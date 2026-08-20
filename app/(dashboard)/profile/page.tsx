"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  X,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useStaffStore } from "@/store/useStaffStore";
import { SkeletonText } from "@/components/ui/Skeleton";

const ACCENT = "#E05C2A";

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #EFEFEF",
  borderRadius: 18,
  boxShadow: "0 1px 8px rgba(17,24,39,0.04)",
  padding: 28,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14.5,
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "#6B7280",
  marginBottom: 6,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const readOnlyRowStyle: React.CSSProperties = {
  height: 46,
  padding: "0 14px",
  background: "#FAFAFA",
  border: "1px solid #F0F0F0",
  borderRadius: 10,
  fontSize: 13.5,
  color: "#374151",
  display: "flex",
  alignItems: "center",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// "SUPER_ADMIN" -> "Super Admin"
function formatRole(role?: string | null) {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: 46,
          background: "#FAFAFA",
          border: `1.5px solid ${error ? "#FCA5A5" : focused ? ACCENT : "#EBEBEB"}`,
          borderRadius: 10,
          transition: "border-color 0.15s",
        }}
      >
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            flex: 1,
            height: "100%",
            padding: "0 12px",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 13.5,
            color: "#374151",
            borderRadius: 10,
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword, logout } = useAuthStore();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMismatch, setPwMismatch] = useState(false);
  // Local, not useAuthStore's isLoading — that flag is shared with
  // fetchMe/fetchBranches/login/etc, so tying this button to it would
  // show a spurious spinner whenever any unrelated auth call is in flight.
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMismatch(true);
      return;
    }
    setPwMismatch(false);
    setIsChangingPassword(true);

    // /auth/change-password — authenticated, separate from the code-based
    // /auth/reset-password used by the public forgot-password flow.
    // useAuthStore.changePassword already handles the success/error toast.
    const ok = await changePassword({ currentPassword, newPassword });

    if (ok) {
      // Matches the modal's own warning copy below — sign out everywhere,
      // including this device, immediately after a successful change.
      await logout();
      onClose();
      router.push("/login");
      return;
    }

    setIsChangingPassword(false);
  };

  const canSubmitPassword =
    !isChangingPassword && currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={sectionHeaderStyle}>
            <KeyRound size={16} /> Change password
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              padding: 2,
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Prominent heads-up — this is the one thing that actually
            surprises a user about this flow, so it gets its own callout
            rather than being buried in a caption line. */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 10,
            padding: "10px 12px",
            margin: "14px 0 18px",
          }}
        >
          <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, color: "#92400E", lineHeight: 1.5 }}>
            You&apos;ll be signed out everywhere — including this device — once your password is changed. You&apos;ll need to log back in with the new password.
          </p>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoFocus />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              setPwMismatch(false);
            }}
            error={pwMismatch ? "Passwords don't match." : undefined}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 0",
                background: "#F3F4F6",
                color: "#374151",
                border: "none",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmitPassword}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 0",
                background: ACCENT,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: canSubmitPassword ? "pointer" : "default",
                opacity: canSubmitPassword ? 1 : 0.5,
              }}
            >
              {isChangingPassword && <Loader2 size={14} className="animate-spin" />}
              {isChangingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { staff, isLoading, isError, fetchStaff } = useStaffStore();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Reuse the staff store's cache — /staff likely already populated it.
  // Only fetch if nothing's loaded yet.
  useEffect(() => {
    if (!staff) fetchStaff();
  }, [staff, fetchStaff]);

  const me = useMemo(
    () => staff?.find((s) => s.id === user?.id) ?? null,
    [staff, user?.id]
  );

  const loading = isLoading && !staff;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          Profile &amp; settings
        </h1>
        <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
          View your account details and update your password
        </p>
      </div>

      {/* Hero card */}
      <div
        style={{
          ...cardStyle,
          background: "linear-gradient(135deg, #FFF7F3 0%, #FFFFFF 55%)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        {/* Settings gear — opens the change-password modal */}
        <button
          onClick={() => setPasswordModalOpen(true)}
          title="Change password"
          aria-label="Change password"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid #F0F0F0",
            boxShadow: "0 1px 4px rgba(17,24,39,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#6B7280",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#FFD9C7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#F0F0F0";
          }}
        >
          <Settings size={16} strokeWidth={1.8} />
        </button>

        {loading ? (
          <>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#F3F4F6", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonText width="40%" height={16} />
              <SkeletonText width="60%" height={12} />
            </div>
          </>
        ) : me ? (
          <>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: ACCENT,
                  border: `2.5px solid ${ACCENT}`,
                }}
              >
                {initials(me.name)}
              </div>
              <span
                title={me.status === "ACTIVE" ? "Active" : "Offline"}
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: me.status === "ACTIVE" ? "#22C55E" : "#D1D5DB",
                  border: "2.5px solid #fff",
                }}
              />
            </div>
            <div style={{ minWidth: 0, paddingRight: 44 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{me.name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "8px 0 0" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: ACCENT,
                    background: "#FFF0EB",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  <ShieldCheck size={12} /> {formatRole(me.role)}
                </span>
                {me.branches.length > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#6B7280",
                      background: "#F3F4F6",
                      padding: "3px 10px",
                      borderRadius: 999,
                    }}
                  >
                    <Building2 size={12} /> {me.branches.join(", ")}
                  </span>
                )}
              </div>
              {me.lastSeenAt && (
                <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#D1D5DB" }}>
                  Last seen {fmtDate(me.lastSeenAt)}
                </p>
              )}
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {isError ? "Could not load profile" : "Profile not found"}
          </p>
        )}
      </div>

      {/* Details — read only. Personal details are managed by an admin
          via the Staff page, not self-service here. */}
      <div style={cardStyle}>
        <h3 style={sectionHeaderStyle}>Personal details</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 18,
          }}
        >
          <div>
            <label style={labelStyle}><Mail size={13} /> Email</label>
            <div style={readOnlyRowStyle}>{me?.email ?? "–"}</div>
          </div>
          <div>
            <label style={labelStyle}><Phone size={13} /> Phone</label>
            <div style={readOnlyRowStyle}>{me?.phone ?? "–"}</div>
          </div>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 11.5, color: "#D1D5DB" }}>
          Contact an admin to update these details.
        </p>
      </div>

      {passwordModalOpen && <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />}
    </div>
  );
}