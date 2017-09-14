'use strict';

// Runtime
chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (request.method === 'get-title') {
    const req = new XMLHttpRequest();
    req.open('GET', request.url);
    req.responseType = 'document';
    req.onload = () => {
      const title = req.responseXML.title;
      if (title) {
        response(title);
      }
      else {
        response();
      }
    };
    req.onerror = () => response();
    req.send();
    return true;
  }
});

// Context Menu
chrome.contextMenus.create({
  id: 'remove-link',
  contexts: ['link'],
  title: 'Remove this link',
  documentUrlPatterns: [
    chrome.runtime.getURL('data/override/index.html')
  ]
});
chrome.contextMenus.onClicked.addListener(() => {
  chrome.runtime.sendMessage({
    method: 'remove-link'
  });
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.toLowerCase().indexOf('Firefox') === -1
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/new-tab.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
