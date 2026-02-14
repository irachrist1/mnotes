'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour,
  Database,
  Brain,
  Gear,
  List,
  X,
  SignOut,
  UserCircle,
  type Icon,
} from '@phosphor-icons/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';

type NavItem = {
  name: string;
  href: string;
  Icon: Icon;
};

const navigation: NavItem[] = [
  { name: 'Home', href: '/dashboard', Icon: SquaresFour },
  { name: 'Your Data', href: '/dashboard/data', Icon: Database },
  { name: 'Intelligence', href: '/dashboard/intelligence', Icon: Brain },
];

// Settings lives in the desktop user popover; on mobile it's an inline nav item

// ─── Desktop nav item (icon-only collapsed, icon+label expanded) ──────────────

function DesktopNavItem({
  item,
  active,
  contentVisible,
}: {
  item: NavItem;
  active: boolean;
  contentVisible: boolean;
}) {
  return (
    <li>
      <Link
        href={item.href}
        title={contentVisible ? undefined : item.name}
        aria-label={item.name}
        className={[
          'flex items-center h-10 rounded-xl transition-colors duration-150 overflow-hidden',
          active
            ? 'bg-blue-600/[0.08] dark:bg-blue-400/[0.10] text-blue-600 dark:text-blue-400'
            : 'text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.06]',
        ].join(' ')}
      >
        {/* Fixed-size icon slot — always centered */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <item.Icon
            size={20}
            weight={active ? 'duotone' : 'regular'}
            aria-hidden="true"
          />
        </div>
        <span
          className={[
            'text-[13px] font-medium whitespace-nowrap',
            'transition-[opacity,transform,max-width] duration-150 ease-out',
            contentVisible
              ? 'opacity-100 max-w-[120px] translate-x-0 delay-75'
              : 'opacity-0 max-w-0 -translate-x-1 pointer-events-none delay-0',
          ].join(' ')}
        >
          {item.name}
        </span>
      </Link>
    </li>
  );
}

// ─── Mobile full-label nav item ───────────────────────────────────────────────

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={[
          'flex items-center gap-x-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
          active
            ? 'text-blue-600 dark:text-blue-400 bg-blue-600/[0.06] dark:bg-blue-400/[0.08]'
            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.05]',
        ].join(' ')}
      >
        <item.Icon
          size={18}
          weight={active ? 'duotone' : 'regular'}
          className="shrink-0"
          aria-hidden="true"
        />
        <span>{item.name}</span>
      </Link>
    </li>
  );
}

// ─── Desktop user popover ─────────────────────────────────────────────────────

