"use client";

import { useEffect, useState } from "react";
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
import { useDeliveryStore } from "@/store/useDeliveryStore";
import {
    DeliveryPartner,
    AdminDelivery,
    DeliveryAssignmentStatus,
    DeliveryZone,
} from "@/types/delivery.types";
import { useBranch } from "../layout";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type Tab = "partners" | "live" | "zones";

// Display-only status — collapsed from the 7-value backend enum.
// ASSIGNED/ACCEPTED both read as "Assigned" in the UI; FAILED/CANCELLED
// aren't in the original 4-step tracker so they get their own badge style
// but don't appear in the step progress list.
type DisplayStatus = "Assigned" | "Picked Up" | "On the way" | "Delivered" | "Failed" | "Cancelled";

const STATUS_DISPLAY: Record<DeliveryAssignmentStatus, DisplayStatus> = {
    ASSIGNED: "Assigned",
    ACCEPTED: "Assigned",
    PICKED_UP: "Picked Up",
    IN_TRANSIT: "On the way",
    DELIVERED: "Delivered",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<DisplayStatus, { bg: string; color: string }> = {
    "On the way": { bg: "rgba(239,68,68,0.10)", color: "#dc2626" },
    "Picked Up": { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    "Assigned": { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
    "Delivered": { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
    "Failed": { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
    "Cancelled": { bg: "rgba(107,114,128,0.12)", color: "#4b5563" },
};

const DELIVERY_STEPS: DisplayStatus[] = ["Assigned", "Picked Up", "On the way", "Delivered"];

// Partner icon keyed by `key`, not stored server-side — purely a frontend
// display concern. Falls back to a generic bike icon for unknown partners.
function partnerIcon(key: string) {
    if (key === "glovo") return Navigation;
    return Bike;
}

/* ══════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════ */
function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            suppressHydrationWarning
            style={{
                width: 40, height: 22, borderRadius: 11, border: "none", cursor: disabled ? "default" : "pointer",
                background: on ? "var(--color-secondary)" : "#d1d5db",
                position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
                opacity: disabled ? 0.6 : 1,
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

/* ── Skeleton primitives ──────────────────────────────────────
   Rendered via styled-jsx (built into Next.js, no extra dep). One
   shimmer keyframe declared globally in DeliveryPage; every <Skeleton>
   block below just sets its own width/height/radius. */
function Skeleton({ width = "100%", height = 14, radius = 6, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
    return <div className="skeleton-block" style={{ width, height, borderRadius: radius, ...style }} />;
}

function SkeletonStatCard() {
    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width={90} height={11} />
            <Skeleton width={50} height={22} />
        </div>
    );
}

function SkeletonPartnerCard() {
    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Skeleton width={38} height={38} radius={10} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Skeleton width={90} height={13} />
                        <Skeleton width={50} height={10} />
                    </div>
                </div>
                <Skeleton width={40} height={22} radius={11} />
            </div>
            <div style={{ display: "flex", gap: 20 }}>
                {[0, 1, 2].map((i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Skeleton width={34} height={9} />
                        <Skeleton width={26} height={15} />
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                <Skeleton width={110} height={11} />
                <Skeleton width={90} height={30} radius={8} />
            </div>
        </div>
    );
}

function SkeletonTableRows({ rows = 4 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j}><Skeleton width={j === 4 ? 70 : j === 6 ? 20 : "80%"} height={j === 4 ? 20 : 12} radius={j === 4 ? 999 : 6} /></td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function SkeletonZoneCard() {
    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton width={110} height={13} />
                    <Skeleton width={70} height={10} />
                </div>
                <Skeleton width={40} height={22} radius={11} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[0, 1].map((i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Skeleton width={60} height={9} />
                        <Skeleton width={80} height={15} />
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                <Skeleton height={34} radius={8} />
                <Skeleton width={36} height={34} radius={8} />
            </div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", fontSize: "0.855rem", color: "var(--color-text-muted)" }}>
            {label}
        </div>
    );
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "48px 0" }}>
            <span style={{ fontSize: "0.855rem", color: "var(--color-text-muted)" }}>{label}</span>
            <button
                onClick={onRetry}
                style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
                Retry
            </button>
        </div>
    );
}

/* ══════════════════════════════════════════
   PARTNERS TAB
══════════════════════════════════════════ */
function PartnersTab() {
    const partners = useDeliveryStore((s) => s.partners);
    const partnersLoading = useDeliveryStore((s) => s.partnersLoading);
    const partnersError = useDeliveryStore((s) => s.partnersError);
    const isSavingPartner = useDeliveryStore((s) => s.isSavingPartner);
    const fetchPartners = useDeliveryStore((s) => s.fetchPartners);
    const updatePartner = useDeliveryStore((s) => s.updatePartner);
    const togglePartner = useDeliveryStore((s) => s.togglePartner);

    // GET /admin/delivery-partners/summary. Separate loading state
    // from `partners` so the stat cards resolve independently of the
    // partner card grid below.
    const partnersSummary = useDeliveryStore((s) => s.partnersSummary);
    const fetchPartnersSummary = useDeliveryStore((s) => s.fetchPartnersSummary);

    const [settingsTarget, setSettingsTarget] = useState<DeliveryPartner | null>(null);
    const [form, setForm] = useState({ commission: "", apiKey: "", webhookUrl: "", enabled: false, showKey: false });

    useEffect(() => {
        fetchPartners();
        fetchPartnersSummary();
    }, [fetchPartners, fetchPartnersSummary]);

    const list = partners ?? [];
    const totalActive = list.reduce((s, p) => s + (p.enabled ? p.active : 0), 0);
    const totalToday = list.reduce((s, p) => s + p.today, 0);

    // Sourced from GET /admin/delivery-partners/summary. Field names on
    // DeliveryPartnersSummary are still provisional — see the note in
    // delivery.types.ts.
    const totalCompleted = partnersSummary?.totalCompleted ?? 0;
    const avgDelivery = partnersSummary?.avgDeliveryMinutes ?? 0;

    const openSettings = (p: DeliveryPartner) => {
        setSettingsTarget(p);
        setForm({ commission: String(p.commission), apiKey: p.apiKey ?? "", webhookUrl: p.webhookUrl ?? "", enabled: p.enabled, showKey: false });
    };

    const saveSettings = async () => {
        if (!settingsTarget) return;
        const ok = await updatePartner(settingsTarget.id, {
            commission: Number(form.commission),
            apiKey: form.apiKey,
            webhookUrl: form.webhookUrl,
            enabled: form.enabled,
        });
        if (ok) setSettingsTarget(null);
    };

    if (partnersError && !partners) return <ErrorState label="Could not load delivery partners." onRetry={fetchPartners} />;

    const showSkeleton = partnersLoading && !partners;

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                    {showSkeleton
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                        : [
                            { label: "Active Partners", value: totalActive, color: "var(--color-primary)" },
                            { label: "Live Orders", value: totalToday, color: "var(--color-heading)" },
                            { label: "Completed Today", value: totalCompleted, color: "var(--color-heading)" },
                            { label: "Avg Delivery", value: `${avgDelivery} min`, color: "var(--color-heading)" },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)" }}>{label}</p>
                                <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color, lineHeight: 1 }}>{value}</p>
                            </div>
                        ))}
                </div>

                {/* Partner cards */}
                {showSkeleton ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {Array.from({ length: 2 }).map((_, i) => <SkeletonPartnerCard key={i} />)}
                    </div>
                ) : list.length === 0 ? (
                    <EmptyState label="No delivery partners configured yet." />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {list.map((p) => {
                            const Icon = partnerIcon(p.key);
                            return (
                                <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {/* Header */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(252,208,99,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <Icon size={18} color="#a07a00" strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{p.name}</p>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                                    <Circle size={7} strokeWidth={3} color={p.online ? "#16a34a" : "#d1d5db"} fill={p.online ? "#16a34a" : "#d1d5db"} />
                                                    <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{p.online ? "Online" : "Offline"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Toggle on={p.enabled} onToggle={() => togglePartner(p.id)} />
                                    </div>

                                    {/* Stats row */}
                                    <div style={{ display: "flex", gap: 20 }}>
                                        {[
                                            { label: "Active", value: p.active },
                                            { label: "Today", value: p.today },
                                            { label: "Avg", value: `${p.avgMin}m` },
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
                            );
                        })}
                    </div>
                )}
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
                        <button className="btn btn-primary" onClick={saveSettings} disabled={isSavingPartner} style={{ flex: 1, justifyContent: "center", padding: "11px", opacity: isSavingPartner ? 0.7 : 1 }}>
                            {isSavingPartner ? "Saving…" : "Save"}
                        </button>
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
    const activeDeliveries = useDeliveryStore((s) => s.activeDeliveries);
    const activeDeliveriesLoading = useDeliveryStore((s) => s.activeDeliveriesLoading);
    const activeDeliveriesError = useDeliveryStore((s) => s.activeDeliveriesError);
    const fetchActiveDeliveries = useDeliveryStore((s) => s.fetchActiveDeliveries);

    const [detail, setDetail] = useState<AdminDelivery | null>(null);

    useEffect(() => {
        fetchActiveDeliveries();
    }, [fetchActiveDeliveries]);

    const orders = activeDeliveries ?? [];
    const stepIndex = (status: DeliveryAssignmentStatus) => DELIVERY_STEPS.indexOf(STATUS_DISPLAY[status]);

    if (activeDeliveriesError && !activeDeliveries) return <ErrorState label="Could not load active deliveries." onRetry={fetchActiveDeliveries} />;

    const showSkeleton = activeDeliveriesLoading && !activeDeliveries;

    return (
        <>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {!showSkeleton && orders.length === 0 ? (
                    <EmptyState label="No active deliveries right now." />
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {["Order ID", "Partner", "Customer", "Driver", "Status", "ETA", "Action"].map((c) => <th key={c}>{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {showSkeleton && <SkeletonTableRows rows={5} />}
                                {!showSkeleton && orders.map((o) => {
                                    const display = STATUS_DISPLAY[o.status];
                                    return (
                                        <tr key={o.id}>
                                            <td style={{ fontWeight: 600, color: "var(--color-text)" }}>#{o.order.orderNumber}</td>
                                            {/* deliveryProvider isn't on AdminDelivery yet — see backend diff sent
                                                for getActiveDeliveries(). Falls back to "Internal" until added. */}
                                            <td>{(o.order as any).deliveryProvider ?? "Internal"}</td>
                                            {/* customer isn't on AdminDelivery yet either — same diff. */}
                                            <td>{(o.order as any).customer?.fullName ?? "—"}</td>
                                            <td style={{ color: "var(--color-text-secondary)" }}>{o.driver?.fullName ?? "Pending"}</td>
                                            <td>
                                                <span className="badge" style={{ background: STATUS_STYLE[display].bg, color: STATUS_STYLE[display].color }}>
                                                    {display}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 400, color: "var(--color-text)" }}>
                                                {o.status === "DELIVERED" ? "Done" : o.etaMinutes != null ? `${o.etaMinutes} min` : "–"}
                                            </td>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {detail && (
                <Modal title={`#${detail.order.orderNumber}`} onClose={() => setDetail(null)} maxWidth={480}>
                    {/* Info card */}
                    <div style={{ background: "var(--color-bg-soft)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { label: "Partner:", value: (detail.order as any).deliveryProvider ?? "Internal" },
                            { label: "Customer:", value: (detail.order as any).customer?.fullName ?? "—" },
                            { label: "Address:", value: detail.order.deliveryAddressLine1 ?? "—", icon: <MapPin size={13} strokeWidth={1.8} color="var(--color-secondary)" /> },
                            { label: "Driver", value: detail.driver?.fullName ?? "Pending" },
                            { label: "Total", value: `₦${Number(detail.order.totalAmount).toLocaleString()}` },
                        ].map(({ label, value, icon }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.855rem" }}>
                                {icon ?? null}
                                <span style={{ fontWeight: 500, color: "var(--color-text)" }}>{label}</span>
                                <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Progress tracker — only meaningful for the 4-step ASSIGNED→DELIVERED
                        path. FAILED/CANCELLED deliveries show a plain status message instead. */}
                    {detail.status === "FAILED" || detail.status === "CANCELLED" ? (
                        <div style={{ padding: "12px 14px", borderRadius: 8, background: STATUS_STYLE[STATUS_DISPLAY[detail.status]].bg, color: STATUS_STYLE[STATUS_DISPLAY[detail.status]].color, fontSize: "0.855rem", fontWeight: 500 }}>
                            {STATUS_DISPLAY[detail.status]}
                            {detail.driverNotes ? ` — ${detail.driverNotes}` : ""}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {DELIVERY_STEPS.map((step, i) => {
                                const done = i <= stepIndex(detail.status);
                                return (
                                    <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {done
                                            ? <CheckCircle size={16} strokeWidth={1.8} color="#16a34a" style={{ flexShrink: 0 }} />
                                            : <Circle size={16} strokeWidth={1.8} color="var(--color-border)" style={{ flexShrink: 0 }} />
                                        }
                                        <span style={{ fontSize: "0.855rem", fontWeight: done ? 500 : 400, color: done ? "var(--color-text)" : "var(--color-text-muted)" }}>
                                            {step}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Call Driver */}
                    <button
                        onClick={() => {
                            if (!detail.driver?.phone) {
                                toast.error("No driver phone number on file.");
                                return;
                            }
                            window.location.href = `tel:${detail.driver.phone}`;
                        }}
                        disabled={!detail.driver}
                        style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "12px", borderRadius: 10, border: "1px solid var(--color-border)",
                            background: "none", cursor: detail.driver ? "pointer" : "default", fontSize: "0.875rem", fontWeight: 500,
                            color: "var(--color-text)", fontFamily: "var(--font-sans)",
                            opacity: detail.driver ? 1 : 0.6,
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
// CHANGED — CURRENT_BRANCH_ID was a hardcoded "REPLACE_WITH_BRANCH_CONTEXT"
// placeholder (the exact string that caused the P2007 "invalid input
// syntax for type uuid" error seen earlier). Now sourced from useBranch(),
// same pattern as morning-count and the reservations Availability tab.
// The "Lekki Branch 1" header text was equally hardcoded and equally
// wrong once a different branch is selected — now reflects the real
// selected branch name.
function DeliveryZonesTab() {
    const zones = useDeliveryStore((s) => s.zones);
    const zonesLoading = useDeliveryStore((s) => s.zonesLoading);
    const zonesError = useDeliveryStore((s) => s.zonesError);
    const isSavingZone = useDeliveryStore((s) => s.isSavingZone);
    const fetchZones = useDeliveryStore((s) => s.fetchZones);
    const createZone = useDeliveryStore((s) => s.createZone);
    const updateZone = useDeliveryStore((s) => s.updateZone);
    const deleteZone = useDeliveryStore((s) => s.deleteZone);
    const branch = useBranch();

    const [addOpen, setAddOpen] = useState(false);
    const [editZone, setEditZone] = useState<DeliveryZone | null>(null);
    const [form, setForm] = useState({ name: "", radius: "5", baseFee: "1500", minOrder: "0" });

    useEffect(() => {
        if (branch.id) fetchZones(branch.id);
    }, [fetchZones, branch.id]);

    const list = zones ?? [];

    const openAdd = () => {
        setEditZone(null);
        setForm({ name: "", radius: "5", baseFee: "1500", minOrder: "0" });
        setAddOpen(true);
    };

    const openEdit = (z: DeliveryZone) => {
        setEditZone(z);
        setForm({ name: z.name, radius: String(z.radiusKm), baseFee: String(z.baseFee), minOrder: String(z.minOrder) });
        setAddOpen(true);
    };

    const handleSave = async () => {
        if (!form.name) return;
        const ok = editZone
            ? await updateZone(editZone.id, {
                  name: form.name,
                  radiusKm: Number(form.radius),
                  baseFee: Number(form.baseFee),
                  minOrder: Number(form.minOrder),
              })
            : await createZone({
                  branchId: branch.id,
                  name: form.name,
                  radiusKm: Number(form.radius),
                  baseFee: Number(form.baseFee),
                  minOrder: Number(form.minOrder),
              });
        if (ok) setAddOpen(false);
    };

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Branch header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>{branch.name || "—"}</span>
                    <button
                        onClick={openAdd}
                        disabled={!branch.id}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", cursor: branch.id ? "pointer" : "default", opacity: branch.id ? 1 : 0.6, fontFamily: "var(--font-sans)" }}
                    >
                        <Plus size={14} strokeWidth={2.2} /> Add Zone
                    </button>
                </div>

                {zonesLoading && !zones ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonZoneCard key={i} />)}
                    </div>
                ) : zonesError && !zones ? (
                    <ErrorState label="Could not load delivery zones." onRetry={() => branch.id && fetchZones(branch.id)} />
                ) : list.length === 0 ? (
                    <EmptyState label="No delivery zones set up for this branch yet." />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {list.map((z) => (
                            <div key={z.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{z.name}</p>
                                        <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{z.radiusKm}km radius</p>
                                    </div>
                                    <Toggle on={z.enabled} onToggle={() => updateZone(z.id, { enabled: !z.enabled })} />
                                </div>

                                {/* Fees */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    {[
                                        { label: "Base Fee", value: `₦${z.baseFee.toLocaleString()}` },
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
                                        onClick={() => deleteZone(z.id)}
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
                )}
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
                        <button className="btn btn-primary" onClick={handleSave} disabled={isSavingZone} style={{ flex: 1, justifyContent: "center", padding: "11px", opacity: isSavingZone ? 0.7 : 1 }}>
                            {isSavingZone ? "Saving…" : editZone ? "Save Changes" : "Add Zone"}
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
    { key: "partners", label: "Partners", icon: Bike },
    { key: "live", label: "Live Orders", icon: Activity },
    { key: "zones", label: "Delivery Zones", icon: MapPin },
];

export default function DeliveryPage() {
    const [tab, setTab] = useState<Tab>("partners");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <style jsx global>{`
                .skeleton-block {
                    background: linear-gradient(
                        90deg,
                        var(--color-bg-soft) 25%,
                        rgba(0, 0, 0, 0.06) 50%,
                        var(--color-bg-soft) 75%
                    );
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.4s ease-in-out infinite;
                }
                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
            <div>
                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
                    Foodies 1 LEKKI
                </p>
                <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
                    DELIVERY PARTNERS
                </h1>
                <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
                    Monitor delivery operations across all partners
                </p>
            </div>

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

            {tab === "partners" && <PartnersTab key="partners" />}
            {tab === "live" && <LiveOrdersTab key="live" />}
            {tab === "zones" && <DeliveryZonesTab key="zones" />}
        </div>
    );
}