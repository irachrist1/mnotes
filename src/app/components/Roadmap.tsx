'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const phases = [
  {
    phase: 'Core Dashboard',
    status: '🔨 Building',
    description: 'Income, Ideas, Mentorship, Analytics',
    items: ['Real-time data tracking', 'CRUD operations', 'Dark mode support', 'Responsive design'],
  },
  {
    phase: 'AI Intelligence',
    status: '⚡ In Progress',
    description: 'Gemini-powered insights and recommendations',
    items: ['Revenue optimization tips', 'Idea scoring system', 'Pattern recognition', 'Predictive analytics'],
  },
  {
    phase: 'Integrations',
    status: '📋 Planned',
    description: 'Connect your calendar, bank, social accounts',
    items: ['Calendar sync', 'Bank account linking', 'Social media APIs', 'Export capabilities'],
  },
  {
    phase: 'Mobile App',
    status: '📋 Planned',
    description: 'Capture ideas on the go',
    items: ['iOS & Android apps', 'Offline support', 'Quick capture', 'Push notifications'],
  },
]

export default function Roadmap() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="roadmap" ref={ref} className="py-24 bg-gradient-to-br from-blue-50 via-purple-50/30 to-blue-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Where We&apos;re Headed
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Building the future of personal intelligence, one feature at a time
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="space-y-8 max-w-4xl mx-auto"
        >
          {phases.map((phase, index) => (
            <motion.div
              key={index}
              variants={fadeUpVariants}
              className="relative"
            >
              {/* Timeline connector */}
              {index < phases.length - 1 && (
                <div className="absolute left-8 top-24 w-0.5 h-full bg-gradient-to-b from-blue-600/50 to-purple-600/50" />
              )}

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-6">
                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                        {phase.phase}
                      </h3>
                      <span className="inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                        {phase.status}
                      </span>
                    </div>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                      {phase.description}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {phase.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-semibold">Building in public.</span> Follow the journey and help shape the future.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
