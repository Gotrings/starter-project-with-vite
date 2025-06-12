import { StoryModel } from '../models/story.js';

export class StoryView {
    constructor() {
        this.appElement = document.getElementById('app');
        this.map = null;
        this.markers = null;
        this.cameraStream = null;
        this.setupNotificationPermission();
        this.setupNotificationContainer();
    }

    setupNotificationContainer() {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notificationContainer.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    async setupNotificationPermission() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.registerServiceWorker();
            }
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Check if notifications are enabled
            const notificationEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            
            if (notificationEnabled) {
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'
                });

                // Subscribe to notifications
                if (subscription) {
                    const storyModel = new StoryModel();
                    await storyModel.subscribeToNotifications({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
                        }
                    });
                }
            }

            return registration;
        } catch (error) {
            console.error('Error registering service worker:', error);
        }
    }

    async sendNotification(title, options) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    renderHome() {
        const isLoggedIn = localStorage.getItem('token') !== null;
        this.appElement.innerHTML = `
            <section class="hero">
                <h2>Welcome to Story Documentation</h2>
                <p>Share your stories with the world!</p>
                ${isLoggedIn ? `
                    <button id="logout-btn" class="btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
                ` : `
                    <div class="auth-buttons">
                        <button id="login-btn" class="btn"><i class="fas fa-sign-in-alt"></i> Login</button>
                        <button id="register-btn" class="btn"><i class="fas fa-user-plus"></i> Register</button>
                    </div>
                `}
            </section>
        `;

        if (isLoggedIn) {
            const logoutBtn = document.getElementById('logout-btn');
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                this.showSuccess('Logged out successfully!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
        }
    }

    renderLogin() {
        this.appElement.innerHTML = `
            <section class="auth-form">
                <h2>Login</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn">Login</button>
                </form>
            </section>
        `;
    }

    renderRegister() {
        this.appElement.innerHTML = `
            <section class="auth-form">
                <h2>Register</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required minlength="8">
                    </div>
                    <button type="submit" class="btn">Register</button>
                </form>
            </section>
        `;
    }

    renderStories(stories) {
        const isLoggedIn = localStorage.getItem('token') !== null;
        this.appElement.innerHTML = `
            <section class="stories">
                <h2>Stories</h2>
                <div class="stories-grid">
                    ${stories.map(story => this.createStoryCard(story)).join('')}
                </div>
                <div id="map" class="map-container"></div>
                ${isLoggedIn ? `
                    <button id="add-story-btn" class="btn">Add New Story</button>
                ` : `
                    <button id="add-story-guest-btn" class="btn">Add Story as Guest</button>
                `}
            </section>
        `;

        this.initializeMap(stories);
    }

    createStoryCard(story) {
        return `
            <article class="story-card">
                <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
                <div class="story-content">
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                    ${story.lat && story.lon ? `
                        <p>Location: ${story.lat}, ${story.lon}</p>
                    ` : ''}
                    <p>Created: ${new Date(story.createdAt).toLocaleDateString()}</p>
                    <button class="btn view-details" data-id="${story.id}">
                        <i class="fas fa-info-circle"></i> Selengkapnya
                    </button>
                </div>
            </article>
        `;
    }

    renderStoryDetail(story) {
        this.appElement.innerHTML = `
            <section class="story-detail">
                <button class="btn back-btn" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <div class="detail-content">
                    <h2>${story.name}</h2>
                    <div class="detail-info">
                        <p><i class="fas fa-user"></i> Pembuat: ${story.name}</p>
                        <p><i class="fas fa-calendar"></i> Tanggal Dibuat: ${new Date(story.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="detail-image">
                        <img src="${story.photoUrl}" alt="${story.description}">
                    </div>
                    <div class="detail-description">
                        <h3>Deskripsi</h3>
                        <p>${story.description}</p>
                    </div>
                    ${story.lat && story.lon ? `
                        <div class="detail-location">
                            <h3>Lokasi</h3>
                            <div id="detail-map" class="map-container"></div>
                            <div class="coordinates">
                                <p><i class="fas fa-map-marker-alt"></i> Latitude: ${story.lat}</p>
                                <p><i class="fas fa-map-marker-alt"></i> Longitude: ${story.lon}</p>
                            </div>
                        </div>
                    ` : ''}
                    <button class="btn save-report" data-id="${story.id}">
                        <i class="fas fa-save"></i> Simpan Laporan
                    </button>
                </div>
            </section>
        `;

        // Initialize map if location exists
        if (story.lat && story.lon) {
            this.initializeDetailMap(story);
        }

        // Add event listener for save report button
        const saveButton = this.appElement.querySelector('.save-report');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveReport(story);
            });
        }
    }

    initializeDetailMap(story) {
        const map = L.map('detail-map').setView([story.lat, story.lon], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`
                <div class="story-popup">
                    <h3>${story.name}</h3>
                    <p>${story.description}</p>
                </div>
            `);
    }

    saveReport(story) {
        const savedReports = JSON.parse(localStorage.getItem('savedReports') || '[]');
        
        // Check if story is already saved
        const isAlreadySaved = savedReports.some(report => report.id === story.id);
        
        if (isAlreadySaved) {
            this.showError('Laporan sudah tersimpan');
            return;
        }

        // Add savedAt timestamp
        const reportToSave = {
            ...story,
            savedAt: new Date().toISOString()
        };

        savedReports.push(reportToSave);
        localStorage.setItem('savedReports', JSON.stringify(savedReports));
        this.showSuccess('Laporan berhasil disimpan');
    }

    renderAddStory(isGuest = false) {
        this.appElement.innerHTML = `
            <section class="add-story">
                <h2>${isGuest ? 'Add Story as Guest' : 'Add New Story'}</h2>
                <form id="story-form">
                    <div class="form-group">
                        <label for="photo">Photo</label>
                        <div class="camera-container">
                            <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                            <canvas id="photo-canvas" style="display: none;"></canvas>
                            <img id="photo-preview" style="display: none; max-width: 100%; margin-top: 1rem;">
                            <button type="button" id="start-camera" class="btn">Start Camera</button>
                            <button type="button" id="capture-photo" class="btn" style="display: none;">Capture Photo</button>
                            <input type="file" id="photo" name="photo" accept="image/*" style="display: none;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="location">Location</label>
                        <div id="location-map" class="map-container"></div>
                        <div id="coordinates-display" class="coordinates-display"></div>
                        <input type="hidden" id="lat" name="lat">
                        <input type="hidden" id="lon" name="lon">
                    </div>
                    <button type="submit" class="btn">Submit Story</button>
                </form>
            </section>
        `;

        this.initializeLocationMap();
        this.setupCameraHandlers();
        this.setupStoryForm();
    }

    setupCameraHandlers() {
        const startCameraBtn = document.getElementById('start-camera');
        const capturePhotoBtn = document.getElementById('capture-photo');
        const cameraPreview = document.getElementById('camera-preview');
        const photoCanvas = document.getElementById('photo-canvas');
        const photoInput = document.getElementById('photo');
        const photoPreview = document.getElementById('photo-preview');

        startCameraBtn.addEventListener('click', async () => {
            try {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                });
                cameraPreview.srcObject = this.cameraStream;
                cameraPreview.style.display = 'block';
                startCameraBtn.style.display = 'none';
                capturePhotoBtn.style.display = 'inline-block';
                photoPreview.style.display = 'none';
            } catch (error) {
                this.showError('Failed to access camera');
                console.error('Camera error:', error);
            }
        });

        capturePhotoBtn.addEventListener('click', () => {
            if (!this.cameraStream) return;

            const context = photoCanvas.getContext('2d');
            photoCanvas.width = cameraPreview.videoWidth;
            photoCanvas.height = cameraPreview.videoHeight;
            context.drawImage(cameraPreview, 0, 0);

            // Convert canvas to blob
            photoCanvas.toBlob((blob) => {
                const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                photoInput.files = dataTransfer.files;

                // Stop camera stream
                this.stopCameraStream();

                // Show photo preview
                const imageUrl = URL.createObjectURL(blob);
                photoPreview.src = imageUrl;
                photoPreview.style.display = 'block';
                photoPreview.onload = () => {
                    URL.revokeObjectURL(imageUrl);
                };

                // Show success message
                this.showSuccess('Photo captured successfully!');
            }, 'image/jpeg', 0.95);
        });

        // Clean up camera stream when leaving the page
        window.addEventListener('hashchange', () => {
            this.stopCameraStream();
        });
    }

    stopCameraStream() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            
            const cameraPreview = document.getElementById('camera-preview');
            if (cameraPreview) {
                cameraPreview.srcObject = null;
                cameraPreview.style.display = 'none';
            }

            const startCameraBtn = document.getElementById('start-camera');
            const capturePhotoBtn = document.getElementById('capture-photo');
            if (startCameraBtn) startCameraBtn.style.display = 'inline-block';
            if (capturePhotoBtn) capturePhotoBtn.style.display = 'none';
        }
    }

    initializeMap(stories) {
        // Clean up existing map if it exists
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Create new map
        this.map = L.map('map').setView([0, 0], 2);
        
        // Define base layers
        const baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri'
            }),
            'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© CARTO'
            })
        };

        // Add default base layer
        baseLayers['OpenStreetMap'].addTo(this.map);

        // Add layer control
        L.control.layers(baseLayers).addTo(this.map);

        // Clean up existing markers if they exist
        if (this.markers) {
            this.markers.clearLayers();
        }

        // Create new marker cluster group
        this.markers = L.markerClusterGroup();

        // Add markers for each story with location
        stories.forEach(story => {
            if (story.lat && story.lon) {
                const marker = L.marker([story.lat, story.lon])
                    .bindPopup(`
                        <div class="story-popup">
                            <img src="${story.photoUrl}" alt="${story.description}" style="max-width: 200px; border-radius: 4px;">
                            <h3>${story.name}</h3>
                            <p>${story.description}</p>
                        </div>
                    `);
                this.markers.addLayer(marker);
            }
        });

        // Add markers to map
        this.map.addLayer(this.markers);

        // Fit bounds if there are markers
        if (this.markers.getLayers().length > 0) {
            this.map.fitBounds(this.markers.getBounds());
        }
    }

    initializeLocationMap() {
        // Clean up existing map if it exists
        const existingMap = document.getElementById('location-map');
        if (existingMap._leaflet_id) {
            L.map(existingMap).remove();
        }

        // Create new map
        const map = L.map('location-map').setView([0, 0], 2);
        
        // Define base layers
        const baseLayers = {
            'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }),
            'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri'
            }),
            'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© CARTO'
            })
        };

        // Add default base layer
        baseLayers['OpenStreetMap'].addTo(map);

        // Add layer control
        L.control.layers(baseLayers).addTo(map);

        let marker = null;
        const coordinatesDisplay = document.getElementById('coordinates-display');
        
        map.on('click', (e) => {
            if (marker) {
                map.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(map);
            document.getElementById('lat').value = e.latlng.lat;
            document.getElementById('lon').value = e.latlng.lng;
            
            // Update coordinates display
            coordinatesDisplay.textContent = `Latitude: ${e.latlng.lat.toFixed(6)}, Longitude: ${e.latlng.lng.toFixed(6)}`;
        });
    }

    setupStoryForm() {
        const storyForm = document.getElementById('story-form');
        storyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(storyForm);
            const description = formData.get('description');
            const photo = formData.get('photo');
            const lat = formData.get('lat');
            const lon = formData.get('lon');

            try {
                // Show loading state
                const submitBtn = storyForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';

                // Here you would typically send the data to your backend
                // For now, we'll simulate a successful submission
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Show success message
                this.showSuccess('Story submitted successfully!');

                // Redirect to stories page
                window.location.hash = '#/stories';
            } catch (error) {
                this.showError('Failed to submit story');
                console.error('Error submitting story:', error);
            } finally {
                // Reset button state
                const submitBtn = storyForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Story';
            }
        });
    }

    renderSavedReports(reports) {
        this.appElement.innerHTML = `
            <section class="saved-reports">
                <h2>Saved Reports</h2>
                ${reports.length === 0 ? `
                    <p class="no-reports">No saved reports yet.</p>
                ` : `
                    <div class="reports-grid">
                        ${reports.map(report => `
                            <article class="report-card">
                                <img src="${report.photoUrl}" alt="${report.description}" loading="lazy">
                                <div class="report-content">
                                    <h3>${report.name}</h3>
                                    <p>${report.description}</p>
                                    ${report.lat && report.lon ? `
                                        <p>Location: ${report.lat}, ${report.lon}</p>
                                    ` : ''}
                                    <p>Saved: ${new Date(report.savedAt).toLocaleDateString()}</p>
                                    <button class="btn delete-report" data-id="${report.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                `}
            </section>
        `;

        // Add event listeners for delete buttons
        const deleteButtons = this.appElement.querySelectorAll('.delete-report');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const reportId = button.dataset.id;
                const reports = JSON.parse(localStorage.getItem('savedReports') || '[]');
                const updatedReports = reports.filter(report => report.id !== reportId);
                localStorage.setItem('savedReports', JSON.stringify(updatedReports));
                this.showSuccess('Report deleted successfully');
                this.renderSavedReports(updatedReports);
            });
        });
    }
} 