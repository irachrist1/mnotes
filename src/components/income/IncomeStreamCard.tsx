'use client';

import { type IncomeStream } from '@/data/incomeStreams';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface IncomeStreamCardProps {
  stream: IncomeStream;
}

export function IncomeStreamCard({ stream }: IncomeStreamCardProps) {
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
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (growthRate < 0) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {stream.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(stream.category)}`}>
                {stream.category.replace('-', ' ')}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stream.status)}`}>
                {stream.status}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue & Growth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Revenue</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(stream.monthlyRevenue)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Growth Rate</span>
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
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Time Investment</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {stream.timeInvestment}h/week
            </span>
          </div>
        </div>

        {/* Client Info */}
        {stream.clientInfo && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Client/Audience</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
              {stream.clientInfo}
            </p>
          </div>
        )}

        {/* Notes Preview */}
        {stream.notes && (
          <div className="pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {stream.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
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