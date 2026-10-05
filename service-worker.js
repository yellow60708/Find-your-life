var CACHE_NAME = 'find-your-life-v1';
var APP_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_FILES);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key !== CACHE_NAME) return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(fetch(request).then(function (response) {
    if (response.ok || response.type === 'opaque') {
      var copy = response.clone();
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.put(request, copy);
      }).then(function () {
        return response;
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) return cachedResponse;
      if (request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    });
  }));
});
