"use client";

import { useEffect, useState } from "react";
import {
  Smartphone,
  CreditCard,
  User,
  Phone,
  Clock,
  Truck,
  UtensilsCrossed,
  Package,
  Settings as SettingsIcon,
  Monitor,
  Copy,
  Check,
  Square,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useKitchenStore } from "@/store/useKitchenStore";
import { OrderSource, KitchenDisplaySettings } from "@/types/kitchen.types";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useBranch } from "../layout";

const SOURCE_ICON: Record<OrderSource, React.ElementType> = {
  "Mobile App": Smartphone,
  "POS": CreditCard,
  "Walk-In": User,
  "Phone": Phone,
  "Delivery": Truck,
  "Dine-In": UtensilsCrossed,
  "Takeaway": Package,
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function KitchenDisplayPage() {
  const [view, setView] = useState<"live" | "settings">("live");
  const [now, setNow] = useState(() => new Date());

  // Hard branch guard, same pattern as Drinks & Fridge, Reconciliation,
  // and Walk-in: a kitchen display is physically one screen at one
  // branch. "All Branches" no longer exists as a selectable option (see
  // app/(admin)/layout.tsx), so this now just guards the brief window
  // before a picker's initial branch selection lands.
  const branch = useBranch();
  const hasUsableBranch = Boolean(branch.id);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>{branch.name}</p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>KITCHEN DISPLAY</h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {view === "live" ? "Real-time queue - All order sources" : "Settings"}
          </p>
        </div>

        {hasUsableBranch && (
          view === "live" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-heading)" }}>
                {timeStr}
              </div>
              <button
                onClick={() => setView("settings")}
                aria-label="Kitchen display settings"
                style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <SettingsIcon size={17} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setView("live")}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", fontSize: "0.85rem" }}
            >
              <Monitor size={16} strokeWidth={1.8} />
              View TV Display
            </button>
          )
        )}
      </div>

      {!hasUsableBranch ? (
        <div className="card">
          <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}>
            <AlertTriangle size={16} strokeWidth={1.8} color="#a07a00" />
            Loading your branch...
          </p>
        </div>
      ) : view === "live" ? (
        <LiveQueueView branchId={branch.id} />
      ) : (
        <SettingsView branchId={branch.id} />
      )}
    </div>
  );
}

