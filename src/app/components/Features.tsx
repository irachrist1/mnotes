'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const features = [
  {
    title: 'Revenue Tracking',
    description: 'See every income stream in one view. Monthly revenue, time invested, growth rates, and category breakdowns.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    border: 'hover:border-emerald-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    span: 'md:col-span-2',
    preview: (
      <div className="mt-4 flex items-end gap-1 h-20">
        {[35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 82, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/30 to-emerald-400/50 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
  {
    title: 'Ideas Pipeline',
    description: 'Move ideas from raw thought to launch. Score by potential, complexity, and market fit.',
    accent: 'from-violet-500/20 to-violet-500/5',
    border: 'hover:border-violet-500/20',
    iconColor: 'text-violet-500 dark:text-violet-400',
    span: '',
    preview: (
      <div className="mt-4 space-y-2">
        {['Launched', 'Testing', 'Developing', 'Researching'].map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="text-[10px] text-stone-500 w-16 text-right">{stage}</span>
            <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500/60 to-violet-400/40 rounded-full" style={{ width: `${[20, 30, 50, 80][i]}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Mentorship Log',
    description: 'Track sessions, capture insights, and follow up on action items. Never lose advice again.',
    accent: 'from-blue-600/20 to-blue-600/5',
    border: 'hover:border-blue-600/20',
    iconColor: 'text-blue-600 dark:text-blue-500',
    span: '',
    preview: (
      <div className="mt-4 space-y-2">
        {[
          { name: 'Design Review', type: 'Receiving', rating: '9/10' },
          { name: 'Career Strategy', type: 'Giving', rating: '8/10' },
        ].map((s) => (
          <div key={s.name} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-lg px-3 py-2 border border-stone-100 dark:border-white/[0.04]">
            <span className="text-xs text-stone-700 dark:text-stone-300">{s.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500">{s.type}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-500 tabular-nums">{s.rating}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'AI Insights',
    description: 'Generate analysis across all your data. Revenue optimization, idea scoring, mentorship patterns. Powered by your choice of model.',
    accent: 'from-blue-600/20 to-blue-500/5',
    border: 'hover:border-blue-600/20',
    iconColor: 'text-blue-600 dark:text-blue-500',
    span: 'md:col-span-2',
    preview: (
      <div className="mt-4 bg-blue-600/[0.07] dark:bg-blue-500/[0.06] rounded-lg p-3 border border-blue-600/10">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-stone-700 dark:text-stone-300">Your consulting work has the best revenue-to-time ratio at $92/hr. Product revenue is growing slower but requires less active time.</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5">92% confidence / gemini-2.5-flash</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Analytics',
    description: 'Real charts. Revenue by category, pipeline velocity, mentorship trends. Not CSS rectangles.',
    accent: 'from-teal-500/20 to-teal-500/5',
    border: 'hover:border-teal-500/20',
    iconColor: 'text-teal-500 dark:text-teal-400',
    span: '',
    preview: (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: 'Monthly Rev', value: '$12.4k', change: '+18%' },
          { label: 'Rev/Hour', value: '$62', change: '+7%' },
        ].map((s) => (
          <div key={s.label} className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-2 border border-stone-100 dark:border-white/[0.04]">
            <p className="text-[10px] text-stone-500">{s.label}</p>
            <p className="text-sm font-semibold text-stone-900 dark:text-white tabular-nums">{s.value}</p>
            <p className="text-[10px] text-emerald-500 dark:text-emerald-400">{s.change}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Settings',
    description: 'Pick your AI provider and model. Bring your own API key. OpenRouter or Google AI Studio.',
    accent: 'from-stone-500/20 to-stone-500/5',
    border: 'hover:border-stone-500/20',
    iconColor: 'text-stone-500 dark:text-stone-400',
    span: '',
    preview: (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-lg px-3 py-2 border border-stone-100 dark:border-white/[0.04]">
          <span className="text-[10px] text-stone-500">Provider</span>
          <span className="text-xs text-stone-700 dark:text-stone-300">OpenRouter</span>
        </div>
        <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-lg px-3 py-2 border border-stone-100 dark:border-white/[0.04]">
          <span className="text-[10px] text-stone-500">Model</span>
          <span className="text-xs text-stone-700 dark:text-stone-300">gemini-2.5-flash</span>
        </div>
      </div>
    ),
  },
]

export default function Features() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="features" ref={ref} className="py-24 bg-white dark:bg-stone-950 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-blue-600 dark:text-blue-500 text-sm font-medium tracking-wide uppercase">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="max-w-2xl mx-auto text-stone-500 dark:text-stone-400">
            Six modules that work together. Each one captures a different part of your business.
            AI reads across all of them.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUpVariants}
              className={`group relative bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-white/[0.06] rounded-xl p-5 ${feature.border} transition-colors duration-150 overflow-hidden ${feature.span}`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />
              <div className="relative">
                <h3 className={`text-sm font-semibold ${feature.iconColor} mb-1.5`}>
                  {feature.title}
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {feature.description}
                </p>
                {feature.preview}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
