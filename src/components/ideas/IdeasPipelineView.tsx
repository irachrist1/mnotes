'use client';

import { useState, useMemo, useEffect } from 'react';
import { IdeasService, type Idea, type CreateIdeaData, type UpdateIdeaData } from '@/services/ideas.service';
import { IdeasFilterState, IdeasFilters } from './IdeasFilters';
import { IdeasPipelineBoard } from './IdeasPipelineBoard';
import { IdeaCard } from './IdeaCard';
import { IdeaRow } from './IdeaRow';
import IdeaModal from '@/components/IdeaModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export function IdeasPipelineView() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    idea: Idea | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    idea: null,
    isLoading: false
  });

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

  // Fetch ideas from Supabase
  const fetchIdeas = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await IdeasService.getAll();
    
    if (fetchError) {
      setError(fetchError);
      console.error('Failed to fetch ideas:', fetchError);
    } else {
      setIdeas(data || []);
    }
    
    setIsLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchIdeas();
  }, []);

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

      // Competition level filter
      if (filters.competitionLevel !== 'all' && idea.competitionLevel !== filters.competitionLevel) {
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
  }, [ideas, filters]);

  // Handle creating new idea
  const handleCreate = async (data: CreateIdeaData) => {
    setIsSubmitting(true);
    
    const { data: newIdea, error: createError } = await IdeasService.create(data);
    
    if (createError) {
      setError(createError);
      console.error('Failed to create idea:', createError);
    } else if (newIdea) {
      setIdeas(prev => [newIdea, ...prev]);
      setIsModalOpen(false);
      setEditingIdea(null);
    }
    
    setIsSubmitting(false);
  };

  // Handle updating idea
  const handleUpdate = async (data: UpdateIdeaData) => {
    if (!editingIdea) return;
    
    setIsSubmitting(true);
    
    const { data: updatedIdea, error: updateError } = await IdeasService.update(editingIdea.id, data);
    
    if (updateError) {
      setError(updateError);
      console.error('Failed to update idea:', updateError);
    } else if (updatedIdea) {
      setIdeas(prev => 
        prev.map(idea => 
          idea.id === updatedIdea.id ? updatedIdea : idea
        )
      );
      setIsModalOpen(false);
      setEditingIdea(null);
    }
    
    setIsSubmitting(false);
  };

  // Unified submit handler for the modal
  const handleModalSubmit = async (data: CreateIdeaData | UpdateIdeaData) => {
    if (editingIdea) {
      await handleUpdate(data as UpdateIdeaData);
    } else {
      await handleCreate(data as CreateIdeaData);
    }
  };

  // Handle deleting idea
  const handleDelete = async () => {
    if (!deleteDialog.idea) return;
    
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    const { success, error: deleteError } = await IdeasService.delete(deleteDialog.idea.id);
    
    if (deleteError) {
      setError(deleteError);
      console.error('Failed to delete idea:', deleteError);
    } else if (success) {
      setIdeas(prev => 
        prev.filter(idea => idea.id !== deleteDialog.idea?.id)
      );
      setDeleteDialog({ isOpen: false, idea: null, isLoading: false });
    }
    
    setDeleteDialog(prev => ({ ...prev, isLoading: false }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingIdea(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (idea: Idea) => {
    setEditingIdea(idea);
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (idea: Idea) => {
    setDeleteDialog({
      isOpen: true,
      idea,
      isLoading: false
    });
  };

  // Error display component
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Error loading ideas
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={fetchIdeas}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <IdeasFilters onFilterChange={setFilters} />

      {/* Add New Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ideas Pipeline ({filteredAndSortedIdeas.length})
          </h2>
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading ideas...
            </p>
          )}
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Idea
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading ideas...</p>
        </div>
      ) : filteredAndSortedIdeas.length === 0 ? (
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
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Idea
          </button>
        </div>
      ) : filters.viewMode === 'pipeline' ? (
        <IdeasPipelineBoard 
          ideas={filteredAndSortedIdeas} 
          onEdit={openEditModal}
          onDelete={openDeleteDialog}
        />
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
                  <IdeaRow 
                    key={idea.id} 
                    idea={idea}
                    onEdit={() => openEditModal(idea)}
                    onDelete={() => openDeleteDialog(idea)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedIdeas.map((idea) => (
            <IdeaCard 
              key={idea.id} 
              idea={idea}
              onEdit={() => openEditModal(idea)}
              onDelete={() => openDeleteDialog(idea)}
            />
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <IdeaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIdea(null);
        }}
        onSubmit={handleModalSubmit}
        editIdea={editingIdea}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, idea: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Delete Idea"
        message={`Are you sure you want to delete "${deleteDialog.idea?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteDialog.isLoading}
        type="danger"
      />
    </div>
  );
} 