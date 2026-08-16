"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  CalendarDays,
  List,
  Bell,
  Plus,
  Trash2,
  SquarePen,
  Users,
  X,
  ChevronDown,
  Check,
  Info,
  CalendarClock,
} from "lucide-react";
import { useReservationsStore } from "@/store/useReservationsStore";
import { ReservationPolicies } from "@/types/reservations.types";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useBranch, ALL_BRANCHES_ID } from "../layout";

// NOTE: Waitlist and Reminders tabs below are UNCHANGED — they still
// point at speculative endpoints, since nothing in the real
// ReservationService covers a waitlist or reminder rules beyond what's
// already wired. Availability and Policies both use real data.
//
// CHANGED — PoliciesTab and the page header no longer hardcode
// "Foodies 1 [Lekki]" — both now read branch.name from useBranch(), same
// source as the sidebar and AvailabilityTab. PoliciesTab also now guards
// against ALL_BRANCHES_ID the same way morning-count/page.tsx does:
// reservation policies are inherently per-branch (you can't set one set
// of booking rules for every branch at once), so fetchPolicies is no
// longer called with the sentinel id, and a friendly empty-state message
// is shown instead of letting a bad request fire. This mirrors the
// backend fix for the find-then-create race in
// OperationsService.getReservationPolicies (now an atomic upsert).

type Tab = "policies" | "availability" | "waitlist" | "reminders";

const TIME_SLOTS = ["15 min", "30 min", "45 min", "60 min"];
const SPECIAL_DATE_TYPES = ["Closed all day", "Reduced Hours", "Holiday Seating"];

