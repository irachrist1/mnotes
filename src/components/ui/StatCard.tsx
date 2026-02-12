import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium mb-0.5",
              trend.positive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      {detail && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {detail}
        </p>
      )}
    </div>
  );
}
