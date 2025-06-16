// Service Worker for PWA with offline support and notifications

const CACHE_NAME = 'stories-cache-v1';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/scripts/app.js',
  '/styles/main.css',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico'
];

// Install event - cache the application shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages under this service worker's scope
  return self.clients.claim();
});

// Push notification event
self.addEventListener('push', (event) => {
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    // If not JSON, treat as text
    data = {
      title: 'New Notification',
      options: {
        body: event.data.text()
      }
    };
  }

  const options = {
    body: data.options.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: data.options.url || '/stories'
    },
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Handle direct notifications from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      ...options,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: options.url || '/stories'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  } else if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests, like those for Google Analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For navigation requests, try the network first, falling back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  
  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      // Clone the request
      const fetchRequest = event.request.clone();
      
      return fetch(fetchRequest).then(
        (response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }
      ).catch(() => {
        // If both fetch and cache fail, return offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});