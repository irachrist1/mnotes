'use client';

import { type Idea } from '@/data/ideas';
import { IdeaCard } from './IdeaCard';

interface IdeasPipelineBoardProps {
  ideas: Idea[];
}

export function IdeasPipelineBoard({ ideas }: IdeasPipelineBoardProps) {
  const stages = [
    { key: 'raw-thought', label: 'Raw Thought', color: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' },
    { key: 'researching', label: 'Researching', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { key: 'validating', label: 'Validating', color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' },
    { key: 'developing', label: 'Developing', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
    { key: 'testing', label: 'Testing', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    { key: 'launched', label: 'Launched', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  ];

  const getIdeasByStage = (stage: string) => {
    return ideas.filter(idea => idea.stage === stage);
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'raw-thought':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'researching':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'validating':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'developing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'testing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'launched':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Ideas Pipeline
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Track your ideas from conception to launch
        </p>
      </div>

      {/* Desktop Pipeline View */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-4 min-h-[600px]">
          {stages.map((stage) => {
            const stageIdeas = getIdeasByStage(stage.key);
            
            return (
              <div key={stage.key} className={`rounded-lg border-2 border-dashed p-4 ${stage.color}`}>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-slate-600 dark:text-slate-400">
                      {getStageIcon(stage.key)}
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {stage.label}
                    </h4>
                  </div>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                    {stageIdeas.length}
                  </span>
                </div>

                {/* Ideas in Stage */}
                <div className="space-y-3">
                  {stageIdeas.map((idea) => (
                    <div key={idea.id} className="transform transition-all duration-200 hover:scale-105">
                      <IdeaCard idea={idea} compact />
                    </div>
                  ))}
                  
                  {stageIdeas.length === 0 && (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <div className="text-xs">No ideas in this stage</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Pipeline View */}
      <div className="lg:hidden space-y-6">
        {stages.map((stage) => {
          const stageIdeas = getIdeasByStage(stage.key);
          
          return (
            <div key={stage.key} className={`rounded-lg border p-4 ${stage.color}`}>
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-slate-600 dark:text-slate-400">
                    {getStageIcon(stage.key)}
                  </div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {stage.label}
                  </h4>
                </div>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-1 rounded-full">
                  {stageIdeas.length}
                </span>
              </div>

              {/* Ideas in Stage */}
              {stageIdeas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {stageIdeas.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 dark:text-slate-500">
                  <div className="text-sm">No ideas in this stage</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 