'use client';

import { useState, useMemo } from 'react';
import { incomeStreams, type IncomeStream } from '@/data/incomeStreams';
import { FilterState, IncomeStreamsFilters } from './IncomeStreamsFilters';
import { IncomeStreamCard } from './IncomeStreamCard';
import { IncomeStreamRow } from './IncomeStreamRow';

export function IncomeStreamsList() {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    sortBy: 'revenue',
    sortOrder: 'desc',
    viewMode: 'grid',
    searchQuery: '',
  });

  const filteredAndSortedStreams = useMemo(() => {
    let filtered = incomeStreams.filter(stream => {
      // Status filter
      if (filters.status !== 'all' && stream.status !== filters.status) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && stream.category !== filters.category) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          stream.name,
          stream.category,
          stream.status,
          stream.notes || '',
          stream.clientInfo || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (filters.sortBy) {
        case 'revenue':
          aValue = a.monthlyRevenue;
          bValue = b.monthlyRevenue;
          break;
        case 'growth':
          aValue = a.growthRate;
          bValue = b.growthRate;
          break;
        case 'time':
          aValue = a.timeInvestment;
          bValue = b.timeInvestment;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return filters.sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <IncomeStreamsFilters onFilterChange={setFilters} />

      {/* Results */}
      {filteredAndSortedStreams.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No income streams found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {filters.searchQuery || filters.status !== 'all' || filters.category !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Get started by adding your first income stream.'}
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Income Stream
          </button>
        </div>
      ) : filters.viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Stream
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Monthly Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Growth Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time/Week
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {filteredAndSortedStreams.map((stream) => (
                  <IncomeStreamRow key={stream.id} stream={stream} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedStreams.map((stream) => (
            <IncomeStreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
} 