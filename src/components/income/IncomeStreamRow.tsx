'use client';

import { type IncomeStream } from '@/data/incomeStreams';
import { Button } from '@/components/ui/Button';

interface IncomeStreamRowProps {
  stream: IncomeStream;
}

export function IncomeStreamRow({ stream }: IncomeStreamRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'developing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'planned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'employment':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'project-based':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'consulting':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
      case 'content':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'product':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTrendIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return (
        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (growthRate < 0) {
      return (
        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    } else {
      return (
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
  };

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {/* Stream Name & Client */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {stream.name}
          </div>
          {stream.clientInfo && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {stream.clientInfo}
            </div>
          )}
        </div>
      </td>

      {/* Category */}
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(stream.category)}`}>
          {stream.category.replace('-', ' ')}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stream.status)}`}>
          {stream.status}
        </span>
      </td>

      {/* Monthly Revenue */}
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatCurrency(stream.monthlyRevenue)}
        </div>
      </td>

      {/* Growth Rate */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {getTrendIcon(stream.growthRate)}
          <span className={`text-sm font-medium ${
            stream.growthRate > 0 ? 'text-green-600 dark:text-green-400' :
            stream.growthRate < 0 ? 'text-red-600 dark:text-red-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            {stream.growthRate > 0 ? '+' : ''}{stream.growthRate}%
          </span>
        </div>
      </td>

      {/* Time Investment */}
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900 dark:text-slate-100">
          {stream.timeInvestment}h
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