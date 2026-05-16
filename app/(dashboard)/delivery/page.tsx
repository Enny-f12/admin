"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Bike,
  Activity,
  MapPin,
  Settings,
  Plus,
  X,
  Eye,
  Trash2,
  SquarePen,
  Phone,
  EyeOff,
  Navigation,
  CheckCircle,
  Circle,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type Tab = "partners" | "live" | "zones";

type DeliveryStatus = "On the way" | "Picked Up" | "Assigned" | "Delivered";

type Partner = {
  id: string;
  name: string;
  icon: string;
  online: boolean;
  enabled: boolean;
  active: number;
  today: number;
  avgMin: number;
  commission: number;
  apiKey: string;
  webhookUrl: string;
};

type LiveOrder = {
  id: string;
  partner: string;
  customer: string;
  address: string;
  driver: string;
  status: DeliveryStatus;
  eta: string;
  total: string;
};

type DeliveryZone = {
  id: number;
  name: string;
  radius: number;
  baseFee: number;
  minOrder: number;
  enabled: boolean;
};

/* ══════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════ */
const INIT_PARTNERS: Partner[] = [
  { id: "chowdeck", name: "CHOWDECK", icon: "bike",       online: true,  enabled: true,  active: 4, today: 32, avgMin: 28, commission: 15, apiKey: "ck_live_xxxxxxxxxxxx", webhookUrl: "https://..." },
  { id: "glovo",    name: "GLOVO",    icon: "navigation", online: true,  enabled: false, active: 0, today: 0,  avgMin: 0,  commission: 20, apiKey: "gl_live_xxxxxxxxxxxx", webhookUrl: "https://..." },
];

const INIT_LIVE_ORDERS: LiveOrder[] = [
  { id: "#FD-2847", partner: "Chowdeck", customer: "Sarah M.", address: "12 Lekki Phase 1, Lagos", driver: "Emeka A.", status: "On the way",  eta: "8 min",  total: "₦1,000" },
  { id: "#FD-2846", partner: "Glovo",    customer: "Mike O.",  address: "5 Allen Ave, Ikeja",      driver: "Joseph T.", status: "Picked Up",  eta: "22 min", total: "₦2,400" },
  { id: "#FD-2845", partner: "Chowdeck", customer: "Ada K.",   address: "3 Ozumba Mbadiwe, VI",    driver: "Pending",   status: "Assigned",   eta: "–",      total: "₦3,500" },
  { id: "#FD-2844", partner: "Chowdeck", customer: "Lisa P.",  address: "21 Broad Street, Lagos",  driver: "Bola K.",   status: "Delivered",  eta: "Done",   total: "₦1,800" },
];

const INIT_ZONES: DeliveryZone[] = [
  { id: 1, name: "Lekki Phase 1",       radius: 5, baseFee: 1500, minOrder: 5000,  enabled: true  },
  { id: 2, name: "Ikoyi, Victoria Island", radius: 7, baseFee: 1500, minOrder: 0,  enabled: true  },
  { id: 3, name: "Ajah, Sangotedo",     radius: 5, baseFee: 2000, minOrder: 7500,  enabled: false },
  { id: 4, name: "Surulere, Yaba",      radius: 7, baseFee: 3000, minOrder: 10000, enabled: true  },
];

const STATUS_STYLE: Record<DeliveryStatus, { bg: string; color: string }> = {
  "On the way": { bg: "rgba(239,68,68,0.10)",   color: "#dc2626" },
  "Picked Up":  { bg: "rgba(59,130,246,0.12)",  color: "#2563eb" },
  "Assigned":   { bg: "rgba(245,158,11,0.12)",  color: "#b45309" },
  "Delivered":  { bg: "rgba(34,197,94,0.12)",   color: "#16a34a" },
};

const DELIVERY_STEPS: DeliveryStatus[] = ["Assigned", "Picked Up", "On the way", "Delivered"];

/* ══════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════ */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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
      <span
        suppressHydrationWarning
        style={{
          position: "absolute", top: 3,
          left: on ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function Modal({ title, onClose, children, maxWidth = 520 }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: number }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "90vh", overflowY: "auto" }} className="no-scrollbar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PARTNERS TAB
