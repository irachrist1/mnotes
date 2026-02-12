'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Income', href: '/dashboard/income', icon: DollarSign },
  { name: 'Ideas', href: '/dashboard/ideas', icon: Lightbulb },
  { name: 'Mentorship', href: '/dashboard/mentorship', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Sparkles },
];

const bottomNav = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  const NavItem = ({ item, onClick }: { item: typeof navigation[0]; onClick?: () => void }) => {
    const active = isActive(item.href);
    return (
      <li>
        <Link
          href={item.href}
          onClick={onClick}
          className={`
            group relative flex items-center gap-x-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200
            ${active
              ? 'text-sky-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }
          `}
        >
          {/* Active indicator */}
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-sky-500/[0.08] dark:bg-sky-400/[0.08]"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          {/* Left accent bar */}
          {active && (
            <motion.div
              layoutId="sidebar-accent"
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-sky-400"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}

          <item.icon
            className={`relative h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
              active
                ? 'text-sky-400'
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
            }`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="relative">{item.name}</span>

          {/* Hover arrow */}
          {!active && (
            <ChevronRight
              className="ml-auto h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              strokeWidth={1.5}
            />
          )}
        </Link>
      </li>
    );
  };

  const navContent = (
    <div className="flex grow flex-col overflow-y-auto px-4 py-6">
      {/* Logo */}
      <div className="flex h-10 shrink-0 items-center px-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
            MNotes
          </span>
        </div>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col" aria-label="Main navigation">
        <ul role="list" className="space-y-0.5">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </ul>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-white/[0.06] mx-3 my-3" />

        {/* Bottom nav */}
        <ul role="list" className="space-y-0.5">
          {bottomNav.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </ul>

        {/* Version badge */}
        <div className="px-3 mt-4">
          <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
            v0.2.0 beta
          </span>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-3 px-4 py-3 lg:hidden" style={{ background: 'rgb(var(--color-background))' }}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">MNotes</span>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              style={{ background: 'rgb(var(--color-background))' }}
            >
              <div className="h-full border-r border-gray-200 dark:border-white/[0.06]">
                {navContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col"
        style={{ background: 'rgb(var(--color-background))' }}
      >
        <div className="h-full border-r border-gray-200 dark:border-white/[0.06]">
          {navContent}
        </div>
      </aside>
    </>
  );
}
