importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDY3Oy2pN2C2KWP1b8m3Z0c4xeWpfSxG7w",
  authDomain: "foodies-2c3c2.firebaseapp.com",
  projectId: "foodies-2c3c2",
  storageBucket: "foodies-2c3c2.firebasestorage.app",
  messagingSenderId: "778301589732",
  appId: "1:778301589732:web:2d6199b3d0267fc52644f1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "New order", {
    body: body || "You have a new order",
    icon: icon || "/icons/icon-192.png",
    data: payload.data
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});