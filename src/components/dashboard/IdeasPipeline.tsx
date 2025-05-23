'use client';

import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ideas, ideaSummary } from '@/data/ideas';

export function IdeasPipeline() {
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

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-4">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Ideas Pipeline
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {ideaSummary.totalIdeas} total ideas • {ideaSummary.aiRelevantIdeas} AI-related • {ideaSummary.hardwareComponentIdeas} hardware components
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
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {ideaSummary.aiRelevantIdeas}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">AI Ideas</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {ideaSummary.hardwareComponentIdeas}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Hardware</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {ideaSummary.byRevenuePotential['very-high']}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Very High ROI</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                {ideaSummary.byStage.developing + ideaSummary.byStage.testing}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 