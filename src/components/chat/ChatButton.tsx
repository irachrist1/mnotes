"use client";

import { MessageSquare, X } from "lucide-react";

export function ChatButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "fixed bottom-4 right-4 sm:right-6 z-50 w-12 h-12 rounded-full",
        "bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900",
        "shadow-lg hover:shadow-xl flex items-center justify-center",
        "transition-all duration-200 active:scale-95 hover:scale-105",
        // Hide on mobile when chat is open (full-screen takes over)
        open ? "max-sm:hidden" : "",
      ].join(" ")}
      aria-label={open ? "Close chat" : "Open chat"}
    >
      {open ? (
        <X className="w-5 h-5" />
      ) : (
        <MessageSquare className="w-5 h-5" />
      )}
    </button>
  );
}
