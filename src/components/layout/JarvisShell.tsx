"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, X, MessageSquare, Brain, Settings, Zap } from "lucide-react";

// Lazy-load the chat panel (heavy — streaming logic)
const JarvisChat = dynamic(() => import("@/components/chat/JarvisChat"), {
  ssr: false,
  loading: () => null,
});

const NAV_ITEMS = [
  { href: "/dashboard", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/memory", label: "Memory", icon: Brain },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function JarvisShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-56 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800
          flex flex-col transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-stone-200 dark:border-stone-800">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Jarvis</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${active
                    ? "bg-blue-600/10 text-blue-600 dark:text-blue-400"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Agent status pill */}
        <AgentStatusPill />
      </aside>

      {/* ── Main Content ───────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar (mobile only) */}
        <header className="flex items-center px-4 h-14 border-b border-stone-200 dark:border-stone-800 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-stone-400 dark:text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-stone-900 dark:text-stone-100">Jarvis</span>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

function AgentStatusPill() {
  return (
    <div className="px-3 py-3 border-t border-stone-200 dark:border-stone-800">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-stone-400 dark:text-stone-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Agent ready
      </div>
    </div>
  );
}
