'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants } from '@/lib/animations'

export default function Problem() {
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
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
            AI is powerful. But it doesn&apos;t know you.
          </h2>

          <div className="space-y-8 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Every time you open ChatGPT, Claude, or any AI assistant, you start from zero.
            </p>

            <div className="space-y-4 py-8">
              <p className="text-slate-700 dark:text-slate-200 font-medium">
                It doesn&apos;t know your income streams.
              </p>
              <p className="text-slate-700 dark:text-slate-200 font-medium">
                It doesn&apos;t know the idea you&apos;ve been developing for months.
              </p>
              <p className="text-slate-700 dark:text-slate-200 font-medium">
                It doesn&apos;t remember that conversation with your mentor last week.
              </p>
            </div>

            <p>
              You end up spending more time explaining context than getting actual help.
            </p>

            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400 pt-8"
            >
              What if AI could see your complete picture?
            </motion.p>
          </div>

          {/* Visual comparison */}
          <div className="grid md:grid-cols-2 gap-8 pt-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 space-y-4"
            >
              <div className="text-red-600 dark:text-red-400 font-semibold text-sm uppercase tracking-wide">
                AI Without Context
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-sm space-y-3">
                <p>&quot;Here are some general tips for increasing revenue...&quot;</p>
                <p>&quot;To validate an idea, you should...&quot;</p>
                <p>&quot;Based on typical business patterns...&quot;</p>
              </div>
              <div className="text-red-600 dark:text-red-400 text-xs font-medium">
                Generic. Repetitive. Unhelpful.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4 relative"
            >
              <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                With MNotes
              </div>
              <div className="text-green-600 dark:text-green-400 font-semibold text-sm uppercase tracking-wide">
                AI With Your Context
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm space-y-3">
                <p>&quot;Your consulting stream grew 23% while content is flat. Consider...&quot;</p>
                <p>&quot;Your &apos;API toolkit&apos; idea scores 84/100 given your skills...&quot;</p>
                <p>&quot;Based on your last 6 months of revenue data...&quot;</p>
              </div>
              <div className="text-green-600 dark:text-green-400 text-xs font-medium">
                Personalized. Relevant. Actionable.
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
