'use client';

import { useState, useMemo } from 'react';
import { ideas, type Idea } from '@/data/ideas';
import { IdeasFilterState, IdeasFilters } from './IdeasFilters';
import { IdeasPipelineBoard } from './IdeasPipelineBoard';
import { IdeaCard } from './IdeaCard';
import { IdeaRow } from './IdeaRow';

export function IdeasPipelineView() {
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

  const filteredAndSortedIdeas = useMemo(() => {
    let filtered = ideas.filter(idea => {
      // Stage filter
      if (filters.stage !== 'all' && idea.stage !== filters.stage) {
        return false;
      }

      // Revenue potential filter
      if (filters.revenuePotential !== 'all' && idea.potentialRevenue !== filters.revenuePotential) {
        return false;
      }

      // Complexity filter
      if (filters.complexity !== 'all') {
        const complexity = idea.implementationComplexity;
        if (filters.complexity === 'low' && complexity > 2) return false;
        if (filters.complexity === 'medium' && complexity !== 3) return false;
        if (filters.complexity === 'high' && complexity < 4) return false;
      }

      // AI relevance filter
      if (filters.aiRelevance === 'true' && !idea.aiRelevance) {
        return false;
      }

      // Hardware component filter
      if (filters.hardwareComponent === 'true' && !idea.hardwareComponent) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          idea.title,
          idea.description,
          idea.category,
          idea.sourceOfInspiration,
          ...idea.tags,
          ...idea.requiredSkills
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = 0;
      let bValue: any = 0;

      switch (filters.sortBy) {
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        case 'createdDate':
          aValue = new Date(a.createdDate).getTime();
          bValue = new Date(b.createdDate).getTime();
          break;
        case 'potentialRevenue':
          const revenueOrder = { 'low': 1, 'medium': 2, 'high': 3, 'very-high': 4 };
          aValue = revenueOrder[a.potentialRevenue];
          bValue = revenueOrder[b.potentialRevenue];
          break;
        case 'complexity':
          aValue = a.implementationComplexity;
          bValue = b.implementationComplexity;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
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
        ? aValue - bValue
        : bValue - aValue;
    });

    return filtered;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <IdeasFilters onFilterChange={setFilters} />

      {/* Results */}
      {filteredAndSortedIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No ideas found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {filters.searchQuery || filters.stage !== 'all' || filters.revenuePotential !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Get started by adding your first entrepreneurial idea.'}
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Idea
          </button>
        </div>
      ) : filters.viewMode === 'pipeline' ? (
        <IdeasPipelineBoard ideas={filteredAndSortedIdeas} />
      ) : filters.viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Idea
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Revenue Potential
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Complexity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Time to Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {filteredAndSortedIdeas.map((idea) => (
                  <IdeaRow key={idea.id} idea={idea} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
} 