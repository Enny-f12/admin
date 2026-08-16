// app/(admin)/settings/security/page.tsx
"use client";

import { SubHeader } from "@/components/settings/SettingsShared";

export default function SecuritySettingsPage() {
  return (
    <>
      <SubHeader title="Security" subtitle="2FA, password policies" />
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Coming soon </p>
      </div>
    </>
  );
}