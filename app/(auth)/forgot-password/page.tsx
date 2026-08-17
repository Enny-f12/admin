"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const inputStyle: React.CSSProperties = {
  height: 46,
  padding: "0 14px",
  background: "#FAFAFA",
  border: "1px solid #EBEBEB",
  borderRadius: 10,
  fontSize: 14,
  color: "#374151",
  width: "100%",
  textAlign: "left",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
  display: "block",
  textAlign: "left",
};

const primaryBtn: React.CSSProperties = {
  height: 46,
  width: "100%",
  background: "#E05C2A",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

type Step = "request" | "confirm" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoading, forgotPassword, resetPassword } = useAuthStore();

  // step/identifier are page-specific UI state, not global auth state —
  // kept local rather than in useAuthStore.
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    const ok = await forgotPassword({ identifier: identifier.trim() });
    if (ok) setStep("confirm");
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }
    setPasswordMismatch(false);
    const ok = await resetPassword({ identifier: identifier.trim(), code: code.trim(), newPassword });
    if (ok) setStep("done");
  };

  const startOver = () => {
    setStep("request");
    setIdentifier("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMismatch(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9FAFB",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #EBEBEB",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          padding: 32,
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Image
          src="/logo/Logo.png"
          alt="Foodies Hot & Spicy logo"
          width={90}
          height={25}
          style={{ height: "auto", margin: "0 auto 24px", objectFit: "contain" }}
          priority
        />

        {step === "request" && (
          <>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, background: "#FFF0EB",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}
            >
              <KeyRound size={20} color="#E05C2A" strokeWidth={1.8} />
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Forgot password?
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9CA3AF" }}>
              Enter your email or phone and we&apos;ll send you a reset code.
            </p>

            <form onSubmit={handleRequest}>
              <label style={labelStyle}>Email or phone</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                style={{ ...inputStyle, marginBottom: 20 }}
                autoFocus
              />
              <button type="submit" disabled={isLoading || !identifier.trim()} style={{ ...primaryBtn, opacity: isLoading || !identifier.trim() ? 0.6 : 1 }}>
                {isLoading ? "Sending…" : "Send reset code"}
              </button>
            </form>

            <button
              onClick={() => router.push("/login")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                fontSize: 13,
                fontWeight: 500,
                padding: 0,
                margin: "20px auto 0",
              }}
            >
              <ArrowLeft size={14} /> Back to login
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, background: "#EFF6FF",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}
            >
              <Mail size={20} color="#2563EB" strokeWidth={1.8} />
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Check your inbox
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9CA3AF" }}>
              Enter the 6-digit code and choose a new password.
            </p>

            <form onSubmit={handleConfirm}>
              <label style={labelStyle}>Reset code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="482913"
                inputMode="numeric"
                style={{ ...inputStyle, marginBottom: 16, textAlign: "center", letterSpacing: "0.2em", fontWeight: 600 }}
                autoFocus
              />

              <label style={labelStyle}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{ ...inputStyle, marginBottom: 16 }}
              />

              <label style={labelStyle}>Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordMismatch(false); }}
                placeholder="Re-enter password"
                style={{ ...inputStyle, marginBottom: passwordMismatch ? 8 : 20 }}
              />
              {passwordMismatch && (
                <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#DC2626" }}>Passwords don&apos;t match.</p>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6 || newPassword.length < 8}
                style={{ ...primaryBtn, opacity: isLoading || code.length !== 6 || newPassword.length < 8 ? 0.6 : 1 }}
              >
                {isLoading ? "Resetting…" : "Reset password"}
              </button>
            </form>

            <button
              onClick={startOver}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                fontSize: 13,
                fontWeight: 500,
                padding: 0,
                margin: "20px auto 0",
              }}
            >
              <ArrowLeft size={14} /> Use a different email/phone
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ padding: "12px 0" }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: "50%", background: "#F0FDF4",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}
            >
              <CheckCircle2 size={26} color="#16A34A" strokeWidth={1.8} />
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Password reset
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9CA3AF" }}>
              Your password has been changed. Log in with your new password.
            </p>
            <button onClick={() => router.push("/login")} style={primaryBtn}>
              Back to login
            </button>
          </div>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
        © {new Date().getFullYear()} Foodies Hot &amp; Spicy · Admin Console
      </p>
    </div>
  );
}