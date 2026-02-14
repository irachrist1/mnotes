"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { useConvexAvailable } from "@/components/ConvexClientProvider";
import { Skeleton } from "@/components/ui/Skeleton";

type Flow = "signIn" | "signUp";

function DisconnectedAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/[0.05] blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <span className="text-white text-base font-bold">M</span>
            </div>
            <span className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              MNotes
            </span>
          </div>
        </div>

        <div className="card p-8 shadow-xl dark:shadow-none text-center">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Convex not connected
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
            This deployment is missing <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs">NEXT_PUBLIC_CONVEX_URL</code>,
            so sign-in is disabled.
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
    const normalizedEmail = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    formData.set("email", normalizedEmail);
    try {
      await signIn("password", formData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Auth error:", err);

      if (message.includes("already exists")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (message.includes("Invalid password")) {
        setError("Password must be at least 8 characters.");
      } else if (message.includes("InvalidSecret") || message.includes("Invalid")) {
        setError("Incorrect password. Please try again.");
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
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-mesh relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-600/[0.05] blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <span className="text-white text-base font-bold">M</span>
            </div>
            <span className="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">
              MNotes
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl dark:shadow-none">
          {/* Flow tabs */}
          <div className="flex rounded-lg p-1 bg-stone-100 dark:bg-white/[0.04] mb-6">
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
                  relative flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-150
                  ${flow === f
                    ? "text-stone-900 dark:text-white"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                  }
                `}
              >
                {flow === f && (
                  <div className="absolute inset-0 bg-white dark:bg-white/10 rounded-md shadow-sm transition-all duration-200" />
                )}
                <span className="relative z-10">
                  {f === "signIn" ? "Sign in" : "Sign up"}
                </span>
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
              {flow === "signIn" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {flow === "signIn"
                ? "Sign in to continue to your dashboard."
                : "Get started tracking your business."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 overflow-hidden animate-fade-in">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 overflow-hidden animate-fade-in">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-sm text-emerald-700 dark:text-emerald-400">
                {flow === "signUp"
                  ? "Account created! Redirecting..."
                  : "Signed in! Redirecting..."}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wide">
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
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                placeholder={flow === "signIn" ? "Enter your password" : "Create a password (8+ characters)"}
                minLength={8}
                disabled={submitting || success}
                className="input-field"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            <button
              type="submit"
              disabled={submitting || success}
              className="btn-primary w-full relative"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {flow === "signIn" ? "Signing in..." : "Creating account..."}
                </span>
              ) : success ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Redirecting...
                </span>
              ) : (
                flow === "signIn" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          {/* Switch flow link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setError(null);
                setSuccess(false);
              }}
              disabled={submitting || success}
              className="text-sm text-stone-500 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {flow === "signIn"
                ? "Don't have an account? "
                : "Already have an account? "}
              <span className="font-medium text-blue-600 dark:text-blue-500">
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-stone-400 dark:text-stone-600 mt-6">
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
