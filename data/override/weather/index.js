'use strict';

{
  const id = window.atob('NzVjMmQyNTkxMzI4ZjIzMzJkZGQ1NGY0OTE1M2E3M2M');

  function get(type, o) {
    const url = `https://api.openweathermap.org/data/2.5/weather?appid=${id}&units=${o.units}&lang=${o.lang}&`;
    if (type === 'zip') {
      return fetch(url + `zip=${o.zip}`);
    }
    else if (type === 'position') {
      return fetch(url + `lat=${o.position.lat}&lon=${o.position.lon}`);
    }
    else {
      return fetch(url + 'q=' + o.city);
    }
  }
  function forecast(type, o) {
    (() => {
      if (o.date) {
        if ((Date.now() - o.date) / 1000 / 60 < 10) {
          return Promise.resolve(o.api);
        }
      }
      return get(type, o).then(r => r.json()).then(j => {
        if (j && j.cod === 200) {
          chrome.storage.local.set({
            api: j,
            date: Date.now()
          });
        }
        return j;
      });
    })().then(j => {
      if (j && j.cod === 200) {
        const weather = j.weather[0];
        const main = j.main;
        const e = document.getElementById('weather');
        let temp = main.temp;
        if (o.accurate) {
          temp = temp.toFixed(1);
        }
        else {
          temp = temp.toFixed(0);
        }
        document.querySelector('#weather [data-id=temperature]').textContent = temp;
        document.querySelector('#weather [data-id=description]').textContent = weather.description;
        document.querySelector('#weather i').classList.add('wi-owm-' + weather.id);
        document.querySelector('#weather a').href = 'https://openweathermap.org/city/' + j.id;
        e.dataset.visible = true;
        document.getElementById('weather').title = `Station: ${j.name}

Country: ${j.sys.country}

Sunrise: ${new Date(j.sys.sunrise).toLocaleString()}
Sunset: ${new Date(j.sys.sunset).toLocaleString()}

Wind: Speed ${j.wind.speed} ${o.units === 'imperial' ? 'miles/hour' : 'meter/sec'}  at ${j.wind.deg} degree`;
      }
      else {
        console.log(j);
      }
    }).catch(e => console.log(e));
  }

  const init = () => chrome.storage.local.get({
    api: null,
    date: null,
    zip: '',
    position: {},
    city: '',
    weather: true,
    units: 'metric',
    accurate: false,
    lang: chrome.i18n.getUILanguage()
  }, prefs => {
    if (prefs.weather) {
      if (prefs.zip) {
        forecast('zip', prefs);
      }
      else if (prefs.city) {
        forecast('city', prefs);
      }
      else if (prefs.position.lat) {
        forecast('position', prefs);
      }
      else {
        navigator.geolocation.getCurrentPosition(position => {
          const ps = {
            position: {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            }
          };
          chrome.storage.local.set(ps, () => forecast('position', Object.assign(prefs, ps)));
        });
      }
    }
    else {
      const e = document.getElementById('weather');
      e.dataset.visible = false;
    }
  });
  init();
  chrome.storage.onChanged.addListener(prefs => {
    if (prefs.zip || prefs.position || prefs.city || prefs.weather || prefs.units || prefs.accurate || prefs.lang) {
      init();
    }
  });
}
