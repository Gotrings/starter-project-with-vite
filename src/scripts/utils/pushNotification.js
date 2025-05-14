class PushNotificationService {
  constructor() {
    this.serviceWorkerRegistration = null;
  }

  async init() {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported in the browser');
        return;
      }

      if (!('Notification' in window)) {
        console.log('Notification not supported in the browser');
        return;
      }

      await this._requestNotificationPermission();
      await this._registerServiceWorker();
    } catch (error) {
      console.error('Error initializing push notification service:', error);
    }
  }

  async _requestNotificationPermission() {
    const result = await Notification.requestPermission();
    if (result === 'denied') {
      console.log('Notification permission denied');
      throw new Error('Notification permission denied');
    }
    if (result === 'default') {
      console.log('Notification permission closed');
      throw new Error('Notification permission closed');
    }
    console.log('Notification permission granted');
  }

  async _registerServiceWorker() {
    try {
      const swUrl = '/starter-project-with-vite/sw.js';

      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl, {
        scope: '/starter-project-with-vite/'
      });

      console.log('Service Worker registered successfully');

      // Ensure the Service Worker is activated
      if (this.serviceWorkerRegistration.active) {
        console.log('Service Worker already active');
      }

      this.serviceWorkerRegistration.addEventListener('activate', (event) => {
        console.log('Service Worker activated');
      });

      return this.serviceWorkerRegistration;
    } catch (error) {
      console.error('Error registering service worker:', error);
      throw error;
    }
  }

  async subscribeToPushNotification() {
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlB64ToUint8Array('BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk')
      });

      console.log('Push notification subscription:', subscription);

      // Send the subscription to your backend
      await this._sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notification:', error);
      throw error;
    }
  }

  async _sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/push-notif/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      const responseData = await response.json();
      console.log('Subscription sent to server:', responseData);
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  _urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default PushNotificationService;