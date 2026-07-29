// app/(admin)/settings/notifications/page.tsx
"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { SubHeader, Toggle } from "@/components/settings/SettingsShared";

function NotifSection({
  title, items, onToggle, loading,
}: { title: string; items: { id: string; label: string; description: string; on: boolean }[]; onToggle: (id: string) => void; loading?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </p>
      {loading && Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
          <SkeletonText width="50%" height={14} />
          <Skeleton width={40} height={22} radius={11} />
        </div>
      ))}
      {!loading && items.map((n) => (
        <div key={n.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{n.label}</p>
            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{n.description}</p>
          </div>
          <Toggle on={n.on} onToggle={() => onToggle(n.id)} />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, notificationsLoading, notificationsError, fetchNotificationSettings, toggleNotification, saveNotificationSettings, isSavingNotifications } = useSettingsStore();

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  return (
    <>
      <SubHeader title="Notification Settings" subtitle="Send messages to your customers" />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {!notificationsLoading && notificationsError && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/settings/notifications not implemented — see request doc #5 */}
            Notification settings unavailable
          </p>
        )}
        <NotifSection title="Email" items={notifications?.email ?? []} loading={notificationsLoading} onToggle={(id) => toggleNotification("email", id)} />
        <NotifSection title="SMS" items={notifications?.sms ?? []} loading={notificationsLoading} onToggle={(id) => toggleNotification("sms", id)} />
        <button
          className="btn btn-primary"
          onClick={saveNotificationSettings}
          disabled={isSavingNotifications || !notifications}
          style={{ alignSelf: "flex-start", padding: "10px 24px", opacity: isSavingNotifications || !notifications ? 0.6 : 1 }}
        >
          {isSavingNotifications ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </>
  );
}