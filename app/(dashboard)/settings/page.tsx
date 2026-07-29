// app/(admin)/settings/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Bell, MapPin, Settings, Shield, Download, Megaphone, CheckCircle } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";

const MENU_ITEMS = [
  { path: "/settings/banners", label: "Promotions & Banners", description: "Manage carousel, schedule campaigns", icon: Megaphone },
  { path: "/settings/notifications", label: "Notification", description: "Order alerts, marketing emails", icon: Bell },
  { path: "/settings/branches", label: "Branches", description: "Manage restaurant locations", icon: MapPin },
  { path: "/settings/general", label: "General", description: "Business info, hours, currency, tax", icon: Settings },
  { path: "/settings/security", label: "Security", description: "2FA, password policies", icon: Shield },
  { path: "/settings/export", label: "Data Export", description: "Export orders, customers, analytics", icon: Download },
];

export default function SettingsPage() {
  const router = useRouter();
  const { banners, branches, notifications, fetchBanners, fetchBranches, fetchNotificationSettings } = useSettingsStore();

  useEffect(() => {
    fetchBanners();
    fetchBranches();
    fetchNotificationSettings();
  }, [fetchBanners, fetchBranches, fetchNotificationSettings]);

  const metaFor = (path: string): string => {
    if (path === "/settings/banners") return banners ? `${banners.filter((b) => b.active).length} active` : "–";
    if (path === "/settings/branches") return branches ? `${branches.length} branches` : "–";
    if (path === "/settings/notifications") {
      if (!notifications) return "–";
      const anyOn = [...notifications.email, ...notifications.sms].some((n) => n.on);
      return anyOn ? "Enabled" : "Disabled";
    }
    if (path === "/settings/general") return "₦ NGN";
    if (path === "/settings/security") return "2FA On";
    return "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
        Manage app configuration and preferences
      </p>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {MENU_ITEMS.map(({ path, label, description, icon: Icon }, i) => (
          <button
            key={path}
            onClick={() => router.push(path)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", border: "none", background: "none", cursor: "pointer",
              borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid var(--color-border)" : "none",
              transition: "background 0.12s", textAlign: "left",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(225,11,28,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle size={16} strokeWidth={1.8} color="var(--color-primary)" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{description}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{metaFor(path)}</span>
              <ChevronRight size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}