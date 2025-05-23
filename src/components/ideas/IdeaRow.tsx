'use client';

import { type Idea } from '@/data/ideas';
import { Button } from '@/components/ui/Button';

interface IdeaRowProps {
  idea: Idea;
}

export function IdeaRow({ idea }: IdeaRowProps) {
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

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {/* Idea Title & Category */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
            {idea.title}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {idea.category}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {idea.aiRelevance && (
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-1.5 py-0.5 text-xs font-medium rounded">
                AI
              </span>
            )}
            {idea.hardwareComponent && (
              <span className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-0.5 text-xs font-medium rounded">
                HW
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Stage */}
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageColor(idea.stage)}`}>
          {idea.stage.replace('-', ' ')}
        </span>
      </td>

      {/* Revenue Potential */}
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRevenueColor(idea.potentialRevenue)}`}>
          {idea.potentialRevenue.replace('-', ' ')}
        </span>
      </td>

      {/* Complexity */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {renderComplexityStars(idea.implementationComplexity)}
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
            {idea.implementationComplexity}/5
          </span>
        </div>
      </td>

      {/* Time to Market */}
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900 dark:text-slate-100">
          {idea.timeToMarket}
        </div>
      </td>

      {/* Last Updated */}
      <td className="px-6 py-4">
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {formatDate(idea.lastUpdated)}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="small"
            className="text-xs"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="small"
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="small"
            className="p-1"
            title="More options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </td>
    </tr>
  );
} 