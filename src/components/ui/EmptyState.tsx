import React, { ComponentType, ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }> | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

function renderIcon(icon: EmptyStateProps['icon']) {
  if (!icon) return null;
  // Pre-rendered element (e.g. icon={<Sparkles className="w-10 h-10" />})
  if (React.isValidElement(icon)) return icon;
  // Component reference (e.g. icon={DollarSign}) - includes forwardRef components
  const Icon = icon as ComponentType<{ className?: string }>;
  return <Icon className="w-12 h-12" />;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4 text-gray-400 dark:text-gray-600">
          {renderIcon(icon)}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
