'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants } from '@/lib/animations'

export default function Solution() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            One place for your data.
            <br />
            <span className="bg-gradient-to-r from-sky-500 to-cyan-400 dark:from-sky-400 dark:to-cyan-300 bg-clip-text text-transparent">
              One AI that understands it.
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
            MNotes is your personal intelligence layer. Capture your revenue, ideas,
            and mentorship insights. Then let AI give you advice that fits your actual situation.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          {[
            { value: '5', label: 'Data modules' },
            { value: '2', label: 'AI providers' },
            { value: '<1min', label: 'To log an entry' },
            { value: '100%', label: 'Your data, your keys' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
