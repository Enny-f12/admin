"use client";

import { useState } from "react";
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

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type Tab = "policies" | "availability" | "waitlist" | "reminders";
type TableStatus = "Free" | "Booked" | "Occupied";

type TableType   = { seats: number; count: number };
type TableSlot   = { id: string; seats: number; status: TableStatus; time?: string };
type SpecialDate = { id: number; date: string; label: string; type: string };

type WaitlistEntry = {
  id: number;
  name: string;
  party: number;
  phone: string;
  branch: string;
  time: string;
  addedAgo: string;
};

type ReminderRule = {
  id: number;
  label: string;
  description: string;
  enabled: boolean;
};

/* ══════════════════════════════════════════
   SEED DATA
══════════════════════════════════════════ */
const INIT_TABLE_TYPES: TableType[] = [
  { seats: 4, count: 3 },
  { seats: 2, count: 2 },
  { seats: 2, count: 8 },
];

const INIT_TABLES: TableSlot[] = [
  { id: "T1",  seats: 4, status: "Occupied" },
  { id: "T2",  seats: 4, status: "Free"     },
  { id: "T3",  seats: 3, status: "Booked",  time: "7pm" },
  { id: "T4",  seats: 2, status: "Free"     },
  { id: "T5",  seats: 8, status: "Occupied" },
  { id: "T6",  seats: 2, status: "Booked",  time: "5pm" },
  { id: "T7",  seats: 2, status: "Booked",  time: "5pm" },
  { id: "T8",  seats: 4, status: "Free"     },
  { id: "T9",  seats: 3, status: "Booked",  time: "7pm" },
  { id: "T10", seats: 4, status: "Occupied" },
  { id: "T11", seats: 2, status: "Booked",  time: "5pm" },
  { id: "T12", seats: 2, status: "Free"     },
  { id: "T13", seats: 8, status: "Occupied" },
  { id: "T14", seats: 2, status: "Booked",  time: "5pm" },
];

const INIT_SPECIAL_DATES: SpecialDate[] = [
  { id: 1, date: "2026-12-25", label: "Christmas Day",                type: "Closed all day" },
  { id: 2, date: "2026-02-14", label: "Valentine's — extended hours", type: "Special hours"  },
];

const INIT_WAITLIST: WaitlistEntry[] = [
  { id: 1, name: "Chidi O.", party: 4, phone: "+234 803 555 0001", branch: "Foodies 1", time: "Tonight 7:30 PM",  addedAgo: "Added 12 min ago" },
  { id: 2, name: "Amaka E.", party: 2, phone: "+234 805 222 9988", branch: "Foodies 3", time: "Tomorrow 6:00 PM", addedAgo: "Added 45 min ago"  },
];

const INIT_REMINDERS: ReminderRule[] = [
  { id: 1, label: "Booking Confirmation", description: "Sent immediately after booking",        enabled: true  },
  { id: 2, label: "24-Hour Reminder",     description: "Day before reservation",                 enabled: true  },
  { id: 3, label: "2-Hour Reminder",      description: "Sent 2 hours before arrival",             enabled: true  },
  { id: 4, label: "SMS Notifications",    description: "Also send via SMS (additional cost)",     enabled: false },
];

const TIME_SLOTS          = ["15 min", "30 min", "45 min", "60 min"];
const SPECIAL_DATE_TYPES  = ["Closed all day", "Reduced Hours", "Holiday Seating"];

const TABLE_STATUS_COLORS: Record<TableStatus, { bg: string; border: string }> = {
  Free:     { bg: "#16a34a", border: "#15803d" },
  Booked:   { bg: "#ca8a04", border: "#a16207" },
  Occupied: { bg: "#b91c1c", border: "#991b1b" },
};

