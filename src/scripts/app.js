import { StoryModel } from './models/story.js';
import { StoryView } from './views/story.js';
import { StoryPresenter } from './presenters/story.js';
import pushNotificationService from './services/pushNotification.js';

export class App {
    constructor() {
        this.model = new StoryModel();
        this.view = new StoryView();
        this.presenter = new StoryPresenter(this.model, this.view);
        
        this.setupRouter();
        this.setupViewTransitions();
        this.setupSkipToContent();
        this.setupPushNotifications();
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

    async setupPushNotifications() {
        // Skip if not in a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
            console.warn('Push notifications require a secure context (HTTPS or localhost)');
            return;
        }

        // Check if push notifications are supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported in this browser');
            return;
        }

        if (!('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }

        try {
            console.log('Initializing push notifications...');
            
            // Check if we have a token
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No auth token found, skipping push notification setup');
                return;
            }
            
            // Initialize push notification service
            const isSupported = await pushNotificationService.init();
            console.log('Push notification supported:', isSupported);
            
            if (isSupported) {
                console.log('Subscribing to push notifications...');
                // Use a small delay to prevent blocking the main thread
                setTimeout(async () => {
                    try {
                        const success = await pushNotificationService.subscribe();
                        console.log('Push notification subscription result:', success);
                        
                        if (success) {
                            this.addPushNotificationTestButton();
                        }
                    } catch (error) {
                        // Handle specific errors
                        if (error.name === 'NotAllowedError') {
                            console.warn('Push notification permission denied by user');
                        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                            console.warn('Failed to connect to push notification server. This might be a CORS issue or network error.');
                            console.warn('Error details:', error);
                        } else if (error.name === 'AbortError') {
                            console.warn('Push subscription was aborted');
                        } else {
                            console.error('Failed to subscribe to push notifications:', error);
                        }
                    }
                }, 1000); // 1 second delay
            }
        } catch (error) {
            console.error('Error initializing push notifications:', error);
            
            // Log additional error details
            if (error instanceof Error) {
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                if (error.stack) {
                    console.error('Error stack:', error.stack);
                }
            }
        }
    }

    addPushNotificationTestButton() {
        // Only add the button if we're in development mode or for testing
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            const header = document.querySelector('header');
            if (header) {
                const testButton = document.createElement('button');
                testButton.textContent = 'Test Push Notification';
                testButton.className = 'btn btn-primary btn-sm';
                testButton.style.position = 'fixed';
                testButton.style.bottom = '20px';
                testButton.style.right = '20px';
                testButton.style.zIndex = '9999';
                
                testButton.addEventListener('click', async () => {
                    try {
                        await pushNotificationService.sendTestNotification();
                        alert('Test notification sent!');
                    } catch (error) {
                        console.error('Error sending test notification:', error);
                        alert('Failed to send test notification: ' + error.message);
                    }
                });
                
                document.body.appendChild(testButton);
            }
        }
    }
} 