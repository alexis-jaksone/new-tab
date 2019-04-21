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
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '&version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '&rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
