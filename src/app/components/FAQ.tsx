'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import * as Accordion from '@radix-ui/react-accordion'
import { fadeUpVariants } from '@/lib/animations'

const faqs = [
  {
    question: 'How is this different from Notion or spreadsheets?',
    answer: 'Notion is a blank canvas — you build everything yourself. MNotes is purpose-built for tracking your income, ideas, and mentorship with AI that understands the connections between them. Unlike spreadsheets, MNotes provides intelligent insights, not just data storage.',
  },
  {
    question: 'What AI powers MNotes?',
    answer: 'We use Google\'s Gemini AI for deep analysis. The difference is that our AI has your complete context — your revenue data, your ideas, your goals — so insights are actually relevant to you, not generic advice.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Your data is stored securely with Supabase (enterprise-grade PostgreSQL). We don\'t sell your data or use it to train AI models. Your intelligence stays yours.',
  },
  {
    question: 'Can I import existing data?',
    answer: 'We\'re building import tools for spreadsheets and common formats. If you have specific needs, let us know when you join the waitlist.',
  },
  {
    question: 'When will MNotes launch?',
    answer: 'We\'re in active development. Waitlist members will get early access as we roll out. Join to stay updated on our progress.',
  },
  {
    question: 'Will there be a free tier?',
    answer: 'Yes. We believe everyone deserves AI with context. Free tier will include core features with usage limits. Premium unlocks unlimited tracking and advanced AI features.',
  },
]

export default function FAQ() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Questions? We&apos;ve Got Answers.
          </h2>
        </motion.div>

        <Accordion.Root type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Accordion.Item
                value={`item-${index}`}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full px-6 py-5 text-left flex items-center justify-between group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white pr-8">
                      {faq.question}
                    </span>
                    <svg
                      className="w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-300 group-data-[state=open]:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-6 pb-5 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.answer}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}
