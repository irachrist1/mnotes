'use client'

import { motion } from 'framer-motion'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

// Precomputed SVG path for revenue line chart
// Data: [40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95] (% height), viewBox 180×52
// Smooth cubic bezier — each segment: C midx,y0 midx,y1 x1,y1
const CHART_LINE = [
  'M 0,31.2',
  'C 8.2,31.2 8.2,23.4 16.4,23.4',
  'C 24.5,23.4 24.5,28.6 32.7,28.6',
  'C 40.9,28.6 40.9,20.8 49.1,20.8',
  'C 57.3,20.8 57.3,26 65.5,26',
  'C 73.6,26 73.6,15.6 81.8,15.6',
  'C 90,15.6 90,18.2 98.2,18.2',
  'C 106.3,18.2 106.3,10.4 114.5,10.4',
  'C 122.7,10.4 122.7,13 130.9,13',
  'C 139.1,13 139.1,5.2 147.3,5.2',
  'C 155.5,5.2 155.5,7.8 163.6,7.8',
  'C 171.8,7.8 171.8,2.6 180,2.6',
].join(' ')

const CHART_AREA = CHART_LINE + ' L 180,52 L 0,52 Z'

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-stone-950">
      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[15%] w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[25%] w-[400px] h-[400px] bg-blue-400/5 dark:bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] bg-blue-700/5 dark:bg-blue-700/10 rounded-full blur-[80px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(128,128,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.3) 1px, transparent 1px)',
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
          {/* Headline */}
          <motion.h1
            variants={fadeUpVariants}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-stone-900 dark:text-white leading-[1.1] tracking-tight"
          >
            The intelligence layer
            <br />
            <span className="text-gradient">
              for everything you build
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUpVariants}
            className="max-w-2xl mx-auto text-lg text-stone-500 dark:text-stone-400 leading-relaxed"
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
              className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
            >
              Get Early Access
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => scrollTo('how-it-works')}
              className="w-full sm:w-auto border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium px-6 py-3 rounded-lg transition-colors duration-150 hover:bg-stone-50 dark:hover:bg-white/5"
            >
              See how it works
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            variants={fadeUpVariants}
            className="pt-16 max-w-4xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-blue-600/20 rounded-xl blur-xl opacity-60" />
              <div className="relative bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-white/[0.08] overflow-hidden shadow-2xl">

                {/* Browser chrome */}
                <div className="bg-stone-100 dark:bg-stone-900 px-4 py-3 flex items-center gap-2 border-b border-stone-200 dark:border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                  </div>
                  <div className="flex-1 mx-12">
                    <div className="bg-white dark:bg-stone-800 rounded-md px-3 py-1 text-center text-xs text-stone-400 dark:text-stone-500 font-mono">
                      mnotes.app/dashboard
                    </div>
                  </div>
                </div>

                {/* App shell: mini sidebar + main content */}
                <div className="flex">

                  {/* Mini sidebar — mirrors the real 64px icon-only sidebar */}
                  <div className="w-10 bg-white dark:bg-stone-950/60 border-r border-stone-200 dark:border-white/[0.06] flex flex-col items-center pt-3 pb-3 gap-2 shrink-0">
                    {/* Logo mark */}
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-1">
                      <span className="text-white font-bold" style={{ fontSize: '7px', lineHeight: 1 }}>M</span>
                    </div>
                    {/* Nav icons */}
                    {[true, false, false, false, false, false].map((active, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${active ? 'bg-blue-600/10' : ''}`}
                      >
                        <div className={`w-3 h-3 rounded-md ${active ? 'bg-blue-500/60' : 'bg-stone-200 dark:bg-stone-700'}`} />
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-4 space-y-3 min-w-0">

                    {/* Stat cards row */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Monthly Revenue', value: '$12,450', accent: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Active Ideas', value: '23', accent: 'text-blue-700 dark:text-blue-500' },
                        { label: 'Growth Rate', value: '+18.2%', accent: 'text-blue-700 dark:text-blue-500' },
                        { label: 'AI Insights', value: '5 new', accent: 'text-violet-600 dark:text-violet-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-stone-800/50 rounded-lg p-2.5 border border-stone-100 dark:border-white/[0.04]">
                          <p className="text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-wider truncate">{stat.label}</p>
                          <p className={`text-sm font-bold ${stat.accent} mt-0.5 tabular-nums`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* SVG line chart + AI insight */}
                    <div className="grid grid-cols-3 gap-2">

                      {/* Revenue trend — SVG line chart */}
                      <div className="col-span-2 bg-white dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-white/[0.04]">
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-2">Revenue Trend</p>
                        <svg
                          viewBox="0 0 180 52"
                          className="w-full h-14"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(37,99,235)" stopOpacity="0.22" />
                              <stop offset="100%" stopColor="rgb(37,99,235)" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {/* Area fill */}
                          <path d={CHART_AREA} fill="url(#heroAreaGrad)" />
                          {/* Line */}
                          <path
                            d={CHART_LINE}
                            fill="none"
                            stroke="rgb(37,99,235)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Terminal dot */}
                          <circle cx="180" cy="2.6" r="2.5" fill="rgb(37,99,235)" />
                        </svg>
                      </div>

                      {/* AI insight card */}
                      <div className="bg-blue-600/[0.07] dark:bg-blue-500/[0.08] rounded-lg p-3 border border-blue-600/15 dark:border-blue-500/10 flex flex-col justify-between">
                        <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium mb-1.5">AI Insight</p>
                        <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-relaxed">
                          Consulting revenue grew 23% this quarter. Consider raising rates for new clients.
                        </p>
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
