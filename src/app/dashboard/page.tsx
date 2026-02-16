"use client";

import dynamic from "next/dynamic";

// Chat is the entire dashboard — lazy loaded so it doesn't block initial render
const JarvisChat = dynamic(() => import("@/components/chat/JarvisChat"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-stone-500 text-sm">
      Loading…
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <div className="h-full">
      <JarvisChat />
    </div>
  );
}
