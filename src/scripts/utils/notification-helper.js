const NotificationHelper = {
  async init() {
    if (!this._checkNotificationAvailability()) {
      console.log('Notification not supported in this browser');
      return;
    }

    if (!this._checkNotificationPermission()) {
      const status = await Notification.requestPermission();
      if (status === 'denied') {
        console.log('Notification permission denied');
        return;
      }
      if (status === 'default') {
        console.log('Permission closed');
        return;
      }
    }

    await this._registerServiceWorker();
    await this._requestNotificationSubscription();
  },

  async _checkNotificationAvailability() {
    return 'Notification' in window;
  },

  _checkNotificationPermission() {
    return Notification.permission === 'granted';
  },

  async _registerServiceWorker() {
    if (!navigator.serviceWorker) {
      console.log('Service Worker not supported in the browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/starter-project-with-vite/sw.js', {
        scope: '/starter-project-with-vite/'
      });
      console.log('Service worker registered');
      return registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      return null;
    }
  },

  async _requestNotificationSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: this._urlB64ToUint8Array('BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk')
    };

    try {
      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('User is subscribed to push service:', subscription);
      
      // Send subscription to backend
      await this._sendSubscriptionToBackend(subscription);
    } catch (error) {
      console.error('Failed to subscribe user:', error);
    }
  },

  async _sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch('https://story-api.dicoding.dev/v1/push-notif/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }
      console.log('Push notification subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send push notification subscription to server:', error);
    }
  },

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
  },

  async sendNotification({ title, options }) {
    if (!this._checkNotificationPermission()) {
      console.log('User has not granted notification permission');
      return;
    }

    if (!this._checkNotificationAvailability()) {
      console.log('Notification not supported in this browser');
      return;
    }

    try {
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      await serviceWorkerRegistration.showNotification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

export default NotificationHelper;