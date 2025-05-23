'use client';

import { useState, useMemo, useEffect } from 'react';
import { FilterState, IncomeStreamsFilters } from './IncomeStreamsFilters';
import { IncomeStreamCard } from './IncomeStreamCard';
import { IncomeStreamRow } from './IncomeStreamRow';
import { IncomeStreamsService, type IncomeStream, type CreateIncomeStreamData, type UpdateIncomeStreamData } from '@/services/incomeStreams.service';
import IncomeStreamModal from '@/components/IncomeStreamModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export function IncomeStreamsList() {
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    stream: IncomeStream | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    stream: null,
    isLoading: false
  });

  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    category: 'all',
    sortBy: 'revenue',
    sortOrder: 'desc',
    viewMode: 'grid',
    searchQuery: '',
  });

  // Fetch income streams from Supabase
  const fetchIncomeStreams = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await IncomeStreamsService.getAll();
    
    if (fetchError) {
      setError(fetchError);
      console.error('Failed to fetch income streams:', fetchError);
    } else {
      setIncomeStreams(data || []);
    }
    
    setIsLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchIncomeStreams();
  }, []);

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
  }, [incomeStreams, filters]);

  // Handle creating new income stream
  const handleCreate = async (data: CreateIncomeStreamData) => {
    setIsSubmitting(true);
    
    const { data: newStream, error: createError } = await IncomeStreamsService.create(data);
    
    if (createError) {
      setError(createError);
      console.error('Failed to create income stream:', createError);
    } else if (newStream) {
      setIncomeStreams(prev => [newStream, ...prev]);
      setIsModalOpen(false);
      setEditingStream(null);
    }
    
    setIsSubmitting(false);
  };

  // Handle updating income stream
  const handleUpdate = async (data: UpdateIncomeStreamData) => {
    if (!editingStream) return;
    
    setIsSubmitting(true);
    
    const { data: updatedStream, error: updateError } = await IncomeStreamsService.update(editingStream.id, data);
    
    if (updateError) {
      setError(updateError);
      console.error('Failed to update income stream:', updateError);
    } else if (updatedStream) {
      setIncomeStreams(prev => 
        prev.map(stream => 
          stream.id === updatedStream.id ? updatedStream : stream
        )
      );
      setIsModalOpen(false);
      setEditingStream(null);
    }
    
    setIsSubmitting(false);
  };

  // Unified submit handler for the modal
  const handleModalSubmit = async (data: CreateIncomeStreamData | UpdateIncomeStreamData) => {
    if (editingStream) {
      await handleUpdate(data as UpdateIncomeStreamData);
    } else {
      await handleCreate(data as CreateIncomeStreamData);
    }
  };

  // Handle deleting income stream
  const handleDelete = async () => {
    if (!deleteDialog.stream) return;
    
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    const { success, error: deleteError } = await IncomeStreamsService.delete(deleteDialog.stream.id);
    
    if (deleteError) {
      setError(deleteError);
      console.error('Failed to delete income stream:', deleteError);
    } else if (success) {
      setIncomeStreams(prev => 
        prev.filter(stream => stream.id !== deleteDialog.stream?.id)
      );
      setDeleteDialog({ isOpen: false, stream: null, isLoading: false });
    }
    
    setDeleteDialog(prev => ({ ...prev, isLoading: false }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingStream(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (stream: IncomeStream) => {
    setEditingStream(stream);
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (stream: IncomeStream) => {
    setDeleteDialog({
      isOpen: true,
      stream,
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
              Error loading income streams
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={fetchIncomeStreams}
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
      <IncomeStreamsFilters onFilterChange={setFilters} />

      {/* Add New Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Income Streams ({filteredAndSortedStreams.length})
          </h2>
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading income streams...
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
          Add Income Stream
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading income streams...</p>
        </div>
      ) : filteredAndSortedStreams.length === 0 ? (
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
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
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
                  <IncomeStreamRow 
                    key={stream.id} 
                    stream={stream}
                    onEdit={() => openEditModal(stream)}
                    onDelete={() => openDeleteDialog(stream)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedStreams.map((stream) => (
            <IncomeStreamCard 
              key={stream.id} 
              stream={stream}
              onEdit={() => openEditModal(stream)}
              onDelete={() => openDeleteDialog(stream)}
            />
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <IncomeStreamModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStream(null);
        }}
        onSubmit={handleModalSubmit}
        editStream={editingStream}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, stream: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Delete Income Stream"
        message={`Are you sure you want to delete "${deleteDialog.stream?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteDialog.isLoading}
        type="danger"
      />
    </div>
  );
} 