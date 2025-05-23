'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalyticsService, type AnalyticsKPIs } from '@/services/analytics.service';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AnalyticsOverview() {
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
    );
  }

  if (error || !kpis) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Analytics Overview
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Performance insights and key metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-300 text-sm">
              {error || 'Failed to load analytics data'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Analytics Overview
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Performance insights and key metrics
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Monthly Revenue
              </div>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(kpis.monthlyRevenue.current)}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                +{kpis.monthlyRevenue.growthRate.toFixed(1)}% growth
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                Content ROI
              </div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(kpis.contentPerformance.monthlyROI)}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">
                +{kpis.contentPerformance.roiGrowthRate}% growth
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Pipeline Value</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(kpis.pipelineValue.totalValue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Subscribers</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {kpis.contentPerformance.totalSubscribers.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Ideas in Pipeline</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {kpis.ideaPipeline.totalIdeas}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {kpis.pipelineValue.conversionRate.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full">
                View Full Analytics
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 