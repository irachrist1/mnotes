'use client';

import { type Idea } from '@/data/ideas';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface IdeaCardProps {
  idea: Idea;
  compact?: boolean;
}

export function IdeaCard({ idea, compact = false }: IdeaCardProps) {
  const getRevenueColor = (potential: string) => {
    switch (potential) {
      case 'very-high':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'high':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'raw-thought':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'researching':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'validating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'developing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'testing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'launched':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const renderComplexityStars = (complexity: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-3 h-3 ${index < complexity ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (compact) {
    return (
      <Card className="p-3 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <div className="space-y-2">
          {/* Title and Revenue */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
              {idea.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRevenueColor(idea.potentialRevenue)}`}>
                {idea.potentialRevenue.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Complexity and Flags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {renderComplexityStars(idea.implementationComplexity)}
            </div>
            <div className="flex items-center gap-1">
              {idea.aiRelevance && (
                <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">AI</span>
                </div>
              )}
              {idea.hardwareComponent && (
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">H</span>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {idea.category}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
              {idea.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {idea.category}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(idea.stage)}`}>
                {idea.stage.replace('-', ' ')}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRevenueColor(idea.potentialRevenue)}`}>
                {idea.potentialRevenue.replace('-', ' ')} revenue
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
            {idea.description}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Implementation Complexity</span>
            <div className="flex items-center gap-1">
              {renderComplexityStars(idea.implementationComplexity)}
              <span className="text-sm text-slate-700 dark:text-slate-300 ml-1">
                {idea.implementationComplexity}/5
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Time to Market</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {idea.timeToMarket}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Market Size</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {idea.marketSize}
            </span>
          </div>
        </div>

        {/* Flags and Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {idea.aiRelevance && (
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 text-xs font-medium rounded-full">
                AI-Relevant
              </span>
            )}
            {idea.hardwareComponent && (
              <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 text-xs font-medium rounded-full">
                Hardware
              </span>
            )}
          </div>
          
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {idea.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 text-xs rounded">
                  {tag}
                </span>
              ))}
              {idea.tags.length > 3 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  +{idea.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last updated: {formatDate(idea.lastUpdated)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            size="small"
            className="flex-1 text-xs"
          >
            View Details
          </Button>
          <Button
            variant="ghost"
            size="small"
            className="flex-1 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="small"
            className="p-2"
            title="More options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
} 