import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'medium'
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-200 h-full flex flex-col';
  
  const variantClasses = {
    default: 'shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
    outlined: 'border-2',
    elevated: 'shadow-lg hover:shadow-xl'
  };

  const paddingClasses = {
    none: '',
    small: 'p-4',
    medium: 'p-6', 
    large: 'p-8'
  };

  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
} 