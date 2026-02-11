'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IncomeStreamsService, type IncomeStream } from '@/services/incomeStreams.service';
import { cn } from '@/utils/cn';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  DollarSign, 
  Activity, 
  BarChart3, 
  ArrowRight,
  Plus
} from 'lucide-react';

interface IncomeStreamsPanelProps {
  className?: string;
}

export function IncomeStreamsPanel({ className }: IncomeStreamsPanelProps) {
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
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'developing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'planned':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 10) {
      return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    } else if (growthRate < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    } else {
      return <Minus className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
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
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Income Streams
              </h2>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-1 animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse h-20"></div>
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
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Income Streams
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                Error loading data
              </p>
            </div>
            <Link href="/dashboard/income">
              <Button variant="outline" size="small" className="gap-2">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Income Streams
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {stats?.activeStreams || 0} active streams generating <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(stats?.totalRevenue || 0)}</span>/month
            </p>
          </div>
          <Link href="/dashboard/income">
            <Button variant="outline" size="small" className="gap-2">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Monthly</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Streams</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.activeStreams || 0}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Developing</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {streamsByStatus.developing || 0}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Growth</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats?.averageGrowthRate?.toFixed(1) || '0.0'}%
              </div>
            </div>
          </div>

          {/* Top Income Streams */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Top Performing Streams
            </h3>
            {topStreams.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-slate-900 dark:text-slate-100 font-medium mb-1">No active income streams</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Start tracking your revenue sources to see insights here.</p>
                <Link href="/dashboard/income">
                  <Button size="small" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Income Stream
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topStreams.map((stream) => (
                  <div key={stream.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {stream.name}
                        </h4>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full ${getStatusColor(stream.status)}`}>
                          {stream.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{stream.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span>{stream.timeInvestment}h/week</span>
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(stream.monthlyRevenue)}
                        </span>
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-md">
                          {getTrendIcon(stream.growthRate)}
                        </div>
                      </div>
                      <div className={`text-xs font-medium mt-1 ${
                        stream.growthRate > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                        stream.growthRate < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-slate-500 dark:text-slate-400'
                      }`}>
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
