
'use strict';

self.addEventListener('push', function (event) {
  let data = { title: 'Update', body: 'Something new happened!', icon: '/icon-192x192.png', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Push event data parsing error:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-192x192.png',
    badge: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-192x192.png',
    data: {
      url: data.url,
      notificationId: data.notificationId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Close the notification

  const notificationData = event.notification.data;
  const urlToOpen = new URL(notificationData.url || '/', self.location.origin).href;

  // Append the notificationId to the URL to track the click
  const urlWithTracking = new URL(urlToOpen);
  if (notificationData.notificationId) {
    urlWithTracking.searchParams.append('notification_id', notificationData.notificationId);
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then(function (windowClients) {
    let matchingClient = null;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      // A more robust check for an open client
      const clientUrl = new URL(windowClients[i].url);
      const targetUrl = new URL(urlToOpen);
      if (clientUrl.pathname === targetUrl.pathname) {
          matchingClient = windowClients[i];
          break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus().then(client => client.navigate(urlWithTracking.href));
    } else {
      return clients.openWindow(urlWithTracking.href);
    }
  });

  event.waitUntil(promiseChain);
});
