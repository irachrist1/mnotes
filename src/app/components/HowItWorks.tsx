'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const steps = [
  {
    number: '01',
    title: 'Capture',
    description: 'Log your income streams, ideas, mentorship sessions, and notes. Quick forms, zero friction.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Connect',
    description: 'AI builds a model of your business from everything you capture. Context compounds over time.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Insight',
    description: 'Get recommendations, scores, and predictions based on your actual data. Not templates.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-stone-50 dark:bg-stone-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/[0.02] to-transparent" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-blue-600 dark:text-blue-500 text-sm font-medium tracking-wide uppercase">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
            Three steps to smarter decisions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUpVariants}
              className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/[0.06] rounded-xl p-6 hover:border-stone-300 dark:hover:border-white/[0.10] transition-colors duration-150"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-500">
                  {step.icon}
                </div>
                <span className="text-xs font-mono text-stone-400 dark:text-stone-600">{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
