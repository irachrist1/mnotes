'use client';

import { newsletterGrowthTrends, contentROITrends } from '@/data/analytics';
import { Card } from '@/components/ui/Card';

export function ContentAnalytics() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const latestNewsletter = newsletterGrowthTrends[newsletterGrowthTrends.length - 1];
  const latestROI = contentROITrends[contentROITrends.length - 1];
  const previousROI = contentROITrends[contentROITrends.length - 2];
  const roiGrowth = ((latestROI.totalROI - previousROI.totalROI) / previousROI.totalROI * 100);

  const totalSubscribers = latestNewsletter.lastWeekInAI.subscribers + latestNewsletter.sundayScoop.subscribers;
  const avgOpenRate = (latestNewsletter.lastWeekInAI.openRate + latestNewsletter.sundayScoop.openRate) / 2;
  const avgClickRate = (latestNewsletter.lastWeekInAI.clickRate + latestNewsletter.sundayScoop.clickRate) / 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Content Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Newsletter performance and content ROI tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newsletter Growth */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Newsletter Performance
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Subscriber growth and engagement metrics
            </p>
          </div>

          <div className="space-y-6">
            {/* Newsletter Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Last Week in AI
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {latestNewsletter.lastWeekInAI.subscribers.toLocaleString()}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {latestNewsletter.lastWeekInAI.openRate}% open • {latestNewsletter.lastWeekInAI.clickRate}% click
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                  Sunday Scoop
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {latestNewsletter.sundayScoop.subscribers.toLocaleString()}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">
                  {latestNewsletter.sundayScoop.openRate}% open • {latestNewsletter.sundayScoop.clickRate}% click
                </div>
              </div>
            </div>

            {/* Growth Trends */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                6-Month Growth Trend
              </h4>
              <div className="space-y-2">
                {newsletterGrowthTrends.map((trend, index) => {
                  const date = new Date(trend.month + '-01');
                  const total = trend.lastWeekInAI.subscribers + trend.sundayScoop.subscribers;
                  const maxTotal = Math.max(...newsletterGrowthTrends.map(t => t.lastWeekInAI.subscribers + t.sundayScoop.subscribers));
                  const percentage = (total / maxTotal) * 100;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 text-xs text-slate-600 dark:text-slate-400">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 relative">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Content ROI */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Content ROI
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Return on investment trends
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(latestROI.totalROI)}
              </div>
              <div className={`text-sm font-medium ${
                roiGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {roiGrowth >= 0 ? '+' : ''}{roiGrowth.toFixed(1)}% MoM
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-4">
            {Object.entries(latestROI.byPlatform).map(([platform, amount]) => {
              const percentage = (amount / latestROI.totalROI * 100);
              const platformColors = {
                newsletter: 'bg-blue-500',
                blog: 'bg-green-500',
                social: 'bg-yellow-500',
                speaking: 'bg-purple-500',
                video: 'bg-red-500',
              };

              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {platform}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${platformColors[platform as keyof typeof platformColors]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Business Opportunities */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Business Opportunities
              </span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {latestROI.businessOpportunities} this month
            </div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              Generated from content marketing efforts
            </div>
          </div>
        </Card>
      </div>

      {/* Content Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Content Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalSubscribers.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Total Subscribers
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {avgOpenRate.toFixed(1)}%
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
              Average Open Rate
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {avgClickRate.toFixed(1)}%
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Average Click Rate
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {contentROITrends.reduce((sum, trend) => sum + trend.businessOpportunities, 0)}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Total Opportunities (6mo)
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 