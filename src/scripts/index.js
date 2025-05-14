// CSS imports
import '../styles/main.css';
import '../styles/detail-story.css';

import { App } from './app.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
let isPushSubscribed = false;
let swReg = null;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function updatePushBtn() {
  const btn = document.getElementById('push-subscribe-btn');
  if (!btn) return;
  if (!('serviceWorker' in navigator)) {
    btn.style.display = 'none';
    return;
  }
  swReg = await navigator.serviceWorker.ready;
  const subscription = await swReg.pushManager.getSubscription();
  isPushSubscribed = !!subscription;
  if (isPushSubscribed) {
    btn.innerHTML = 'Unsubscribe Notifikasi <i class="fa-solid fa-bell-slash"></i>';
    btn.style.background = '#EF5350';
    btn.style.color = '#fff';
  } else {
    btn.innerHTML = 'Subscribe Notifikasi <i class="fa-solid fa-bell"></i>';
    btn.style.background = '#fff';
    btn.style.color = '#4A90E2';
  }
}

async function subscribePush() {
  swReg = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;
  const subscription = await swReg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  // Kirim ke backend
  const token = localStorage.getItem('token');
  await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  });
}

async function unsubscribePush() {
  swReg = await navigator.serviceWorker.ready;
  const subscription = await swReg.pushManager.getSubscription();
  if (subscription) {
    // Hapus dari backend
    const token = localStorage.getItem('token');
    await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint: subscription.endpoint })
    });
    await subscription.unsubscribe();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
  const btn = document.getElementById('push-subscribe-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (isPushSubscribed) {
        await unsubscribePush();
        showLocalNotification('Notifikasi Dimatikan', 'Kamu tidak akan menerima notifikasi lagi.');
      } else {
        await subscribePush();
        showLocalNotification('Notifikasi Aktif!', 'Kamu akan menerima notifikasi dari aplikasi ini.');
      }
      updatePushBtn();
    });
    updatePushBtn();
  }
});

export function showLocalNotification(title, body) {
  if (isPushSubscribed && swReg && swReg.active) {
    swReg.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body
    });
  }
}
