'use strict';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  const payload = event.data.json();

  const options = {
    body: payload.body,
    icon: payload.icon || 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
    badge: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
    data: {
      url: payload.url || '/',
      notificationId: payload.notificationId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  const notificationId = event.notification.data.notificationId;

  const urlWithParams = new URL(urlToOpen);
  if (notificationId) {
    urlWithParams.searchParams.append('notification_id', notificationId);
  }
  
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    let matchingClient = null;

    for (const client of windowClients) {
      const clientUrl = new URL(client.url);
      const targetUrl = new URL(urlToOpen);
      if (clientUrl.pathname === targetUrl.pathname) {
        matchingClient = client;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus().then(client => client.navigate(urlWithParams.href));
    } else {
      return clients.openWindow(urlWithParams.href);
    }
  });

  event.waitUntil(promiseChain);
});
