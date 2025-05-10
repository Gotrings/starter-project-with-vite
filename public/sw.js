self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.options.body,
        icon: '/icon.png',
        badge: '/badge.png',
        data: {
            url: '/stories'
        }
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