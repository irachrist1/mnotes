'use client'

import { Toaster } from 'sonner'
import LandingHeader from './components/LandingHeader'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Solution from './components/Solution'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import WhatYouCanTrack from './components/WhatYouCanTrack'
import Roadmap from './components/Roadmap'
import WaitlistCTA from './components/WaitlistCTA'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-center" richColors />
      <LandingHeader />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <WhatYouCanTrack />
        <Roadmap />
        <WaitlistCTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
