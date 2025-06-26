import { StoryModel } from './models/story.js';
import { StoryView } from './views/story.js';
import { StoryPresenter } from './presenters/story.js';
import { databaseService } from './services/database.js';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker
    navigator.serviceWorker.register('/sw-new.js', { scope: '/' })
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker found:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed to:', newWorker.state);
          });
        });
        
        // Check for updates
        if (registration.waiting) {
          console.log('Service worker waiting to activate');
        }
        
        if (registration.active) {
          console.log('Service worker active');
        }
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
    
    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Controller changed, reloading page...');
      window.location.reload();
    });
  });
}

// Listen for controllerchange event to handle service worker updates
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!refreshing) {
    window.location.reload();
    refreshing = true;
  }
});

class App {
    constructor() {
        this.model = new StoryModel();
        this.view = new StoryView();
        this.presenter = new StoryPresenter(this.model, this.view);
        
        this.setupRouter();
        this.setupViewTransitions();
        this.setupSkipToContent();
        this.setupSaveReportHandler();
        
        // Initialize the database
        databaseService.init().catch(console.error);
    }
    
    setupSaveReportHandler() {
        // Listen for custom 'saveReport' events
        document.addEventListener('saveReport', async (event) => {
            try {
                const reportData = event.detail;
                const reportId = await databaseService.saveReport(reportData);
                console.log('Report saved with ID:', reportId);
                
                // Dispatch an event to notify that the report was saved
                const savedEvent = new CustomEvent('reportSaved', { 
                    detail: { ...reportData, id: reportId } 
                });
                document.dispatchEvent(savedEvent);
                
            } catch (error) {
                console.error('Failed to save report:', error);
                const errorEvent = new CustomEvent('reportSaveError', { 
                    detail: { error: error.message || 'Failed to save report' } 
                });
                document.dispatchEvent(errorEvent);
            }
        });
    }

    setupSkipToContent() {
        const mainContent = document.querySelector('#main-content');
        const skipLink = document.querySelector('.skip-link');
        
        skipLink.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
        });
    }

    setupRouter() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash || '#/home';
            this.presenter.handleRoute(hash);
        });

        // Initial route
        window.dispatchEvent(new Event('hashchange'));
    }

    setupViewTransitions() {
        if (!document.startViewTransition) {
            return;
        }

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href.startsWith('#')) return;

            e.preventDefault();
            document.startViewTransition(() => {
                window.location.hash = href;
            });
        });
    }
}

// Initialize the app
new App(); 