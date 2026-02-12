'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { fadeUpVariants } from '@/lib/animations'

interface FormData {
  email: string
}

export default function WaitlistCTA() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitted(true)
    toast.success(`You're on the list, ${data.email.split('@')[0]}!`)
  }

  return (
    <section id="waitlist" ref={ref} className="py-24 bg-stone-50 dark:bg-stone-950 relative overflow-hidden">
      {/* Gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white">
              Get early access
            </h2>
            <p className="text-stone-500 dark:text-stone-400">
              Join the waitlist and be the first to try MNotes when we open up.
              No spam. Just an email when it&apos;s your turn.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-stone-900 border border-blue-600/20 rounded-xl p-8 space-y-3"
            >
              <div className="w-10 h-10 mx-auto bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-stone-900 dark:text-white font-medium">You&apos;re on the list</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">We&apos;ll send you an email when early access opens.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Enter a valid email' },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/[0.08] rounded-lg text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-colors"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 text-left">{errors.email.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-150 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-600">
                Free during early access. No credit card required.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
