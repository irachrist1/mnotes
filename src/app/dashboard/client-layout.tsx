"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@convex/_generated/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ConvexGuard } from "@/components/ConvexGuard";
import { useConvexAvailable } from "@/components/ConvexClientProvider";
import { identifyUser, trackPageView } from "@/lib/analytics";

function DashboardConnectedLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const claimLegacyData = useMutation(api.users.claimLegacyData);
  const hasAttemptedClaim = useRef(false);
  const analyticsInitRef = useRef(false);
  const soulFile = useQuery(api.soulFile.get, {});
  const dashboardEmpty = useQuery(api.dashboard.isEmpty, {});
  const user = useQuery(api.users.me);

  useEffect(() => {
    if (hasAttemptedClaim.current) return;
    hasAttemptedClaim.current = true;
    void claimLegacyData().catch(() => {
      // Non-blocking background migration; UI should continue to load.
    });
  }, [claimLegacyData]);

  // Identify user for analytics once known
  useEffect(() => {
    if (!user || analyticsInitRef.current) return;
    analyticsInitRef.current = true;
    identifyUser(user._id);
  }, [user]);

  // Track page views
  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  // Redirect to onboarding if no soul file yet (but wait for query to load)
  useEffect(() => {
    if (soulFile === null) {
      router.replace("/onboarding");
    }
  }, [soulFile, router]);

  // Show minimal loading screen while checking soul file (no shell = no flicker)
  if (soulFile === undefined || soulFile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--color-background))' }}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse" />
      </div>
    );
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
