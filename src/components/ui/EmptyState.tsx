"use client";

import React, { ReactNode, ComponentType } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode | LucideIcon | ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}

function renderIcon(icon: EmptyStateProps['icon']) {
  if (!icon) return null;
  // Pre-rendered element (e.g. icon={<Sparkles className="w-10 h-10" />})
  if (React.isValidElement(icon)) return icon;
  // Component reference (e.g. icon={DollarSign}) - includes forwardRef components
  if (typeof icon === 'function') {
    const Icon = icon as ComponentType<{ className?: string }>;
    return <Icon className="w-6 h-6 text-blue-600/60 dark:text-blue-400/50" />;
  }
  return null;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center py-16"
    >
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-blue-600/10 dark:bg-blue-400/[0.06] flex items-center justify-center mb-4">
          {renderIcon(icon)}
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
