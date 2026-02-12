"use client";

import { Check, X, Database } from "lucide-react";
import { motion } from "framer-motion";

type Intent = {
  table: string;
  operation: "create" | "update" | "query";
  data?: Record<string, unknown>;
};

const TABLE_LABELS: Record<string, string> = {
  incomeStreams: "Income Stream",
  ideas: "Idea",
  mentorshipSessions: "Mentorship Session",
};

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return "(none)";
    // For action items (objects), show count
    if (typeof value[0] === "object") return `${value.length} item(s)`;
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value ?? "");
}

export function ConfirmationCard({
  intent,
  status,
  onConfirm,
  onReject,
  loading,
}: {
  intent: Intent;
  status: "proposed" | "confirmed" | "rejected" | "committed";
  onConfirm: () => void;
  onReject: () => void;
  loading?: boolean;
}) {
  const tableLabel = TABLE_LABELS[intent.table] ?? intent.table;
  const isResolved = status === "committed" || status === "rejected";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`rounded-lg border text-sm ${
        status === "committed"
          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10"
          : status === "rejected"
            ? "border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 opacity-60"
            : "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
        <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="font-medium text-stone-700 dark:text-stone-300">
          {intent.operation === "create" ? "Create" : "Update"} {tableLabel}
        </span>
        {status === "committed" && (
          <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
        {status === "rejected" && (
          <span className="ml-auto text-xs text-stone-500 font-medium">
            Dismissed
          </span>
        )}
      </div>

      {/* Data preview */}
      {intent.data && (
        <div className="px-3 py-2 space-y-1">
          {Object.entries(intent.data)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .slice(0, 6)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <span className="text-stone-500 dark:text-stone-400 text-xs shrink-0">
                  {formatFieldName(key)}
                </span>
                <span className="text-stone-700 dark:text-stone-300 text-xs text-right truncate">
                  {formatValue(value)}
                </span>
              </div>
            ))}
          {Object.keys(intent.data).length > 6 && (
            <p className="text-xs text-stone-400">
              +{Object.keys(intent.data).length - 6} more fields
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="flex gap-2 px-3 py-2 border-t border-inherit">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Check className="w-3 h-3" />
            )}
            Confirm
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Dismiss
          </button>
        </div>
      )}
    </motion.div>
  );
}