══════════════════════════════════════════ */
function PartnersTab() {
  const [partners, setPartners] = useState<Partner[]>(INIT_PARTNERS);
  const [settingsTarget, setSettingsTarget] = useState<Partner | null>(null);
  const [form, setForm] = useState({ commission: "", apiKey: "", webhookUrl: "", enabled: false, showKey: false });

  const totalActive    = partners.reduce((s, p) => s + (p.enabled ? p.active : 0), 0);
  const totalToday     = partners.reduce((s, p) => s + p.today, 0);
  const totalCompleted = 71;
  const avgDelivery    = 29;

  const openSettings = (p: Partner) => {
    setSettingsTarget(p);
    setForm({ commission: String(p.commission), apiKey: p.apiKey, webhookUrl: p.webhookUrl, enabled: p.enabled, showKey: false });
  };

  const saveSettings = () => {
    if (!settingsTarget) return;
    setPartners((prev) => prev.map((p) =>
      p.id === settingsTarget.id
        ? { ...p, commission: Number(form.commission), apiKey: form.apiKey, webhookUrl: form.webhookUrl, enabled: form.enabled }
        : p
    ));
    toast.success(`${settingsTarget.name} settings saved`);
    setSettingsTarget(null);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[
            { label: "Active Partners", value: totalActive,    color: "var(--color-primary)" },
            { label: "Live Orders",     value: totalToday,     color: "var(--color-heading)" },
            { label: "Completed Today", value: totalCompleted, color: "var(--color-heading)" },
            { label: "Avg Delivery",    value: `${avgDelivery} min`, color: "var(--color-heading)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Partner cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {partners.map((p) => (
            <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(252,208,99,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {p.icon === "bike"       && <Bike       size={18} color="#a07a00" strokeWidth={1.8} />}
                    {p.icon === "navigation" && <Navigation size={18} color="#a07a00" strokeWidth={1.8} />}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{p.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <Circle size={7} strokeWidth={3} color={p.online ? "#16a34a" : "#d1d5db"} fill={p.online ? "#16a34a" : "#d1d5db"} />
                      <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{p.online ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                </div>
                <Toggle on={p.enabled} onToggle={() => setPartners((prev) => prev.map((x) => x.id === p.id ? { ...x, enabled: !x.enabled } : x))} />
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "Active", value: p.active },
                  { label: "Today",  value: p.today  },
                  { label: "Avg",    value: `${p.avgMin}m` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 500, color: "var(--color-text-muted)" }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>Commission: {p.commission}%</span>
                <button
                  onClick={() => openSettings(p)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                >
                  <Settings size={13} strokeWidth={1.8} /> Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsTarget && (
        <Modal title={`${settingsTarget.name} Settings`} onClose={() => setSettingsTarget(null)} maxWidth={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Commission (%)</label>
              <input className="input" type="number" value={form.commission}
                onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>API Key</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={form.showKey ? "text" : "password"} value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  style={{ paddingRight: "2.5rem" }} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, showKey: !f.showKey }))}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 0 }}>
                  {form.showKey ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Webhook URL</label>
              <input className="input" type="url" value={form.webhookUrl}
                onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)" }}>Partner Enabled</span>
              <Toggle on={form.enabled} onToggle={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={saveSettings} style={{ flex: 1, justifyContent: "center", padding: "11px" }}>Save</button>
            <button onClick={() => setSettingsTarget(null)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   LIVE ORDERS TAB
══════════════════════════════════════════ */
function LiveOrdersTab() {
  const [orders] = useState<LiveOrder[]>(INIT_LIVE_ORDERS);
  const [detail, setDetail] = useState<LiveOrder | null>(null);

  const stepIndex = (status: DeliveryStatus) => DELIVERY_STEPS.indexOf(status);

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Order ID", "Partner", "Customer", "Driver", "Status", "ETA", "Action"].map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{o.id}</td>
                  <td>{o.partner}</td>
                  <td>{o.customer}</td>
                  <td style={{ color: o.driver === "Pending" ? "var(--color-text-muted)" : "var(--color-text-secondary)" }}>{o.driver}</td>
                  <td>
                    <span className="badge" style={{ background: STATUS_STYLE[o.status].bg, color: STATUS_STYLE[o.status].color }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 400, color: o.eta === "Done" ? "var(--color-text-muted)" : "var(--color-text)" }}>{o.eta}</td>
                  <td>
                    <button
                      onClick={() => setDetail(o)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                    >
                      <Eye size={15} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <Modal title={detail.id} onClose={() => setDetail(null)} maxWidth={480}>
          {/* Info card */}
          <div style={{ background: "var(--color-bg-soft)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Partner:",  value: detail.partner  },
              { label: "Customer:", value: detail.customer },
              { label: "Address:",  value: detail.address, icon: <MapPin size={13} strokeWidth={1.8} color="var(--color-secondary)" /> },
              { label: "Driver",    value: detail.driver   },
              { label: "Total",     value: detail.total    },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.855rem" }}>
                {icon ?? null}
                <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{label}</span>
                <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Progress tracker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DELIVERY_STEPS.map((step, i) => {
              const done    = i <= stepIndex(detail.status);
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {done
                    ? <CheckCircle size={16} strokeWidth={1.8} color="#16a34a" style={{ flexShrink: 0 }} />
                    : <Circle      size={16} strokeWidth={1.8} color="var(--color-border)" style={{ flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: "0.855rem", fontWeight: done ? 500 : 400, color: done ? "var(--color-text)" : "var(--color-text-muted)" }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Call Driver */}
          <button
            onClick={() => toast.success(`Calling ${detail.driver}…`)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px", borderRadius: 10, border: "1px solid var(--color-border)",
              background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
              color: "var(--color-text)", fontFamily: "var(--font-sans)",
            }}
          >
            <Phone size={15} strokeWidth={1.8} /> Call Driver
          </button>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   DELIVERY ZONES TAB
══════════════════════════════════════════ */
function DeliveryZonesTab() {
  const [zones, setZones]       = useState<DeliveryZone[]>(INIT_ZONES);
  const [addOpen, setAddOpen]   = useState(false);
  const [editZone, setEditZone] = useState<DeliveryZone | null>(null);
  const [form, setForm]         = useState({ name: "", radius: "5", baseFee: "1500", minOrder: "0" });

  const openAdd = () => {
    setEditZone(null);
    setForm({ name: "", radius: "5", baseFee: "1500", minOrder: "0" });
    setAddOpen(true);
  };

  const openEdit = (z: DeliveryZone) => {
    setEditZone(z);
    setForm({ name: z.name, radius: String(z.radius), baseFee: String(z.baseFee), minOrder: String(z.minOrder) });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editZone) {
      setZones((p) => p.map((z) => z.id === editZone.id
        ? { ...z, name: form.name, radius: Number(form.radius), baseFee: Number(form.baseFee), minOrder: Number(form.minOrder) }
        : z));
      toast.success("Zone updated");
    } else {
      setZones((p) => [...p, { id: Date.now(), name: form.name, radius: Number(form.radius), baseFee: Number(form.baseFee), minOrder: Number(form.minOrder), enabled: true }]);
      toast.success("Zone added");
    }
    setAddOpen(false);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Branch header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Lekki Branch 1</span>
          <button
            onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <Plus size={14} strokeWidth={2.2} /> Add Zone
          </button>
        </div>

        {/* Zone cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {zones.map((z) => (
            <div key={z.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{z.name}</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{z.radius}km radius</p>
                </div>
                <Toggle on={z.enabled} onToggle={() => setZones((p) => p.map((x) => x.id === z.id ? { ...x, enabled: !x.enabled } : x))} />
              </div>

              {/* Fees */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Base Fee",  value: `₦${z.baseFee.toLocaleString()}` },
                  { label: "Min Order", value: z.minOrder > 0 ? `₦${z.minOrder.toLocaleString()}` : "₦0" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 500, color: "var(--color-text-muted)" }}>{label}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                <button
                  onClick={() => openEdit(z)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
                >
                  <SquarePen size={13} strokeWidth={1.8} /> Edit
                </button>
                <button
                  onClick={() => { setZones((p) => p.filter((x) => x.id !== z.id)); toast.success(`${z.name} removed`); }}
                  style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", transition: "color 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Zone Modal */}
      {addOpen && (
        <Modal title={editZone ? "Edit Delivery Zone" : "Add Delivery Zone"} onClose={() => setAddOpen(false)} maxWidth={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Zone Name</label>
              <input className="input" placeholder="e.g. Ikoyi" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Radius (km)</label>
              <input className="input" type="number" value={form.radius}
                onChange={(e) => setForm((f) => ({ ...f, radius: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Base Delivery Fee (₦)</label>
              <input className="input" type="number" value={form.baseFee}
                onChange={(e) => setForm((f) => ({ ...f, baseFee: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Minimum Order (₦)</label>
              <input className="input" type="number" value={form.minOrder}
                onChange={(e) => setForm((f) => ({ ...f, minOrder: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: "center", padding: "11px" }}>
              {editZone ? "Save Changes" : "Add Zone"}
            </button>
            <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "partners", label: "Partners",       icon: Bike     },
  { key: "live",     label: "Live Orders",    icon: Activity },
  { key: "zones",    label: "Delivery Zones", icon: MapPin   },
];

export default function DeliveryPage() {
  const [tab, setTab] = useState<Tab>("partners");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
        Monitor delivery operations across all partners
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4 }}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 8, border: "none",
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "#fff" : "var(--color-text-secondary)",
                fontFamily: "var(--font-sans)", fontSize: "0.855rem",
                fontWeight: active ? 500 : 400, cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "partners" && <PartnersTab />}
      {tab === "live"     && <LiveOrdersTab />}
      {tab === "zones"    && <DeliveryZonesTab />}
    </div>
  );
}