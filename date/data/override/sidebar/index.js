'use strict';
{
  const sidebar = document.getElementById('sidebar');

  document.addEventListener('click', ({target}) => {
    if (target.dataset.id === 'sidebar') {
      sidebar.dataset.open = true;
    }
    else {
      sidebar.dataset.open = sidebar.contains(target);
    }
  });
}
var style = document.createElement('style');
style.textContent = localStorage.getItem('userstyle') || '';
document.documentElement.appendChild(style);

document.getElementById('userstyle').value = style.textContent;
document.getElementById('favicon').checked = localStorage.getItem('favicon') !== 'false';
chrome.storage.local.get({
  zip: '',
  position: {},
  city: '',
  weather: false,
  units: 'metric',
  accurate: false,
  lang: chrome.i18n.getUILanguage()
}, prefs => {
  document.getElementById('prefs.latitude').value = prefs.position.lat || '';
  document.getElementById('prefs.longitude').value = prefs.position.lon || '';
  document.getElementById('prefs.city').value = prefs.city;
  document.getElementById('prefs.weather').checked = prefs.weather;
  document.getElementById('prefs.units').value = prefs.units;
  document.getElementById('prefs.accurate').checked = prefs.accurate;
  document.getElementById('prefs.lang').value = prefs.lang;
});
{
  const status = document.getElementById('status');
  document.getElementById('save').addEventListener('click', () => chrome.storage.local.set({
    position: {
      lat: document.getElementById('prefs.latitude').value,
      lon: document.getElementById('prefs.longitude').value
    },
    city: document.getElementById('prefs.city').value,
    weather: document.getElementById('prefs.weather').checked,
    units: document.getElementById('prefs.units').value,
    accurate: document.getElementById('prefs.accurate').checked,
    lang: document.getElementById('prefs.lang').value,
    api: null,
    date: null,
  }, () => {
    style.textContent = document.getElementById('userstyle').value;
    localStorage.setItem('userstyle', style.textContent);
    localStorage.setItem('favicon', document.getElementById('favicon').checked);

    status.textContent = 'Options saved';
    window.setTimeout(() => status.textContent = '', 750);
  }));
  // reset
  document.getElementById('reset').addEventListener('click', e => {
    if (e.detail === 1) {
      status.textContent = 'Double-click to reset!';
      window.setTimeout(() => status.textContent = '', 750);
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
    url: chrome.runtime.getManifest().homepage_url + '&rd=donate'
  }));
}
