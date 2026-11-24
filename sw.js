var CACHE_NAME = 'study-planner-v2';
var HOME_URL = new URL('./index.html', self.registration.scope).href;
var PLANNER_URL = new URL('./planner.html', self.registration.scope).href;
var ASSETS = [
  HOME_URL,
  PLANNER_URL,
  new URL('./manifest.webmanifest', self.registration.scope).href,
  new URL('./study-icon.svg', self.registration.scope).href
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return name.indexOf('study-planner-') === 0 && name !== CACHE_NAME
          ? caches.delete(name)
          : Promise.resolve(false);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        return caches.open(CACHE_NAME).then(function(cache) {
          return cache.put(event.request, response.clone()).catch(function(error) {
            console.error('Could not update the offline website cache.', error);
          }).then(function() {
            return response;
          });
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match(HOME_URL);
      });
    })
  );
});
