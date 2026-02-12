'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const phases = [
  {
    phase: 'Phase 1',
    title: 'Core Dashboard',
    status: 'Live',
    statusColor: 'bg-emerald-500',
    items: ['Income stream tracking', 'Ideas pipeline', 'Mentorship sessions', 'CRUD operations', 'Mobile responsive'],
  },
  {
    phase: 'Phase 2',
    title: 'AI Intelligence',
    status: 'Building',
    statusColor: 'bg-sky-500',
    items: ['Server-side AI actions', 'Multi-model support', 'Revenue optimization', 'Idea scoring', 'Persistent insights'],
  },
  {
    phase: 'Phase 3',
    title: 'Smart Analytics',
    status: 'Next',
    statusColor: 'bg-amber-500',
    items: ['Real Chart.js charts', 'Revenue projections', 'Pipeline velocity', 'Efficiency metrics', 'Date range filters'],
  },
  {
    phase: 'Phase 4',
    title: 'Auth + Integrations',
    status: 'Planned',
    statusColor: 'bg-gray-500',
    items: ['User authentication', 'Calendar sync', 'Scheduled AI runs', 'Push notifications', 'Goal tracking'],
  },
]

export default function Roadmap() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="roadmap" ref={ref} className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-sky-400 text-sm font-medium tracking-wide uppercase">Roadmap</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Where we&apos;re headed
          </h2>
          <p className="max-w-xl mx-auto text-gray-400">
            Shipping fast. Phase 1 is live. Phase 2 is actively in development.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {phases.map((phase) => (
            <motion.div
              key={phase.phase}
              variants={fadeUpVariants}
              className="bg-gray-900 border border-white/[0.06] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-mono">{phase.phase}</p>
                  <h3 className="text-base font-semibold text-white">{phase.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${phase.statusColor}`} />
                  <span className="text-xs text-gray-400">{phase.status}</span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
