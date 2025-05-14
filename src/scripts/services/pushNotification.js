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
      const isDev = import.meta.env.MODE === 'development';
      const base = isDev ? '' : '/starter-project-with-vite';
      const swPath = isDev ? '/sw.js' : '/starter-project-with-vite/sw.js';
      const scope = isDev ? '/' : '/starter-project-with-vite/';
      
      // Ensure variables are defined in error logging scope
      this.isDev = isDev;
      this.swPath = swPath;
      this.scope = scope;
      
      console.log('Environment:', isDev ? 'Development' : 'Production');
      console.log('Base URL:', base);
      console.log('Service Worker Path:', swPath);
      console.log('Service Worker Scope:', scope);
      
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(swPath, {
        scope: scope,
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
      console.error('Service Worker registration failed:', {
        message: error.message,
        stack: error.stack,
        environment: this.isDev ? 'Development' : 'Production',
        swPath: this.swPath,
        scope: this.scope,
        hostname: location.hostname
      });
      return false;
    }
  }

  async subscribe() {
    try {
      if (!('Notification' in window)) {
        console.error('Browser tidak mendukung Notification API');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('Izin notifikasi tidak diberikan');
        return false;
      }

      if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.active) {
        console.log('Service Worker belum aktif, mencoba menginisialisasi...');
        const initialized = await this.init();
        if (!initialized) {
          console.error('Gagal menginisialisasi Service Worker');
          return false;
        }
      }
      const existingSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Sudah berlangganan push notification');
        return true;
      }

      console.log('Mencoba mendapatkan subscription...');
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      if (!subscription) {
        console.error('Gagal mendapatkan subscription');
        return false;
      }

      console.log('Mengirim subscription ke server...');
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
        const errorMessage = `Gagal mengirim subscription ke server: ${response.status} ${response.statusText}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Berhasil subscribe push notification');

      const result = await response.json();
      if (!result.error) {
        console.log('Berhasil berlangganan push notification');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Gagal melakukan subscribe push notification:', {
        message: error.message,
        stack: error.stack,
        serviceWorkerStatus: this.serviceWorkerRegistration?.active ? 'active' : 'inactive',
      });
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
