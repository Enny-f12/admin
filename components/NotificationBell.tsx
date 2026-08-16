// components/NotificationBell.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    notifications,
    isLoading,
    isMarkingAllRead,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    startPolling();
    return () => stopPolling();
  }, [fetchNotifications, startPolling, stopPolling]);

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: 8,
          borderRadius: 8,
          color: "var(--color-text-muted)",
        }}
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#E10B1C",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllRead}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {isLoading && !notifications && (
            <p style={{ padding: "20px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
              Loading…
            </p>
          )}

          {!isLoading && !notifications?.length && (
            <p style={{ padding: "20px 16px", fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
              No notifications yet
            </p>
          )}

          {notifications?.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markAsRead(n.id)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--color-border)",
                cursor: n.readAt ? "default" : "pointer",
                background: n.readAt ? "transparent" : "rgba(225,11,28,0.03)",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
                {n.title}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                {n.body}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                {n.sentAt ? timeAgo(n.sentAt) : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}