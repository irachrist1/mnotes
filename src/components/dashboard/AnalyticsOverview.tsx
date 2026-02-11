'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalyticsService, type AnalyticsKPIs } from '@/services/analytics.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Activity, 
  Percent,
  PieChart,
  Lightbulb,
  MousePointer
} from 'lucide-react';

interface AnalyticsOverviewProps {
  className?: string;
}

export function AnalyticsOverview({ className }: AnalyticsOverviewProps) {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: analyticsError } = await AnalyticsService.getKPIMetrics();
      
      if (analyticsError) {
        setError(analyticsError);
        console.error('Failed to fetch analytics overview:', analyticsError);
      } else {
        setKpis(data);
      }
      
      setIsLoading(false);
    };

    fetchAnalyticsData();
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
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Analytics Overview
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Performance insights and key metrics
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {error || 'Failed to load analytics data'}
              </p>
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Analytics Overview
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Performance insights and key metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-full">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Monthly Revenue
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(kpis.monthlyRevenue.current)}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 flex items-center mt-1 font-medium">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{kpis.monthlyRevenue.growthRate.toFixed(1)}% growth
                </div>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Content ROI
                </div>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(kpis.contentPerformance.monthlyROI)}
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center mt-1 font-medium">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{kpis.contentPerformance.roiGrowthRate}% growth
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  Pipeline Value
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(kpis.pipelineValue.totalValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                    <Users className="w-3 h-3" />
                  </div>
                  Total Subscribers
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {kpis.contentPerformance.totalSubscribers.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400">
                    <Lightbulb className="w-3 h-3" />
                  </div>
                  Ideas in Pipeline
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {kpis.ideaPipeline.totalIdeas}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400">
                    <MousePointer className="w-3 h-3" />
                  </div>
                  Conversion Rate
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {kpis.pipelineValue.conversionRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-2 border-t border-slate-200 dark:border-slate-700">
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full gap-2 group">
                  View Full Analytics 
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
