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
  
  // Show notification that notifications have been activated
  if (swReg && swReg.active) {
    swReg.active.postMessage({
      type: 'SEND_NOTIFICATION',
      notification: {
        title: 'CityCare App',
        body: 'Notifikasi diaktifkan',
        icon: '/starter-project-with-vite/icons/icon-192x192.png'
      }
    });
  }
  
  // Start checking for new stories
  if (storyCheckInterval) {
    clearInterval(storyCheckInterval);
  }
  
  // Initialize the latest story ID
  await checkForNewStories();
  
  // Set up interval to check for new stories every 5 minutes
  storyCheckInterval = setInterval(checkForNewStories, 5 * 60 * 1000);
}

async function unsubscribePush() {
  swReg = await navigator.serviceWorker.ready;
  const subscription = await swReg.pushManager.getSubscription();
  if (subscription) {
    // Show notification that notifications have been deactivated before unsubscribing
    if (swReg && swReg.active) {
      swReg.active.postMessage({
        type: 'SEND_NOTIFICATION',
        notification: {
          title: 'CityCare App',
          body: 'Notifikasi dimatikan',
          icon: '/starter-project-with-vite/icons/icon-192x192.png'
        }
      });
    }
    
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
    
    // Clear the story checking interval
    if (storyCheckInterval) {
      clearInterval(storyCheckInterval);
      storyCheckInterval = null;
    }
    
    // Reset the latest story ID
    latestStoryId = null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  new App();
  const btn = document.getElementById('push-subscribe-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (isPushSubscribed) {
        await unsubscribePush();
      } else {
        await subscribePush();
      }
      updatePushBtn();
    });
    await updatePushBtn();
    
    // If the user is already subscribed, start checking for new stories
    if (isPushSubscribed) {
      // Initialize the latest story ID
      await checkForNewStories();
      
      // Set up interval to check for new stories every 5 minutes
      if (storyCheckInterval) {
        clearInterval(storyCheckInterval);
      }
      storyCheckInterval = setInterval(checkForNewStories, 5 * 60 * 1000);
    }
  }
});

export function showLocalNotification(title, body, data = {}) {
  if (isPushSubscribed && swReg && swReg.active) {
    swReg.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      data
    });
  }
}

// Store the latest story ID we've seen
let latestStoryId = null;

// Function to check for new stories and show notifications if needed
export async function checkForNewStories() {
  // Only check if user is subscribed to notifications
  if (!isPushSubscribed) return;
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Fetch the latest stories
    const response = await fetch('https://story-api.dicoding.dev/v1/stories?page=1&size=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch stories:', response.status);
      return;
    }
    
    const data = await response.json();
    if (!data.listStory || data.listStory.length === 0) return;
    
    const newestStory = data.listStory[0];
    
    // If this is the first time we're checking, just store the ID without notification
    if (latestStoryId === null) {
      latestStoryId = newestStory.id;
      return;
    }
    
    // If we have a new story, show a notification
    if (newestStory.id !== latestStoryId) {
      showLocalNotification(
        'CityCare App', 
        `Ada cerita baru dari ${newestStory.name}`,
        {
          url: `#/stories/${newestStory.id}`,
          storyId: newestStory.id
        }
      );
      
      // Update the latest story ID
      latestStoryId = newestStory.id;
    }
  } catch (error) {
    console.error('Error checking for new stories:', error);
  }
}

// Set up a periodic check for new stories (every 5 minutes)
let storyCheckInterval = null;
