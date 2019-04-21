'use strict';

var info = document.getElementById('info');

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    info.textContent = 'Double-click to reset!';
    window.setTimeout(() => info.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});
// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

chrome.storage.local.get({
  page: 'https://calendar.google.com/calendar/r/week'
}, prefs => {
  const options = [
    'https://calendar.google.com/calendar/r/day',
    'https://calendar.google.com/calendar/r/week',
    'https://calendar.google.com/calendar/r/month',
    'https://calendar.google.com/calendar/r/year',
    'https://calendar.google.com/calendar/r/agenda',
    'https://calendar.google.com/calendar/r/customday'
  ];
  const index = options.indexOf(prefs.page);
  if (index !== -1) {
    document.getElementById('d-mode').checked = true;
    return document.getElementById('defaults').value = options[index];
  }
  else if (prefs.page) {
    document.getElementById('c-mode').checked = true;
    return document.getElementById('custom').value = prefs.page;
  }
  document.getElementById('d-mode').checked = true;
  document.getElementById('defaults').value = 'https://calendar.google.com/calendar/r/week';
});

document.getElementById('save').addEventListener('click', async () => {
  if (document.getElementById('d-mode').checked) {
    await new Promise(resolve => chrome.storage.local.set({
      page: document.getElementById('defaults').value
    }, resolve));
  }
  else {
    await new Promise(resolve => chrome.storage.local.set({
      page: document.getElementById('custom').value || 'https://calendar.google.com/calendar/r/week'
    }, resolve));
  }
  info.textContent = 'Options saved';
  window.setTimeout(() => info.textContent = '', 750);
});

document.getElementById('custom').addEventListener('focus', () => {
  document.getElementById('c-mode').checked = true;
});
document.getElementById('defaults').addEventListener('focus', () => {
  document.getElementById('d-mode').checked = true;
});
