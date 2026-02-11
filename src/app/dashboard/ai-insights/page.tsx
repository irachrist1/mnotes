'use client';

import { Header } from '@/components/layout/Header';
import { AIInsightsDashboard } from '@/components/ai/AIInsightsDashboard';

export default function AIInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AIInsightsDashboard />
      </main>
    </div>
  );
} 