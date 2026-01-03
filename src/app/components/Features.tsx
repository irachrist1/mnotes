'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { fadeUpVariants, slideInFromLeft, slideInFromRight } from '@/lib/animations'

const features = [
  {
    title: 'See Your Complete Revenue Picture',
    description: 'Track consulting, products, content, employment — every dollar, every source. Understand where your time creates the most value.',
    aiAngle: 'AI analyzes your streams to spot optimization opportunities',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    title: 'From Shower Thought to Shipped Product',
    description: 'Capture ideas instantly. Develop them through a 6-stage pipeline. Never lose a breakthrough to a forgotten note.',
    aiAngle: 'AI scores each idea based on your goals, skills, and market potential',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    title: 'Wisdom Captured. Action Tracked.',
    description: 'Log every meaningful conversation. Extract key insights. Track action items. Your mentorship becomes a searchable knowledge base.',
    aiAngle: 'AI surfaces patterns and connects advice to your current challenges',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Your AI Advisor — With Full Context',
    description: 'Powered by advanced AI that sees your complete picture. Get revenue optimization tips, idea validation, predictive insights, and strategic recommendations.',
    aiAngle: 'Regular analysis + "Ultra Mode" for deep strategic insights',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-600',
  },
]

export default function Features() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="features" ref={ref} className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            MNotes brings together all the pieces of your personal and professional growth
          </p>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              variants={index % 2 === 0 ? slideInFromLeft : slideInFromRight}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1 space-y-6">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient}`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-blue-900 dark:text-blue-200 font-medium">
                    {feature.aiAngle}
                  </p>
                </div>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 min-h-[300px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Feature visualization
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
