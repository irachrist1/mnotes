'use client';

import { Header } from '@/components/layout/Header';
import { IncomeStreamsList } from '@/components/income/IncomeStreamsList';
import { IncomeStreamsSummary } from '@/components/income/IncomeStreamsSummary';

export default function IncomeStreamsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Income Streams Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Detailed overview and management of all your revenue sources
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <IncomeStreamsSummary />
          
          {/* Income Streams List with integrated filters */}
          <IncomeStreamsList />
        </div>
      </main>
    </div>
  );
} 