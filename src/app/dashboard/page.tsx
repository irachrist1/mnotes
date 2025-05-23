import { Header } from '@/components/layout/Header';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { IncomeStreamsPanel } from '@/components/dashboard/IncomeStreamsPanel';
import { IdeasPipeline } from '@/components/dashboard/IdeasPipeline';
import { ContentMetrics } from '@/components/dashboard/ContentMetrics';
import { OperationsStatus } from '@/components/dashboard/OperationsStatus';
import { MentorshipInsights } from '@/components/dashboard/MentorshipInsights';
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Your entrepreneurial business intelligence at a glance
          </p>
        </div>

        <div className="space-y-8">
          {/* Income Streams Section */}
          <DashboardGrid>
            <IncomeStreamsPanel />
            <MentorshipInsights />
          </DashboardGrid>

          {/* Ideas Pipeline Section */}
          <DashboardGrid>
            <IdeasPipeline />
          </DashboardGrid>

          {/* Content & Operations Section */}
          <DashboardGrid>
            <ContentMetrics />
            <OperationsStatus />
          </DashboardGrid>

          {/* Analytics & Performance Section */}
          <DashboardGrid>
            <AnalyticsOverview />
          </DashboardGrid>
        </div>
      </main>
    </div>
  );
} 