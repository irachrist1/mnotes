"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
    });

    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = v.toLocaleString();
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}

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
  // Check if value is a pure number for animation
  const numericValue = typeof value === "number" ? value : null;
  const displayValue = typeof value === "string" ? value : null;

  // Try to extract number from string like "$1,200"
  const parsedFromString =
    typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : null;
  const prefix =
    typeof value === "string" ? value.match(/^[^0-9.-]*/)?.[0] || "" : "";
  const suffix =
    typeof value === "string" ? value.match(/[^0-9.,]*$/)?.[0] || "" : "";
  const canAnimate =
    numericValue !== null ||
    (parsedFromString !== null && !isNaN(parsedFromString));
  const animateValue = numericValue ?? parsedFromString ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "card card-hover p-5 cursor-default",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400/10 to-sky-500/10 dark:from-sky-400/[0.08] dark:to-sky-500/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-sky-500 dark:text-sky-400" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">
          {canAnimate ? (
            <>
              {prefix}
              <AnimatedNumber value={animateValue} />
              {suffix}
            </>
          ) : (
            value
          )}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium mb-0.5 tabular-nums",
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          {detail}
        </p>
      )}
    </motion.div>
  );
}
