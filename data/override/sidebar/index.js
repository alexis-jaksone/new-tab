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

chrome.storage.local.get({
  zip: '',
  position: {},
  city: '',
  weather: true,
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
  const status = document.getElementById('status');
  status.textContent = 'Options saved';
  window.setTimeout(() => status.textContent = '', 750);
}));
