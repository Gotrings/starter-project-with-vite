importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

const { openDB } = idb;

// Determine base path based on environment
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const basePath = '/starter-project-with-vite';

// Handle push notification
self.addEventListener('push', (event) => {
  try {
    console.log('Service Worker: Push Received');
    
    if (!event.data) {
      console.error('Service Worker: Push event but no data');
      return;
    }

    let notificationData = {};
    try {
      notificationData = event.data.json();
    } catch (error) {
      const pushData = event.data.text();
      console.log('Push data:', pushData);
      
      notificationData = {
        title: 'Story App',
        options: {
          body: pushData,
          icon: `${basePath}/icons/icon-192x192.png`,
          badge: `${basePath}/icons/icon-72x72.png`,
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          },
          actions: [
            {
              action: 'explore',
              title: 'Lihat Detail',
              icon: `${basePath}/icons/icon-72x72.png`
            }
          ]
        }
      };
    }

    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData.options)
        .then(() => {
          console.log('Service Worker: Notification displayed successfully');
        })
        .catch((error) => {
          console.error('Service Worker: Error showing notification:', error);
        })
    );
  } catch (error) {
    console.error('Service Worker: Error processing push event:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rootUrl = new URL(basePath || '/', self.location.origin).href;
  console.log('Notification click - Opening URL:', rootUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(rootUrl);
      })
  );
});

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

// Base path already defined at the top of the file

// Precache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', { isDev, basePath });
  event.waitUntil(
    Promise.all([
      precacheAssets(),
      caches.open('static-resources').then((cache) => {
        console.log('Service Worker: Caching Static Resources');
        return cache.addAll([
          `${basePath}/`,
          `${basePath}/index.html`,
          `${basePath}/manifest.json`,
          `${basePath}/icons/icon-192x192.png`,
          `${basePath}/icons/icon-512x512.png`
        ]);
      }),
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== 'static-resources' && cacheName !== 'api-cache' && cacheName !== 'images') {
              console.log('Service Worker: Clearing Old Cache:', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      }),
      clients.claim()
    ])
  );
});

// Precache assets
const precacheAssets = () => {
  console.log('Service Worker: Precaching assets...');
  return precacheAndRoute([
    { url: `${basePath}/`, revision: '1' },
    { url: `${basePath}/index.html`, revision: '1' },
    { url: `${basePath}/manifest.json`, revision: '1' },
    { url: `${basePath}/icons/icon-192x192.png`, revision: '1' },
    { url: '/starter-project-with-vite/icons/icon-512x512.png', revision: '1' }
  ]);
};

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache API responses with offline fallback
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      }),
      {
        cacheDidUpdate: async ({ cacheName, request, oldResponse, newResponse }) => {
          console.log(`Cache ${cacheName} updated for ${request.url}`);
        },
        cacheWillUpdate: async ({ request, response }) => {
          if (response && response.status === 200) {
            return response;
          }
          return null;
        },
        handlerDidError: async ({ request }) => {
          console.log('Network error, serving from IndexedDB if available');
          const db = await openDB('story-app-db', 1);
          const cachedData = await db.get('stories', request.url);
          return cachedData ? new Response(JSON.stringify(cachedData)) : Response.error();
        }
      }
    ],
    networkTimeoutSeconds: 3,
    fetchOptions: {
      mode: 'cors',
      credentials: 'same-origin'
    },
    matchOptions: {
      ignoreSearch: false
    }
  })
);

// Cache static assets
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources'
  })
);



// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  try {
    console.log('Service Worker: Notification Click');
    console.log('Action clicked:', event.action);

    event.notification.close();

    const rootUrl = new URL(basePath || '/', self.location.origin).href;
    console.log('Opening URL:', rootUrl);

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there is already a window/tab open with the target URL
          for (let client of windowClients) {
            if (client.url === rootUrl) {
              console.log('Found existing window, focusing');
              return client.focus();
            }
          }
          console.log('No existing window found, opening new one');
          return clients.openWindow(rootUrl);
        })
        .catch((error) => {
          console.error('Error handling notification click:', error);
        })
    );
  } catch (error) {
    console.error('Error in notification click handler:', error);
  }
});

