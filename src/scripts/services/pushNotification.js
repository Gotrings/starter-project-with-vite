// pushNotification.js
// Service for handling push notifications
import { Workbox } from 'workbox-window';

// Konfigurasi API
const isDevelopment = import.meta.env.DEV;
// Gunakan path relatif untuk development untuk menghindari masalah CORS
const API_BASE_URL = isDevelopment 
  ? '/v1' 
  : 'https://story-api.dicoding.dev/v1';

// Log untuk debugging
console.log('API Base URL:', API_BASE_URL);
console.log('Is Development:', isDevelopment);

// VAPID public key
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

class PushNotificationService {
  constructor() {
    this.publicVapidKey = VAPID_PUBLIC_KEY;
    this.serviceWorkerRegistration = null;
    this.workbox = null;
    this.isSubscribing = false;
  }

  async init() {
    try {
      // Check for browser support
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported in this browser');
        return false;
      }
      
      if (!('PushManager' in window)) {
        console.warn('Push notifications are not supported in this browser');
        return false;
      }

      // Check for secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.warn('Service workers require a secure context (HTTPS or localhost)');
        return false;
      }

      // Unregister any existing service workers first
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered old service worker:', registration.scope);
        }
      } catch (unregisterError) {
        console.warn('Error unregistering old service workers:', unregisterError);
        // Continue with registration even if unregistering old ones fails
      }

      // Register the service worker with Workbox
      try {
        console.log('Registering service worker...');
        
        // Use the correct path to the service worker file
        const swUrl = '/starter-project-with-vite/sw.js';
        this.workbox = new Workbox(swUrl);
        
        // Handle service worker updates
        this.workbox.addEventListener('installed', (event) => {
          if (event.isUpdate) {
            console.log('Service Worker updated');
          } else {
            console.log('Service Worker installed for the first time');
          }
        });
        
        // Handle service worker activation
        this.workbox.addEventListener('activated', (event) => {
          if (!event.isUpdate) {
            console.log('Service Worker activated for the first time');
          } else {
            console.log('Service Worker updated and activated');
          }
        });
        
        // Handle service worker errors
        this.workbox.addEventListener('error', (error) => {
          console.error('Workbox error:', error);
        });
        
        // Register the service worker
        this.serviceWorkerRegistration = await this.workbox.register();
        
        if (!this.serviceWorkerRegistration) {
          throw new Error('Service worker registration failed: No registration object returned');
        }
        
        console.log('Service Worker registered with scope:', this.serviceWorkerRegistration.scope);
        
        // Wait for the service worker to be ready
        if (this.serviceWorkerRegistration.installing) {
          console.log('Service Worker is installing...');
          
          // Wait for the service worker to be installed and activated
          await new Promise((resolve, reject) => {
            const worker = this.serviceWorkerRegistration.installing;
            
            if (!worker) {
              resolve();
              return;
            }
            
            // Set timeout to prevent hanging (30 seconds)
            const timeout = setTimeout(() => {
              reject(new Error('Service worker installation timed out after 30 seconds'));
            }, 30000);
            
            const onStateChange = () => {
              console.log('Service Worker state changed to:', worker.state);
              
              if (worker.state === 'activated') {
                clearTimeout(timeout);
                console.log('Service Worker activated successfully');
                worker.removeEventListener('statechange', onStateChange);
                resolve();
              } else if (worker.state === 'redundant') {
                clearTimeout(timeout);
                const error = new Error('Service worker installation failed (redundant)');
                worker.removeEventListener('statechange', onStateChange);
                reject(error);
              }
            };
            
            const onError = (error) => {
              console.error('Service Worker error:', error);
              clearTimeout(timeout);
              worker.removeEventListener('statechange', onStateChange);
              worker.removeEventListener('error', onError);
              reject(error);
            };
            
            worker.addEventListener('statechange', onStateChange);
            worker.addEventListener('error', onError);
          });
        } else if (this.serviceWorkerRegistration.active) {
          console.log('Service Worker is already active');
        } else if (this.serviceWorkerRegistration.waiting) {
          console.log('Service Worker is waiting to activate');
        }
        
        console.log('Service Worker initialization successful');
        return true;
        
      } catch (registerError) {
        console.error('Failed to register service worker:', registerError);
        throw registerError;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async subscribe() {
    if (!this.serviceWorkerRegistration) {
      console.error('Service worker not registered');
      return false;
    }
    
    try {
      console.log('Checking service worker registration...');
      
      // Check if service worker is supported and ready
      if (!navigator.serviceWorker || !navigator.serviceWorker.ready) {
        throw new Error('Service worker not ready');
      }
      
      const registration = await navigator.serviceWorker.ready;
      
      console.log('Getting existing subscription...');
      let subscription;
      
      try {
        subscription = await registration.pushManager.getSubscription();
      } catch (error) {
        console.error('Error getting push subscription:', error);
        throw new Error('Failed to check existing push subscription');
      }
      
      if (!subscription) {
        console.log('No existing subscription, creating new one...');
        
        // Request notification permission first
        let permission;
        try {
          permission = await Notification.requestPermission();
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          throw new Error('Failed to request notification permission');
        }
        
        if (permission !== 'granted') {
          console.log('Notification permission not granted');
          throw new Error('Notification permission denied by user');
        }
        
        console.log('Subscribing to push notifications...');
        let vapidPublicKey;
        try {
          vapidPublicKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        } catch (error) {
          console.error('Error converting VAPID public key:', error);
          throw new Error('Invalid VAPID public key configuration');
        }
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
          });
        } catch (error) {
          console.error('Error subscribing to push service:', error);
          throw new Error('Failed to subscribe to push service');
        }
        
        console.log('New subscription:', subscription);
        
        // Get the auth and p256dh keys
        let p256dh, auth;
        try {
          const p256dhArray = subscription.getKey('p256dh');
          const authArray = subscription.getKey('auth');
          
          if (!p256dhArray || !authArray) {
            throw new Error('Invalid subscription: missing encryption keys');
          }
          
          p256dh = btoa(String.fromCharCode(...new Uint8Array(p256dhArray)));
          auth = btoa(String.fromCharCode(...new Uint8Array(authArray)));
        } catch (error) {
          console.error('Error processing subscription keys:', error);
          throw new Error('Failed to process subscription encryption keys');
        }

        // Get the auth token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Send subscription to server
        console.log('Sending subscription to server...');
        let response;
        try {
          response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: { 
                p256dh: p256dh,
                auth: auth 
              }
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', errorText);
            throw new Error(`Server responded with status: ${response.status}`);
          }
          
          console.log('Subscription saved to server successfully');
          
        } catch (error) {
          console.error('Error sending subscription to server:', error);
          // Clean up the subscription if server update fails
          try {
            await subscription.unsubscribe();
            console.log('Cleaned up subscription after server error');
          } catch (unsubscribeError) {
            console.error('Error cleaning up subscription:', unsubscribeError);
          }
          throw new Error(`Failed to save subscription to server: ${error.message}`);
        }
      } else {
        console.log('Existing subscription found:', subscription);
      }
      
      return true;
    } catch (error) {
      console.error('Error in push notification subscription:', error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to set up push notifications';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Notification permission denied';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request was aborted';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('VAPID')) {
        errorMessage = 'Invalid push notification configuration';
      }
      
      // Create a new error with a more user-friendly message
      const friendlyError = new Error(errorMessage);
      friendlyError.originalError = error;
      
      throw friendlyError;
    }
  }

  /**
   * Unsubscribes from push notifications and notifies the server
   * @returns {Promise<boolean>} - Whether unsubscription was successful
   */
  async unsubscribe() {
    console.log('Starting unsubscribe process...');
    
    try {
      // Check if service worker is registered
      if (!this.serviceWorkerRegistration) {
        const errorMsg = 'Service worker not registered';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if push manager is available
      if (!('pushManager' in this.serviceWorkerRegistration)) {
        const errorMsg = 'PushManager not available in service worker registration';
        console.error(errorMsg);
        throw new Error('Push notifications not supported');
      }

      // Get the current subscription
      let subscription;
      try {
        subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        if (!subscription) {
          console.log('No active push subscription found');
          return true; // No subscription to unsubscribe from
        }
        console.log('Found existing subscription for endpoint:', 
          subscription.endpoint.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error getting push subscription:', error);
        throw new Error('Failed to check existing subscription');
      }

      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found, will only unsubscribe locally');
      }

      // Unsubscribe from push notifications
      let unsubscribed = false;
      try {
        console.log('Unsubscribing from push service...');
        unsubscribed = await subscription.unsubscribe();
        
        if (!unsubscribed) {
          const errorMsg = 'Failed to unsubscribe from push service';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('Successfully unsubscribed from push service');
      } catch (unsubscribeError) {
        console.error('Error unsubscribing from push service:', unsubscribeError);
        throw new Error(`Failed to unsubscribe: ${unsubscribeError.message}`);
      }

      // Notify server about unsubscription if we have a token
      if (token) {
        try {
          console.log('Notifying server about unsubscription...');
          const response = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint
            })
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.warn(`Server responded with status ${response.status}:`, errorText);
            // Don't throw here - we still want to consider this a success since local unsubscription worked
          } else {
            console.log('Successfully notified server about unsubscription');
          }
        } catch (serverError) {
          console.warn('Error notifying server about unsubscription:', serverError);
          // Don't throw here - we still want to consider this a success since local unsubscription worked
        }
      } else {
        console.log('Skipping server notification - no authentication token');
      }

      console.log('Push notification unsubscription completed successfully');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Sends a test notification either through the service worker or falls back to the Notifications API
   * @param {Object} options - Notification options
   * @param {string} [options.title='Test Notification'] - Notification title
   * @param {string} [options.body='This is a test notification'] - Notification body
   * @param {string} [options.icon='/icons/icon-192x192.png'] - URL of the notification icon
   * @param {string} [options.badge='/icons/icon-96x96.png'] - URL of the notification badge
   * @param {Object} [options.data={}] - Additional data to include with the notification
   * @param {string} [options.tag='test-notification'] - Tag to identify the notification
   * @returns {Promise<boolean>} - Whether the notification was sent successfully
   */
  async sendTestNotification(options = {}) {
    console.log('Sending test notification with options:', options);
    
    const defaultOptions = {
      title: 'Test Notification',
      body: 'This is a test notification',
      icon: '/starter-project-with-vite/icons/icon-192x192.png',
      badge: '/starter-project-with-vite/icons/icon-96x96.png',
      tag: 'test-notification-' + Date.now(),
      data: {
        url: window.location.href,
        timestamp: Date.now(),
        clickTarget: '/',
        source: 'test-notification'
      },
      // Add vibrate pattern for mobile devices
      vibrate: [200, 100, 200],
      // Add actions that can be handled in the service worker
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    // Merge default options with provided options
    const notificationOptions = { 
      ...defaultOptions, 
      ...options,
      // Ensure data is properly merged
      data: {
        ...defaultOptions.data,
        ...(options.data || {})
      }
    };

    // Add timestamp to the notification data
    notificationOptions.data.timestamp = Date.now();

    // Log the final notification options for debugging
    console.log('Final notification options:', notificationOptions);

    // Try to send the notification through the service worker first
    if (this.serviceWorkerRegistration && 'showNotification' in this.serviceWorkerRegistration) {
      try {
        console.log('Sending notification through service worker...');
        await this.serviceWorkerRegistration.showNotification(
          notificationOptions.title,
          notificationOptions
        );
        console.log('Notification sent through service worker');
        return true;
      } catch (swError) {
        console.warn('Error sending notification through service worker, falling back to Notifications API:', swError);
        // Continue to fallback
      }
    }

    // Fallback to Notifications API if service worker is not available or fails
    try {
      console.log('Service worker not available or failed, using Notifications API fallback');
      
      // Check if Notifications API is supported
      if (!('Notification' in window)) {
        console.error('Notifications API not supported');
        return false;
      }

      // Request permission if needed
      let permission = Notification.permission;
      if (permission !== 'granted' && permission !== 'denied') {
        console.log('Requesting notification permission...');
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        console.log('Sending notification using Notifications API:', notificationOptions);
        const notification = new Notification(notificationOptions.title, notificationOptions);
        
        // Add click handler
        notification.onclick = (event) => {
          console.log('Notification clicked:', notification);
          event.preventDefault();
          window.focus();
          
          // Handle the click based on the action if it's an action button click
          if (event.action) {
            console.log('Notification action clicked:', event.action);
            // You can add custom handling for different actions here
            if (event.action === 'view' && notification.data && notification.data.url) {
              window.open(notification.data.url, '_blank');
            } else if (event.action === 'dismiss') {
              notification.close();
            }
          } 
          // Handle main notification click
          else if (notification.data && notification.data.url) {
            window.open(notification.data.url, '_blank');
          }
          
          // Close the notification
          notification.close();
        };
        
        // Handle notification close
        notification.onclose = (event) => {
          console.log('Notification closed:', notificationOptions.tag);
        };
        
        // Handle notification error
        notification.onerror = (error) => {
          console.error('Notification error:', error);
        };
        
        console.log('Test notification shown successfully');
        return true;
      } else {
        console.warn('Notification permission not granted');
        return false;
      }
    } catch (fallbackError) {
      console.error('Error showing fallback notification:', fallbackError);
      return false;
    }
  }
  /**
   * Converts a base64 string to a Uint8Array
   * @param {string} base64String - The base64 string to convert
   * @returns {Uint8Array} - The converted Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    try {
      // Add padding if needed
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      
      // Convert base64 to URL-safe format
      const base64 = (base64String + padding)
        .replace(/\-/g, '+') // Convert from URL-safe
        .replace(/_/g, '/'); // Convert from URL-safe
      
      // Decode base64 to binary string
      const rawData = window.atob(base64);
      
      // Create a new Uint8Array with the decoded data
      const outputArray = new Uint8Array(rawData.length);
      
      // Convert each character to its char code and store in the Uint8Array
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      return outputArray;
    } catch (error) {
      console.error('Error converting base64 to Uint8Array:', error);
      throw new Error('Failed to convert base64 string to Uint8Array');
    }
  }
}

// Export a singleton instance of the PushNotificationService
export default new PushNotificationService();