'use client'

import { motion } from 'framer-motion'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[15%] w-[600px] h-[600px] bg-sky-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-sky-400/15 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[25%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] bg-sky-600/10 rounded-full blur-[80px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center space-y-6"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUpVariants}>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
              Now in early access
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUpVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
          >
            The intelligence layer
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              for everything you build
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUpVariants}
            className="max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed"
          >
            Track your income streams, ideas, and mentorship sessions.
            Let AI connect the dots and surface what matters most.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUpVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <button
              onClick={() => scrollTo('waitlist')}
              className="group w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-white font-medium px-6 py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2"
            >
              Get Early Access
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="w-full sm:w-auto border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-lg transition-all hover:bg-white/5"
            >
              See how it works
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            variants={fadeUpVariants}
            className="pt-16 max-w-4xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 via-cyan-500/10 to-sky-500/20 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative bg-gray-900 rounded-xl border border-white/[0.08] overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                  </div>
                  <div className="flex-1 mx-12">
                    <div className="bg-gray-800 rounded-md px-3 py-1 text-center text-xs text-gray-500 font-mono">
                      mnotes.app/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard mockup content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Monthly Revenue', value: '$12,450', accent: 'text-emerald-400' },
                      { label: 'Active Ideas', value: '23', accent: 'text-sky-400' },
                      { label: 'Growth Rate', value: '+18.2%', accent: 'text-sky-400' },
                      { label: 'AI Insights', value: '5 new', accent: 'text-amber-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-gray-800/50 rounded-lg p-3 border border-white/[0.04]">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-lg font-semibold ${stat.accent} mt-0.5 tabular-nums`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-gray-800/50 rounded-lg p-4 border border-white/[0.04] h-32">
                      <p className="text-xs text-gray-500 mb-3">Revenue Trend</p>
                      <div className="flex items-end gap-1.5 h-16">
                        {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-sky-500/40 to-sky-400/60 rounded-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-sky-500/10 to-cyan-500/10 rounded-lg p-4 border border-sky-500/20">
                      <p className="text-xs text-sky-400 font-medium mb-2">AI Insight</p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Your consulting revenue grew 23% this quarter. Consider raising rates for new clients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
