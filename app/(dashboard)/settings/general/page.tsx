// app/(admin)/settings/general/page.tsx
"use client";

import { SubHeader } from "@/components/settings/SettingsShared";

export default function GeneralSettingsPage() {
  return (
    <>
      <SubHeader title="General" subtitle="Business info, hours, currency, tax" />
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Coming soon </p>
      </div>
    </>
  );
}