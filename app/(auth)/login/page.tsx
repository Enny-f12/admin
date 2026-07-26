// app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";

const SLIDES = [
  { src: "/home/login-1.jpg", label: "Signature dish", title: "Hot & Crispy\nFried Chicken" },
  { src: "/home/login-2.png", label: "Fan favourite", title: "Smash Burger\nPerfected" },
  { src: "/home/login-3.png", label: "House special", title: "Golden Drums\n& Thighs" },
  { src: "/home/login-4.png", label: "Chef's pick", title: "Stir-Fry\nWok Nights" },
];

// TODO: replace with GET /branches once backend implements it (see backend request doc)
const BRANCHES = [
  { id: "lekki-1", name: "Lekki Phase 1 — Lagos" },
  { id: "lekki-2", name: "Lekki Phase 2 — Lagos" },
  { id: "maitama", name: "Maitama — Abuja" },
];

type LoginFormValues = {
  email: string;
  password: string;
  branch: string; // optional — not yet sent to backend, see note below
};

export default function LoginPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "", branch: "" },
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormValues) => {
    // NOTE: `branch` is intentionally NOT sent — the backend's LoginDto
    // only accepts { email, password } right now, and the ValidationPipe
    // has forbidNonWhitelisted: true, so sending an extra field would 400.
    // Once the backend request below is implemented, add branchId here.
    const success = await login({ email: data.email, password: data.password });
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-8 sm:p-6"
      style={{ fontFamily: "var(--font-sans)", background: "var(--color-bg)" }}
    >
      <div
        className="flex w-full max-w-6xl rounded-2xl overflow-hidden sm:shadow-ambient sm:border"
        style={{ minHeight: "min(600px, 90vh)", borderColor: "var(--color-border, #e5e7eb)" }}
      >
        {/* ── Left: image carousel ── */}
        <div className="relative hidden lg:flex lg:w-1/2">
          <div className="absolute inset-0 overflow-hidden z-0">
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: i === current ? 1 : 0 }}
              >
                <Image src={slide.src} alt={slide.label} fill className="object-cover" priority={i === 0} />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.30) 100%)",
                  }}
                />
              </div>
            ))}
            <div className="absolute left-6 top-6 z-20">
              <Image
                src="/logo/Logo.png"
                alt="Foodies Hot & Spicy logo"
                width={80}
                height={22}
                style={{ height: "auto" }}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* ── Right: login form ── */}
        <div
          className="flex w-full flex-col items-center justify-center px-8 py-10 lg:w-1/2 overflow-y-auto max-h-[90vh]"
          style={{ background: "#fff" }}
        >
          <div className="w-full max-w-sm flex flex-col gap-8">
            <div className="card flex flex-col gap-6">
              <div className="flex flex-col gap-1 text-center">
                <h1 className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>
                  Admin Dashboard
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Sign in to manage your restaurant
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@foodies.com"
                    autoComplete="email"
                    className="input"
                    style={errors.email ? { borderColor: "var(--color-error)" } : undefined}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-xs" style={{ color: "var(--color-error)" }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="input"
                      style={{
                        paddingRight: "2.5rem",
                        ...(errors.password ? { borderColor: "var(--color-error)" } : {}),
                      }}
                      {...register("password", {
                        required: "Password is required",
                        minLength: { value: 6, message: "Password must be at least 6 characters" },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs" style={{ color: "var(--color-error)" }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Branch — optional for now, not sent to backend yet */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="branch" className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Branch <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="branch"
                      className="input appearance-none"
                      style={{ paddingRight: "2.5rem", color: "var(--color-text)" }}
                      {...register("branch")}
                    >
                      <option value="">Select branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "var(--color-text-muted)",
                      }}
                    />
                  </div>
                </div>

                {/* API error */}
                {error && (
                  <p className="text-xs text-center" style={{ color: "var(--color-error)" }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full justify-center py-3 text-sm mt-1"
                  style={{ opacity: isLoading ? 0.65 : 1 }}
                >
                  {isLoading ? "Signing in…" : "Sign In to Dashboard"}
                </button>
              </form>
            </div>

            <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
              © {new Date().getFullYear()} Foodies Hot &amp; Spicy · Admin Console
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}