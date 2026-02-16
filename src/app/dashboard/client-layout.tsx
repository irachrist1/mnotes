"use client";

import JarvisShell from "@/components/layout/JarvisShell";
import { useConvexAvailable } from "@/components/ConvexClientProvider";

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const convexAvailable = useConvexAvailable();

  if (!convexAvailable) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-950 text-stone-400">
        <div className="text-center">
          <p className="text-lg font-medium mb-1 text-stone-200">Connecting…</p>
          <p className="text-sm">Waiting for Convex connection.</p>
        </div>
      </div>
    );
  }

  return <JarvisShell>{children}</JarvisShell>;
}
