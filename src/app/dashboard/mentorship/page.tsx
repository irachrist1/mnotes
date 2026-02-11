'use client';

import { Header } from '@/components/layout/Header';
import { MentorshipList } from '@/components/mentorship/MentorshipList';
import { MentorshipSummary } from '@/components/mentorship/MentorshipSummary';

export default function MentorshipPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Mentorship Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track and manage all your mentorship sessions, insights, and action items
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <MentorshipSummary />
          
          {/* Mentorship Sessions List with integrated filters */}
          <MentorshipList />
        </div>
      </main>
    </div>
  );
} 