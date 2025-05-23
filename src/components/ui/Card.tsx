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
  const baseClasses = 'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-200';
  
  const variantClasses = {
    default: '',
    outlined: 'border-2',
    elevated: 'shadow-lg'
  };

  const paddingClasses = {
    none: '',
    small: 'p-3',
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
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={cn('', className)}>
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