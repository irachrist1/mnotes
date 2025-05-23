'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { analyticsKPIs } from '@/data/analytics';

export function AnalyticsOverview() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const keyMetrics = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(analyticsKPIs.revenueGrowth.current),
      change: `+${analyticsKPIs.revenueGrowth.growthRate}%`,
      changeType: 'positive' as const,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Content ROI',
      value: formatCurrency(analyticsKPIs.contentPerformance.monthlyROI),
      change: `+${analyticsKPIs.contentPerformance.roiGrowth}%`,
      changeType: 'positive' as const,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Total Subscribers',
      value: analyticsKPIs.contentPerformance.totalSubscribers.toLocaleString(),
      change: `+${analyticsKPIs.contentPerformance.subscriberGrowth}%`,
      changeType: 'positive' as const,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      label: 'Pipeline Value',
      value: formatCurrency(analyticsKPIs.businessDevelopment.pipelineValue),
      change: `${analyticsKPIs.businessDevelopment.newOpportunities} opportunities`,
      changeType: 'neutral' as const,
      color: 'text-yellow-600 dark:text-yellow-400'
    }
  ];

  const getChangeColor = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="col-span-1 md:col-span-2">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Business Analytics
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Key performance indicators and growth metrics
            </p>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="small">
              Full Analytics
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {keyMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {metric.label}
                  </span>
                  <span className={`text-xs font-medium ${getChangeColor(metric.changeType)}`}>
                    {metric.change}
                  </span>
                </div>
                <div className={`text-xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Revenue Target Progress</span>
                <span className="text-slate-900 dark:text-slate-100">
                  {((analyticsKPIs.revenueGrowth.yearToDate / analyticsKPIs.revenueGrowth.target) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((analyticsKPIs.revenueGrowth.yearToDate / analyticsKPIs.revenueGrowth.target) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Content Engagement</span>
                <span className="text-slate-900 dark:text-slate-100">
                  {analyticsKPIs.contentPerformance.averageEngagement}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analyticsKPIs.contentPerformance.averageEngagement}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Growth Insight
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Revenue grew {analyticsKPIs.revenueGrowth.growthRate}% this month with {analyticsKPIs.businessDevelopment.newOpportunities} new business opportunities identified.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 