/* ══════════════════════════ Live Queue ══════════════════════════ */
function LiveQueueView({ branchId }: { branchId: string }) {
  const {
    liveQueue, liveQueueLoading, liveQueueError, fetchLiveQueue,
    completed, completedLoading, completedError, fetchCompleted,
    settings,
  } = useKitchenStore();

  useEffect(() => {
    fetchLiveQueue(branchId);
    fetchCompleted(30, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Poll the live queue at whatever interval settings specify, defaulting
  // to a sane 15s until settings load (mock's "2 seconds" would hammer a
  // real API -- worth confirming the real default with backend/product).
  useEffect(() => {
    const intervalMs = (settings?.refreshIntervalSeconds ?? 15) * 1000;
    const t = setInterval(() => fetchLiveQueue(branchId), intervalMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.refreshIntervalSeconds, branchId]);

  // Delivery was previously excluded from this count entirely, despite
  // being a valid OrderSource and already rendering with its own Truck
  // icon on individual queue cards below.
  const counts: Record<string, number> = { "Mobile App": 0, "POS": 0, "Walk-In": 0, "Phone": 0, "Delivery": 0 };
  liveQueue?.forEach((o) => {
    if (o.source in counts) counts[o.source] += 1;
  });

  const statCards = [
    { label: "Mobile App", value: counts["Mobile App"], icon: Smartphone, color: "gold" },
    { label: "POS", value: counts["POS"], icon: CreditCard, color: "red" },
    { label: "Walk-In", value: counts["Walk-In"], icon: User, color: "gold" },
    { label: "Phone", value: counts["Phone"], icon: Phone, color: "red" },
    { label: "Delivery", value: counts["Delivery"], icon: Truck, color: "gold" },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: s.color === "gold" ? "var(--color-secondary)" : "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <s.icon size={18} strokeWidth={1.8} color={s.color === "gold" ? "#7a5500" : "#fff"} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "var(--color-heading)" }}>
                {liveQueueLoading ? <SkeletonText width={24} height={20} /> : s.value}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {liveQueueLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
              <Skeleton width="100%" height={40} radius={0} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton width="60%" height={12} />
                <Skeleton width="80%" height={12} />
                <Skeleton width="70%" height={12} />
                <Skeleton width="100%" height={30} radius={8} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!liveQueueLoading && (liveQueueError || !liveQueue?.length) && (
        <div className="card">
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No orders in the queue
          </p>
        </div>
      )}

      {!liveQueueLoading && !liveQueueError && liveQueue && liveQueue.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {liveQueue.map((order, i) => {
            const gold = i % 2 === 0;
            const headerBg = gold ? "var(--color-secondary)" : "var(--color-primary)";
            const headerText = gold ? "#5c4200" : "#fff";
            const Icon = SOURCE_ICON[order.source] ?? Package;
            return (
              <div key={order.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: headerBg, color: headerText }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: "0.9rem" }}>
                    <Icon size={15} strokeWidth={1.8} />
                    {order.source}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{order.orderNumber}</span>
                </div>

                <div style={{ padding: 16, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      <Clock size={13} strokeWidth={1.8} />
                      {formatTime(order.createdAt)}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      <Clock size={13} strokeWidth={1.8} />
                      Due: {formatTime(order.dueAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: order.special ? 14 : 0 }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--color-text)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-text-muted)", flexShrink: 0 }} />
                        {item.name}&nbsp;&nbsp;x{item.qty}
                      </div>
                    ))}
                  </div>

                  {order.special && (
                    <div
                      style={{
                        padding: "8px 12px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 500,
                        background: gold ? "rgba(252,208,99,0.15)" : "rgba(225,11,28,0.08)",
                        border: `1px solid ${gold ? "rgba(160,122,0,0.25)" : "rgba(225,11,28,0.25)"}`,
                        color: gold ? "#7a5500" : "var(--color-primary)",
                      }}
                    >
                      Special: {order.special}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <p style={{ margin: "0 0 14px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Completed Last 30 Minutes</p>

        {completedLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonText key={i} width="70%" height={13} />
            ))}
          </div>
        )}

        {!completedLoading && (completedError || !completed?.length) && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No completed orders in this window
          </p>
        )}

        {!completedLoading && !completedError && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {completed?.map((c, i) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: i > 0 ? "1px solid var(--color-border)" : "none" }}>
                <span style={{ fontSize: "0.88rem", color: "var(--color-text)" }}>{c.orderNumber} - {formatTime(c.completedAt)} - {c.source}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#16A34A" }}>Completed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════ Settings ══════════════════════════ */
function SettingsView({ branchId }: { branchId: string }) {
  const { settings, settingsLoading, settingsError, fetchSettings, saveSettings, isSavingSettings } = useKitchenStore();

  const [form, setForm] = useState<KitchenDisplaySettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSettings(branchId);
  }, [fetchSettings, branchId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings) setForm(settings);
  }, [settings]);

  const copyUrl = () => {
    if (!form?.tvDisplayUrl) return;
    navigator.clipboard?.writeText(form.tvDisplayUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const update = (patch: Partial<KitchenDisplaySettings>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateStations = (patch: Partial<KitchenDisplaySettings["stations"]>) =>
    setForm((prev) => (prev ? { ...prev, stations: { ...prev.stations, ...patch } } : prev));

  const updatePrinter = (patch: Partial<KitchenDisplaySettings["printerBackup"]>) =>
    setForm((prev) => (prev ? { ...prev, printerBackup: { ...prev.printerBackup, ...patch } } : prev));

  const parseNumber = (raw: string) => Number(raw.replace(/\D/g, "")) || 0;

  if (settingsLoading || !form) {
    return (
      <>
        <div className="card">
          <SkeletonText width="30%" height={13} />
          <div style={{ marginTop: 10 }}>
            <Skeleton width="100%" height={40} radius={8} />
          </div>
        </div>
        <div className="card">
          <SkeletonText width="35%" height={13} />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Skeleton width="100%" height={38} radius={8} />
                <Skeleton width="100%" height={38} radius={8} />
                <Skeleton width="100%" height={38} radius={8} />
              </div>
            ))}
          </div>
        </div>
        {settingsError && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Settings unavailable
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <div className="card">
        <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", color: "var(--color-heading)" }}>TV DISPLAY URL</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input" value={form.tvDisplayUrl} readOnly style={{ flex: 1 }} />
          <button
            onClick={copyUrl}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}
          >
            {copied ? <Check size={15} strokeWidth={2} color="#16A34A" /> : <Copy size={15} strokeWidth={1.8} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="card">
        <p style={{ margin: "0 0 16px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", color: "var(--color-heading)" }}>DISPLAY SETTINGS</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <CheckPair label="Show order source:" hint="(for kitchen awareness)" value={form.showOrderSource} onChange={(v) => update({ showOrderSource: v })} />
            <Field label="Urgent threshold:">
              <input
                className="input"
                value={`${form.urgentThresholdMinutes} minutes`}
                onChange={(e) => update({ urgentThresholdMinutes: parseNumber(e.target.value) })}
              />
            </Field>
            <Field label="Auto-refresh interval:">
              <input
                className="input"
                value={`${form.refreshIntervalSeconds} seconds`}
                onChange={(e) => update({ refreshIntervalSeconds: parseNumber(e.target.value) })}
              />
            </Field>
          </div>
          <div>
            <CheckPair label="Show estimated prep time:" value={form.showPrepTime} onChange={(v) => update({ showPrepTime: v })} />
            <Field label="Show completed orders for:">
              <input
                className="input"
                value={`${form.completedForMinutes} minutes`}
                onChange={(e) => update({ completedForMinutes: parseNumber(e.target.value) })}
              />
            </Field>
            <Field label="Audio alert volume:">
              <input
                className="input"
                value={`${form.audioAlertVolumePercent}%`}
                onChange={(e) => update({ audioAlertVolumePercent: parseNumber(e.target.value) })}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <p style={{ margin: "0 0 16px", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.03em", color: "var(--color-heading)" }}>
          STATION ROUTING (multiple TVs per branch)
        </p>
        <Field label="Grill station TV:">
          <input className="input" value={form.stations.grillTvUrl} onChange={(e) => updateStations({ grillTvUrl: e.target.value })} />
        </Field>
        <Field label="Pastry station TV:">
          <input className="input" value={form.stations.pastryTvUrl} onChange={(e) => updateStations({ pastryTvUrl: e.target.value })} />
        </Field>
        <Field label="Expo station TV:">
          <input className="input" value={form.stations.expoTvUrl} onChange={(e) => updateStations({ expoTvUrl: e.target.value })} />
        </Field>

        <p style={{ margin: "12px 0 12px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-heading)" }}>Station Assignment:</p>
        <Field label="Grill:">
          <input className="input" value={form.stations.grillAssignment} onChange={(e) => updateStations({ grillAssignment: e.target.value })} />
        </Field>
        <Field label="Pastry:">
          <input className="input" value={form.stations.pastryAssignment} onChange={(e) => updateStations({ pastryAssignment: e.target.value })} />
        </Field>
      </div>

      <div className="card">
        <button
          onClick={() => updatePrinter({ enabled: !form.printerBackup.enabled })}
          style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", marginBottom: 16 }}
        >
          <CheckBox checked={form.printerBackup.enabled} />
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-heading)" }}>Enable thermal printer backup</span>
        </button>

        <Field label="Printer IP">
          <input className="input" value={form.printerBackup.printerIp} onChange={(e) => updatePrinter({ printerIp: e.target.value })} style={{ maxWidth: 260 }} />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Fallback after</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => updatePrinter({ fallbackAfterMinutes: Math.max(0, form.printerBackup.fallbackAfterMinutes - 1) })} style={stepperBtn}><Minus size={13} /></button>
            <input
              className="input"
              type="number"
              value={form.printerBackup.fallbackAfterMinutes}
              onChange={(e) => updatePrinter({ fallbackAfterMinutes: Number(e.target.value) || 0 })}
              style={{ width: 60, textAlign: "center" }}
            />
            <button onClick={() => updatePrinter({ fallbackAfterMinutes: form.printerBackup.fallbackAfterMinutes + 1 })} style={stepperBtn}><Plus size={13} /></button>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>minutes of TV disconnection</span>
        </div>
      </div>

      <div>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: "0.85rem" }}
          disabled={isSavingSettings}
          onClick={() => saveSettings(form, branchId)}
        >
          {isSavingSettings ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
      {children}
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
        background: checked ? "var(--color-primary)" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {checked && <Check size={12} strokeWidth={3} color="#fff" />}
    </span>
  );
}

function CheckPair({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
        {label} {hint && <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>{hint}</span>}
      </span>
      <button onClick={() => onChange(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-text)" }}>
        <CheckBox checked={value} />
        Yes
      </button>
      <button onClick={() => onChange(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--color-text)" }}>
        {!value ? <CheckBox checked={true} /> : <Square size={18} strokeWidth={1.5} color="var(--color-border)" />}
        No
      </button>
    </div>
  );
}

const stepperBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6, border: "1px solid var(--color-border)", background: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};