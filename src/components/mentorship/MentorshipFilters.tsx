'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface MentorshipFilterState {
  sessionType: 'all' | 'giving' | 'receiving';
  mentor: 'all' | string;
  rating: 'all' | '8+' | '6-7' | '5-';
  hasActionItems: 'all' | 'yes' | 'no';
  actionItemsStatus: 'all' | 'pending' | 'completed';
  sortBy: 'date' | 'rating' | 'duration' | 'mentor';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  searchQuery: string;
}

interface MentorshipFiltersProps {
  onFilterChange: (filters: MentorshipFilterState) => void;
}

export function MentorshipFilters({ onFilterChange }: MentorshipFiltersProps) {
  const [filters, setFilters] = useState<MentorshipFilterState>({
    sessionType: 'all',
    mentor: 'all',
    rating: 'all',
    hasActionItems: 'all',
    actionItemsStatus: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'grid',
    searchQuery: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof MentorshipFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: MentorshipFilterState = {
      sessionType: 'all',
      mentor: 'all',
      rating: 'all',
      hasActionItems: 'all',
      actionItemsStatus: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'grid',
      searchQuery: '',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Common mentors from the data
  const commonMentors = [
    'James Muigai',
    'Elizabeth Babalola',
    'Jimmy Nsenga',
    'Catherine Njane',
    'Shaan Puri',
    'Timothy'
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      {/* Search and Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search sessions, mentors, topics..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 
                     placeholder-slate-500 dark:placeholder-slate-400
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => updateFilter('viewMode', 'grid')}
              className={`px-3 py-2 text-sm ${
                filters.viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => updateFilter('viewMode', 'list')}
              className={`px-3 py-2 text-sm border-l border-slate-300 dark:border-slate-600 ${
                filters.viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Session Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Session Type
              </label>
              <select
                value={filters.sessionType}
                onChange={(e) => updateFilter('sessionType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Types</option>
                <option value="receiving">Receiving</option>
                <option value="giving">Giving</option>
              </select>
            </div>

            {/* Mentor Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mentor
              </label>
              <select
                value={filters.mentor}
                onChange={(e) => updateFilter('mentor', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Mentors</option>
                {commonMentors.map((mentor) => (
                  <option key={mentor} value={mentor}>
                    {mentor}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => updateFilter('rating', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Ratings</option>
                <option value="8+">8+ (Excellent)</option>
                <option value="6-7">6-7 (Good)</option>
                <option value="5-">5 and below</option>
              </select>
            </div>

            {/* Action Items Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Action Items
              </label>
              <select
                value={filters.actionItemsStatus}
                onChange={(e) => updateFilter('actionItemsStatus', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All</option>
                <option value="pending">With Pending Actions</option>
                <option value="completed">All Actions Completed</option>
              </select>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sort by:
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="date">Date</option>
                <option value="rating">Rating</option>
                <option value="duration">Duration</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Order:
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="small"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 