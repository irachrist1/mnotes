'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-white/[0.06] pt-12 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('features')} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('roadmap')} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Roadmap
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('waitlist')} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  Waitlist
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Blog (soon)</span></li>
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Docs (soon)</span></li>
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Changelog (soon)</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Company</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-300 dark:text-gray-600">About (soon)</span></li>
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Contact (soon)</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Privacy (soon)</span></li>
              <li><span className="text-sm text-gray-300 dark:text-gray-600">Terms (soon)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-sky-500 rounded-lg flex items-center justify-center shadow-lg shadow-sky-500/25">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div>
                <span className="text-sm text-gray-900 dark:text-white font-medium">MNotes</span>
                <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">&copy; {currentYear}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Built for people who track what matters.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
