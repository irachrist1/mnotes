'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { contentMetrics, newsletterStats, contentSummary } from '@/data/contentPerformance';
import { cn } from '@/utils/cn';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  Mail, 
  ArrowRight, 
  MousePointer, 
  DollarSign,
  Share2,
  MessageCircle,
  Eye
} from 'lucide-react';

interface ContentMetricsProps {
  className?: string;
}

export function ContentMetrics({ className }: ContentMetricsProps) {
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
    <div className={cn("col-span-1 md:col-span-2", className)}>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              Content Performance
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">{contentSummary.totalContent}</span> pieces
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-blue-600 dark:text-blue-400">
                <Users className="w-3 h-3 mr-1" /> {formatNumber(contentSummary.totalReach)} reach
              </span>
            </p>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="small" className="gap-2">
              Analytics <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {/* Newsletter Stats */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Mail className="w-3 h-3" /> Newsletter Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsletterStats.map((newsletter) => (
                <div key={newsletter.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {newsletter.name}
                    </h4>
                    <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {newsletter.subscriberCount} subs
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">Open Rate</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {newsletter.openRate}%
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block mb-1">Growth</span>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {newsletter.growthRate}%
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">Monetization Readiness</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{newsletter.monetizationReadiness}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full" 
                        style={{ width: `${newsletter.monetizationReadiness * 10}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Content */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Top Performing Content
            </h3>
            <div className="space-y-3">
              {topContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      {content.title}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-medium">{content.platform}</span>
                      <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {formatNumber(content.reach)}</span>
                      {content.conversions && <span className="flex items-center text-emerald-600 dark:text-emerald-400"><MousePointer className="w-3 h-3 mr-1" /> {content.conversions}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg font-bold ${getEngagementColor(content.engagementScore)}`}>
                      {content.engagementScore}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      Score
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(contentSummary.totalReach)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Reach</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-center mb-1">
                <MousePointer className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {contentSummary.totalConversions}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Conversions</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-center mb-1">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {contentSummary.averageEngagement.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Engagement</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-center mb-1">
                <DollarSign className="w-4 h-4 text-purple-500" />
              </div>
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