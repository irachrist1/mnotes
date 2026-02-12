'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
}

export function Select({ value, onChange, options, className, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'input-field w-full flex items-center justify-between gap-2 text-left cursor-default',
          open && 'border-blue-600'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={cn(
            'truncate',
            selected
              ? 'text-stone-900 dark:text-stone-100'
              : 'text-stone-400 dark:text-stone-500'
          )}
        >
          {selected?.label ?? placeholder ?? 'Select…'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-stone-400 shrink-0 transition-transform duration-150',
            open && 'rotate-180'
          )}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/[0.08] rounded-lg shadow-lg overflow-hidden py-1">
          <ul role="listbox">
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2 text-sm cursor-default select-none transition-colors duration-100',
                  option.value === value
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-600/[0.06] dark:bg-blue-400/[0.06]'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/[0.03]'
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-3.5 w-3.5 shrink-0 ml-2" strokeWidth={2.5} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
