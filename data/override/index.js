'use strict';

var $ = {
  body: document.body,
  header: {
    parent: document.querySelector('header'),
    a: document.querySelector('header>a')
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
  insert: (url) => {
    $.body.style['background-image'] = `url('${url}')`;
  }
};

var bookmarks = {
  id: '1',
  add: ({title, url, id}) => {
    let node = $.header.a.cloneNode(true);

    node.href = url;
    node.dataset.id = id;
    node.querySelector('span').textContent = title;
    node.querySelector('img').src = 'chrome://favicon/' + url;
    $.header.parent.appendChild(node);
    return node;
  },
  bar: (id) => {
    return new Promise(resolve => {
      chrome.bookmarks.getSubTree(id || bookmarks.id, ([e]) => resolve(e.children));
    });
  },
  build: () => {
    [...$.header.parent.querySelectorAll('a')]
      .slice(1).forEach(a => a.parentNode.removeChild(a));
    bookmarks.bar().then(entries => entries.forEach(bookmarks.add));
  },
  insert: ({id, title, url}) => {
    return new Promise(resolve => {
      chrome.bookmarks.create({
        parentId: id || bookmarks.id,
        title,
        url
      }, resolve);
    });
  },
  remove: (id) => {
    return new Promise(resolve => {
      chrome.bookmarks.remove(id, resolve);
    });
  }
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

(function (url) {
  if (url) {
    bing.insert(url);
  }
  bing.url('en-US').then(u => {
    cookie.set('url', u);
    if (!url) {
      bing.insert(u);
    }
  });
})(cookie.get('url'));

/*topSites.list().then(entries => {
  entries.forEach(topSites.add);
});*/
bookmarks.build();

function update () {
  function td (s) {
    return ('00' + s).substr(-2);
  }

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
(function () {
  let id;
  function one () {
    window.clearTimeout(id);
    id = window.setTimeout(one, 1000);
    update();
  }
  one();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(id);
    }
    else {
      one();
    }
  });
})();

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
chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'remove-link') {
    let a = contextmenu && contextmenu.closest('a');
    if (a && a.dataset.id) {
      bookmarks.remove(a.dataset.id).then(bookmarks.build);
    }
  }
});

// Fixes
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (a && a.href && a.href.startsWith('chrome://')) {
    document.location.replace(a.href);
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, ([tab]) => chrome.tabs.update(tab.id, {
      url: a.href
    }));
  }
});
