import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDY3Oy2pN2C2KWP1b8m3Z0c4xeWpfSxG7w",
  authDomain: "foodies-2c3c2.firebaseapp.com",
  projectId: "foodies-2c3c2",
  storageBucket: "foodies-2c3c2.firebasestorage.app",
  messagingSenderId: "778301589732",
  appId: "1:778301589732:web:2d6199b3d0267fc52644f1",
  measurementId: "G-B25VQL29N6"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const requestPushToken = async (userAuthToken: string, vapidKey: string) => {
  try {
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // register the SW first so getToken knows where to attach
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      const deviceToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      await fetch("https://api.foodies.com/notifications/device-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userAuthToken}`
        },
        body: JSON.stringify({ token: deviceToken, platform: "WEB" })
      });

      return deviceToken;
    }
  } catch (error) {
    console.error("Error registering web push token:", error);
  }
};

// Bonus: catches notifications while the tab IS open/focused
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
};