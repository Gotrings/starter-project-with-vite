// Service Worker for PWA with offline support
const CACHE_NAME = 'stories-cache-v1';
const BASE_URL = '/starter-project-with-vite';
const OFFLINE_URL = `${BASE_URL}/offline.html`;
const CACHE_VERSION = 'v1';
const CACHE_NAME_VERSIONED = `${CACHE_NAME}-${CACHE_VERSION}`;

// List of file extensions to cache
const FILE_EXTENSIONS_TO_CACHE = [
  'html',
  'css',
  'js',
  'json',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'eot'
];

// Check if a URL should be cached
const shouldCache = (url) => {
  const parsedUrl = new URL(url);
  return FILE_EXTENSIONS_TO_CACHE.some(ext => 
    parsedUrl.pathname.endsWith(`.${ext}`) ||
    parsedUrl.pathname.endsWith('/')
  );
};

const urlsToCache = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/src/scripts/app.js`,
  `${BASE_URL}/styles/main.css`,
  `${BASE_URL}/favicon.ico`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/offline.html`,
  // Icons
  `${BASE_URL}/icon-72x72.png`,
  `${BASE_URL}/icon-96x96.png`,
  `${BASE_URL}/icon-128x128.png`,
  `${BASE_URL}/icon-144x144.png`,
  `${BASE_URL}/icon-152x152.png`,
  `${BASE_URL}/icon-192x192.png`,
  `${BASE_URL}/icon-384x384.png`,
  `${BASE_URL}/icon-512x512.png`
];

// Listen for messages from clients (like skipWaiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Send message to all clients
const notifyClients = async (message) => {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(message);
  });
};

// Check network status and notify clients
const updateOnlineStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.status >= 200 && response.status < 300) {
      await notifyClients({
        type: 'ONLINE_STATUS',
        payload: { isOnline: true }
      });
      return true;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    await notifyClients({
      type: 'ONLINE_STATUS',
      payload: { isOnline: false }
    });
    return false;
  }
};

// Check network status periodically
setInterval(updateOnlineStatus, 30000); // Check every 30 seconds

// Initial check when service worker activates
self.addEventListener('activate', (event) => {
  event.waitUntil(updateOnlineStatus());
});

// Install event - cache the application shell
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${CACHE_VERSION}...`);
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Cache all static assets
  event.waitUntil(
    caches.open(CACHE_NAME_VERSIONED)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and static assets');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('[Service Worker] All assets have been cached');
          })
          .catch(error => {
            console.error('[Service Worker] Failed to cache some assets:', error);
            // Don't fail the installation if some assets couldn't be cached
          });
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Helper function to handle network requests with cache fallback
const handleNetworkRequest = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    // If we got a valid response, cache it
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME_VERSIONED);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Network request failed, trying cache', error);
    throw error; // Rethrow to be caught by the caller
  }
};

// Helper function to get from cache with fallback
const getFromCache = async (request) => {
  const cache = await caches.open(CACHE_NAME_VERSIONED);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try the network
  try {
    const networkResponse = await handleNetworkRequest(request);
    return networkResponse;
  } catch (error) {
    // If network fails and it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Image not available</title><path fill="currentColor" d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01L3 5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-3 6.42l3 3.01V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.58l3 2.99 4-4 4 4 4-4z"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    // For other requests, return a generic error response
    return new Response('You are offline and this resource is not available in the cache.', {
      status: 408,
      statusText: 'Offline',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
};

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and non-http(s) requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests and chrome-extension requests
  if (!requestUrl.origin.startsWith(self.location.origin) || 
      requestUrl.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle navigation requests with network first, falling back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      handleNetworkRequest(event.request)
        .catch(() => getFromCache(event.request))
    );
    return;
  }

  // For API requests, try network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      handleNetworkRequest(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For all other requests, try cache first, then network
  event.respondWith(
    getFromCache(event.request)
  );
  
  // If we're online, update the cache in the background for non-API requests
  if (navigator.onLine && !event.request.url.includes('/api/')) {
    event.waitUntil(
      handleNetworkRequest(event.request).catch(console.error)
    );
  }
});

// Helper function to check for updates
async function checkForUpdates() {
  console.log('[Service Worker] Checking for updates...');
  
  try {
    // Get all clients (open windows)
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    if (clients && clients.length) {
      // Tell all windows to check for updates
      clients.forEach(client => {
        client.postMessage({
          type: 'CHECKING_FOR_UPDATES',
          timestamp: new Date().toISOString()
        });
      });
    }
    
    // Check if there's a new service worker waiting
    const registration = await self.registration;
    if (registration.waiting) {
      console.log('[Service Worker] Update found (waiting)');
      notifyClientsAboutUpdate();
      return true;
    }
    
    // Check if there's an update available
    await registration.update();
    
    if (registration.installing) {
      console.log('[Service Worker] Update found (installing)');
      // Wait for the new service worker to be installed
      registration.installing.addEventListener('statechange', (event) => {
        if (event.target.state === 'installed') {
          notifyClientsAboutUpdate();
        }
      });
      return true;
    }
    
    console.log('[Service Worker] No updates found');
    return false;
  } catch (error) {
    console.error('[Service Worker] Error checking for updates:', error);
    return false;
  }
}

// Notify all clients about an available update
function notifyClientsAboutUpdate() {
  self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clients => {
    if (clients && clients.length) {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          message: 'A new version is available!',
          timestamp: new Date().toISOString(),
          reloadOnUpdate: true
        });
      });
    }
  });
}

// Helper function to fetch and cache a request
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Check if we received a valid response
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }
    
    // Clone the response and cache it
    const responseToCache = response.clone();
    const cache = await caches.open(CACHE_NAME_VERSIONED);
    await cache.put(request, responseToCache);
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Error in fetchAndCache:', error);
    throw error;
  }
}

// Periodically check for updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-for-updates') {
    console.log('[Service Worker] Periodic sync for updates');
    event.waitUntil(checkForUpdates());
  }
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    checkForUpdates();
  }
});

// Listen for the 'sync' event for background sync
self.addEventListener('sync', event => {
  console.log(`[Service Worker] Background sync event: ${event.tag}`);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncData()
        .then(() => {
          console.log('[Service Worker] Background sync completed');
          // Notify all clients about the successful sync
          self.clients.matchAll({ type: 'window' })
            .then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'SYNC_COMPLETED',
                  message: 'Your data has been synced with the server.',
                  timestamp: new Date().toISOString()
                });
              });
            });
        })
        .catch(error => {
          console.error('[Service Worker] Background sync failed:', error);
        })
    );
  }
});

// Helper function to perform background sync
async function syncData() {
  console.log('[Service Worker] Starting background sync');
  // Here you would typically sync your application data with the server
  // For example:
  // 1. Get unsynced data from IndexedDB
  // 2. Send it to your API
  // 3. Update local data with server response
  
  // This is a placeholder for the actual sync logic
  return new Promise((resolve) => {
    // Simulate network request
    setTimeout(() => {
      console.log('[Service Worker] Background sync completed successfully');
      resolve();
    }, 2000);
  });
}

// Listen for 'push' events for push notifications
self.addEventListener('push', event => {
  const title = 'Stories App';
  const options = {
    body: event.data?.text() || 'You have new updates!',
    icon: `${BASE_URL}/icon-192x192.png`,
    badge: `${BASE_URL}/icon-96x96.png`,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.', event);
  event.notification.close();
  
  // Handle the notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const title = 'Stories App';
  const options = {
    body: event.data?.text() || 'You have new updates!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
