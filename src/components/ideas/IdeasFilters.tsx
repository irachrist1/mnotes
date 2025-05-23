'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface IdeasFilterState {
  stage: string;
  revenuePotential: string;
  complexity: string;
  category: string;
  aiRelevance: string;
  hardwareComponent: string;
  competitionLevel: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'pipeline' | 'list' | 'grid';
  searchQuery: string;
}

interface IdeasFiltersProps {
  onFilterChange?: (filters: IdeasFilterState) => void;
}

export function IdeasFilters({ onFilterChange }: IdeasFiltersProps) {
  const [filters, setFilters] = useState<IdeasFilterState>({
    stage: 'all',
    revenuePotential: 'all',
    complexity: 'all',
    category: 'all',
    aiRelevance: 'all',
    hardwareComponent: 'all',
    competitionLevel: 'all',
    sortBy: 'lastUpdated',
    sortOrder: 'desc',
    viewMode: 'pipeline',
    searchQuery: '',
  });

  const handleFilterChange = (key: keyof IdeasFilterState, value: string | 'asc' | 'desc' | 'pipeline' | 'list' | 'grid') => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const stageOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'raw-thought', label: 'Raw Thought' },
    { value: 'researching', label: 'Researching' },
    { value: 'validating', label: 'Validating' },
    { value: 'developing', label: 'Developing' },
    { value: 'testing', label: 'Testing' },
    { value: 'launched', label: 'Launched' },
  ];

  const revenueOptions = [
    { value: 'all', label: 'All Revenue Potential' },
    { value: 'very-high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const complexityOptions = [
    { value: 'all', label: 'All Complexity' },
    { value: 'low', label: 'Low (1-2)' },
    { value: 'medium', label: 'Medium (3)' },
    { value: 'high', label: 'High (4-5)' },
  ];

  const sortOptions = [
    { value: 'lastUpdated', label: 'Last Updated' },
    { value: 'createdDate', label: 'Created Date' },
    { value: 'potentialRevenue', label: 'Revenue Potential' },
    { value: 'complexity', label: 'Implementation Complexity' },
    { value: 'title', label: 'Title' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search ideas, descriptions, tags..."
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Stage Filter */}
          <select
            value={filters.stage}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Revenue Potential Filter */}
          <select
            value={filters.revenuePotential}
            onChange={(e) => handleFilterChange('revenuePotential', e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {revenueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Complexity Filter */}
          <select
            value={filters.complexity}
            onChange={(e) => handleFilterChange('complexity', e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {complexityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* AI Relevance Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.aiRelevance === 'true'}
                onChange={(e) => handleFilterChange('aiRelevance', e.target.checked ? 'true' : 'all')}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              AI-Relevant
            </label>
          </div>

          {/* Hardware Component Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hardwareComponent === 'true'}
                onChange={(e) => handleFilterChange('hardwareComponent', e.target.checked ? 'true' : 'all')}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              Hardware
            </label>
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="small"
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2"
              title={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {filters.sortOrder === 'asc' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <Button
                variant={filters.viewMode === 'pipeline' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleFilterChange('viewMode', 'pipeline')}
                className="px-3 py-1 text-xs"
                title="Pipeline view"
              >
                Pipeline
              </Button>
              <Button
                variant={filters.viewMode === 'grid' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleFilterChange('viewMode', 'grid')}
                className="px-3 py-1 text-xs"
                title="Grid view"
              >
                Grid
              </Button>
              <Button
                variant={filters.viewMode === 'list' ? 'primary' : 'ghost'}
                size="small"
                onClick={() => handleFilterChange('viewMode', 'list')}
                className="px-3 py-1 text-xs"
                title="List view"
              >
                List
              </Button>
            </div>

            {/* Add New Button */}
            <Button variant="primary" size="medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Idea
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 