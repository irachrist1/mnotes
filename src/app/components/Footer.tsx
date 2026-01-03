'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-white transition-colors"
                >
                  Roadmap
                </button>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Pricing (Coming)</span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-500 cursor-not-allowed">Blog</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Documentation</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Changelog</span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-500 cursor-not-allowed">About</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Contact</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-500 cursor-not-allowed">Privacy</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Terms</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Security</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo and copyright */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <div className="text-white font-semibold">MNotes</div>
                <div className="text-sm text-slate-500">© {currentYear} MNotes. All rights reserved.</div>
              </div>
            </div>

            {/* Tagline */}
            <div className="text-sm text-slate-500">
              Made for people who ship
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
