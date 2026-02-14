"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Bell, Check, CheckCheck, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

const TYPE_STYLES: Record<string, { color: string; border: string }> = {
  "goal-check-in": { color: "text-blue-500", border: "border-l-blue-500" },
  "stale-idea": { color: "text-amber-500", border: "border-l-amber-500" },
  "overdue-action": { color: "text-red-500", border: "border-l-red-500" },
  "pattern-detected": { color: "text-violet-500", border: "border-l-violet-500" },
  milestone: { color: "text-emerald-500", border: "border-l-emerald-500" },
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell({ contentVisible }: { contentVisible?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.notifications.unreadCount, {});
  const notifications = useQuery(api.notifications.list, open ? {} : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const dismiss = useMutation(api.notifications.dismiss);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const count = unreadCount ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center h-10 rounded-xl transition-colors duration-150 overflow-hidden text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.06]"
        title="Notifications"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </div>
        {contentVisible && (
          <span className="text-[13px] font-medium whitespace-nowrap transition-[opacity,transform,max-width] duration-150 ease-out opacity-100 max-w-[120px] translate-x-0 delay-75">
            Notifications
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[min(400px,calc(100vh-6rem))] rounded-xl border border-stone-200 dark:border-white/[0.08] bg-white dark:bg-stone-900 shadow-lg z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-200 dark:border-white/[0.06] shrink-0">
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                Notifications
              </span>
              {count > 0 && (
                <button
                  onClick={() => void markAllRead({})}
                  className="flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {(!notifications || notifications.length === 0) && (
                <p className="text-xs text-stone-400 text-center py-8">
                  No notifications yet
                </p>
              )}
              {notifications?.map((n) => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES["pattern-detected"];
                return (
                  <div
                    key={n._id}
                    className={`px-3 py-2.5 border-l-3 ${style.border} ${
                      !n.read ? "bg-blue-50/50 dark:bg-blue-500/[0.04]" : ""
                    } hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${!n.read ? "text-stone-900 dark:text-stone-100" : "text-stone-600 dark:text-stone-400"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-stone-400">
                            {relativeTime(n.createdAt)}
                          </span>
                          {n.actionUrl && (
                            <Link
                              href={n.actionUrl}
                              onClick={() => {
                                void markRead({ id: n._id as Id<"notifications"> });
                                setOpen(false);
                              }}
                              className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View <ArrowRight className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => void markRead({ id: n._id as Id<"notifications"> })}
                            className="p-1 rounded text-stone-400 hover:text-blue-500 transition-colors"
                            title="Mark read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => void dismiss({ id: n._id as Id<"notifications"> })}
                          className="p-1 rounded text-stone-400 hover:text-red-500 transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
