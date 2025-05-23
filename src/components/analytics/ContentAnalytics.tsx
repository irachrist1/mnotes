'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService, type AnalyticsKPIs } from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';

export function ContentAnalytics() {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContentData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch KPIs which include content performance metrics
      const { data, error: kpiError } = await AnalyticsService.getKPIMetrics();
      
      if (kpiError) {
        setError(kpiError);
        console.error('Failed to fetch content analytics:', kpiError);
      } else {
        setKpis(data);
      }
      
      setIsLoading(false);
    };

    fetchContentData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'Failed to load content analytics'}
        </p>
      </div>
    );
  }

  // Newsletter data (current metrics from existing data)
  const newsletterData = [
    {
      name: 'Last Week in AI',
      subscribers: 1300,
      openRate: 49,
      clickRate: 13,
      monthlyGrowth: 8.2,
      color: 'blue'
    },
    {
      name: 'Sunday Scoop',
      subscribers: 1600,
      openRate: 45,
      clickRate: 11,
      monthlyGrowth: 8.7,
      color: 'green'
    }
  ];

  // Content ROI breakdown (derived from KPIs)
  const contentROIBreakdown = [
    { platform: 'Newsletter', roi: Math.round(kpis.contentPerformance.monthlyROI * 0.4), percentage: 40 },
    { platform: 'Blog', roi: Math.round(kpis.contentPerformance.monthlyROI * 0.25), percentage: 25 },
    { platform: 'Social Media', roi: Math.round(kpis.contentPerformance.monthlyROI * 0.2), percentage: 20 },
    { platform: 'Speaking', roi: Math.round(kpis.contentPerformance.monthlyROI * 0.1), percentage: 10 },
    { platform: 'Video', roi: Math.round(kpis.contentPerformance.monthlyROI * 0.05), percentage: 5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Content Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Newsletter performance, engagement metrics, and content ROI tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter Performance */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Newsletter Performance
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current subscriber metrics and engagement rates
            </p>
          </div>

          <div className="space-y-6">
            {newsletterData.map((newsletter, index) => (
              <div key={index} className={`p-4 bg-${newsletter.color}-50 dark:bg-${newsletter.color}-900/20 rounded-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold text-${newsletter.color}-700 dark:text-${newsletter.color}-300`}>
                    {newsletter.name}
                  </h4>
                  <span className={`text-sm font-medium text-${newsletter.color}-600 dark:text-${newsletter.color}-400`}>
                    +{newsletter.monthlyGrowth}% growth
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-lg font-bold text-${newsletter.color}-600 dark:text-${newsletter.color}-400`}>
                      {newsletter.subscribers.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Subscribers</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold text-${newsletter.color}-600 dark:text-${newsletter.color}-400`}>
                      {newsletter.openRate}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Open Rate</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold text-${newsletter.color}-600 dark:text-${newsletter.color}-400`}>
                      {newsletter.clickRate}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Click Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Metrics */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {kpis.contentPerformance.totalSubscribers.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Subscribers</div>
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {kpis.contentPerformance.averageEngagement.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Avg. Engagement</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Content ROI Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Content ROI Breakdown
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Revenue attribution by content platform
            </p>
          </div>

          <div className="space-y-4">
            {contentROIBreakdown.map((platform, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {platform.platform}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(platform.roi)} ({platform.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${platform.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(kpis.contentPerformance.monthlyROI)}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Total Monthly Content ROI
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                +{kpis.contentPerformance.roiGrowthRate}% growth rate
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Content Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {newsletterData.reduce((sum, newsletter) => sum + newsletter.subscribers, 0).toLocaleString()}
            </div>
            <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
              Combined Reach
            </div>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {((newsletterData.reduce((sum, newsletter) => sum + newsletter.openRate, 0) / newsletterData.length)).toFixed(1)}%
            </div>
            <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Avg. Open Rate
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              +{kpis.contentPerformance.subscriberGrowth.toFixed(1)}%
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Monthly Growth
            </div>
          </div>
        </div>

        {/* Note about future integration */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Enhanced Content Analytics Coming Soon
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Full content performance tracking with Supabase integration is planned for the next phase. 
                This will include detailed content metrics, engagement tracking, and business opportunity correlation.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 