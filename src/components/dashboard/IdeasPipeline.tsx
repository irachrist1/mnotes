'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IdeasService, type Idea } from '@/services/ideas.service';
import { cn } from '@/utils/cn';
import { 
  Lightbulb, 
  Zap, 
  Target, 
  Cpu, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Layers,
  Plus,
  Rocket,
  DollarSign
} from 'lucide-react';

interface IdeasPipelineProps {
  className?: string;
}

export function IdeasPipeline({ className }: IdeasPipelineProps) {
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'researching':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'validating':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'developing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'testing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'launched':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
        return 'text-emerald-700 dark:text-emerald-300 font-semibold';
      case 'high':
        return 'text-emerald-600 dark:text-emerald-400 font-medium';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-slate-600 dark:text-slate-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const stages = [
    { id: 'raw-thought', title: 'Raw Ideas', color: 'border-gray-300 dark:border-gray-600' },
    { id: 'researching', title: 'Research', color: 'border-blue-300 dark:border-blue-600' },
    { id: 'validating', title: 'Validation', color: 'border-amber-300 dark:border-amber-600' },
    { id: 'developing', title: 'Development', color: 'border-purple-300 dark:border-purple-600' }
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
      <div className={cn("col-span-1 md:col-span-2 lg:col-span-4", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
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
                  <div key={index} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
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
      <div className={cn("col-span-1 md:col-span-2 lg:col-span-4", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Ideas Pipeline
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Error loading ideas data
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  Failed to load ideas
                </h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("col-span-1 md:col-span-2 lg:col-span-4", className)}>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Ideas Pipeline
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <span className="font-medium text-slate-900 dark:text-slate-100">{stats?.totalIdeas || 0}</span> ideas
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-blue-500">
                <Zap className="w-3 h-3 mr-1" />
                {stats?.aiRelevantIdeas || 0} AI
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-purple-500">
                <Cpu className="w-3 h-3 mr-1" />
                {stats?.hardwareComponentIdeas || 0} Hardware
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/ideas">
              <Button variant="outline" size="small" className="gap-2">
                All Ideas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <Button variant="primary" size="small" className="gap-2">
              <Plus className="w-4 h-4" /> Add Idea
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Pipeline Overview */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-4">
              {stages.map((stage) => {
                const stageIdeas = getIdeasByStage(stage.id);
                return (
                  <div key={stage.id} className={`border-l-4 ${stage.color} pl-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-r-lg py-2`}>
                    <h3 className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">
                      {stage.title}
                    </h3>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {stageIdeas.length}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {stageIdeas.filter(idea => idea.potentialRevenue === 'high' || idea.potentialRevenue === 'very-high').length} high value
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Priority Ideas */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              High Priority Opportunities
            </h3>
            {highPriorityIdeas.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  No high priority ideas yet
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                  Add ideas with high or very high revenue potential to see them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highPriorityIdeas.map((idea) => (
                  <div key={idea.id} className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${getStageColor(idea.stage)}`}>
                        {idea.stage.replace('-', ' ')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {idea.aiRelevance && (
                          <div className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-md" title="AI Relevant">
                            <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        {idea.hardwareComponent && (
                          <div className="bg-purple-100 dark:bg-purple-900/50 p-1 rounded-md" title="Hardware Component">
                            <Cpu className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {idea.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-8">
                      {idea.description}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <span className={`font-medium flex items-center gap-1 ${getRevenueColor(idea.potentialRevenue)}`}>
                        <DollarSign className="w-3 h-3" />
                        {idea.potentialRevenue.replace('-', ' ')}
                      </span>
                      <span className={`font-medium flex items-center gap-1 ${getComplexityColor(idea.implementationComplexity)}`}>
                        <Layers className="w-3 h-3" />
                        Lvl {idea.implementationComplexity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.aiRelevantIdeas || 0}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Ideas</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
              <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.hardwareComponentIdeas || 0}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Hardware</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.byRevenuePotential['very-high'] || 0}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Very High ROI</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <Target className="w-5 h-5 text-slate-600 dark:text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                {(stats?.byStage.developing || 0) + (stats?.byStage.testing || 0)}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
