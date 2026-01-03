'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants } from '@/lib/animations'

export default function Solution() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-blue-50 via-purple-50/30 to-blue-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-12"
        >
          <div className="space-y-6">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              One Dashboard. Full Context.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Real Intelligence.
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-slate-600 dark:text-slate-300">
              MNotes is your personal intelligence layer. Capture everything that matters — your revenue, your ideas, your mentorship insights, your goals. Then watch as AI finally gives you advice that actually fits your life.
            </p>
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-6xl mx-auto pt-8"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-2xl blur-3xl" />

              {/* Dashboard mockup */}
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">mnotes.app/dashboard</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Income card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="text-green-700 dark:text-green-400 text-sm font-semibold mb-2">Income Streams</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">$12,450</div>
                    <div className="text-green-600 dark:text-green-400 text-sm">+23% this month</div>
                  </div>

                  {/* Ideas card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="text-purple-700 dark:text-purple-400 text-sm font-semibold mb-2">Ideas Pipeline</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">23 Active</div>
                    <div className="text-purple-600 dark:text-purple-400 text-sm">4 ready to launch</div>
                  </div>

                  {/* AI Insights card */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="text-blue-700 dark:text-blue-400 text-sm font-semibold mb-2">AI Insights</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">5 New</div>
                    <div className="text-blue-600 dark:text-blue-400 text-sm">Ultra mode ready</div>
                  </div>
                </div>

                {/* Bottom AI insight example */}
                <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold mb-1">AI Recommendation</div>
                        <div className="text-sm text-white/90">
                          Your consulting revenue is growing 23% monthly while product revenue is flat. Consider allocating 3 more hours per week to consulting and validating your top-scored idea (&quot;API toolkit&quot;) to create a new revenue stream.
                        </div>
                        <div className="text-xs text-white/70 mt-2">Confidence: 92% • Based on 6 months of data</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
