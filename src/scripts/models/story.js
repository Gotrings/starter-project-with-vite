export class StoryModel {
    constructor() {
        this.baseUrl = 'https://story-api.dicoding.dev/v1';
        this.token = localStorage.getItem('token') || null;
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            if (!response.ok) throw new Error(`Register failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Login failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.loginResult || !data.loginResult.token) {
                throw new Error('Invalid response format: missing token');
            }

            this.token = data.loginResult.token;
            localStorage.setItem('token', this.token);
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.name === 'AbortError') {
                throw new Error('Login request timed out. Please check your internet connection.');
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to the server. Please check your internet connection.');
            }
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async getStories(page = 1, size = 10, location = 0) {
        this.token = localStorage.getItem('token') || null;
        try {
            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(
                `${this.baseUrl}/stories?page=${page}&size=${size}&location=${location}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.message);
            }

            return data.listStory;
        } catch (error) {
            console.error('Error fetching stories:', error);
            throw error;
        }
    }

    async addStory(storyData) {
        this.token = localStorage.getItem('token') || null;
        try {
            const formData = new FormData();
            formData.append('description', storyData.description);
            formData.append('photo', storyData.photo);
            if (storyData.lat) formData.append('lat', storyData.lat);
            if (storyData.lon) formData.append('lon', storyData.lon);

            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.baseUrl}/stories`, {
                method: 'POST',
                headers,
                body: formData,
            });
            if (!response.ok) throw new Error(`Add story failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error adding story:', error);
            throw error;
        }
    }

    async addStoryAsGuest(storyData) {
        try {
            const formData = new FormData();
            formData.append('description', storyData.description);
            formData.append('photo', storyData.photo);
            if (storyData.lat) formData.append('lat', storyData.lat);
            if (storyData.lon) formData.append('lon', storyData.lon);

            const response = await fetch(`${this.baseUrl}/stories/guest`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(`Add story as guest failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error adding story as guest:', error);
            throw error;
        }
    }

    async subscribeToNotifications(subscription) {
        this.token = localStorage.getItem('token') || null;
        try {
            const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription),
            });
            if (!response.ok) throw new Error(`Subscribe to notifications failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            throw error;
        }
    }

    async unsubscribeFromNotifications(endpoint) {
        this.token = localStorage.getItem('token') || null;
        try {
            const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ endpoint }),
            });
            if (!response.ok) throw new Error(`Unsubscribe from notifications failed: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error unsubscribing from notifications:', error);
            throw error;
        }
    }

    async getStoryById(storyId) {
        this.token = localStorage.getItem('token') || null;
        try {
            let headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            let response = await fetch(`${this.baseUrl}/stories/${storyId}`, { headers });

            // Jika gagal 401 dan ada token, coba ulangi tanpa token (public)
            if (response.status === 401 && this.token) {
                response = await fetch(`${this.baseUrl}/stories/${storyId}`);
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.message);
            }

            return data.story;
        } catch (error) {
            console.error('Error fetching story:', error);
            throw error;
        }
    }
} 