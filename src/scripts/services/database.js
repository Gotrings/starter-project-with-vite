class DatabaseService {
  constructor() {
    this.dbName = 'saved-reports';
    this.dbVersion = 1;
    this.db = null;
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
          
          console.log('Database and object store created');
        }
      };
    });
  }

  // Save a report to the database
  async saveReport(report) {
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

  // Get all saved reports
  async getAllReports() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reports'], 'readonly');
      const store = transaction.objectStore('reports');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Error getting reports:', event.target.error);
        reject('Error getting reports');
      };
    });
  }

  // Delete a report by ID
  async deleteReport(id) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('Report deleted successfully');
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error deleting report:', event.target.error);
        reject('Error deleting report');
      };
    });
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Initialize the database when the module is imported
databaseService.init().catch(console.error);
