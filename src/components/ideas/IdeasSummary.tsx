'use client';

import { useState, useEffect } from 'react';
import { IdeasService } from '@/services/ideas.service';
import { Card } from '@/components/ui/Card';

export function IdeasSummary() {
  const [stats, setStats] = useState<{
    totalIdeas: number;
    aiRelevantIdeas: number;
    hardwareComponentIdeas: number;
    byStage: Record<string, number>;
    byRevenuePotential: Record<string, number>;
    averageComplexity: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: statsError } = await IdeasService.getStats();
      
      if (statsError) {
        setError(statsError);
        console.error('Failed to fetch ideas stats:', statsError);
      } else {
        setStats(data);
      }
      
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'Failed to load ideas statistics'}
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Total Ideas',
      value: `${stats.totalIdeas}`,
      subtitle: 'In pipeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'AI-Related Ideas',
      value: `${stats.aiRelevantIdeas}`,
      subtitle: 'Using AI technology',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Hardware Ideas',
      value: `${stats.hardwareComponentIdeas}`,
      subtitle: 'With hardware components',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Average Complexity',
      value: `${stats.averageComplexity.toFixed(1)}/5`,
      subtitle: 'Implementation difficulty',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Potential & Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Potential Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Revenue Potential Distribution
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats.byRevenuePotential).map(([potential, count]) => {
              const potentialColors = {
                'very-high': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
                'high': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
              };

              return (
                <div key={potential} className="text-center">
                  <div className={`rounded-lg p-3 ${potentialColors[potential as keyof typeof potentialColors]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium capitalize mt-1">
                      {potential.replace('-', ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Stage Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Pipeline Stage Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.byStage).map(([stage, count]) => {
              const stageColors = {
                'raw-thought': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                'researching': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                'validating': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                'developing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
                'testing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
                'launched': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
              };

              return (
                <div key={stage} className="text-center">
                  <div className={`rounded-lg p-4 h-20 flex flex-col items-center justify-center ${stageColors[stage as keyof typeof stageColors]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium capitalize mt-1">
                      {stage.replace('-', ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
} 