const CACHE_NAME = 'workout-timer-cache-v8';
const URLS_TO_CACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'metadata.json',
  // NOTE: Source files like .ts and .tsx are not included here
  // because they are not present on the deployed server.
  // The browser runs bundled Javascript files.
  // The service worker will still cache the main page and all assets,
  // providing a good offline experience.

  // External resources
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://www.gstatic.com/images/branding/product/1x/fitness_192dp.png',
  'https://ssl.gstatic.com/images/branding/product/1x/fitness_512dp.png',
  // JS dependencies from importmap
  'https://aistudiocdn.com/rxjs@^7.8.2?conditions=es2015',
  'https://aistudiocdn.com/rxjs@^7.8.2/operators?conditions=es2015',
  'https://aistudiocdn.com/rxjs@^7.8.2/ajax?conditions=es2015',
  'https://aistudiocdn.com/rxjs@^7.8.2/webSocket?conditions=es2015',
  'https://aistudiocdn.com/rxjs@^7.8.2/testing?conditions=es2015',
  'https://aistudiocdn.com/rxjs@^7.8.2/fetch?conditions=es2015',
  'https://next.esm.sh/@angular/platform-browser@^21.0.1?external=rxjs',
  'https://next.esm.sh/@angular/core@^21.0.1?external=rxjs',
  'https://next.esm.sh/@angular/compiler@^21.0.1?external=rxjs',
  'https://next.esm.sh/@angular/common@^21.0.1?external=rxjs'
];

// On install, cache the app shell and all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell and assets');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Activate the new service worker immediately
      .catch(error => {
        console.error('Service Worker: Failed to cache resources during install:', error);
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// On fetch, use a cache-first strategy
self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return response from cache if found
        if (response) {
          return response;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response.
          // Opaque responses (for cross-origin requests) don't have a status we can check, but are valid to cache.
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
          }
          
          return networkResponse;
        }).catch(error => {
          console.error('Service Worker: Fetch failed; browser will show its offline page.', event.request.url, error);
          // Re-throw the error to allow the browser to handle the network failure.
          throw error;
        });
      });
    })
  );
});