'use strict';

document.addEventListener('DOMContentLoaded', () => document.body.dataset.ready = true);

var $ = {
  body: document.body,
  header: {
    parent: document.querySelector('header'),
    a: document.querySelector('header>a'),
    template: document.querySelector('header>template'),
    spacer: document.querySelector('header [data-id=spacer]')
  },
  time: document.getElementById('time'),
  date: document.getElementById('date')
};

var cookie = {
  get: name => {
    try {
      return document.cookie.split(name + '=')[1].split(';').shift();
    }
    catch (e) {}
  },
  set: (name, value) => document.cookie = `${name}=${value}`
};

var bing = {
  url: (lc = 'en-US') => {
    const base = 'http://www.bing.com';
    return fetch(base + '/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=' + lc)
      .then(r => r.json())
      .then(r => base + r.images[0].url);
  },
  insert: url => {
    $.body.style['background-image'] = `url('${url}')`;
  }
};

var bookmarks = {
  id: typeof InstallTrigger === 'undefined' ? '1' : 'toolbar_____',
  favicon: url => {
    if (typeof InstallTrigger === 'undefined') {
      return 'chrome://favicon/' + url;
    }
    else {
      // temporary solution until nsIFaviconService is supported
      if (localStorage.getItem('favicon') !== 'false') {
        return 'http://www.google.com/s2/favicons?domain_url=' + url;
      }
      else {
        return 'web.svg';
      }
    }
  },
  add: ({title, url, id}) => {
    const node = document.importNode($.header.template.content, true);
    const a = node.querySelector('a');
    a.href = url;
    a.dataset.id = id;
    node.querySelector('span').textContent = title;
    node.querySelector('img').src = bookmarks.favicon(url);
    $.header.parent.insertBefore(node, $.header.spacer);
    return node;
  },
  bar: id => new Promise(resolve => {
    chrome.bookmarks.getSubTree(id || bookmarks.id, ([e]) => resolve(e.children));
  }),
  build: () => {
    [...$.header.parent.querySelectorAll('a')]
      .filter(a => a.dataset.id !== 'apps' && a.dataset.id !== 'sidebar')
      .forEach(a => a.remove());
    bookmarks.bar().then(entries => entries
      // filter folders
      .filter(e => !e.children)
      .filter(e => e.url.indexOf('://') !== -1)
      .forEach(bookmarks.add));
  },
  insert: ({id, title, url}) => new Promise(resolve => {
    chrome.bookmarks.create({
      parentId: id || bookmarks.id,
      title,
      url
    }, resolve);
  }),
  remove: id => new Promise(resolve => {
    chrome.bookmarks.remove(id, resolve);
  })
};

/*var topSites = {
  list: () => {
    return new Promise(resolve => {
      chrome.topSites.get(resolve);
    });
  },
  add: ({title, url}) => {
    const template = document.querySelector('details template');
    const parent = document.querySelector('details');

    let node = document.importNode(template.content, true);
    node.href = url;
    node.querySelector('span').textContent = title;
    node.querySelector('img').src = 'chrome://favicon/' + url;
    parent.appendChild(node);
    return node;
  }
};*/

(function(url, img) {
  bing.insert(img || chrome.runtime.getURL('data/override/default.jpg'));
  bing.url('en-US').then(u => {
    if (u !== url) {
      const req = new XMLHttpRequest();
      req.open('GET', u);
      req.responseType = 'blob';
      req.onload = () => {
        const fileReader = new FileReader();
        fileReader.onload = ({target}) => {
          const dataURL = target.result;
          localStorage.setItem('image', dataURL);
          bing.insert(dataURL);
          cookie.set('url', u);
        };
        fileReader.readAsDataURL(req.response);
      };
      req.send();
    }
  });
})(cookie.get('url'), localStorage.getItem('image'));

/*topSites.list().then(entries => {
  entries.forEach(topSites.add);
});*/
bookmarks.build();

function update() {
  const td = s => ('00' + s).substr(-2);

  const now = new Date();
  $.time.textContent = `${td(now.getHours())}.${td(now.getMinutes())}.${td(now.getSeconds())}`;
  $.date.textContent =
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()] +
    ', ' +
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()] +
    ' ' +
    td(now.getDate());
}
update();
{
  let id;
  const one = () => {
    window.clearTimeout(id);
    id = window.setTimeout(one, 1000);
    update();
  };
  one();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(id);
    }
    else {
      one();
    }
  });
}

// Drag & Drop
$.header.parent.addEventListener('dragover', e => {
  if ([...e.dataTransfer.types].indexOf('text/uri-list') !== -1) {
    e.preventDefault();
  }
});
$.header.parent.addEventListener('drop', e => {
  e.preventDefault();

  const url = e.dataTransfer.getData('text/uri-list');
  bookmarks.insert({
    title: url,
    url
  }).then(node => {
    bookmarks.build();
    chrome.runtime.sendMessage({
      method: 'get-title',
      url
    }, title => {
      if (title) {
        chrome.bookmarks.update(node.id, {
          title
        }, bookmarks.build);
      }
    });
  });
});

// Context Menu
var contextmenu;
document.addEventListener('contextmenu', e => {
  contextmenu = e.target;
});
chrome.runtime.onMessage.addListener(({method}) => {
  if (method === 'remove-link') {
    const a = contextmenu && contextmenu.closest('a');
    if (a && a.dataset.id) {
      bookmarks.remove(a.dataset.id).then(bookmarks.build);
    }
  }
});

// Fixes
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (a && a.href && (
    a.href.startsWith('chrome://') ||
    a.href.startsWith('about:')
  )) {
    e.preventDefault();
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, ([tab]) => chrome.tabs.update(tab.id, {
      url: a.href
    }));
  }
});
