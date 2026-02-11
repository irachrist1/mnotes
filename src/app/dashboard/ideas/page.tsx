'use client';

import { Header } from '@/components/layout/Header';
import { IdeasPipelineView } from '@/components/ideas/IdeasPipelineView';
import { IdeasSummary } from '@/components/ideas/IdeasSummary';

export default function IdeasPipelinePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Ideas Pipeline
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and track your entrepreneurial ideas from conception to launch
          </p>
        </div>

        <div className="space-y-6">
          {/* Summary Dashboard */}
          <IdeasSummary />
          
          {/* Ideas Pipeline with integrated filters */}
          <IdeasPipelineView />
        </div>
      </main>
    </div>
  );
} 