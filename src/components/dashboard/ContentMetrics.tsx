'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { contentMetrics, newsletterStats, contentSummary } from '@/data/contentPerformance';

export function ContentMetrics() {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getEngagementColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const topContent = contentMetrics
    .filter(content => content.topPerforming)
    .slice(0, 3);

  return (
    <div className="col-span-1 md:col-span-2">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Content Performance
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {contentSummary.totalContent} pieces reaching {formatNumber(contentSummary.totalReach)} people
            </p>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="small">
              View Analytics
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {/* Newsletter Stats */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Newsletter Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsletterStats.map((newsletter) => (
                <div key={newsletter.name} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {newsletter.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {newsletter.subscriberCount} subscribers
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Open Rate</span>
                      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {newsletter.openRate}%
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Growth</span>
                      <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        +{newsletter.growthRate}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${newsletter.monetizationReadiness * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Monetization readiness: {newsletter.monetizationReadiness}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Content */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Top Performing Content
            </h3>
            <div className="space-y-3">
              {topContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {content.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{content.platform}</span>
                      <span>{formatNumber(content.reach)} reach</span>
                      {content.conversions && <span>{content.conversions} conversions</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getEngagementColor(content.engagementScore)}`}>
                      {content.engagementScore}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      engagement
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(contentSummary.totalReach)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Reach</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {contentSummary.totalConversions}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Conversions</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {contentSummary.averageEngagement.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Engagement</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                ${contentSummary.averageROI.toFixed(0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg ROI</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 