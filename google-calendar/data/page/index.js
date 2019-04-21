'use strict';

chrome.storage.local.get({
  page: 'https://calendar.google.com/calendar/r/week'
}, prefs => location.replace(prefs.page));
