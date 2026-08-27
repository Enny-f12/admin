"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Eye, EyeOff, Loader2, X, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const ACCENT = "#E05C2A";

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

/**
 * Standalone change-password modal — extracted from the old profile page
 * so it can be triggered from anywhere (currently: a padlock icon in the
 * navbar on desktop, and the avatar dropdown on mobile). No longer tied
 * to a page that needs staff:view to load.
 */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
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
        zIndex: 200,
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