/* Converts a stored "11:00 AM" style time to 24-hour "11:00" for display */
function to24Hour(t: string): string {
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t;
  const [, h, min, period] = m;
  let hour = parseInt(h, 10);
  if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${min}`;
}

/* ══════════════════════════════════════════
   SHARED UI HELPERS
══════════════════════════════════════════ */
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
              onMouseEnter={(e) => { if (o !== value) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)"; }}
              onMouseLeave={(e) => { if (o !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
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

/* ══════════════════════════════════════════
   POLICIES TAB
══════════════════════════════════════════ */
function PoliciesTab() {
  const [tableTypes, setTableTypes]  = useState<TableType[]>(INIT_TABLE_TYPES);
  const [reservationsOn, setResOn]   = useState(true);
  const [timeSlot, setTimeSlot]      = useState("30 min");
  const [requireDeposit, setDeposit] = useState(true);
  const [depositAmount, setDepAmt]   = useState("5000");
  const [bookingDuration, setBD]     = useState("90");
  const [advanceWindow, setAW]       = useState("30");
  const [minLeadTime, setMLT]        = useState("60");
  const [cancellationWindow, setCW]  = useState("2");
  const [gracePeriod, setGP]         = useState("15");
  const [opHours, setOpHours]        = useState({ open: "11:00 AM", close: "10:00 PM" });
  const [specialDates, setSpecial]   = useState<SpecialDate[]>(INIT_SPECIAL_DATES);

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editHoursOpen, setEditHours] = useState(false);
  const [addDateOpen, setAddDate]     = useState(false);
  const [newType, setNewType]         = useState({ seats: "", count: "" });
  const [editOp, setEditOp]           = useState({ open: "11:00 AM", close: "10:00 PM" });
  const [newDate, setNewDate]         = useState({
    date: "", type: "Closed all day", note: "",
    openTime: "5:00 PM", closeTime: "10:00 PM",
    slot1: "5:00 PM - 7:00 PM", slot2: "7:30 PM - 10:00 PM",
  });

  const totalTables = tableTypes.reduce((s, t) => s + t.count, 0);
  const totalSeats  = tableTypes.reduce((s, t) => s + t.seats * t.count, 0);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Branch + Table Inventory */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>Foodies 1 [Lekki]</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                {totalTables} tables · {totalSeats} seats total
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Reservations</span>
              <Toggle on={reservationsOn} onToggle={() => setResOn((v) => !v)} />
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

            {tableTypes.length === 0 ? (
              <p style={{ fontSize: "0.83rem", color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>No tables configured</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tableTypes.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Users size={15} strokeWidth={1.8} color="var(--color-secondary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text)" }}>
                        {t.count} × {t.seats}-seater table{t.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => setTableTypes((p) => p.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                    >
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Rules */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-heading)" }}>Booking Rules</span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { label: "Booking Duration (minutes)",        val: bookingDuration,     set: setBD  },
              { label: "Advance Booking Window (days)",     val: advanceWindow,       set: setAW  },
              { label: "Cancellation Window (hours before)",val: cancellationWindow,  set: setCW  },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{label}</label>
                <input className="input" value={val} onChange={(e) => set(e.target.value)} />
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Time Slot Increment (minutes)</label>
              <SimpleDropdown options={TIME_SLOTS} value={timeSlot} onChange={setTimeSlot} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Minimum Lead Time (minutes)</label>
              <input className="input" value={minLeadTime} onChange={(e) => setMLT(e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Grace Period (minutes)</label>
              <input className="input" value={gracePeriod} onChange={(e) => setGP(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>Require Deposit</p>
              <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Charge deposit at booking</p>
            </div>
            <Toggle on={requireDeposit} onToggle={() => setDeposit((v) => !v)} />
          </div>

          {requireDeposit && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Deposit Amount (₦)</label>
              <input className="input" value={depositAmount} onChange={(e) => setDepAmt(e.target.value)} />
            </div>
          )}
        </div>

        {/* Operating Hours */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>Operating Hours</p>
            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {to24Hour(opHours.open)} – {to24Hour(opHours.close)} daily
            </p>
          </div>
          <button
            onClick={() => { setEditOp({ open: opHours.open, close: opHours.close }); setEditHours(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <SquarePen size={13} strokeWidth={1.8} /> Edit
          </button>
        </div>

        {/* Special Dates */}
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
          {specialDates.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CalendarClock size={15} strokeWidth={1.8} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>{d.date} · {d.label}</p>
                  <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{d.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSpecial((p) => p.filter((x) => x.id !== d.id))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(252,208,99,0.12)", border: "1px solid rgba(252,208,99,0.3)" }}>
          <Info size={15} strokeWidth={1.8} color="#a07a00" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 400, color: "#7a5800" }}>
            All policies are automatically pushed to the customer mobile app in real time.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => toast.success("Policies saved", { description: "Changes pushed to the customer app." })}
          style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem" }}
        >
          Save All Policies
        </button>
      </div>

      {/* Add Table Type Modal */}
      {addTypeOpen && (
        <Modal title="Add Table Type" onClose={() => setAddTypeOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Seats per table",  key: "seats" as const, placeholder: "4" },
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
                setTableTypes((p) => [...p, { seats: Number(newType.seats), count: Number(newType.count) }]);
                setNewType({ seats: "", count: "" });
                setAddTypeOpen(false);
                toast.success("Table type added");
              }}>Add</button>
            <button onClick={() => setAddTypeOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Edit Operating Hours Modal */}
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
                setOpHours({ open: editOp.open, close: editOp.close });
                setEditHours(false);
                toast.success("Operating hours updated");
              }}>Save</button>
            <button onClick={() => setEditHours(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Add Special Date Modal */}
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
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "11px" }}
              onClick={() => {
                if (!newDate.date) return;
                setSpecial((p) => [...p, { id: Date.now(), date: newDate.date, label: newDate.note || newDate.type, type: newDate.type }]);
                setAddDate(false);
                setNewDate({ date: "", type: "Closed all day", note: "", openTime: "5:00 PM", closeTime: "10:00 PM", slot1: "5:00 PM - 7:00 PM", slot2: "7:30 PM - 10:00 PM" });
                toast.success("Special date added");
              }}>Add</button>
            <button onClick={() => setAddDate(false)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500, color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   AVAILABILITY TAB
══════════════════════════════════════════ */
function AvailabilityTab() {
  const [tables, setTables] = useState<TableSlot[]>(INIT_TABLES);

  const cycleStatus = (id: string) => {
    const cycle: TableStatus[] = ["Free", "Booked", "Occupied"];
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: cycle[(cycle.indexOf(t.status) + 1) % cycle.length] }
          : t
      )
    );
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>
        Foodies 1 [Lekki] — Table Availability
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
        {tables.map((t) => {
          const colors = TABLE_STATUS_COLORS[t.status];
          return (
            <button
              key={t.id}
              onClick={() => cycleStatus(t.id)}
              title="Click to cycle status"
              style={{
                background: colors.bg, border: `2px solid ${colors.border}`,
                borderRadius: 12, padding: "16px 10px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#fff" }}>{t.id}</span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)" }}>
                {t.seats}-Seat{t.time ? ` (${t.time})` : ""}
              </span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.95)", fontWeight: 500 }}>
                {t.status}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {(["Free", "Reserved", "Occupied"] as const).map((s) => {
          const color = s === "Free" ? "#16a34a" : s === "Reserved" ? "#ca8a04" : "#b91c1c";
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   WAITLIST TAB
══════════════════════════════════════════ */
function WaitlistTab() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INIT_WAITLIST);

  const notify = (id: number) => {
    const entry = waitlist.find((w) => w.id === id);
    if (!entry) return;
    toast.success(`${entry.name} has been notified`, {
      description: `SMS sent to ${entry.phone}`,
      duration: 4000,
    });
  };

  const seat = (id: number) => {
    const entry = waitlist.find((w) => w.id === id);
    if (!entry) return;
    setWaitlist((p) => p.filter((w) => w.id !== id));
    toast.success(`${entry.name} has been seated`, {
      description: `Party of ${entry.party} — ${entry.branch}`,
      duration: 4000,
    });
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>
          Waitlist ({waitlist.length})
        </span>
      </div>

      {waitlist.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--color-text-muted)" }}>
            No one on the waitlist right now.
          </p>
        </div>
      ) : (
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
                {w.addedAgo}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => notify(w.id)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "none", cursor: "pointer", fontSize: "0.825rem", fontWeight: 500, color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
              >
                Notify
              </button>
              <button
                onClick={() => seat(w.id)}
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

/* ══════════════════════════════════════════
   REMINDERS TAB
══════════════════════════════════════════ */
function RemindersTab() {
  const [reminders, setReminders] = useState<ReminderRule[]>(INIT_REMINDERS);

  const toggle = (id: number) =>
    setReminders((p) => p.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-heading)" }}>Automated Reminders</span>
        </div>

        {reminders.map((r, i) => (
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
            <Toggle on={r.enabled} onToggle={() => toggle(r.id)} />
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => toast.success("Reminder settings saved")}
        style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem", marginTop: 16 }}
      >
        Save
      </button>
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "policies",     label: "Policies",     icon: Settings     },
  { key: "availability", label: "Availability", icon: CalendarDays },
  { key: "waitlist",     label: "Waitlist",     icon: List         },
  { key: "reminders",    label: "Reminders",    icon: Bell         },
];

export default function ReservationsPage() {
  const [tab, setTab] = useState<Tab>("policies");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
          Foodies 1 LEKKI
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          RESERVATION POLICIES
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
          Configure table booking rules across all branches.
        </p>
      </div>

      {/* Tab bar */}
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

      {/* Tab content */}
      {tab === "policies"     && <PoliciesTab     />}
      {tab === "availability" && <AvailabilityTab />}
      {tab === "waitlist"     && <WaitlistTab      />}
      {tab === "reminders"    && <RemindersTab     />}
    </div>
  );
}