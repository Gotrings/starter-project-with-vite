import DetailStoryPage from '../pages/detail-story.js';
import SavedReportsPage from '../pages/saved-reports.js';

export class StoryPresenter {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.detailPage = new DetailStoryPage();
    }

    async handleRoute(hash) {
        try {
            if (hash.startsWith('#/detail')) {
                const detailContent = await this.detailPage.render();
                this.view.appElement.innerHTML = '';
                this.view.appElement.appendChild(detailContent);
                return;
            }

            if (hash.startsWith('#/saved-reports')) {
                const page = new SavedReportsPage();
                const content = await page.render();
                this.view.appElement.innerHTML = '';
                this.view.appElement.appendChild(content);
                return;
            }

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
                default:
                    window.location.hash = '#/home';
            }
        } catch (error) {
            console.error('Error in handleRoute:', error);
            if (this.view && this.view.showError) {
                this.view.showError('Terjadi kesalahan saat memuat halaman.');
            }
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
        } catch (error) {
            if (error.message.includes('401')) {
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
                } else {
                    this.view.showError(result.message);
                }
            } catch (error) {
                this.view.showError('Failed to add story');
            }
        });
    }
} 