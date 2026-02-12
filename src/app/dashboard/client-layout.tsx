"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <ConvexGuard>{children}</ConvexGuard>
    </DashboardShell>
  );
}
