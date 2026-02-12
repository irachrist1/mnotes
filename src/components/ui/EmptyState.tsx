"use client";

import { ReactNode, ComponentType } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode | LucideIcon | ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: IconOrNode, title, description, action }: EmptyStateProps) {
  // Determine if icon is a component (function) or a ReactNode
  const isComponent = typeof IconOrNode === 'function';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center text-center py-16"
    >
      {IconOrNode && (
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-400/10 to-sky-500/10 dark:from-sky-400/[0.06] dark:to-sky-500/[0.06] flex items-center justify-center mb-4">
          {isComponent ? (
            <IconOrNode className="w-6 h-6 text-sky-500/60 dark:text-sky-400/50" />
          ) : (
            <span className="text-sky-500/60 dark:text-sky-400/50">{IconOrNode}</span>
          )}
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
