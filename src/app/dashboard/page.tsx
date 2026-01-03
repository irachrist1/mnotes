import { Header } from '@/components/layout/Header';
import { IncomeStreamsPanel } from '@/components/dashboard/IncomeStreamsPanel';
import { IdeasPipeline } from '@/components/dashboard/IdeasPipeline';
import { ContentMetrics } from '@/components/dashboard/ContentMetrics';
import { OperationsStatus } from '@/components/dashboard/OperationsStatus';
import { MentorshipInsights } from '@/components/dashboard/MentorshipInsights';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Your entrepreneurial business intelligence at a glance
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Row 1: Income (2/3) + Mentorship (1/3) */}
          <IncomeStreamsPanel className="col-span-12 lg:col-span-8 h-full" />
          <MentorshipInsights className="col-span-12 lg:col-span-4 h-full" />

          {/* Row 2: Ideas Pipeline (Full Width) */}
          <IdeasPipeline className="col-span-12" />

          {/* Row 3: Content (2/3) + AI Insights (1/3) */}
          <ContentMetrics className="col-span-12 lg:col-span-8 h-full" />
          <AIInsightsPanel className="col-span-12 lg:col-span-4 h-full" />

          {/* Row 4: Operations (2/3) + Analytics (1/3) */}
          <OperationsStatus className="col-span-12 lg:col-span-8 h-full" />
          <AnalyticsOverview className="col-span-12 lg:col-span-4 h-full" />
        </div>
      </main>
    </div>
  );
}
