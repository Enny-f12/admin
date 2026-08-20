import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
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