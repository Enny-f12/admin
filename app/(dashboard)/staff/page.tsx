"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  SquarePen,
  Trash2,
  X,
  ChevronDown,
  Check,
} from "lucide-react";


type StaffStatus = "Active" | "Offline";

type StaffMember = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: StaffStatus;
  lastSeen: string;
  branches: string[];
  invPermissions: string[];
  permissions: string[];
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  branches: string[];
  invPermissions: string[];
  permissions: string[];
  sendWelcome: boolean;
};


const ROLES = ["Manager", "Kitchen Staff", "Delivery Coord", "Admin", "Cashier", "Waiter"];
const BRANCHES = ["Lekki", "Abuja", "Maitama", "Victoria Island"];

const INV_PERMISSIONS = [
  "View inventory (all items)",
  "Adjust manual items only",
  "Override feed items (emergency only)",
  "Configure feed settings (super admin only)",
];

const PERMISSIONS = [
  "Orders - View",
  "Orders - Update Status",
  "Menu - Edit",
  "Customers - View",
];

const EMPTY_FORM: StaffForm = {
  name: "", email: "", phone: "", role: "",
  branches: [], invPermissions: ["Adjust manual items only"],
  permissions: ["Orders - Update Status"], sendWelcome: true,
};

const SEED_STAFF: StaffMember[] = [
  { id: 1, name: "John Isaac",  email: "johnisaac@gmail.com", phone: "07035467899", role: "Manager",        status: "Active",  lastSeen: "Today",     branches: ["Lekki"],         invPermissions: ["Adjust manual items only"], permissions: ["Orders - Update Status"] },
  { id: 2, name: "Tunde Bello", email: "tunde@gmail.com",     phone: "08012345678", role: "Kitchen Staff",  status: "Active",  lastSeen: "Today",     branches: ["Lekki", "Abuja"], invPermissions: [],                           permissions: [] },
  { id: 3, name: "John Caleb",  email: "johncaleb@gmail.com", phone: "09011223344", role: "Delivery Coord", status: "Active",  lastSeen: "Today",     branches: ["Abuja"],          invPermissions: [],                           permissions: ["Orders - View", "Orders - Update Status"] },
  { id: 4, name: "Tolu Ajagbe", email: "tolu@gmail.com",      phone: "08099887766", role: "Admin",          status: "Offline", lastSeen: "Yesterday", branches: ["Lekki", "Abuja"], invPermissions: INV_PERMISSIONS,              permissions: PERMISSIONS },
];

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function RoleDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
          background: "var(--color-bg-input)", fontSize: "0.855rem",
          color: value ? "var(--color-text)" : "var(--color-text-muted)",
          cursor: "pointer", fontFamily: "var(--font-sans)", gap: 8,
        }}
      >
        <span>{value || "Select role"}</span>
        <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                background: r === value ? "var(--color-bg-soft)" : "transparent",
                color: r === value ? "var(--color-primary)" : "var(--color-text)",
                fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                fontWeight: r === value ? 500 : 400, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => { if (r !== value) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)"; }}
              onMouseLeave={(e) => { if (r !== value) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {r}
              {r === value && <Check size={13} strokeWidth={2.2} color="var(--color-primary)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Checkbox({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: "0.855rem", fontWeight: 400, color: "var(--color-text-secondary)" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: checked ? "none" : "1.5px solid var(--color-border)",
          background: checked ? "var(--color-primary)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {checked && <Check size={10} strokeWidth={3} color="#fff" />}
      </div>
      {label}
    </label>
  );
}

function toggleArr(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

/* ══════════════════════════════════════════
   STAFF MODAL
══════════════════════════════════════════ */
function StaffModal({
  editStaff,
  onClose,
  onSave,
}: {
  editStaff: StaffMember | null;
  onClose: () => void;
  onSave: (form: StaffForm) => void;
}) {
  const [form, setForm] = useState<StaffForm>(
    editStaff
      ? {
          name: editStaff.name, email: editStaff.email, phone: editStaff.phone,
          role: editStaff.role, branches: editStaff.branches,
          invPermissions: editStaff.invPermissions, permissions: editStaff.permissions,
          sendWelcome: true,
        }
      : EMPTY_FORM
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 520, padding: 28, display: "flex", flexDirection: "column", gap: 18, maxHeight: "92vh", overflowY: "auto" }}
        className="no-scrollbar"
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>
            {editStaff ? "Edit Staff Member" : "Add Staff Member"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Name</label>
          <input className="input" placeholder="John Isaac" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Email */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Email</label>
          <input className="input" type="email" placeholder="johnisaac@gmail.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>

        {/* Phone */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Phone Number</label>
          <input className="input" type="tel" placeholder="07035467899" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>

        {/* Role */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Role</label>
          <RoleDropdown value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
        </div>

        {/* Branch Access */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Branch Access:</label>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {BRANCHES.map((b) => (
              <Checkbox
                key={b}
                label={b}
                checked={form.branches.includes(b)}
                onChange={() => setForm((f) => ({ ...f, branches: toggleArr(f.branches, b) }))}
              />
            ))}
          </div>
        </div>

        {/* Inventory Permissions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Inventory Permissions:</label>
          <div
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: "var(--color-bg-soft)" }}
          >
            {INV_PERMISSIONS.map((p) => (
              <Checkbox
                key={p}
                label={p}
                checked={form.invPermissions.includes(p)}
                onChange={() => setForm((f) => ({ ...f, invPermissions: toggleArr(f.invPermissions, p) }))}
              />
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Permissions:</label>
          <div
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: "var(--color-bg-soft)" }}
          >
            {PERMISSIONS.map((p) => (
              <Checkbox
                key={p}
                label={p}
                checked={form.permissions.includes(p)}
                onChange={() => setForm((f) => ({ ...f, permissions: toggleArr(f.permissions, p) }))}
              />
            ))}
          </div>
        </div>

        {/* Welcome email */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Checkbox
            label="Send welcome email with login instructions"
            checked={form.sendWelcome}
            onChange={(v) => setForm((f) => ({ ...f, sendWelcome: v }))}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
              borderRadius: 8, border: "1px solid var(--color-border)", background: "none",
              cursor: "pointer", fontSize: "0.855rem", fontWeight: 500,
              color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)",
            }}
          >
            <Plus size={14} strokeWidth={2} style={{ transform: "rotate(45deg)" }} /> Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(form)}
            style={{ flex: 1, justifyContent: "center", padding: "11px" }}
          >
            {editStaff ? "Done" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function StaffManagementPage() {
  const [staff, setStaff]       = useState<StaffMember[]>(SEED_STAFF);
  const [search, setSearch]     = useState("");
  const [modalOpen, setModal]   = useState(false);
  const [editTarget, setEdit]   = useState<StaffMember | null>(null);

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEdit(null); setModal(true); };
  const openEdit = (s: StaffMember) => { setEdit(s); setModal(true); };

  const handleSave = (form: StaffForm) => {
    if (!form.name) return;
    if (editTarget) {
      setStaff((p) => p.map((s) => s.id === editTarget.id ? { ...s, ...form } : s));
      toast.success(`${form.name} updated`);
    } else {
      setStaff((p) => [...p, {
        id: Date.now(), ...form,
        status: "Active", lastSeen: "Today",
      }]);
      toast.success(`${form.name} added`);
    }
    setModal(false);
  };

  const handleDelete = (s: StaffMember) => {
    setStaff((p) => p.filter((x) => x.id !== s.id));
    toast.success(`${s.name} removed`);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
            View and manage staff
          </p>
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} /> Add Staff
          </button>
        </div>

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                className="input"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Name</th>
                  <th></th>
                  <th>Status</th>
                  <th></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      No staff found
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{s.name}</td>
                      <td style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{s.role}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.status === "Active" ? "rgba(34,197,94,0.12)" : "var(--color-bg-soft)",
                            color: s.status === "Active" ? "#16a34a" : "var(--color-text-muted)",
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                        {s.lastSeen}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => openEdit(s)}
                            aria-label={`Edit ${s.name}`}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                          >
                            <SquarePen size={15} strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            aria-label={`Delete ${s.name}`}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <StaffModal
          editStaff={editTarget}
          onClose={() => setModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}