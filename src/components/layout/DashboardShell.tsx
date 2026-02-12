"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-right" richColors />
      <Sidebar />
      {/* Main content area — shifts right for sidebar */}
      <div className="pl-56 min-h-screen transition-all duration-200" id="main-content">
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
