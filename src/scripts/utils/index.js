export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// IndexedDB Utility
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('story-app-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('savedReports')) {
        db.createObjectStore('savedReports', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('comments')) {
        const commentsStore = db.createObjectStore('comments', { keyPath: 'commentId', autoIncrement: true });
        commentsStore.createIndex('storyId', 'storyId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveReport(story) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('savedReports', 'readwrite');
    tx.objectStore('savedReports').put(story);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedReports() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('savedReports', 'readonly');
    const req = tx.objectStore('savedReports').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteReport(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('savedReports', 'readwrite');
    tx.objectStore('savedReports').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addComment(storyId, user, message) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('comments', 'readwrite');
    tx.objectStore('comments').add({ storyId, user, message, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCommentsByStoryId(storyId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('comments', 'readonly');
    const index = tx.objectStore('comments').index('storyId');
    const req = index.getAll(IDBKeyRange.only(storyId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteComment(commentId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('comments', 'readwrite');
    tx.objectStore('comments').delete(commentId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
