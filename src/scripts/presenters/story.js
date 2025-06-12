export class StoryPresenter {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.notificationEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        this.setupNotificationToggle();
    }

    setupNotificationToggle() {
        const notificationToggle = document.getElementById('notification-toggle');
        const notificationStatus = document.getElementById('notification-status');
        
        if (notificationToggle && notificationStatus) {
            // Set initial state
            this.updateNotificationStatus();
            
            notificationToggle.addEventListener('click', async (e) => {
                e.preventDefault();
                if (this.notificationEnabled) {
                    // Disable notifications
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.getSubscription();
                        if (subscription) {
                            await subscription.unsubscribe();
                            await this.model.unsubscribeFromNotifications(subscription.endpoint);
                        }
                        this.notificationEnabled = false;
                        localStorage.setItem('notificationsEnabled', 'false');
                        this.view.showSuccess('Notifications disabled');
                    } catch (error) {
                        console.error('Error disabling notifications:', error);
                        this.view.showError('Failed to disable notifications');
                    }
                } else {
                    // Enable notifications
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
                        });
                        await this.model.subscribeToNotifications({
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                                auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
                            }
                        });
                        this.notificationEnabled = true;
                        localStorage.setItem('notificationsEnabled', 'true');
                        this.view.showSuccess('Notifications enabled');
                    } catch (error) {
                        console.error('Error enabling notifications:', error);
                        this.view.showError('Failed to enable notifications');
                    }
                }
                this.updateNotificationStatus();
            });
        }
    }

    updateNotificationStatus() {
        const notificationStatus = document.getElementById('notification-status');
        if (notificationStatus) {
            notificationStatus.textContent = this.notificationEnabled ? 'Notifikasi Hidup' : 'Notifikasi Mati';
        }
    }

    async handleRoute(hash) {
        switch (hash) {
            case '#/home':
                this.view.renderHome();
                this.setupAuthButtons();
                break;
            case '#/login':
                this.view.renderLogin();
                this.setupLoginForm();
                break;
            case '#/register':
                this.view.renderRegister();
                this.setupRegisterForm();
                break;
            case '#/stories':
                await this.handleStories();
                break;
            case '#/add-story':
                this.handleAddStory();
                break;
            case '#/add-story-guest':
                this.handleAddStory(true);
                break;
            case '#/saved-reports':
                this.handleSavedReports();
                break;
            default:
                window.location.hash = '#/home';
        }
    }

    setupAuthButtons() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.hash = '#/login';
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                window.location.hash = '#/register';
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.model.logout();
                window.location.hash = '#/home';
            });
        }
    }

    setupLoginForm() {
        const form = document.getElementById('login-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const credentials = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const result = await this.model.login(credentials);
                if (!result.error) {
                    // Subscribe to notifications after successful login
                    try {
                        const subscription = await this.view.registerServiceWorker();
                        if (subscription) {
                            await this.model.subscribeToNotifications(subscription);
                        }
                    } catch (error) {
                        console.error('Failed to subscribe to notifications:', error);
                    }
                    this.view.showSuccess('Login successful!');
                    setTimeout(() => {
                        window.location.hash = '#/stories';
                    }, 1000);
                } else {
                    this.view.showError(result.message || 'Login failed');
                }
            } catch (error) {
                this.view.showError('Login failed: ' + error.message);
            }
        });
    }

    setupRegisterForm() {
        const form = document.getElementById('register-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            try {
                const result = await this.model.register(userData);
                if (!result.error) {
                    this.view.showSuccess('Registration successful! Please login.');
                    window.location.hash = '#/login';
                } else {
                    this.view.showError(result.message);
                }
            } catch (error) {
                this.view.showError('Registration failed');
            }
        });
    }

    async handleStories() {
        try {
            const stories = await this.model.getStories();
            this.view.renderStories(stories);
            this.setupStoryButtons();
            this.setupDetailButtons();
        } catch (error) {
            if (error.message.includes('Session expired') || error.message.includes('401')) {
                // Token expired or invalid
                this.model.logout();
                this.view.showError('Session expired. Please login again.');
                setTimeout(() => {
                    window.location.hash = '#/login';
                }, 1000);
            } else {
                this.view.showError(error.message || 'Failed to load stories');
            }
        }
    }

    setupStoryButtons() {
        const addStoryBtn = document.getElementById('add-story-btn');
        const addStoryGuestBtn = document.getElementById('add-story-guest-btn');

        if (addStoryBtn) {
            addStoryBtn.addEventListener('click', () => {
                window.location.hash = '#/add-story';
            });
        }

        if (addStoryGuestBtn) {
            addStoryGuestBtn.addEventListener('click', () => {
                window.location.hash = '#/add-story-guest';
            });
        }
    }

    setupDetailButtons() {
        const detailButtons = document.querySelectorAll('.view-details');
        detailButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const storyId = button.dataset.id;
                try {
                    const story = await this.model.getStoryById(storyId);
                    if (story) {
                        this.view.renderStoryDetail(story);
                    } else {
                        this.view.showError('Story not found');
                    }
                } catch (error) {
                    this.view.showError('Failed to load story details');
                }
            });
        });
    }

    handleAddStory(isGuest = false) {
        this.view.renderAddStory(isGuest);
        this.setupStoryForm(isGuest);
    }

    setupStoryForm(isGuest) {
        const form = document.getElementById('story-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const storyData = {
                description: formData.get('description'),
                photo: formData.get('photo'),
                lat: formData.get('lat'),
                lon: formData.get('lon')
            };

            try {
                const result = isGuest
                    ? await this.model.addStoryAsGuest(storyData)
                    : await this.model.addStory(storyData);

                if (!result.error) {
                    this.view.showSuccess('Story added successfully!');
                    
                    // Send push notification if enabled
                    if (this.notificationEnabled) {
                        try {
                            const registration = await navigator.serviceWorker.ready;
                            await registration.showNotification('Story berhasil dibuat', {
                                body: `Anda telah membuat story baru dengan deskripsi: ${storyData.description}`,
                                icon: './images/logo.png',
                                badge: './favicon.png',
                                data: {
                                    url: '/stories'
                                }
                            });
                        } catch (error) {
                            console.error('Error sending notification:', error);
                        }
                    }
                } else {
                    this.view.showError(result.message);
                }
            } catch (error) {
                this.view.showError('Failed to add story');
            }
        });
    }

    handleSavedReports() {
        const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
        this.view.renderSavedReports(savedReports);
    }
} 