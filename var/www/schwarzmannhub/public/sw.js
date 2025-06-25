// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'Neue Benachrichtigung';
  const options = {
    body: data.body,
    icon: '/images/logo-192.png', // Path to a notification icon
    badge: '/images/badge.png',    // Path to a monochrome badge icon
    data: {
      url: data.url || '/', // URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If the app is already open, focus it
      if (clientList.length > 0) {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Create dummy files for the icons. The user can replace these later.
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            fetch('/images/logo-192.png').catch(() => {}),
            fetch('/images/badge.png').catch(() => {}),
        ])
    );
});
