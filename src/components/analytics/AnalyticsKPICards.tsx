'use client';

import { analyticsKPIs } from '@/data/analytics';
import { Card } from '@/components/ui/Card';

type ChangeType = 'positive' | 'negative' | 'neutral';

export function AnalyticsKPICards() {
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

  const kpiCards = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(analyticsKPIs.revenueGrowth.current),
      change: `+${analyticsKPIs.revenueGrowth.growthRate}%`,
      changeType: 'positive' as ChangeType,
      subtitle: `${formatCurrency(analyticsKPIs.revenueGrowth.yearToDate)} YTD`,
      progress: (analyticsKPIs.revenueGrowth.yearToDate / analyticsKPIs.revenueGrowth.target) * 100,
      target: formatCurrency(analyticsKPIs.revenueGrowth.target),
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
      value: formatCurrency(analyticsKPIs.contentPerformance.monthlyROI),
      change: `+${analyticsKPIs.contentPerformance.roiGrowth}%`,
      changeType: 'positive' as ChangeType,
      subtitle: `${formatNumber(analyticsKPIs.contentPerformance.totalSubscribers)} subscribers`,
      progress: analyticsKPIs.contentPerformance.averageEngagement,
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
      value: `+${analyticsKPIs.contentPerformance.subscriberGrowth}%`,
      change: `${formatNumber(analyticsKPIs.contentPerformance.totalSubscribers)} total`,
      changeType: 'neutral' as ChangeType,
      subtitle: 'Monthly growth rate',
      progress: analyticsKPIs.contentPerformance.subscriberGrowth * 10, // Scale for visualization
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
      value: formatCurrency(analyticsKPIs.businessDevelopment.pipelineValue),
      change: `${analyticsKPIs.businessDevelopment.newOpportunities} opportunities`,
      changeType: 'positive' as ChangeType,
      subtitle: `${analyticsKPIs.businessDevelopment.conversionRate}% conversion rate`,
      progress: analyticsKPIs.businessDevelopment.conversionRate,
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