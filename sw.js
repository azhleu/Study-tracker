var CACHE_NAME = 'study-planner-v1';
var APP_URL = new URL('./S.T.U.D.Y_GROUP3.html', self.registration.scope).href;
var ASSETS = [
  APP_URL,
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
          return cache.put(APP_URL, response.clone()).catch(function(error) {
            console.error('Could not update the offline planner cache.', error);
          }).then(function() {
            return response;
          });
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match(APP_URL);
      });
    })
  );
});
