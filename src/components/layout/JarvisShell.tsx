"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  X,
  MessageSquare,
  Brain,
  Settings,
  Zap,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Toaster } from "sonner";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/memory", label: "Memory", icon: Brain },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function JarvisShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden">
      <Toaster position="top-center" richColors />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-56 bg-stone-50 dark:bg-stone-900
          border-r border-stone-200/80 dark:border-stone-800
          flex flex-col transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-stone-200/80 dark:border-stone-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Jarvis
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-600/5"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <AgentStatusPill />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 h-14 border-b border-stone-200/80 dark:border-stone-800 lg:hidden bg-white dark:bg-stone-950">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 -ml-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              Jarvis
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

function AgentStatusPill() {
  const [status, setStatus] = useState<{
    ok: boolean;
    mode?: string;
    model?: string;
  }>({ ok: false });

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch("/api/agent/status", {
          signal: AbortSignal.timeout(4000),
        });
        if (!mounted) return;
        if (res.ok) {
          const data = (await res.json()) as {
            mode?: string;
            model?: string;
          };
          setStatus({
            ok: data.mode !== "error" && data.mode !== "unconfigured",
            mode: data.mode,
            model: data.model,
          });
        } else {
          setStatus({ ok: false });
        }
      } catch {
        if (mounted) setStatus({ ok: false });
      }
    };
    void check();
    const interval = setInterval(() => void check(), 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="px-3 py-3 border-t border-stone-200/80 dark:border-stone-800">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs">
        {status.ok ? (
          <>
            <Wifi className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="text-stone-500 dark:text-stone-400 truncate">
              {status.mode === "subscription"
                ? "Subscription"
                : status.mode === "api-key"
                  ? "API key"
                  : "Connected"}
              {status.model ? ` \u00b7 ${status.model.split("-").slice(0, 2).join(" ")}` : ""}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-stone-400 dark:text-stone-600 flex-shrink-0" />
            <span className="text-stone-400 dark:text-stone-600">
              Agent offline
            </span>
          </>
        )}
      </div>
    </div>
  );
}
