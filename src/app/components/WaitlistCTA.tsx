'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { fadeUpVariants } from '@/lib/animations'

type FormData = {
  email: string
  interests: string[]
}

export default function WaitlistCTA() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Waitlist submission:', data)
    toast.success('Thanks for joining! We\'ll be in touch soon.')
    reset()
    setIsSubmitting(false)
  }

  return (
    <section id="waitlist" ref={ref} className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="text-center space-y-8"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Be First to Experience AI With Context
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            MNotes is currently in development. Join the waitlist to get early access and help shape the future of personal AI intelligence.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4">
            <div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                placeholder="Enter your email"
                className="w-full px-6 py-4 rounded-lg text-slate-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-shadow"
              />
              {errors.email && (
                <p className="text-red-200 text-sm mt-2">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist →'}
            </button>

            <p className="text-blue-100 text-sm">
              No spam. Just updates on launch.
            </p>
          </form>

          {/* Optional interest checkboxes */}
          <div className="pt-8">
            <p className="text-blue-100 mb-4">I&apos;m interested in:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Personal use', 'Business/consulting', 'Content creation', 'All of the above'].map((interest) => (
                <label
                  key={interest}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-white cursor-pointer transition-colors"
                >
                  <input
                    {...register('interests')}
                    type="checkbox"
                    value={interest}
                    className="rounded border-white/50"
                  />
                  <span className="text-sm">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
