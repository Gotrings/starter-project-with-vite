import CONFIG from '../config.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

class PushNotificationService {
  constructor() {
    this.serviceWorkerRegistration = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported');
      return false;
    }

    try {
      let swPath = '/sw.js';
      if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        swPath = '/starter-project-with-vite/sw.js';
      }

      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swPath, {
        scope: location.hostname === 'localhost' ? '/' : '/starter-project-with-vite/',
      });

      if (this.serviceWorkerRegistration.active) {
        console.log('Service Worker aktif');
        return true;
      }

      await new Promise(resolve => {
        this.serviceWorkerRegistration.addEventListener('activate', () => {
          console.log('Service Worker telah diaktifkan');
          resolve();
        });
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async subscribe() {
    try {
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Sudah berlangganan push notification');
        return true;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal berlangganan push notification: ' + response.status);
      }

      const result = await response.json();
      if (!result.error) {
        console.log('Berhasil berlangganan push notification');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saat berlangganan push notification:', error);
      return false;
    }
  }

  async unsubscribe() {
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (!subscription) {
        console.log('Tidak ada subscription yang aktif');
        return true;
      }

      const unsubscribed = await subscription.unsubscribe();
      if (!unsubscribed) {
        throw new Error('Gagal berhenti berlangganan dari push manager');
      }

      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal berhenti berlangganan dari server: ' + response.status);
      }

      const result = await response.json();
      if (!result.error) {
        console.log('Berhasil berhenti berlangganan push notification');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error saat berhenti berlangganan push notification:', error);
      return false;
    }
  }

  // ✅ Metode utilitas ini harus berada di dalam class
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushNotificationService();
