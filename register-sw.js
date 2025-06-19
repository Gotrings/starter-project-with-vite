// This script handles the service worker registration and PWA installation

// Base URL for the application
const BASE_URL = '/starter-project-with-vite';

// Create offline indicator if it doesn't exist
let offlineIndicator = document.querySelector('.offline-indicator');
if (!offlineIndicator) {
  offlineIndicator = document.createElement('div');
  offlineIndicator.className = 'offline-indicator';
  offlineIndicator.innerHTML = `
    <i class="fas fa-wifi"></i>
    <span>You're currently offline. Some features may be limited.</span>
  `;
  document.body.appendChild(offlineIndicator);
}

// Show/hide offline indicator
function updateOfflineStatus(isOnline) {
  if (!offlineIndicator) return;
  
  if (isOnline) {
    offlineIndicator.textContent = 'Back online';
    setTimeout(() => {
      offlineIndicator.classList.remove('show');
    }, 3000);
  } else {
    offlineIndicator.textContent = 'You are currently offline';
    offlineIndicator.classList.add('show');
  }
}

// Show update notification to the user
function showUpdateNotification(registration, message = 'A new version is available!', reloadOnUpdate = true) {
  // Check if we already showed the update notification
  if (window.updateNotificationShown) return;
  window.updateNotificationShown = true;
  
  // Create update notification if it doesn't exist
  let updateNotification = document.getElementById('update-notification');
  
  if (!updateNotification) {
    updateNotification = document.createElement('div');
    updateNotification.id = 'update-notification';
    updateNotification.className = 'update-notification';
    
    updateNotification.innerHTML = `
      <div class="update-notification-content">
        <h3>Update Available</h3>
        <p>${message}</p>
        <div class="update-actions">
          <button id="update-now" class="btn btn-primary">Update Now</button>
          <button id="update-later" class="btn btn-secondary">Later</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // Add event listeners for the buttons
    document.getElementById('update-now').addEventListener('click', () => {
      // Tell the service worker to skip waiting and reload the page
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      updateNotification.classList.remove('show');
      setTimeout(() => updateNotification.remove(), 300);
    });
    
    document.getElementById('update-later').addEventListener('click', () => {
      updateNotification.classList.remove('show');
      setTimeout(() => updateNotification.remove(), 300);
      // Reset the flag so the notification can be shown again
      setTimeout(() => { window.updateNotificationShown = false; }, 1000);
    });
    
    // Show with animation
    setTimeout(() => updateNotification.classList.add('show'), 100);
  }
  
  // If reloadOnUpdate is true, automatically reload after a short delay
  if (reloadOnUpdate && registration && registration.waiting) {
    setTimeout(() => {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }, 10000); // 10 seconds delay before auto-update
  }
}

// Show a toast notification (only one at a time)
let currentToast = null;
function showToast(message, duration = 3000) {
  // Remove any existing toast
  if (currentToast) {
    currentToast.classList.remove('show');
    setTimeout(() => {
      if (currentToast && currentToast.parentNode) {
        currentToast.parentNode.removeChild(currentToast);
      }
      currentToast = null;
      showNewToast(message, duration);
    }, 300);
  } else {
    showNewToast(message, duration);
  }
  
  function showNewToast(message, duration) {
    currentToast = document.createElement('div');
    currentToast.className = 'toast-notification';
    currentToast.textContent = message;
    document.body.appendChild(currentToast);
    
    // Show with animation
    setTimeout(() => currentToast.classList.add('show'), 10);
    
    // Auto-hide after duration
    setTimeout(() => {
      if (currentToast) {
        currentToast.classList.remove('show');
        setTimeout(() => {
          if (currentToast && currentToast.parentNode) {
            currentToast.parentNode.removeChild(currentToast);
            currentToast = null;
          }
        }, 300);
      }
    }, duration);
  }
}

// Handle the beforeinstallprompt event for PWA installation
function setupInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show install button or custom UI
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      
      // Remove any existing event listeners to prevent duplicates
      const newButton = installButton.cloneNode(true);
      installButton.parentNode.replaceChild(newButton, installButton);
      
      newButton.addEventListener('click', () => {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            showToast('App installed successfully!');
          } else {
            console.log('User dismissed the install prompt');
          }
          // Clear the deferredPrompt variable
          deferredPrompt = null;
        });
      });
    }
  });
}

// Set up periodic update checks
function setupPeriodicUpdateChecks(registration) {
  // Check for updates every 6 hours
  setInterval(() => {
    registration.update().catch(err => 
      console.log('[Service Worker] Error checking for updates:', err)
    );
  }, 6 * 60 * 60 * 1000);
}

// Check for updates
async function checkForUpdates(registration) {
  try {
    await registration.update();
    
    // If there's a waiting service worker, show the update UI
    if (registration.waiting) {
      console.log('[Service Worker] Update found (waiting)');
      showUpdateNotification(registration);
      return true;
    }
    
    // Listen for updates in the background
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        // When the new service worker is installed and there's a controller,
        // it means an update is ready to be activated
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[Service Worker] Update found (installing)');
          showUpdateNotification(registration);
        }
      });
    });
    
    return false;
  } catch (error) {
    console.error('[Service Worker] Error checking for updates:', error);
    return false;
  }
}

// Only run in browser context
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Wait for the window to load
  window.addEventListener('load', async () => {
    // Setup install prompt handler
    setupInstallPrompt();
    
    try {
      // Register the service worker
      const registration = await navigator.serviceWorker.register(`${BASE_URL}/sw.js`);
      console.log('[Service Worker] Registration successful with scope: ', registration.scope);
      
      // Set up periodic update checks (every 6 hours)
      setupPeriodicUpdateChecks(registration);
      
      // Initial check for updates
      checkForUpdates(registration);
      
      // Listen for controller change (page refresh needed)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          console.log('[Service Worker] Controller changed, reloading page...');
          window.location.reload();
          refreshing = true;
        }
      });
      
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        
        switch (event.data.type) {
          case 'UPDATE_AVAILABLE':
            console.log('[Service Worker] Update available:', event.data.message);
            showUpdateNotification(registration, event.data.message, event.data.reloadOnUpdate);
            break;
            
          case 'SYNC_COMPLETED':
            console.log('[Service Worker] Sync completed:', event.data.message);
            showToast(event.data.message || 'Data synced successfully!');
            break;
            
          case 'OFFLINE_STATUS':
            updateOfflineStatus(event.data.isOnline);
            break;
            
          case 'CACHE_UPDATED':
            console.log('[Service Worker] Cache updated:', event.data.payload);
            showToast('New content is available. Refresh to update.');
            break;
        }
      });
      
      // Initial offline status check
      updateOfflineStatus(navigator.onLine);
      
    } catch (error) {
      console.error('[Service Worker] Registration failed:', error);
    }
  });
}

// Listen for online/offline events
window.addEventListener('online', () => updateOfflineStatus(true));
window.addEventListener('offline', () => updateOfflineStatus(false));

// Initial offline status check
updateOfflineStatus(navigator.onLine);

// Check if the current page is being loaded from the cache
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.log('[Service Worker] Page loaded from cache');
  }
});

// Listen for appinstalled event
window.addEventListener('appinstalled', (e) => {
  console.log('PWA was installed');
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Check if the app is running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode');
  }
});
