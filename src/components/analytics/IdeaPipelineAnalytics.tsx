'use client';

import { useState, useEffect } from 'react';
import { AnalyticsService, type IdeaFunnelMetrics, type AnalyticsKPIs } from '@/services/analytics.service';
import { Card } from '@/components/ui/Card';

export function IdeaPipelineAnalytics() {
  const [funnelMetrics, setFunnelMetrics] = useState<IdeaFunnelMetrics[]>([]);
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelineData = async () => {
      setIsLoading(true);
      setError(null);
      
      const [funnelResult, kpisResult] = await Promise.all([
        AnalyticsService.getIdeaFunnelMetrics(),
        AnalyticsService.getKPIMetrics()
      ]);
      
      if (funnelResult.error) {
        setError(funnelResult.error);
        console.error('Failed to fetch funnel metrics:', funnelResult.error);
      } else {
        setFunnelMetrics(funnelResult.data || []);
      }

      if (kpisResult.error) {
        console.error('Failed to fetch KPI metrics:', kpisResult.error);
      } else {
        setKpis(kpisResult.data);
      }
      
      setIsLoading(false);
    };

    fetchPipelineData();
  }, []);

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
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || funnelMetrics.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'No pipeline data available'}
        </p>
      </div>
    );
  }

  const totalIdeas = funnelMetrics.reduce((sum, stage) => sum + stage.currentCount, 0);
  const avgTimeToLaunch = kpis?.ideaPipeline.averageTimeToLaunch || 180;
  const launchedThisYear = kpis?.ideaPipeline.launchedThisYear || 0;
  const successRate = kpis?.ideaPipeline.successRate || 0;
  
  const stageColors = {
    'raw-thought': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', accent: 'bg-gray-500' },
    'researching': { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-500' },
    'validating': { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', accent: 'bg-yellow-500' },
    'developing': { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', accent: 'bg-orange-500' },
    'testing': { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', accent: 'bg-purple-500' },
    'launched': { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', accent: 'bg-green-500' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Idea Pipeline Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Funnel metrics, conversion rates, and pipeline health indicators
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Idea Funnel
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current ideas by development stage
            </p>
          </div>

          <div className="space-y-4">
            {funnelMetrics.map((stage, index) => {
              const stageColor = stageColors[stage.stage as keyof typeof stageColors];
              
              return (
                <div key={stage.stage} className="relative">
                  <div className={`${stageColor.bg} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${stageColor.accent}`} />
                        <span className={`font-medium capitalize ${stageColor.text}`}>
                          {stage.stage.replace('-', ' ')}
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${stageColor.text}`}>
                        {stage.currentCount}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Conversion Rate:</span>
                        <span className={`ml-1 font-medium ${stageColor.text}`}>
                          {stage.conversionRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Avg. Time:</span>
                        <span className={`ml-1 font-medium ${stageColor.text}`}>
                          {stage.averageTimeInStage}d
                        </span>
                      </div>
                    </div>
                  </div>

                  {index < funnelMetrics.length - 1 && (
                    <div className="flex justify-center my-2">
                      <svg className="w-6 h-6 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Pipeline Health */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pipeline Health
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Key metrics and performance indicators
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalIdeas}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Total Ideas
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {launchedThisYear}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Launched This Year
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Average Time to Launch
                </span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {avgTimeToLaunch} days
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min((avgTimeToLaunch / 365) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Target: &lt; 1 year
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Success Rate
                </span>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {successRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Ideas that reach launch stage
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Pipeline Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {funnelMetrics.reduce((sum, stage) => sum + stage.monthlyInflow, 0)}
            </div>
            <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
              New Ideas/Month
            </div>
          </div>
          
          <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {funnelMetrics.length > 0 
                ? (funnelMetrics.reduce((sum, stage) => sum + stage.conversionRate, 0) / funnelMetrics.length).toFixed(1)
                : '0.0'}%
            </div>
            <div className="text-sm text-teal-700 dark:text-teal-300 mt-1">
              Avg. Conversion Rate
            </div>
          </div>
          
          <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {funnelMetrics.find(s => s.stage === 'developing')?.currentCount || 0}
            </div>
            <div className="text-sm text-pink-700 dark:text-pink-300 mt-1">
              In Development
            </div>
          </div>
          
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {funnelMetrics.find(s => s.stage === 'launched')?.currentCount || 0}
            </div>
            <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Successfully Launched
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 