class DatabaseService {
  constructor() {
    this.dbName = 'story-app-db';
    // Increment version to ensure onupgradeneeded is called
    this.dbVersion = 2;
    this.db = null;
  }

  // Clear and reinitialize the database
  async clearAndReinit() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        this.db = null;
        this.init().then(resolve).catch(reject);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting database:', event.target.error);
        reject('Error deleting database');
      };
      
      request.onblocked = () => {
        console.error('Database deletion blocked');
        reject('Database deletion blocked. Please close all other tabs using this database.');
      };
    });
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error opening database:', event.target.error);
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for reports if it doesn't exist
        if (!db.objectStoreNames.contains('reports')) {
          const store = db.createObjectStore('reports', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          
          // Create indexes for querying
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('title', 'title', { unique: false });
          
          console.log('Reports store created');
        }

        // Create object store for stories
        if (!db.objectStoreNames.contains('stories')) {
          const store = db.createObjectStore('stories', {
            keyPath: 'id'
          });
          
          // Create index for querying stories
          store.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Stories store created');
        }
        
        // Create object store for saved reports
        if (!db.objectStoreNames.contains('savedReports')) {
          try {
            const store = db.createObjectStore('savedReports', {
              keyPath: 'id'
            });
            
            // Create index for querying saved reports by saved date
            store.createIndex('savedAt', 'savedAt', { unique: false });
            console.log('Saved reports store created');
          } catch (e) {
            console.error('Error creating savedReports store:', e);
            // In case of error, try to delete the existing database
            indexedDB.deleteDatabase(this.dbName);
            throw e;
          }
        }
      };
    });
  }

  // Save stories to the database
  async saveStories(stories) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      // Clear existing stories
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all new stories
        const addRequests = stories.map(story => {
          return new Promise((resolveAdd, rejectAdd) => {
            const request = store.add({
              ...story,
              id: story.id, // Ensure id is set as the key
              createdAt: new Date().toISOString()
            });
            
            request.onsuccess = () => resolveAdd();
            request.onerror = (e) => {
              console.error('Error adding story:', e);
              rejectAdd(e);
            };
          });
        });
        
        Promise.all(addRequests)
          .then(() => resolve())
          .catch(error => reject(error));
      };
      
      clearRequest.onerror = (e) => {
        console.error('Error clearing stories:', e);
        reject(e);
      };
    });
  }

  // Get all stories from the database
  async getStories() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => {
        console.error('Error getting stories:', e);
        reject(e);
      };
    });
  }

  // Ensure the database is properly initialized
  async ensureDatabase() {
    if (!this.db) {
      await this.init();
    }
    
    // Verify the object store exists
    if (!this.db.objectStoreNames.contains('savedReports')) {
      console.warn('savedReports store not found, recreating database...');
      await this.clearAndReinit();
    }
  }

  // Save a report to the database
  async saveReport(report) {
    await this.ensureDatabase();
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['savedReports'], 'readwrite');
      const store = transaction.objectStore('savedReports');
      
      // Check if report already exists
      const getRequest = store.get(report.id);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          reject(new Error('Laporan sudah tersimpan'));
          return;
        }
        
        // Add savedAt timestamp
        const reportToSave = {
          ...report,
          savedAt: new Date().toISOString()
        };
        
        const request = store.add(reportToSave);
        
        request.onsuccess = () => resolve(reportToSave);
        request.onerror = (e) => {
          console.error('Error saving report:', e);
          reject(e);
        };
      };
      
      getRequest.onerror = (e) => {
        console.error('Error checking report existence:', e);
        reject(e);
      };
    });
  }
  
  // Get all saved reports
  async getSavedReports() {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['savedReports'], 'readonly');
      const store = transaction.objectStore('savedReports');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => {
        console.error('Error getting saved reports:', e);
        reject(e);
      };
    });
  }
  
  // Delete a saved report
  async deleteReport(reportId) {
    await this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['savedReports'], 'readwrite');
      const store = transaction.objectStore('savedReports');
      const request = store.delete(reportId);
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => {
        console.error('Error deleting report:', e);
        reject(e);
      };
    });
  }
  
  // Save a report to the reports store (existing method)
  async saveReportToReports(report) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');
      
      // Add timestamp to the report
      const reportWithTimestamp = {
        ...report,
        timestamp: new Date().toISOString()
      };
      
      const request = store.add(reportWithTimestamp);
      
      request.onsuccess = () => {
        console.log('Report saved successfully');
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error saving report:', event.target.error);
        reject('Error saving report');
      };
    });
  }
  
  // Get all reports from the reports store
  async getAllReports() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reports'], 'readonly');
      const store = transaction.objectStore('reports');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => {
        console.error('Error getting reports:', e);
        reject(e);
      };
    });
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Initialize the database when the module is imported
databaseService.init().catch(console.error);
