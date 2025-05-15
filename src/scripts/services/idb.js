class IndexedDBService {
  static #dbPromise = null;
  static #dbName = 'story-app-db';
  static #dbVersion = 1;
  static #objectStoreName = 'stories';

  static async init() {
    if (this.#dbPromise) return this.#dbPromise;

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.#dbName, this.#dbVersion);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.#dbPromise = event.target.result;
        resolve(this.#dbPromise);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.#objectStoreName)) {
          const objectStore = db.createObjectStore(this.#objectStoreName, {
            keyPath: 'id',
            autoIncrement: false
          });

          // Add indexes
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  static async addStory(story) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.#objectStoreName], 'readwrite');
      const objectStore = transaction.objectStore(this.#objectStoreName);
      
      const request = objectStore.put(story);
      
      request.onsuccess = () => resolve(story);
      request.onerror = () => reject(request.error);
    });
  }

  static async getStory(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.#objectStoreName], 'readonly');
      const objectStore = transaction.objectStore(this.#objectStoreName);
      
      const request = objectStore.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async getAllStories() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.#objectStoreName], 'readonly');
      const objectStore = transaction.objectStore(this.#objectStoreName);
      
      const request = objectStore.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async deleteStory(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.#objectStoreName], 'readwrite');
      const objectStore = transaction.objectStore(this.#objectStoreName);
      
      const request = objectStore.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async clearAll() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.#objectStoreName], 'readwrite');
      const objectStore = transaction.objectStore(this.#objectStoreName);
      
      const request = objectStore.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export default IndexedDBService;
