self.addEventListener('push', (event) => {
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        // If not JSON, treat as text
        data = {
            title: 'New Notification',
            options: {
                body: event.data.text()
            }
        };
    }

    const options = {
        body: data.options.body,
        icon: './images/logo.png',
        badge: './favicon.png',
        data: {
            url: '/stories'
        },
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Handle direct notifications from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        const notificationOptions = {
            ...options,
            vibrate: [200, 100, 200],
            requireInteraction: true,
            icon: './images/logo.png',
            badge: './favicon.png'
        };
        event.waitUntil(
            self.registration.showNotification(title, notificationOptions)
        );
    }
}); 