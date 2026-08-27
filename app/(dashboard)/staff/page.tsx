"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  SquarePen,
  Trash2,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { useBranch } from "../layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useStaffStore } from "@/store/useStaffStore";
import { StaffMember, CreateStaffPayload, RoleDefaultsResponse, PermissionsResponse } from "@/types/staff";
import { Branch } from "@/types/auth.types";

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

const EMPTY_FORM: StaffForm = {
  name: "", email: "", phone: "", role: "",
  branches: [],
  // No hardcoded defaults anymore — picking a role in the modal now
  // auto-fills these from GET /admin/staff/role-defaults. Starts empty
  // so "no role selected yet" doesn't imply any permissions.
  invPermissions: [], permissions: [],
  sendWelcome: true,
};

function formatLastSeen(iso: string | null) {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return "Today";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return "Today";
  if (hrs < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString();
}

/* ══════════════════════════════════════════
   LABEL FORMATTERS
   Both endpoints return raw enum/permission keys with no display label
   attached, so these do the prettifying client-side.
══════════════════════════════════════════ */
function titleCase(s: string) {
  return s
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// "KITCHEN_STAFF" -> "Kitchen Staff", "CUSTOMER_CARE" -> "Customer Care"
function roleLabel(value: string) {
  return value ? titleCase(value) : value;
}

// "orders:update_status" -> "Orders - Update Status"
// "inventory:stock_count" -> "Inventory - Stock Count"
function permissionLabel(key: string) {
  const [domain, action] = key.split(":");
  if (!action) return titleCase(domain);
  return `${titleCase(domain)} - ${titleCase(action)}`;
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function RoleDropdown({
  value, onChange, roles, isLoading,
}: { value: string; onChange: (v: string) => void; roles: string[]; isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => roles.length > 0 && setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
          background: "var(--color-bg-input)", fontSize: "0.855rem",
          color: value ? "var(--color-text)" : "var(--color-text-muted)",
          cursor: roles.length > 0 ? "pointer" : "default", fontFamily: "var(--font-sans)", gap: 8,
        }}
      >
        <span>
          {value ? roleLabel(value) : isLoading ? "Loading roles…" : roles.length === 0 ? "No roles available" : "Select role"}
        </span>
        <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden",
          maxHeight: 260, overflowY: "auto",
        }}>
          {roles.map((r) => (
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
              {roleLabel(r)}
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
  branches,
  roleDefaults,
  permissionsData,
  onClose,
  onSave,
  isSaving,
}: {
  editStaff: StaffMember | null;
  branches: Branch[];
  roleDefaults: RoleDefaultsResponse | null;
  permissionsData: PermissionsResponse | null;
  onClose: () => void;
  onSave: (form: StaffForm) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<StaffForm>(
    editStaff
      ? {
          name: editStaff.name, email: editStaff.email, phone: editStaff.phone,
          role: editStaff.role,
          // editStaff.branches are NAMES (confirmed via GET), but the
          // update payload needs IDs (confirmed via the 22P02 uuid error
          // on save) — map name -> id using the real branch list. Any
          // name that doesn't match a known branch is dropped rather than
          // silently sent as garbage.
          branches: editStaff.branches
            .map((name) => branches.find((b) => b.name === name)?.id)
            .filter((id): id is string => Boolean(id)),
          invPermissions: editStaff.invPermissions, permissions: editStaff.permissions,
          sendWelcome: true,
        }
      : EMPTY_FORM
  );

  const roles = roleDefaults?.roles ?? [];
  const permissionOptions = permissionsData?.permissions ?? [];
  const invPermissionOptions = permissionsData?.invPermissions ?? [];

  // Picking a role auto-applies that role's default permission set from
  // GET /admin/staff/role-defaults. Guarded so re-clicking the currently
  // selected role doesn't wipe out permissions the user has since
  // hand-edited. ASSUMPTION worth confirming with product: this overwrites
  // existing checkbox state on every genuine role change, including when
  // editing an existing staff member — if the intent is "only suggest
  // defaults for brand-new staff", this needs a `!editStaff` guard added.
  const handleRoleChange = (v: string) => {
    setForm((f) => {
      if (v === f.role) return f;
      const roleDefault = roleDefaults?.defaults[v];
      return {
        ...f,
        role: v,
        permissions: roleDefault ? roleDefault.permissions : f.permissions,
        invPermissions: roleDefault ? roleDefault.invPermissions : f.invPermissions,
      };
    });
  };

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
          <RoleDropdown value={form.role} onChange={handleRoleChange} roles={roles} isLoading={!roleDefaults} />
        </div>

        {/* Branch Access */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Branch Access:</label>
          {branches.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              No branches loaded yet.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {branches.map((b) => (
                <Checkbox
                  key={b.id}
                  label={b.name}
                  checked={form.branches.includes(b.id)}
                  onChange={() => setForm((f) => ({ ...f, branches: toggleArr(f.branches, b.id) }))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inventory Permissions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Inventory Permissions:</label>
          <div
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: "var(--color-bg-soft)" }}
          >
            {invPermissionOptions.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {permissionsData ? "No inventory permissions available." : "Loading…"}
              </p>
            ) : (
              invPermissionOptions.map((p) => (
                <Checkbox
                  key={p}
                  label={permissionLabel(p)}
                  checked={form.invPermissions.includes(p)}
                  onChange={() => setForm((f) => ({ ...f, invPermissions: toggleArr(f.invPermissions, p) }))}
                />
              ))
            )}
          </div>
        </div>

        {/* Permissions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Permissions:</label>
          <div
            style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, background: "var(--color-bg-soft)" }}
          >
            {permissionOptions.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {permissionsData ? "No permissions available." : "Loading…"}
              </p>
            ) : (
              permissionOptions.map((p) => (
                <Checkbox
                  key={p}
                  label={permissionLabel(p)}
                  checked={form.permissions.includes(p)}
                  onChange={() => setForm((f) => ({ ...f, permissions: toggleArr(f.permissions, p) }))}
                />
              ))
            )}
          </div>
        </div>

        {/* Welcome email — only relevant when creating a new staff member */}
        {!editStaff && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Checkbox
              label="Send welcome email with login instructions"
              checked={form.sendWelcome}
              onChange={(v) => setForm((f) => ({ ...f, sendWelcome: v }))}
            />
          </div>
        )}

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
            disabled={isSaving}
            style={{ flex: 1, justifyContent: "center", padding: "11px", opacity: isSaving ? 0.6 : 1 }}
          >
            {isSaving ? "Saving…" : editStaff ? "Done" : "Add Staff"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   DELETE CONFIRMATION MODAL
══════════════════════════════════════════ */
function DeleteConfirmModal({
  staff,
  onClose,
  onConfirm,
  isDeleting,
}: {
  staff: StaffMember;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 400, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>
            Delete staff member?
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: "0.855rem", fontWeight: 400, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          This will remove <strong style={{ color: "var(--color-text)" }}>{staff.name}</strong> from active staff. This action cannot be undone from here.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "none", cursor: "pointer", fontSize: "0.855rem", fontWeight: 500,
              color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: "var(--color-primary)", cursor: isDeleting ? "default" : "pointer",
              fontSize: "0.855rem", fontWeight: 600, color: "#fff", fontFamily: "var(--font-sans)",
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? "Deleting…" : "Delete"}
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
  const branch = useBranch();
  const { branches: authBranches, fetchBranches } = useAuthStore();

  const [search, setSearch] = useState("");
  const [modalOpen, setModal] = useState(false);
  const [editTarget, setEdit] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const {
    staff, isLoading, isError, isSaving, isDeleting,
    fetchStaff, createStaff, updateStaff, deleteStaff,
    permissions, fetchPermissions,
    roleDefaults, fetchRoleDefaults,
  } = useStaffStore();

  useEffect(() => {
    fetchStaff({});
  }, [fetchStaff]);

  useEffect(() => {
    if (!authBranches) fetchBranches();
  }, [authBranches, fetchBranches]);
  const branches = authBranches ?? [];

  // Loaded once, same lazy pattern as branches — the modal falls back to
  // "Loading…" / empty states until these resolve.
  useEffect(() => {
    if (!permissions) fetchPermissions();
  }, [permissions, fetchPermissions]);

  useEffect(() => {
    if (!roleDefaults) fetchRoleDefaults();
  }, [roleDefaults, fetchRoleDefaults]);

  const list = staff ?? [];
  const filtered = list
    .filter((s) => s.branches.length === 0 || s.branches.includes(branch.name))
    .filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase())
    );

  const openAdd = () => { setEdit(null); setModal(true); };
  const openEdit = (s: StaffMember) => { setEdit(s); setModal(true); };

  const handleSave = async (form: StaffForm) => {
    if (!form.name) return;

    if (editTarget) {
      const success = await updateStaff(editTarget.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        branches: form.branches,
        invPermissions: form.invPermissions,
        permissions: form.permissions,
      });
      if (success) setModal(false);
    } else {
      const payload: CreateStaffPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        branches: form.branches,
        invPermissions: form.invPermissions,
        permissions: form.permissions,
        sendWelcomeEmail: form.sendWelcome,
      };
      const success = await createStaff(payload);
      if (success) setModal(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteStaff(deleteTarget.id);
    if (ok) setDeleteTarget(null);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
              {branch?.name ?? "—"}
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
              STAFF MANAGEMENT
            </h1>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
              View and manage staff
            </p>
          </div>
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
                placeholder="Search staff..."
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
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && isError && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Could not load staff
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      No staff found for this branch
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{s.name}</td>
                      <td style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>{roleLabel(s.role)}</td>
                      <td style={{ fontWeight: 400, color: "var(--color-text-secondary)", fontSize: "0.82rem" }}>
                        {s.branches.length > 0 ? s.branches.join(", ") : "All branches"}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: s.status === "ACTIVE" ? "rgba(34,197,94,0.12)" : "var(--color-bg-soft)",
                            color: s.status === "ACTIVE" ? "#16a34a" : "var(--color-text-muted)",
                          }}
                        >
                          {s.status === "ACTIVE" ? "Active" : "Offline"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 400, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                        {formatLastSeen(s.lastSeenAt)}
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
                            onClick={() => setDeleteTarget(s)}
                            disabled={isDeleting}
                            title="Delete staff member"
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
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <StaffModal
          editStaff={editTarget}
          branches={branches}
          roleDefaults={roleDefaults}
          permissionsData={permissions}
          onClose={() => setModal(false)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          staff={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}