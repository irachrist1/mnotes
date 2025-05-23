'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IdeasService, type Idea } from '@/services/ideas.service';

export function IdeasPipeline() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
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

  // Fetch ideas and stats on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both ideas and stats in parallel
        const [ideasResponse, statsResponse] = await Promise.all([
          IdeasService.getAll(),
          IdeasService.getStats()
        ]);
        
        if (ideasResponse.error) {
          setError(ideasResponse.error);
        } else {
          setIdeas(ideasResponse.data || []);
        }
        
        if (statsResponse.error) {
          setError(statsResponse.error);
        } else {
          setStats(statsResponse.data);
        }
      } catch (err) {
        setError('Failed to load ideas data');
        console.error('Error fetching ideas:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'raw-thought':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'researching':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'validating':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'developing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'testing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'launched':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'text-emerald-600 dark:text-emerald-400';
    if (complexity <= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRevenueColor = (potential: string) => {
    switch (potential) {
      case 'very-high':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'high':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-slate-600 dark:text-slate-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const stages = [
    { id: 'raw-thought', title: 'Raw Ideas', color: 'border-gray-300' },
    { id: 'researching', title: 'Research', color: 'border-blue-300' },
    { id: 'validating', title: 'Validation', color: 'border-amber-300' },
    { id: 'developing', title: 'Development', color: 'border-purple-300' }
  ];

  const getIdeasByStage = (stage: string) => {
    return ideas.filter(idea => idea.stage === stage);
  };

  const highPriorityIdeas = ideas
    .filter(idea => idea.potentialRevenue === 'very-high' || idea.potentialRevenue === 'high')
    .slice(0, 3);

  // Loading state
  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Ideas Pipeline
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading ideas data...
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="animate-pulse space-y-6">
              {/* Pipeline Overview Skeleton */}
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
              
              {/* High Priority Ideas Skeleton */}
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Ideas Pipeline
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Error loading ideas data
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200">
                    Failed to load ideas
                  </h3>
                  <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Ideas Pipeline
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats?.totalIdeas || 0} total ideas • {stats?.aiRelevantIdeas || 0} AI-related • {stats?.hardwareComponentIdeas || 0} hardware components
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/ideas">
              <Button variant="outline" size="small">
                View All Ideas
              </Button>
            </Link>
            <Button variant="primary" size="small">
              Add Idea
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Pipeline Overview */}
          <div className="mb-6">
            <div className="grid grid-cols-4 gap-4">
              {stages.map((stage) => {
                const stageIdeas = getIdeasByStage(stage.id);
                return (
                  <div key={stage.id} className={`border-l-4 ${stage.color} pl-4`}>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {stage.title}
                    </h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stageIdeas.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stageIdeas.filter(idea => idea.potentialRevenue === 'high' || idea.potentialRevenue === 'very-high').length} high value
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Priority Ideas */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              High Priority Ideas
            </h3>
            {highPriorityIdeas.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <svg className="w-8 h-8 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No high priority ideas yet
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">
                  Add ideas with high or very high revenue potential
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {highPriorityIdeas.map((idea) => (
                  <div key={idea.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(idea.stage)}`}>
                        {idea.stage.replace('-', ' ')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {idea.aiRelevance && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" title="AI Relevant"></span>
                        )}
                        {idea.hardwareComponent && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full" title="Hardware Component"></span>
                        )}
                      </div>
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">
                      {idea.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                      {idea.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${getRevenueColor(idea.potentialRevenue)}`}>
                        {idea.potentialRevenue.replace('-', ' ')} revenue
                      </span>
                      <span className={`font-medium ${getComplexityColor(idea.implementationComplexity)}`}>
                        Complexity: {idea.implementationComplexity}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats?.aiRelevantIdeas || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">AI Ideas</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {stats?.hardwareComponentIdeas || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Hardware</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.byRevenuePotential['very-high'] || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Very High ROI</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                {(stats?.byStage.developing || 0) + (stats?.byStage.testing || 0)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 