"use client";

import dynamic from "next/dynamic";

export const MarkdownMessage = dynamic(
  () => import("./MarkdownMessage").then((m) => m.MarkdownMessage),
  {
    ssr: false,
    loading: () => <div className="h-4 w-24 skeleton rounded" />,
  }
);
