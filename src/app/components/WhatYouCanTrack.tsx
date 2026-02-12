'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const capabilities = [
  { label: 'Income Streams', detail: 'Consulting, products, content, employment, project-based' },
  { label: 'Ideas Pipeline', detail: 'Raw thought to launch. Six stages, AI-scored' },
  { label: 'Mentorship Sessions', detail: 'Topics, insights, action items, ratings' },
  { label: 'AI Analysis', detail: 'Revenue, idea, and mentorship insights on demand' },
  { label: 'Analytics Dashboard', detail: 'Charts, projections, efficiency metrics' },
  { label: 'Model Selection', detail: 'Gemini, Claude, GPT, Llama. Your API key, your choice' },
]

export default function WhatYouCanTrack() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-stone-50 dark:bg-stone-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/[0.02] to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
            Built for people who track what matters
          </h2>
          <p className="max-w-xl mx-auto text-stone-500 dark:text-stone-400">
            Every module is designed for speed. Log an entry in under a minute.
            Let AI handle the analysis.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {capabilities.map((cap) => (
            <motion.div
              key={cap.label}
              variants={fadeUpVariants}
              className="flex items-start gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/[0.06] rounded-lg p-4 hover:border-stone-300 dark:hover:border-white/[0.1] transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-stone-900 dark:text-white">{cap.label}</p>
                <p className="text-xs text-stone-500 mt-0.5">{cap.detail}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
