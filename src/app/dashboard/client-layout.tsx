"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConvexGuard } from "@/components/ConvexGuard";
import { useConvexAvailable } from "@/components/ConvexClientProvider";

function DashboardConnectedLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const router = useRouter();
  const claimLegacyData = useMutation(api.users.claimLegacyData);
  const hasAttemptedClaim = useRef(false);
  const soulFile = useQuery(api.soulFile.get, {});
  const dashboardEmpty = useQuery(api.dashboard.isEmpty, {});

  useEffect(() => {
    if (hasAttemptedClaim.current) return;
    hasAttemptedClaim.current = true;
    void claimLegacyData().catch(() => {
      // Non-blocking background migration; UI should continue to load.
    });
  }, [claimLegacyData]);

  // Redirect to onboarding if no soul file yet (but wait for query to load)
  useEffect(() => {
    if (soulFile === null) {
      router.replace("/onboarding");
    }
  }, [soulFile, router]);

  // Show nothing while checking soul file (avoids flash)
  if (soulFile === undefined) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600" />
        </div>
      </DashboardShell>
    );
  }

  if (soulFile === null) {
    // Redirecting to onboarding
    return null;
  }

  // Auto-open chat for freshly onboarded users with no data
  const initialChatOpen = soulFile !== null && soulFile !== undefined && dashboardEmpty === true;

  return (
    <DashboardShell initialChatOpen={initialChatOpen}>
      <ConvexGuard>{children}</ConvexGuard>
    </DashboardShell>
  );
}

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const convexAvailable = useConvexAvailable();

  if (!convexAvailable) {
    return (
      <DashboardShell>
        <ConvexGuard>{children}</ConvexGuard>
      </DashboardShell>
    );
  }

  return <DashboardConnectedLayout>{children}</DashboardConnectedLayout>;
}
