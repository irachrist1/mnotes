"use client";

import { useConvexAvailable } from "@/components/ConvexClientProvider";

export function ConvexGuard({ children }: { children: React.ReactNode }) {
  const available = useConvexAvailable();

  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span className="text-2xl">⚡</span>
        </div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Convex not connected
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Set <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">NEXT_PUBLIC_CONVEX_URL</code> in
          your environment to connect to your Convex backend.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
