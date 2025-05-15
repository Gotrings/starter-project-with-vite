// Konfigurasi
const CACHE_NAME = 'story-app-v2';
const BASE_PATH = '/starter-project-with-vite';
const OFFLINE_URL = `${BASE_PATH}/offline.html`;
const ASSETS_TO_CACHE = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/offline.html`,
  `${BASE_PATH}/icons/icon-192x192.png`,
  `${BASE_PATH}/icons/icon-512x512.png`,
  `${BASE_PATH}/icons/icon-72x72.png`,
  `${BASE_PATH}/icons/icon-96x96.png`,
  `${BASE_PATH}/icons/icon-128x128.png`,
  `${BASE_PATH}/icons/icon-144x144.png`,
  `${BASE_PATH}/icons/icon-152x152.png`,
  `${BASE_PATH}/icons/icon-384x384.png`,
  `${BASE_PATH}/src/scripts/index.js`,
  `${BASE_PATH}/src/styles/main.css`
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('[Service Worker] Cache addAll error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  // Remove old caches
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          }).filter(Boolean)
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          console.log(`[Service Worker] Returning cached: ${request.url}`);
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if response is not ok or is not a basic response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log(`[Service Worker] Caching new resource: ${request.url}`);
                return cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.error(`[Service Worker] Error caching ${request.url}:`, error);
              });

            return response;
          })
          .catch((error) => {
            console.error(`[Service Worker] Fetch failed for ${request.url}:`, error);
            
            // If it's an HTML request, return the offline page
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            
            // Otherwise, return a fallback response
            return new Response('Network error', {
              status: 408,
              statusText: 'Network error',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notificationData = {};
  
  try {
    // Try to parse the data as JSON
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    // If it's not JSON, use text
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'CityCare App',
      body: event.data ? event.data.text() : 'Ada cerita baru untuk Anda!',
      icon: `${BASE_PATH}/icons/icon-192x192.png`
    };
  }
  
  // Check if this is a new story notification
  const isNewStory = notificationData.type === 'new-story' || 
                     (notificationData.body && notificationData.body.includes('story'));
  
  const title = notificationData.title || 'CityCare App';
  const options = {
    body: notificationData.body || (isNewStory ? 'Ada cerita baru untuk Anda!' : 'Anda memiliki notifikasi baru'),
    icon: notificationData.icon || `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/icon-96x96.png`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: notificationData.url || '/',
      isNewStory: isNewStory,
      ...notificationData.data
    },
    actions: notificationData.actions || [
      {
        action: 'explore',
        title: 'Lihat Detail',
        icon: `${BASE_PATH}/icons/icon-72x72.png`
      }
    ]
  };

  // Keep the service worker alive until the notification is shown
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch((error) => {
        console.error('Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event.notification);
  
  // Close the notification
  event.notification.close();
  
  // Get the URL from the notification data or use the root
  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle the notification click
  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        
        // If client URL matches the target URL (ignoring hash and search params)
        if (clientUrl.pathname === targetUrl.pathname) {
          // Focus the client and navigate to the exact URL if needed
          if ('focus' in client) {
            if (client.url !== targetUrl.href) {
              return client.navigate(targetUrl.href).then(client => client.focus());
            }
            return client.focus();
          }
        }
      }
      
      // If no matching client is found, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
    .catch((error) => {
      console.error('Error handling notification click:', error);
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  console.log('[Service Worker] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SEND_NOTIFICATION':
      const { title, ...options } = event.data.notification || {};
      if (title) {
        // Ensure proper icon paths
        if (options.icon && !options.icon.startsWith('http')) {
          options.icon = options.icon.startsWith('/') ? `${BASE_PATH}${options.icon}` : `${BASE_PATH}/${options.icon}`;
        }
        if (options.badge && !options.badge.startsWith('http')) {
          options.badge = options.badge.startsWith('/') ? `${BASE_PATH}${options.badge}` : `${BASE_PATH}/${options.badge}`;
        }
        
        // Add vibration if not specified
        if (!options.vibrate) {
          options.vibrate = [100, 50, 100];
        }
        
        // Add data if not specified
        if (!options.data) {
          options.data = {
            dateOfArrival: Date.now(),
            primaryKey: Date.now()
          };
        }
        
        self.registration.showNotification(title, options)
          .catch(error => {
            console.error('Error showing notification from message:', error);
          });
      }
      break;
      
    case 'SHOW_NOTIFICATION':
      // This is a simplified version for direct notification requests
      const notificationTitle = event.data.title || 'CityCare App';
      const notificationOptions = {
        body: event.data.body || 'Anda memiliki notifikasi baru',
        icon: `${BASE_PATH}/icons/icon-192x192.png`,
        badge: `${BASE_PATH}/icons/icon-96x96.png`,
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: Date.now(),
          ...event.data.data // Include any additional data passed from the client
        },
        actions: [
          {
            action: 'explore',
            title: 'Lihat Detail',
            icon: `${BASE_PATH}/icons/icon-72x72.png`
          }
        ]
      };
      
      self.registration.showNotification(notificationTitle, notificationOptions)
        .catch(error => {
          console.error('Error showing notification from SHOW_NOTIFICATION message:', error);
        });
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLIENTS_CLAIM':
      self.clients.claim();
      break;
      
    default:
      console.log('Unknown message type:', event.data.type);
  }
});