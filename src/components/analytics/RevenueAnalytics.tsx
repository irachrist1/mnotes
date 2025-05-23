'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService, type MonthlyRevenueTrend } from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';

export function RevenueAnalytics() {
  const [revenueTrends, setRevenueTrends] = useState<MonthlyRevenueTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueTrends = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: trendError } = await AnalyticsService.getRevenueTrends();
      
      if (trendError) {
        setError(trendError);
        console.error('Failed to fetch revenue trends:', trendError);
      } else {
        setRevenueTrends(data || []);
      }
      
      setIsLoading(false);
    };

    fetchRevenueTrends();
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
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || revenueTrends.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'No revenue trends data available'}
        </p>
      </div>
    );
  }

  const latestMonth = revenueTrends[revenueTrends.length - 1];
  const previousMonth = revenueTrends[revenueTrends.length - 2];
  const growthRate = previousMonth 
    ? ((latestMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue * 100)
    : 0;

  const maxRevenue = Math.max(...revenueTrends.map(t => t.totalRevenue));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Revenue Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track revenue trends and income stream performance over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Revenue Trend
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                6-month revenue progression
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(latestMonth.totalRevenue)}
              </div>
              <div className={`text-sm font-medium ${
                growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}% MoM
              </div>
            </div>
          </div>
          
          {/* Simple Chart Visualization */}
          <div className="space-y-3">
            {revenueTrends.map((trend, index) => {
              const date = new Date(trend.month + '-01');
              const percentage = (trend.totalRevenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-slate-600 dark:text-slate-400">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {formatCurrency(trend.totalRevenue)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Current Revenue Breakdown
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Income stream distribution for {new Date(latestMonth.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="space-y-4">
            {Object.entries(latestMonth.breakdown).map(([category, amount]) => {
              const percentage = (amount / latestMonth.totalRevenue * 100);
              const categoryColors: Record<string, string> = {
                employment: 'bg-blue-500',
                consulting: 'bg-green-500',
                content: 'bg-yellow-500',
                'project-based': 'bg-purple-500',
                product: 'bg-red-500',
                other: 'bg-gray-500',
              };

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {category.replace(/-/g, ' ')}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${categoryColors[category] || 'bg-gray-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Revenue Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Revenue Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(revenueTrends.reduce((sum, trend) => sum + trend.totalRevenue, 0))}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Total 6-Month Revenue
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(revenueTrends.reduce((sum, trend) => sum + trend.totalRevenue, 0) / revenueTrends.length)}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
              Average Monthly Revenue
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.entries(latestMonth.breakdown).reduce((max, [category, amount]) => 
                amount > max.amount ? { category, amount } : max, 
                { category: '', amount: 0 }
              ).category.replace(/-/g, ' ')}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              Top Income Stream
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 