importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');

const { openDB } = idb;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;

const basePath = self.location.pathname.includes('/starter-project-with-vite') ? '/starter-project-with-vite' : '';

// Precache basic files
precacheAndRoute([
  { url: `${basePath}/`, revision: '1' },
  { url: `${basePath}/index.html`, revision: '1' },
  { url: `${basePath}/manifest.json`, revision: '1' },
  { url: `${basePath}/icons/icon-192x192.png`, revision: '1' },
  { url: `${basePath}/icons/icon-512x512.png`, revision: '1' }
]);

// Cache images
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

// Cache API responses
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Static assets
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources'
  })
);

// Push notification
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
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
  };

  event.waitUntil(
    self.registration.showNotification('Story App', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const rootUrl = new URL(basePath || '/', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url === rootUrl) {
            return client.focus();
          }
        }
        return clients.openWindow(rootUrl);
      })
  );
});

// Show notification from message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: `${basePath}/icons/icon-192x192.png`
    });
  }
});
