'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/25">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">MNotes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Roadmap'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, '-'))}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => scrollToSection('waitlist')}
              className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-sky-500/25"
            >
              Get Early Access
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-500 dark:text-gray-400 p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/[0.06]"
        >
          <nav className="px-4 py-3 space-y-1">
            {['Features', 'How It Works', 'Roadmap'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase().replace(/ /g, '-'))}
                className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {item}
              </button>
            ))}
            <div className="pt-2 pb-1 px-4">
              <button
                onClick={() => scrollToSection('waitlist')}
                className="block w-full bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors text-center"
              >
                Get Early Access
              </button>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  )
}
