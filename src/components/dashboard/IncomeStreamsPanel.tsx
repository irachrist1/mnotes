'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IncomeStreamsService, type IncomeStream } from '@/services/incomeStreams.service';

export function IncomeStreamsPanel() {
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([]);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    activeStreams: number;
    averageGrowthRate: number;
    totalTimeInvestment: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch both streams and stats in parallel
      const [streamsResult, statsResult] = await Promise.all([
        IncomeStreamsService.getAll(),
        IncomeStreamsService.getStats()
      ]);
      
      if (streamsResult.error || statsResult.error) {
        setError(streamsResult.error || statsResult.error || 'Failed to load data');
      } else {
        setIncomeStreams(streamsResult.data || []);
        setStats(statsResult.data);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

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

  // Calculate additional stats from streams data
  const streamsByStatus = incomeStreams.reduce((acc, stream) => {
    acc[stream.status] = (acc[stream.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStreams = incomeStreams
    .filter(stream => stream.status === 'active')
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Income Streams
              </h2>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
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

  if (error) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Income Streams
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                Error loading data
              </p>
            </div>
            <Link href="/dashboard/income">
              <Button variant="outline" size="small">
                View All Streams
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Income Streams
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats?.activeStreams || 0} active streams generating {formatCurrency(stats?.totalRevenue || 0)}/month
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
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Monthly</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.activeStreams || 0}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Active Streams</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {streamsByStatus.developing || 0}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Developing</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {stats?.averageGrowthRate?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Avg Growth</div>
            </div>
          </div>

          {/* Top Income Streams */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Top Performing Streams
            </h3>
            {topStreams.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>No active income streams found</p>
                <Link href="/dashboard/income">
                  <Button variant="outline" size="small" className="mt-2">
                    Add Income Stream
                  </Button>
                </Link>
              </div>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 