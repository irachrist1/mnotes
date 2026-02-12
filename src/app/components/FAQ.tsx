'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import * as Accordion from '@radix-ui/react-accordion'
import { fadeUpVariants, staggerContainer } from '@/lib/animations'

const faqs = [
  {
    question: 'How is this different from Notion or spreadsheets?',
    answer: 'Notion is a blank canvas. You build everything yourself. MNotes is purpose-built for tracking income, ideas, and mentorship. The AI reads across all your data, so insights actually connect the dots between what you earn, what you build, and who you learn from.',
  },
  {
    question: 'What AI models does it use?',
    answer: 'You choose your provider and model. We support OpenRouter and Google AI Studio, which gives you access to GPT-4, Claude, Gemini, and dozens of others. Bring your own API key. Your data never leaves your control.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Your data is stored with Convex, a production-grade backend with end-to-end encryption. We never sell your data or use it to train models. AI calls use your own API keys, so your information stays between you and your chosen provider.',
  },
  {
    question: 'Can I import existing data?',
    answer: 'Import tools for spreadsheets and common formats are on the roadmap. If you have specific needs, mention them when you join the waitlist and we will prioritize accordingly.',
  },
  {
    question: 'When does early access open?',
    answer: 'Phase 1 (core dashboard) is live. Phase 2 (AI intelligence) is actively shipping. Waitlist members get access as we roll features out. Join to get notified.',
  },
  {
    question: 'Will there be a free tier?',
    answer: 'Yes. Free tier includes core tracking and limited AI insights. Premium unlocks unlimited AI runs, advanced analytics, and priority access to new features.',
  },
]

export default function FAQ() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section ref={ref} className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-sky-500 dark:text-sky-400 text-sm font-medium tracking-wide uppercase">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Common questions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          <Accordion.Root type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={fadeUpVariants}>
                <Accordion.Item
                  value={`item-${index}`}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="w-full px-5 py-4 text-left flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors">
                      <span className="text-sm font-medium text-gray-900 dark:text-white pr-8">
                        {faq.question}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-300 group-data-[state=open]:rotate-180 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              </motion.div>
            ))}
          </Accordion.Root>
        </motion.div>
      </div>
    </section>
  )
}
