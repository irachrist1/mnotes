'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Christian's Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-Powered Personal Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a 
              href="/dashboard" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/dashboard/income" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Income
            </a>
            <a 
              href="/dashboard/ideas" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Ideas
            </a>
            <a 
              href="/dashboard/mentorship" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Mentorship
            </a>
            <a 
              href="/dashboard/ai-insights" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <span>📊</span>
              <span>Insights</span>
            </a>
            <a 
              href="/dashboard/analytics" 
              className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Analytics
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="small"
              onClick={toggleDarkMode}
              className="w-9 h-9 p-0"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="small"
              className="md:hidden w-9 h-9 p-0"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            <a 
              href="/dashboard" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/dashboard/income" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Income
            </a>
            <a 
              href="/dashboard/ideas" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Ideas
            </a>
            <a 
              href="/dashboard/mentorship" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Mentorship
            </a>
            <a 
              href="/dashboard/ai-insights" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Insights</span>
            </a>
            <a 
              href="/dashboard/analytics" 
              className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Analytics
            </a>
          </nav>
        </div>
      )}
    </header>
  );
} 