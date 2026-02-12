"use client";

import { motion } from "framer-motion";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8"
    >
      <div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </motion.div>
  );
}
