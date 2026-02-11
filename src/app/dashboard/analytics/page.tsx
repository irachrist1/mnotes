'use client';

import { Header } from '@/components/layout/Header';
import { AnalyticsKPICards } from '@/components/analytics/AnalyticsKPICards';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { ContentAnalytics } from '@/components/analytics/ContentAnalytics';
import { IdeaPipelineAnalytics } from '@/components/analytics/IdeaPipelineAnalytics';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Business Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Comprehensive insights into revenue trends, content performance, and pipeline analytics
          </p>
        </div>

        <div className="space-y-8">
          {/* Key Performance Indicators */}
          <AnalyticsKPICards />
          
          {/* Revenue Analytics Section */}
          <RevenueAnalytics />
          
          {/* Content Performance Analytics */}
          <ContentAnalytics />
          
          {/* Idea Pipeline Analytics */}
          <IdeaPipelineAnalytics />
        </div>
      </main>
    </div>
  );
} 