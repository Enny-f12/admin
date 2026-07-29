// components/settings/SettingsShared.tsx
"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      suppressHydrationWarning
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? "var(--color-secondary)" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
      }}
    >
      <span suppressHydrationWarning style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/**
 * SubHeader now defaults to navigating back to /settings via the router
 * instead of taking an onBack callback — since each sub-page is a real
 * route now, "back" means "go to the settings index route." Pass a custom
 * onBack only if a page needs different behavior.
 */
export function SubHeader({
  title, subtitle, action, onBack,
}: { title: string; subtitle: string; action?: React.ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.push("/settings"));

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", padding: "2px 0", marginTop: 2 }}>
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Modal({
  title, subtitle, onClose, children,
}: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 560, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h3>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, marginLeft: 8, flexShrink: 0 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}