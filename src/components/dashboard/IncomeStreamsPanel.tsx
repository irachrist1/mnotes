'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { incomeStreams, incomeStreamSummary } from '@/data/incomeStreams';

export function IncomeStreamsPanel() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'developing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'planned':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'paused':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 10) {
      return <span className="text-emerald-600 dark:text-emerald-400">↗</span>;
    } else if (growthRate < 0) {
      return <span className="text-red-600 dark:text-red-400">↘</span>;
    } else {
      return <span className="text-slate-600 dark:text-slate-400">→</span>;
    }
  };

  const topStreams = incomeStreams
    .filter(stream => stream.status === 'active')
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 3);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Income Streams
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {incomeStreamSummary.streamsByStatus.active} active streams generating {formatCurrency(incomeStreamSummary.totalMonthlyRevenue)}/month
            </p>
          </div>
          <Link href="/dashboard/income">
            <Button variant="outline" size="small">
              View All Streams
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(incomeStreamSummary.totalMonthlyRevenue)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Monthly</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {incomeStreamSummary.streamsByStatus.active}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Active Streams</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {incomeStreamSummary.streamsByStatus.developing}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Developing</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {incomeStreamSummary.averageGrowthRate.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Avg Growth</div>
            </div>
          </div>

          {/* Top Income Streams */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Top Performing Streams
            </h3>
            <div className="space-y-3">
              {topStreams.map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {stream.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stream.status)}`}>
                        {stream.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {stream.category} • {stream.timeInvestment}h/week
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(stream.monthlyRevenue)}
                      </span>
                      {getTrendIcon(stream.growthRate)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {stream.growthRate > 0 ? '+' : ''}{stream.growthRate}% growth
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 