'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-white/[0.06] pt-12 pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('features')} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('roadmap')} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                  Roadmap
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('waitlist')} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
                  Waitlist
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Blog (soon)</span></li>
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Docs (soon)</span></li>
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Changelog (soon)</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Company</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-stone-300 dark:text-stone-600">About (soon)</span></li>
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Contact (soon)</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Privacy (soon)</span></li>
              <li><span className="text-sm text-stone-300 dark:text-stone-600">Terms (soon)</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-stone-200 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/25">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div>
                <span className="text-sm text-stone-900 dark:text-white font-medium">MNotes</span>
                <span className="text-xs text-stone-400 dark:text-stone-600 ml-2">&copy; {currentYear}</span>
              </div>
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-600">
              Built for people who track what matters.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