function to24Hour(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t;
  const [, h, min, period] = m;
  let hour = parseInt(h, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Added just now";
  if (mins < 60) return `Added ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `Added ${hrs} hour${hrs === 1 ? "" : "s"} ago`;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: on ? "var(--color-secondary)" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SimpleDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
          background: "var(--color-bg-input)", fontSize: "0.855rem", color: "var(--color-text)",
          cursor: "pointer", fontFamily: "var(--font-sans)", gap: 8,
        }}
      >
        <span>{value}</span>
        <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60,
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {options.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                background: o === value ? "var(--color-bg-soft)" : "transparent",
                color: o === value ? "var(--color-primary)" : "var(--color-text)",
                fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                fontWeight: o === value ? 500 : 400, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              {o}
              {o === value && <Check size={13} strokeWidth={2.2} color="var(--color-primary)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
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

/* ══════════════════════════ POLICIES TAB ══════════════════════════ */
function PoliciesTab() {
  const { policies, policiesLoading, policiesError, fetchPolicies, savePolicies, isSavingPolicies, addSpecialDate, removeSpecialDate, isSavingSpecialDate } = useReservationsStore();
  const branch = useBranch();

  // Reservation policies are per-branch — you can't set one set of
  // booking rules for every branch simultaneously (same reasoning as
  // Morning Count). Guard mirrors morning-count/page.tsx's
  // hasUsableBranch pattern: don't fire fetchPolicies with the
  // "All Branches" sentinel, and show a friendly empty state instead of
  // letting a bad/misleading request go out.
  const isAllBranches = branch.id === ALL_BRANCHES_ID;
  const hasUsableBranch = Boolean(branch.id) && !isAllBranches;

  const [form, setForm] = useState<ReservationPolicies | null>(null);

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editHoursOpen, setEditHours] = useState(false);
  const [addDateOpen, setAddDate] = useState(false);
  const [newType, setNewType] = useState({ seats: "", count: "" });
  const [editOp, setEditOp] = useState({ open: "", close: "" });
  const [newDate, setNewDate] = useState({
    date: "", type: "Closed all day", note: "",
    openTime: "5:00 PM", closeTime: "10:00 PM",
    slot1: "5:00 PM - 7:00 PM", slot2: "7:30 PM - 10:00 PM",
  });

  useEffect(() => {
    if (hasUsableBranch) fetchPolicies(branch.id);
  }, [fetchPolicies, branch.id, hasUsableBranch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (policies) setForm(policies);
  }, [policies]);

  if (isAllBranches) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Reservation policies are per-branch — pick a specific branch above to view or edit them.
        </p>
      </div>
    );
  }

  if (policiesLoading || !form) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonText width="30%" height={16} />
            <Skeleton width="100%" height={40} radius={8} />
            <Skeleton width="100%" height={40} radius={8} />
          </div>
        ))}
        {policiesError && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/reservations/policies not implemented */}
            Policies unavailable
          </p>
        )}
      </div>
    );
  }

  const totalTables = form.tableTypes.reduce((s, t) => s + t.count, 0);
  const totalSeats = form.tableTypes.reduce((s, t) => s + t.seats * t.count, 0);

  const update = (patch: Partial<ReservationPolicies>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const savePayload = () => {
    if (!form) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { branchId: _branchId, specialDates: _specialDates, ...rest } = form;
    savePolicies(branch.id, rest);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>
                {branch.name || "—"}
              </p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                {totalTables} tables · {totalSeats} seats total
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Reservations</span>
              <Toggle on={form.reservationsEnabled} onToggle={() => update({ reservationsEnabled: !form.reservationsEnabled })} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Table Inventory</span>
              <button
                onClick={() => setAddTypeOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                <Plus size={13} strokeWidth={2.2} /> Add Type
              </button>
            </div>

            {form.tableTypes.length === 0 ? (
              <p style={{ fontSize: "0.83rem", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>No tables configured</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.tableTypes.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Users size={15} strokeWidth={1.8} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text)" }}>
                        {t.count} × {t.seats}-seater table{t.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => update({ tableTypes: form.tableTypes.filter((_, j) => j !== i) })}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Booking Rules</span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Booking Duration (minutes)</label>
              <input className="input" value={form.bookingDurationMinutes} onChange={(e) => update({ bookingDurationMinutes: Number(e.target.value) || 0 })} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Advance Booking Window (days)</label>
              <input className="input" value={form.advanceBookingWindowDays} onChange={(e) => update({ advanceBookingWindowDays: Number(e.target.value) || 0 })} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Cancellation Window (hours before)</label>
              <input className="input" value={form.cancellationWindowHours} onChange={(e) => update({ cancellationWindowHours: Number(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Time Slot Increment (minutes)</label>
              <SimpleDropdown options={TIME_SLOTS} value={`${form.timeSlotIncrementMinutes} min`} onChange={(v) => update({ timeSlotIncrementMinutes: Number(v.replace(/\D/g, "")) || 0 })} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Minimum Lead Time (minutes)</label>
              <input className="input" value={form.minimumLeadTimeMinutes} onChange={(e) => update({ minimumLeadTimeMinutes: Number(e.target.value) || 0 })} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Grace Period (minutes)</label>
              <input className="input" value={form.gracePeriodMinutes} onChange={(e) => update({ gracePeriodMinutes: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>Require Deposit</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Charge deposit at booking</p>
            </div>
            <Toggle on={form.requireDeposit} onToggle={() => update({ requireDeposit: !form.requireDeposit })} />
          </div>

          {form.requireDeposit && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Deposit Amount (₦)</label>
              <input className="input" value={form.depositAmount} onChange={(e) => update({ depositAmount: Number(e.target.value) || 0 })} />
            </div>
          )}
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>Operating Hours</p>
            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {to24Hour(form.operatingHours.open)} – {to24Hour(form.operatingHours.close)} daily
            </p>
          </div>
          <button
            onClick={() => { setEditOp({ open: form.operatingHours.open, close: form.operatingHours.close }); setEditHours(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <SquarePen size={13} strokeWidth={1.8} /> Edit
          </button>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Special Dates</span>
            <button
              onClick={() => setAddDate(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)", fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
            >
              <Plus size={13} strokeWidth={2.2} /> Add
            </button>
          </div>
          {form.specialDates.length === 0 && (
            <p style={{ fontSize: "0.83rem", color: "var(--color-text-muted)", textAlign: "center", padding: "10px 0" }}>No special dates configured</p>
          )}
          {form.specialDates.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CalendarClock size={15} strokeWidth={1.8} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{d.date} · {d.label}</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{d.type}</p>
                </div>
              </div>
              <button
                onClick={() => removeSpecialDate(d.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(252,208,99,0.12)", border: "1px solid rgba(252,208,99,0.3)" }}>
          <Info size={15} strokeWidth={1.8} color="#a07a00" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 400, color: "#7a5800" }}>
            All policies are automatically pushed to the customer mobile app in real time.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={savePayload}
          disabled={isSavingPolicies}
          style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem", opacity: isSavingPolicies ? 0.6 : 1 }}
        >
          {isSavingPolicies ? "Saving…" : "Save All Policies"}
        </button>
      </div>

      {addTypeOpen && (
        <Modal title="Add Table Type" onClose={() => setAddTypeOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Seats per table", key: "seats" as const, placeholder: "4" },
              { label: "Number of tables", key: "count" as const, placeholder: "1" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" type="number" placeholder={placeholder} value={newType[key]}
                  onChange={(e) => setNewType((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "11px" }}
              onClick={() => {
                if (!newType.seats || !newType.count) return;
                update({ tableTypes: [...form.tableTypes, { seats: Number(newType.seats), count: Number(newType.count) }] });
                setNewType({ seats: "", count: "" });
                setAddTypeOpen(false);
                toast.success("Table type added — remember to Save All Policies");
              }}>Add</button>
            <button onClick={() => setAddTypeOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {editHoursOpen && (
        <Modal title="Edit Operating Hours" onClose={() => setEditHours(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Opening", key: "open" as const },
              { label: "Closing", key: "close" as const },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" value={editOp[key]} onChange={(e) => setEditOp((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "11px" }}
              onClick={() => {
                update({ operatingHours: { open: editOp.open, close: editOp.close } });
                setEditHours(false);
                toast.success("Operating hours updated — remember to Save All Policies");
              }}>Save</button>
            <button onClick={() => setEditHours(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {addDateOpen && (
        <Modal title="Add Special Date" onClose={() => setAddDate(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Date</label>
              <input className="input" type="date" value={newDate.date} onChange={(e) => setNewDate((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Type</label>
              <SimpleDropdown options={SPECIAL_DATE_TYPES} value={newDate.type} onChange={(v) => setNewDate((f) => ({ ...f, type: v }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Note</label>
              <input className="input" placeholder="e.g. Public Holiday" value={newDate.note} onChange={(e) => setNewDate((f) => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Opening Time", key: "openTime" as const },
                { label: "Closing Time", key: "closeTime" as const },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                  <input className="input" value={newDate[key]} onChange={(e) => setNewDate((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Fixed Seating Slots (1)", key: "slot1" as const },
                { label: "Fixed Seating Slots (2)", key: "slot2" as const },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                  <input className="input" value={newDate[key]} onChange={(e) => setNewDate((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center", padding: "11px", opacity: isSavingSpecialDate ? 0.6 : 1 }}
              disabled={isSavingSpecialDate}
              onClick={async () => {
                if (!newDate.date) return;
                const ok = await addSpecialDate({
                  branchId: branch.id,
                  date: newDate.date,
                  type: newDate.type,
                  note: newDate.note || null,
                  openTime: newDate.openTime || null,
                  closeTime: newDate.closeTime || null,
                  slot1: newDate.slot1 || null,
                  slot2: newDate.slot2 || null,
                });
                if (ok) {
                  setAddDate(false);
                  setNewDate({ date: "", type: "Closed all day", note: "", openTime: "5:00 PM", closeTime: "10:00 PM", slot1: "5:00 PM - 7:00 PM", slot2: "7:30 PM - 10:00 PM" });
                }
              }}
            >
              {isSavingSpecialDate ? "Adding…" : "Add"}
            </button>
            <button onClick={() => setAddDate(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════ AVAILABILITY TAB ══════════════════════════ */
// Rebuilt against the real backend: DiningTable has no status field, and
// there is no endpoint to set one. Status shown here is DERIVED client-side
// from live reservations overlapping "now" — it's read-only, not something
// staff can click to change. See ReservationService.getAvailableTables for
// the same overlap logic this mirrors.
//
// branchId is sourced from useBranch(), same as morning-count — no
// hardcoded UUID.
function AvailabilityTab() {
  const { tables, tablesLoading, tablesError, fetchTables, reservations, reservationsLoading, fetchReservations } = useReservationsStore();
  const branch = useBranch();

  useEffect(() => {
    if (branch.id) {
      fetchTables(branch.id);
      fetchReservations(branch.id);
    }
  }, [fetchTables, fetchReservations, branch.id]);

  const loading = tablesLoading || reservationsLoading;

  const deriveStatus = (tableId: string) => {
    const now = new Date();
    const relevant = (reservations ?? []).filter(
      (r) =>
        r.status !== "CANCELLED" &&
        r.status !== "NO_SHOW" &&
        r.tableLinks.some((tl) => tl.table.id === tableId),
    );
    const current = relevant.find((r) => new Date(r.startsAt) <= now && now <= new Date(r.endsAt));
    if (current) return { label: "Reserved Now", time: null as string | null };

    const upcoming = relevant
      .filter((r) => new Date(r.startsAt) > now)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
    if (upcoming) {
      return { label: "Booked Later", time: new Date(upcoming.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    }
    return { label: "Free", time: null };
  };

  const colorsFor = (label: string) => {
    if (label === "Free") return { bg: "#16a34a", border: "#15803d" };
    if (label === "Booked Later") return { bg: "#ca8a04", border: "#a16207" };
    return { bg: "#b91c1c", border: "#991b1b" }; // Reserved Now
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>
          {branch.name || "—"} — Table Availability
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
          Status is computed from current reservations, not manually set.
        </p>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={84} radius={12} />
          ))}
        </div>
      )}

      {!loading && (tablesError || !tables?.length) && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {/* TODO(BACKEND): confirm exact route for ReservationService.listTables — inferred as GET /admin/reservations/tables?branchId */}
          No table data available
        </p>
      )}

      {!loading && !tablesError && tables && tables.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
            {tables.map((t) => {
              const derived = deriveStatus(t.id);
              const colors = colorsFor(derived.label);
              return (
                <div
                  key={t.id}
                  style={{
                    background: colors.bg, border: `2px solid ${colors.border}`,
                    borderRadius: 12, padding: "16px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#fff" }}>{t.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)" }}>
                    {t.seats}-Seat{t.section ? ` · ${t.section}` : ""}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>
                    {derived.label}{derived.time ? ` (${derived.time})` : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {[
              { label: "Free", color: "#16a34a" },
              { label: "Booked Later", color: "#ca8a04" },
              { label: "Reserved Now", color: "#b91c1c" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════ WAITLIST TAB ══════════════════════════ */
// NOTE: "Seat" below calls seatWaitlistEntry(id, tableId), which the
// backend requires (PATCH /admin/reservations/waitlist/:id/seat needs a
// tableId in its body — confirmed via Swagger). There is currently no UI
// for picking which table to seat this party at. Passing an empty string
// will 400. This needs a real design decision (a table picker dropdown,
// or defaulting to the first available table from AvailabilityTab's data)
// before "Seat" can work end-to-end — flagging rather than guessing a
// silent default that could seat someone at the wrong table.
function WaitlistTab() {
  const { waitlist, waitlistLoading, waitlistError, fetchWaitlist, notifyWaitlistEntry } = useReservationsStore();
  const branch = useBranch();

  useEffect(() => {
    if (branch.id) fetchWaitlist(branch.id);
  }, [fetchWaitlist, branch.id]);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>
          Waitlist {waitlist ? `(${waitlist.length})` : ""}
        </span>
      </div>

      {waitlistLoading && (
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonText width="50%" height={14} />
              <SkeletonText width="70%" height={12} />
            </div>
          ))}
        </div>
      )}

      {!waitlistLoading && (waitlistError || !waitlist?.length) && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/reservations/waitlist not implemented */}
            No one on the waitlist right now.
          </p>
        </div>
      )}

      {!waitlistLoading && !waitlistError && waitlist && waitlist.length > 0 && (
        waitlist.map((w, i) => (
          <div
            key={w.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px",
              borderBottom: i < waitlist.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>
                {w.name} · Party of {w.party}
              </p>
              <p style={{ margin: "3px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                {w.phone} · {w.branch} · {w.time}
              </p>
              <p style={{ margin: "3px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-primary)" }}>
                {timeAgo(w.addedAt)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => notifyWaitlistEntry(w.id)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
              >
                Notify
              </button>
              <button
                onClick={() => {
                  // TODO: needs a real table picker before this can call
                  // seatWaitlistEntry(w.id, tableId) — see note above the
                  // component. Left as a no-op rather than sending a
                  // fake/empty tableId that would either 400 or seat the
                  // party at the wrong table.
                  toast.info("Table selection isn't wired up yet — see TODO in WaitlistTab.");
                }}
                className="btn btn-primary"
                style={{ padding: "8px 18px" }}
              >
                Seat
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ══════════════════════════ REMINDERS TAB ══════════════════════════ */
function RemindersTab() {
  const { reminders, remindersLoading, remindersError, fetchReminders, toggleReminder, saveReminders, isSavingReminders } = useReservationsStore();
  const branch = useBranch();

  useEffect(() => {
    if (branch.id) fetchReminders(branch.id);
  }, [fetchReminders, branch.id]);

  return (
    <>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>Automated Reminders</span>
        </div>

        {remindersLoading && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <SkeletonText width="45%" height={14} />
                <Skeleton width={40} height={22} radius={11} />
              </div>
            ))}
          </div>
        )}

        {!remindersLoading && (remindersError || !reminders?.length) && (
          <p style={{ padding: 20, margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): GET /admin/reservations/reminders not implemented */}
            No reminder rules available
          </p>
        )}

        {!remindersLoading && !remindersError && reminders?.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: i < reminders.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{r.label}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                {r.description}
              </p>
            </div>
            <Toggle on={r.enabled} onToggle={() => toggleReminder(r.id)} />
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => saveReminders(branch.id)}
        disabled={isSavingReminders || !reminders?.length}
        style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem", marginTop: 16, opacity: isSavingReminders || !reminders?.length ? 0.6 : 1 }}
      >
        {isSavingReminders ? "Saving…" : "Save"}
      </button>
    </>
  );
}

/* ══════════════════════════ MAIN PAGE ══════════════════════════ */
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "policies", label: "Policies", icon: Settings },
  { key: "availability", label: "Availability", icon: CalendarDays },
  { key: "waitlist", label: "Waitlist", icon: List },
  { key: "reminders", label: "Reminders", icon: Bell },
];

export default function ReservationsPage() {
  const [tab, setTab] = useState<Tab>("policies");
  const branch = useBranch();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
          {branch.name ? branch.name.toUpperCase() : "—"}
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          RESERVATION POLICIES
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
          Configure table booking rules across all branches.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={active ? "btn btn-primary" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 8,
                border: active ? "none" : "1px solid var(--color-border)",
                background: active ? undefined : "#fff",
                color: active ? undefined : "var(--color-text)",
                fontFamily: "var(--font-sans)", fontSize: "0.855rem",
                fontWeight: 500, cursor: "pointer",
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "policies" && <PoliciesTab />}
      {tab === "availability" && <AvailabilityTab />}
      {tab === "waitlist" && <WaitlistTab />}
      {tab === "reminders" && <RemindersTab />}
    </div>
  );
}