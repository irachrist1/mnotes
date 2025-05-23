'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService, type AnalyticsKPIs } from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';

type ChangeType = 'positive' | 'negative' | 'neutral';

export function AnalyticsKPICards() {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: kpiError } = await AnalyticsService.getKPIMetrics();
      
      if (kpiError) {
        setError(kpiError);
        console.error('Failed to fetch KPI metrics:', kpiError);
      } else {
        setKpis(data);
      }
      
      setIsLoading(false);
    };

    fetchKPIs();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getTrendIcon = (changeType: ChangeType) => {
    switch (changeType) {
      case 'positive':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
    }
  };

  const getChangeTypeColor = (changeType: ChangeType) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'Failed to load KPI metrics'}
        </p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(kpis.monthlyRevenue.current),
      change: `+${kpis.monthlyRevenue.growthRate.toFixed(1)}%`,
      changeType: kpis.monthlyRevenue.growthRate >= 0 ? 'positive' : 'negative' as ChangeType,
      subtitle: `${formatCurrency(kpis.monthlyRevenue.yearToDate)} YTD`,
      progress: (kpis.monthlyRevenue.yearToDate / kpis.monthlyRevenue.target) * 100,
      target: formatCurrency(kpis.monthlyRevenue.target),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Content ROI',
      value: formatCurrency(kpis.contentPerformance.monthlyROI),
      change: `+${kpis.contentPerformance.roiGrowthRate.toFixed(1)}%`,
      changeType: 'positive' as ChangeType,
      subtitle: `${formatNumber(kpis.contentPerformance.totalSubscribers)} subscribers`,
      progress: kpis.contentPerformance.averageEngagement,
      target: '50% engagement',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Subscriber Growth',
      value: `+${kpis.contentPerformance.subscriberGrowth.toFixed(1)}%`,
      change: `${formatNumber(kpis.contentPerformance.totalSubscribers)} total`,
      changeType: 'neutral' as ChangeType,
      subtitle: 'Monthly growth rate',
      progress: kpis.contentPerformance.subscriberGrowth * 10, // Scale for visualization
      target: '10% target',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(kpis.pipelineValue.totalValue),
      change: `${kpis.pipelineValue.newOpportunities} opportunities`,
      changeType: 'positive' as ChangeType,
      subtitle: `${kpis.pipelineValue.conversionRate.toFixed(1)}% conversion rate`,
      progress: kpis.pipelineValue.conversionRate,
      target: '30% target',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <div className={card.iconColor}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(card.changeType)}
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {card.title}
            </h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {card.value}
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getChangeTypeColor(card.changeType)}`}>
                {card.change}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {card.subtitle}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-1">
              <span>Progress</span>
              <span>{card.target}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  card.progress >= 80 ? 'bg-green-500' :
                  card.progress >= 60 ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(card.progress, 100)}%` }}
              />
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-500 mt-1">
              {card.progress.toFixed(1)}%
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 