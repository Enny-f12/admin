"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import Image from "next/image";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80",
    label: "Signature dish",
    title: "Hot & Crispy\nFried Chicken",
  },
  {
    src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    label: "Fan favourite",
    title: "Smash Burger\nPerfected",
  },
  {
    src: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=800&q=80",
    label: "House special",
    title: "Golden Drums\n& Thighs",
  },
  {
    src: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
    label: "Chef's pick",
    title: "Stir-Fry\nWok Nights",
  },
];

const BRANCHES = [
  "Ikeja — Lagos",
  "Victoria Island — Lagos",
  "Lekki Phase 1 — Lagos",
  "Abuja Central",
  "Port Harcourt",
];

type LoginFormValues = {
  email: string;
  password: string;
  branch: string;
};

export default function LoginPage() {
  const [current, setCurrent] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "", branch: "" },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Login data:", data);
      // TODO: wire up auth
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">

      {/* ── Left: image carousel ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.label}
              fill
              className="object-cover"
              priority={i === 0}
            />
            {/* dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          </div>
        ))}

        {/* Brand badge */}
        <div className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm font-bold tracking-widest text-white">
            FOODIES
          </span>
        </div>

        {/* Slide caption */}
        <div className="absolute bottom-16 left-6 z-10">
          <p className="mb-1 text-xs tracking-wider text-white/70">
            {SLIDES[current].label}
          </p>
          <p className="whitespace-pre-line text-2xl font-bold leading-tight text-white">
            {SLIDES[current].title}
          </p>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">

        {/* Logo */}
        <div className="mb-8 text-center">
          <p className="font-serif text-3xl font-black tracking-widest text-[#E03A2F]">
            FOODIES
          </p>
          <span className="mt-1 inline-block rounded-full border border-[#E87C2A] px-3 py-0.5 text-xs italic text-[#E87C2A]">
            Hot &amp; Spicy
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-width-[420px] rounded-xl border border-gray-200 p-8 sm:max-w-md">
          <h1 className="mb-1 text-center text-xl font-bold text-[#E03A2F]">
            Admin Dashboard
          </h1>
          <p className="mb-7 text-center text-sm text-gray-400">
            Sign in to manage your restaurant
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@foodies.com"
                autoComplete="email"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-[#E03A2F] focus:ring-1 focus:ring-[#E03A2F]/20 ${
                  errors.email ? "border-red-400" : "border-gray-200"
                }`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-[#E03A2F] focus:ring-1 focus:ring-[#E03A2F]/20 ${
                    errors.password ? "border-red-400" : "border-gray-200"
                  }`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Branch */}
            <div>
              <label
                htmlFor="branch"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Branch
              </label>
              <div className="relative">
                <select
                  id="branch"
                  className={`w-full appearance-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#E03A2F] focus:ring-1 focus:ring-[#E03A2F]/20 ${
                    errors.branch ? "border-red-400" : "border-gray-200"
                  }`}
                  {...register("branch", { required: "Please select a branch" })}
                >
                  <option value="" disabled>
                    Select branch
                  </option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
              {errors.branch && (
                <p className="mt-1 text-xs text-red-500">{errors.branch.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg bg-[#E03A2F] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C0302A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in…" : "Sign In to Dashboard"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}