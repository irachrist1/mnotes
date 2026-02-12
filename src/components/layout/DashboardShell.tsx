"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" richColors />
      <Sidebar />
      {/* Main content — no left padding on mobile, offset for sidebar on desktop */}
      <div className="lg:pl-56 min-h-screen transition-all duration-200">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
