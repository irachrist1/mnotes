"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { useConvexAvailable } from "@/components/ConvexClientProvider";
import { Zap } from "lucide-react";

type Flow = "signIn" | "signUp";

function DisconnectedAuthPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">Jarvis</span>
          </div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center">
          <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">Convex not connected</h1>
          <p className="text-sm text-stone-500 mt-2">
            Missing{" "}
            <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs text-blue-600 dark:text-blue-400">
              NEXT_PUBLIC_CONVEX_URL
            </code>
            . Sign-in is disabled.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConnectedSignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 150);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const normalizedEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    formData.set("email", normalizedEmail);
    try {
      await signIn("password", formData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (message.includes("Invalid password")) {
        setError("Password must be at least 8 characters.");
      } else if (
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("no account")
      ) {
        setError("No account found for this email. Try signing up.");
      } else if (message.includes("InvalidSecret") || message.includes("Invalid")) {
        setError("Incorrect password. Please try again.");
        setShowRecoveryHint(true);
      } else if (flow === "signUp") {
        setError(
          process.env.NODE_ENV === "development"
            ? `Could not create account: ${message}`
            : "Could not create account. Please try again."
        );
      } else {
        setError(
          process.env.NODE_ENV === "development"
            ? `Sign in failed: ${message}`
            : "Invalid email or password. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow — static, no animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full bg-blue-600/[0.04] blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full bg-blue-700/[0.03] blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Jarvis</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8">
          {/* Flow tabs */}
          <div className="flex rounded-lg p-1 bg-stone-100 dark:bg-stone-800 mb-6">
            {(["signIn", "signUp"] as Flow[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFlow(f);
                  setError(null);
                  setSuccess(false);
                }}
                className={`
                  flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-150
                  ${flow === f
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                  }
                `}
              >
                {f === "signIn" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-5">
            <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
              {flow === "signIn" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {flow === "signIn"
                ? "Sign in to continue to Jarvis."
                : "Create your account to get started."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400">
                {flow === "signUp"
                  ? "Account created! Redirecting…"
                  : "Signed in! Redirecting…"}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                disabled={submitting || success}
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 outline-none focus:border-blue-500/60 transition-colors duration-150 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                  placeholder={
                    flow === "signIn" ? "Enter your password" : "Create a password (8+ chars)"
                  }
                  minLength={8}
                  disabled={submitting || success}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2.5 pr-16 text-base sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 outline-none focus:border-blue-500/60 transition-colors duration-150 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting || success}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 transition-colors duration-150"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {flow === "signIn" && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryHint((v) => !v)}
                    className="text-xs text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400 transition-colors duration-150"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {flow === "signIn" && showRecoveryHint && (
                <div className="mt-2 text-xs text-stone-500 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-3">
                  Password reset is not automated yet. Contact support with your sign-in email and
                  we&apos;ll help recover your account.
                </div>
              )}
            </div>

            <input name="flow" type="hidden" value={flow} />

            <button
              type="submit"
              disabled={submitting || success}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors duration-150"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {flow === "signIn" ? "Signing in…" : "Creating account…"}
                </span>
              ) : success ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Redirecting…
                </span>
              ) : flow === "signIn" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Switch flow */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setError(null);
                setSuccess(false);
              }}
              disabled={submitting || success}
              className="text-sm text-stone-500 dark:text-stone-600 disabled:opacity-50 transition-colors duration-150"
            >
              {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
              <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-150">
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-400 dark:text-stone-700 mt-5">
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const convexAvailable = useConvexAvailable();
  if (!convexAvailable) return <DisconnectedAuthPage />;
  return <ConnectedSignInPage />;
}
