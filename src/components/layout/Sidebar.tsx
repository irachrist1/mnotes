'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DollarSign,
  Lightbulb,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Income Streams', href: '/dashboard/income', icon: DollarSign },
  { name: 'Ideas Pipeline', href: '/dashboard/ideas', icon: Lightbulb },
  { name: 'Mentorship', href: '/dashboard/mentorship', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 py-8">
      <div className="flex h-10 shrink-0 items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          MNotes
        </h1>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group flex gap-x-3 rounded-lg px-3 py-2 text-sm font-medium leading-6 transition-colors
                        ${
                          isActive
                            ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        }
                      `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 bg-white dark:bg-gray-950 px-4 py-3 border-b border-gray-200 dark:border-gray-800 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">MNotes</h1>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-50">
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {navContent}
      </aside>
    </>
  );
}
