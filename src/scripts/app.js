import { StoryModel } from './models/story.js';
import { StoryView } from './views/story.js';
import { StoryPresenter } from './presenters/story.js';

class App {
    constructor() {
        this.model = new StoryModel();
        this.view = new StoryView();
        this.presenter = new StoryPresenter(this.model, this.view);
        
        this.setupRouter();
        this.setupViewTransitions();
        this.setupSkipToContent();
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