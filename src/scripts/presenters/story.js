import DetailStoryPage from '../pages/detail-story.js';
import SavedReportsPage from '../pages/saved-reports.js';
import { getUserSavedReports, getStoryComments } from '../data/api.js';
import { openDB } from '../utils/index.js';
import { showLocalNotification } from '../index.js';

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
                this.view.renderDetail(detailContent);
                return;
            }

            if (hash.startsWith('#/saved-reports')) {
                const page = new SavedReportsPage();
                const content = await page.render();
                this.view.renderDetail(content);
                return;
            }

            switch (hash) {
                case '#/home':
                    this.view.renderHome();
                    this.setupHomeEventHandlers();
                    break;
                case '#/login':
                    this.view.renderLogin();
                    this.setupLoginEventHandlers();
                    break;
                case '#/register':
                    this.view.renderRegister();
                    this.setupRegisterEventHandlers();
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
                    // Tampilkan halaman Not Found jika route tidak dikenali
                    this.view.renderNotFound({
                        title: '404 - Halaman Tidak Ditemukan',
                        message: 'Halaman yang Anda cari tidak tersedia.',
                        buttonText: 'Kembali ke Home',
                        buttonAction: '#/home'
                    });
            }
        } catch (error) {
            console.error('Error in handleRoute:', error);
            if (this.view && this.view.showError) {
                this.view.showError('Terjadi kesalahan saat memuat halaman.');
            }
        }
    }

    setupHomeEventHandlers() {
        this.view.bindLoginButton(() => {
            window.location.hash = '#/login';
        });
        
        this.view.bindRegisterButton(() => {
            window.location.hash = '#/register';
        });
        
        this.view.bindLogoutButton(() => {
            this.model.logout();
            window.location.hash = '#/home';
        });
    }

    setupLoginEventHandlers() {
        this.view.bindLoginForm(async (credentials) => {
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

                    // --- Sinkronisasi Komentar (per laporan) ---
                    // Nonaktifkan sinkronisasi saved reports karena endpoint tidak tersedia
                    // Jika ingin sinkronisasi komentar, pastikan endpoint tersedia
                    // --- END Sinkronisasi ---

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

    setupRegisterEventHandlers() {
        this.view.bindRegisterForm(async (userData) => {
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
            this.setupStoriesEventHandlers();
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

    setupStoriesEventHandlers() {
        this.view.bindAddStoryButton(() => {
            window.location.hash = '#/add-story';
        });
        
        this.view.bindAddStoryGuestButton(() => {
            window.location.hash = '#/add-story-guest';
        });
        
        this.view.bindStoryDetailButtons((storyId) => {
            window.location.hash = `#/detail?id=${storyId}`;
        });
    }

    handleAddStory(isGuest = false) {
        this.view.renderAddStory(isGuest);
        this.setupAddStoryEventHandlers(isGuest);
    }

    setupAddStoryEventHandlers(isGuest) {
        this.view.bindStoryForm(async (storyData) => {
            try {
                const result = isGuest
                    ? await this.model.addStoryAsGuest(storyData)
                    : await this.model.addStory(storyData);

                if (!result.error) {
                    this.view.showSuccess('Story added successfully!');
                    showLocalNotification('Story berhasil dibuat', {
                      body: `Anda telah membuat story baru dengan deskripsi: ${storyData.description}`
                    });
                } else {
                    this.view.showError(result.message);
                }
            } catch (error) {
                this.view.showError('Failed to add story');
            }
        });
    }
}