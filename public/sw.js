// This service worker file is intentionally kept simple for clarity.
// It handles push notifications and click events.

self.addEventListener('push', function(event) {
  // Fallback for when no data is sent with the push message.
  if (!event.data) {
    console.warn('Push event but no data');
    return;
  }
  
  const data = event.data.json();
  
  const title = data.title || 'Neue Benachrichtigung';
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png', // A default icon
    badge: '/badge-72x72.png', // A default badge for Android
    // Pass along data to the click event
    data: {
      url: data.url,
      notificationId: data.notificationId,
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const notificationData = event.notification.data;
  if (!notificationData || !notificationData.url) {
    // If no URL is provided, just open the app's root page.
    event.waitUntil(clients.openWindow('/'));
    return;
  }
  
  // Construct the URL to open. We add a query parameter to track the click.
  const urlToOpen = new URL(notificationData.url, self.location.origin);
  urlToOpen.searchParams.set('notification_id', notificationData.notificationId);

  // This code focuses an existing window or opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // If a window is already open, focus it.
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        // Navigate the existing window to the new URL and focus it.
        return client.navigate(urlToOpen.href).then(cli => cli.focus());
      }
      // Otherwise, open a new window.
      return clients.openWindow(urlToOpen.href);
    })
  );
});
