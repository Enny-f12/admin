"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { requestPushToken, onForegroundMessage } from "@/lib/firebase";

export default function PushSetup() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Don't ask again if they already granted or already blocked it
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowModal(true);
    } else if (Notification.permission === "granted") {
      // Already granted previously — just silently re-register the token
      requestPushToken(accessToken, process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!);
    }

    const unsubscribe = onForegroundMessage((payload) => {
      console.log("New order (foreground):", payload);
    });

    return () => unsubscribe();
  }, [isAuthenticated, accessToken]);

  const handleAllow = async () => {
    setShowModal(false);
    if (accessToken) {
      await requestPushToken(accessToken, process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    // optional: remember "not now" in localStorage so you don't nag every login
  };

  if (!showModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "28px 26px",
          width: 340,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(225, 11, 28, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 22,
          }}
        >
          🔔
        </div>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 8px" }}>
          Stay on top of new orders
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#6B6B6B", margin: "0 0 22px", lineHeight: 1.5 }}>
          Turn on notifications so you never miss a new order, even when this tab isn&apos;t open.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid #E4E0D8",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            Not now
          </button>
          <button
            onClick={handleAllow}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "var(--color-primary, #E10B1C)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}