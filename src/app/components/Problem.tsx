'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants } from '@/lib/animations'

export default function Problem() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-16"
        >
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Generic AI gives generic answers
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-400">
              Every conversation starts from zero. No memory of your revenue,
              your ideas, or last week&apos;s mentorship session.
            </p>
          </div>

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-gray-900 border border-white/[0.06] rounded-xl p-6 text-left space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Without context</span>
              </div>
              <div className="space-y-3 text-sm text-gray-500">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-white/[0.04]">
                  &quot;Here are some general tips for growing revenue...&quot;
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-white/[0.04]">
                  &quot;To validate a business idea, consider...&quot;
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-white/[0.04]">
                  &quot;Based on typical industry patterns...&quot;
                </div>
              </div>
              <p className="text-xs text-gray-600">Vague. Repetitive. Forgettable.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-gray-900 border border-sky-500/20 rounded-xl p-6 text-left space-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">With MNotes</span>
                </div>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                    &quot;Your consulting stream grew 23% while content revenue stayed flat. Here&apos;s why.&quot;
                  </div>
                  <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                    &quot;Your API toolkit idea scores 84/100 given your TypeScript background.&quot;
                  </div>
                  <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                    &quot;You told your mentor you'd launch by March. You're 2 weeks behind.&quot;
                  </div>
                </div>
                <p className="text-xs text-sky-400/70 mt-4">Specific. Personal. Actionable.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
