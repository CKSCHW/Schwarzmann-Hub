
// This event listener is triggered when a push message is received.
self.addEventListener('push', (event) => {
  // Parse the incoming data as JSON.
  const data = event.data.json();

  // Prepare the options for the notification.
  const options = {
    body: data.body,
    icon: data.icon || 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
    badge: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
    data: {
      url: data.url, // URL to open on click
      notificationId: data.notificationId, // Custom ID for tracking
    }
  };

  // Display the notification.
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// This event listener is triggered when a user clicks on the notification.
self.addEventListener('notificationclick', (event) => {
  // Close the notification.
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  const notificationId = event.notification.data.notificationId;

  // Append the notificationId to the URL to track the click in the app.
  const urlWithParam = new URL(urlToOpen);
  if (notificationId) {
    urlWithParam.searchParams.append('notification_id', notificationId);
  }

  // Check if a window with the target URL is already open.
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    // Iterate through open windows to find a match.
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      // A more robust check would be to parse the URL and compare origins and paths.
      if (new URL(windowClient.url).pathname === new URL(urlToOpen).pathname) {
        matchingClient = windowClient;
        break;
      }
    }

    // If a matching window is found, focus it. Otherwise, open a new window.
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlWithParam.href);
    }
  });

  event.waitUntil(promiseChain);
});

// This event is triggered when the service worker is installed.
self.addEventListener('install', (event) => {
  // self.skipWaiting() forces the waiting service worker to become the
  // active service worker. This is useful for getting the latest updates
  // to the user faster.
  self.skipWaiting();
});

// This event is triggered when the service worker is activated.
self.addEventListener('activate', (event) => {
  // event.waitUntil(clients.claim()) allows an active service worker to
  // take control of all clients (open tabs/windows) that are in its scope.
  event.waitUntil(clients.claim());
});