function DesktopUserSection({ contentVisible }: { contentVisible: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  if (!isAuthenticated) return null;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      setSigningOut(false);
    }
  };

  const avatarEl = user?.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.name || ''}
      className="h-8 w-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-white/10 shrink-0"
    />
  ) : (
    <div className="h-8 w-8 rounded-full bg-blue-600/10 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0">
      <UserCircle size={18} weight="duotone" className="text-blue-500" />
    </div>
  );

  return (
    <div className="relative px-3 py-3 border-t border-stone-200 dark:border-white/[0.06]" ref={menuRef}>
      {/* Avatar button with inline name */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center h-10 rounded-xl hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors duration-150 overflow-hidden"
        aria-label="Account menu"
        title={user?.name || 'Account'}
      >
        {/* Fixed-size avatar slot — always centered */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          {avatarEl}
        </div>
        <span
          className={[
            'text-[13px] font-medium text-stone-600 dark:text-stone-300 whitespace-nowrap truncate',
            'transition-[opacity,transform,max-width] duration-150 ease-out',
            contentVisible
              ? 'opacity-100 max-w-[120px] translate-x-0 delay-75'
              : 'opacity-0 max-w-0 -translate-x-1 pointer-events-none delay-0',
          ].join(' ')}
        >
          {user?.name || 'Account'}
        </span>
      </button>

      {/* Popover menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute bottom-full left-3 mb-2 w-48 rounded-xl border border-stone-200 dark:border-white/[0.08] shadow-lg py-1.5 z-50"
            style={{ background: 'rgb(var(--color-background))' }}
          >
            {/* User info header */}
            <div className="px-3 py-2 border-b border-stone-200 dark:border-white/[0.06]">
              <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                {user?.name || 'User'}
              </p>
              {user?.email && (
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                  {user.email}
                </p>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.05] transition-colors rounded-lg"
              >
                <Gear size={14} weight="regular" aria-hidden="true" />
                Settings
              </Link>
              <button
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.06] transition-colors disabled:opacity-50 rounded-lg"
              >
                <SignOut size={14} weight="regular" aria-hidden="true" />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile user section ──────────────────────────────────────────────────────

function MobileUserProfile() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.me);
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (!isAuthenticated) return null;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="px-3 mt-3">
      <div className="px-3 py-2 rounded-lg bg-stone-50 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2.5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User avatar'}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-blue-600/10 flex items-center justify-center">
              <UserCircle size={16} weight="duotone" className="text-blue-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
              {user?.name || 'User'}
            </p>
            {user?.email && (
              <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-white/[0.08]">
          <button
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            <SignOut size={14} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(false);
  const [desktopContentVisible, setDesktopContentVisible] = useState(false);
  const showContentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  useEffect(() => {
    return () => {
      if (showContentTimerRef.current) clearTimeout(showContentTimerRef.current);
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  const handleDesktopEnter = () => {
    if (showContentTimerRef.current) clearTimeout(showContentTimerRef.current);
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setDesktopExpanded(true);
    showContentTimerRef.current = setTimeout(() => {
      setDesktopContentVisible(true);
      showContentTimerRef.current = null;
    }, 70);
  };

  const handleDesktopLeave = () => {
    if (showContentTimerRef.current) clearTimeout(showContentTimerRef.current);
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setDesktopContentVisible(false);
    collapseTimerRef.current = setTimeout(() => {
      setDesktopExpanded(false);
      collapseTimerRef.current = null;
    }, 110);
  };

  const mobileNavContent = (
    <div className="flex grow flex-col overflow-y-auto px-4 py-6">
      {/* Logo */}
      <div className="flex h-10 shrink-0 items-center px-3 mb-4 pb-4 border-b border-stone-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-[15px] font-semibold text-stone-900 dark:text-white tracking-tight">
            MNotes
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col" aria-label="Main navigation">
        <ul role="list" className="space-y-0.5">
          {navigation.map((item) => (
            <MobileNavItem
              key={item.name}
              item={item}
              active={isActive(item.href)}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </ul>
        <div className="flex-1" />
        <div className="h-px bg-stone-200 dark:bg-white/[0.06] mx-3 my-3" />
        <ul role="list" className="space-y-0.5">
          <MobileNavItem
            item={{ name: 'Settings', href: '/dashboard/settings', Icon: Gear }}
            active={isActive('/dashboard/settings')}
            onClick={() => setMobileOpen(false)}
          />
        </ul>
        <MobileUserProfile />
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-40 flex items-center gap-x-3 px-4 py-3 lg:hidden border-b border-stone-200 dark:border-white/[0.06]"
        style={{ background: 'rgb(var(--color-background))' }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <List size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
          </div>
          <span className="text-sm font-semibold text-stone-900 dark:text-white tracking-tight">
            MNotes
          </span>
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
              <div className="h-full border-r border-stone-200 dark:border-white/[0.06]">
                {mobileNavContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — 64px collapsed, 224px on hover */}
      <aside
        className={[
          'hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width]',
          desktopExpanded ? 'lg:w-56' : 'lg:w-16',
        ].join(' ')}
        style={{ background: 'rgb(var(--color-background))' }}
        onMouseEnter={handleDesktopEnter}
        onMouseLeave={handleDesktopLeave}
      >
        <div className="h-full border-r border-stone-200 dark:border-white/[0.06] flex flex-col overflow-hidden">

          {/* Logo — icon mark when collapsed, full wordmark when expanded */}
          <div className="h-14 flex items-center border-b border-stone-200 dark:border-white/[0.06] shrink-0 px-4 overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold leading-none">M</span>
              </div>
              <span
                className={[
                  'text-[15px] font-semibold text-stone-900 dark:text-white tracking-tight whitespace-nowrap',
                  'transition-[opacity,transform,max-width] duration-150 ease-out',
                  desktopContentVisible
                    ? 'opacity-100 max-w-[140px] translate-x-0 delay-75'
                    : 'opacity-0 max-w-0 -translate-x-1 delay-0',
                ].join(' ')}
              >
                MNotes
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col py-4 px-3 overflow-hidden" aria-label="Main navigation">
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <DesktopNavItem
                  key={item.name}
                  item={item}
                  active={isActive(item.href)}
                  contentVisible={desktopContentVisible}
                />
              ))}
            </ul>

            <div className="flex-1" />
          </nav>

          <DesktopUserSection contentVisible={desktopContentVisible} />
        </div>
      </aside>
    </>
  );
}
