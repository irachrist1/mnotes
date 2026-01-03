'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const modules = [
  {
    title: 'Income Streams',
    description: 'Consulting, products, content, employment, projects',
    icon: '💰',
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Ideas Pipeline',
    description: 'Raw thoughts → Research → Validation → Development → Launch',
    icon: '💡',
    color: 'from-purple-500 to-pink-600',
  },
  {
    title: 'Mentorship',
    description: 'Sessions, insights, action items, mentor relationships',
    icon: '🎓',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Analytics',
    description: 'Revenue trends, pipeline health, conversion rates, growth metrics',
    icon: '📊',
    color: 'from-orange-500 to-red-600',
  },
  {
    title: 'AI Insights',
    description: 'Personalized recommendations, scoring, predictions',
    icon: '🤖',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    title: 'Notes & Context',
    description: 'Tag anything, connect everything, build your knowledge graph',
    icon: '📝',
    color: 'from-teal-500 to-green-600',
  },
]

export default function WhatYouCanTrack() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything That Matters. One Place.
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Comprehensive tracking meets intelligent insights
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((module, index) => (
            <motion.div
              key={index}
              variants={fadeUpVariants}
              className="group relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className={`text-5xl mb-4`}>
                  {module.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {module.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {module.description}
                </p>
              </div>
              {/* Hover gradient border effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
