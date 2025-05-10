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
            return await response.json();
        } catch (error) {
            console.error('Error registering:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            const data = await response.json();
            if (!data.error) {
                this.token = data.loginResult.token;
                localStorage.setItem('token', this.token);
            }
            return data;
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async getStories(page = 1, size = 10, location = 0) {
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

            return await response.json();
        } catch (error) {
            console.error('Error adding story as guest:', error);
            throw error;
        }
    }

    async subscribeToNotifications(subscription) {
        try {
            const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription),
            });
            return await response.json();
        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            throw error;
        }
    }

    async unsubscribeFromNotifications(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ endpoint }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error unsubscribing from notifications:', error);
            throw error;
        }
    }

    async getStoryById(storyId) {
        try {
            const headers = {};
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
                headers
            });

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