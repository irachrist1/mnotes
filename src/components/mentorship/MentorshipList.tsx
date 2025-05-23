'use client';

import { useState, useMemo, useEffect } from 'react';
import { MentorshipFilterState, MentorshipFilters } from './MentorshipFilters';
import { MentorshipCard } from './MentorshipCard';
import { MentorshipRow } from './MentorshipRow';
import { MentorshipService, type MentorshipSession, type CreateMentorshipSessionData, type UpdateMentorshipSessionData } from '@/services/mentorship.service';
import MentorshipModal from '@/components/MentorshipModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export function MentorshipList() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<MentorshipSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    session: MentorshipSession | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    session: null,
    isLoading: false
  });

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

  // Fetch mentorship sessions from Supabase
  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await MentorshipService.getAll();
    
    if (fetchError) {
      setError(fetchError);
      console.error('Failed to fetch mentorship sessions:', fetchError);
    } else {
      setSessions(data || []);
    }
    
    setIsLoading(false);
  };

  // Load data on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      // Session Type filter
      if (filters.sessionType !== 'all' && session.sessionType !== filters.sessionType) {
        return false;
      }

      // Mentor filter
      if (filters.mentor !== 'all' && session.mentorName !== filters.mentor) {
        return false;
      }

      // Rating filter
      if (filters.rating !== 'all') {
        const rating = session.rating;
        if (filters.rating === '8+' && rating < 8) return false;
        if (filters.rating === '6-7' && (rating < 6 || rating > 7)) return false;
        if (filters.rating === '5-' && rating > 5) return false;
      }

      // Action Items Status filter
      if (filters.actionItemsStatus !== 'all') {
        const pendingActions = session.actionItems.filter(item => !item.completed);
        if (filters.actionItemsStatus === 'pending' && pendingActions.length === 0) return false;
        if (filters.actionItemsStatus === 'completed' && pendingActions.length > 0) return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          session.mentorName,
          session.sessionType,
          session.notes,
          ...session.topics,
          ...session.keyInsights,
          ...session.actionItems.map(item => item.task)
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
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'mentor':
          aValue = a.mentorName.toLowerCase();
          bValue = b.mentorName.toLowerCase();
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
  }, [sessions, filters]);

  // Handle creating new session
  const handleCreate = async (data: CreateMentorshipSessionData) => {
    setIsSubmitting(true);
    
    const { data: newSession, error: createError } = await MentorshipService.create(data);
    
    if (createError) {
      setError(createError);
      console.error('Failed to create mentorship session:', createError);
    } else if (newSession) {
      setSessions(prev => [newSession, ...prev]);
      setIsModalOpen(false);
      setEditingSession(null);
    }
    
    setIsSubmitting(false);
  };

  // Handle updating session
  const handleUpdate = async (data: UpdateMentorshipSessionData) => {
    if (!editingSession) return;
    
    setIsSubmitting(true);
    
    const { data: updatedSession, error: updateError } = await MentorshipService.update(editingSession.id, data);
    
    if (updateError) {
      setError(updateError);
      console.error('Failed to update mentorship session:', updateError);
    } else if (updatedSession) {
      setSessions(prev => 
        prev.map(session => 
          session.id === updatedSession.id ? updatedSession : session
        )
      );
      setIsModalOpen(false);
      setEditingSession(null);
    }
    
    setIsSubmitting(false);
  };

  // Unified submit handler for the modal
  const handleModalSubmit = async (data: CreateMentorshipSessionData | UpdateMentorshipSessionData) => {
    if (editingSession) {
      await handleUpdate(data as UpdateMentorshipSessionData);
    } else {
      await handleCreate(data as CreateMentorshipSessionData);
    }
  };

  // Handle deleting session
  const handleDelete = async () => {
    if (!deleteDialog.session) return;
    
    setDeleteDialog(prev => ({ ...prev, isLoading: true }));
    
    const { success, error: deleteError } = await MentorshipService.delete(deleteDialog.session.id);
    
    if (deleteError) {
      setError(deleteError);
      console.error('Failed to delete mentorship session:', deleteError);
    } else if (success) {
      setSessions(prev => 
        prev.filter(session => session.id !== deleteDialog.session?.id)
      );
      setDeleteDialog({ isOpen: false, session: null, isLoading: false });
    }
    
    setDeleteDialog(prev => ({ ...prev, isLoading: false }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (session: MentorshipSession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  // Open delete confirmation
  const openDeleteDialog = (session: MentorshipSession) => {
    setDeleteDialog({
      isOpen: true,
      session,
      isLoading: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <MentorshipFilters onFilterChange={setFilters} />

      {/* Add New Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mentorship Sessions ({filteredAndSortedSessions.length})
          </h2>
          {isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading mentorship sessions...
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
          Log New Session
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading mentorship sessions...</p>
        </div>
      ) : filteredAndSortedSessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No mentorship sessions found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {filters.searchQuery || filters.sessionType !== 'all' || filters.mentor !== 'all' || filters.rating !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Get started by logging your first mentorship session.'}
          </p>
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log New Session
          </button>
        </div>
      ) : (
        // Grid View
        filters.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSessions.map((session) => (
              <MentorshipCard 
                key={session.id} 
                session={session}
                onEdit={() => openEditModal(session)}
                onDelete={() => openDeleteDialog(session)}
              />
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Mentor & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Topics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Key Insights
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {filteredAndSortedSessions.map((session) => (
                    <MentorshipRow 
                      key={session.id} 
                      session={session}
                      onEdit={() => openEditModal(session)}
                      onDelete={() => openDeleteDialog(session)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal for Create/Edit */}
      <MentorshipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleModalSubmit}
        editSession={editingSession}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, session: null, isLoading: false })}
        onConfirm={handleDelete}
        title="Delete Mentorship Session"
        message={`Are you sure you want to delete the session with "${deleteDialog.session?.mentorName}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteDialog.isLoading}
        type="danger"
      />
    </div>
  );
} 