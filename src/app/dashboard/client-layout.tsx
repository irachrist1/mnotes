"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claimLegacyData = useMutation(api.users.claimLegacyData);
  const hasAttemptedClaim = useRef(false);

  useEffect(() => {
    if (hasAttemptedClaim.current) return;
    hasAttemptedClaim.current = true;
    void claimLegacyData().catch(() => {
      // Non-blocking background migration; UI should continue to load.
    });
  }, [claimLegacyData]);

  return (
    <DashboardShell>
      <ConvexGuard>{children}</ConvexGuard>
    </DashboardShell>
  );
}
