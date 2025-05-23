'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { MentorshipSession, CreateMentorshipSessionData, UpdateMentorshipSessionData } from '@/services/mentorship.service'

interface MentorshipModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMentorshipSessionData | UpdateMentorshipSessionData) => Promise<void>
  editSession?: MentorshipSession | null
  isLoading?: boolean
}

export default function MentorshipModal({
  isOpen,
  onClose,
  onSubmit,
  editSession,
  isLoading = false,
}: MentorshipModalProps) {
  const [formData, setFormData] = useState<CreateMentorshipSessionData>({
    mentorName: '',
    date: new Date().toISOString().split('T')[0],
    duration: 30,
    sessionType: 'receiving',
    topics: [],
    keyInsights: [],
    actionItems: [],
    rating: 8,
    notes: '',
  })

  const [currentTopic, setCurrentTopic] = useState('')
  const [currentInsight, setCurrentInsight] = useState('')
  const [currentActionItem, setCurrentActionItem] = useState({
    task: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    completed: false,
    dueDate: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or editSession changes
  useEffect(() => {
    if (isOpen) {
      if (editSession) {
        setFormData({
          mentorName: editSession.mentorName,
          date: editSession.date,
          duration: editSession.duration,
          sessionType: editSession.sessionType,
          topics: [...editSession.topics],
          keyInsights: [...editSession.keyInsights],
          actionItems: editSession.actionItems.map(item => ({ ...item })),
          rating: editSession.rating,
          notes: editSession.notes,
        })
      } else {
        setFormData({
          mentorName: '',
          date: new Date().toISOString().split('T')[0],
          duration: 30,
          sessionType: 'receiving',
          topics: [],
          keyInsights: [],
          actionItems: [],
          rating: 8,
          notes: '',
        })
      }
      setErrors({})
      setCurrentTopic('')
      setCurrentInsight('')
      setCurrentActionItem({
        task: '',
        priority: 'medium',
        completed: false,
        dueDate: '',
      })
    }
  }, [isOpen, editSession])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.mentorName.trim()) {
      newErrors.mentorName = 'Mentor name is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute'
    }

    if (formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = 'Rating must be between 1 and 10'
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Add action item IDs if they don't exist
    const processedActionItems = formData.actionItems.map(item => ({
      ...item,
      id: item.id || `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))

    const submitData = {
      ...formData,
      actionItems: processedActionItems,
    }

    try {
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error submitting mentorship session:', error)
    }
  }

  const addTopic = () => {
    if (currentTopic.trim() && !formData.topics.includes(currentTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, currentTopic.trim()]
      }))
      setCurrentTopic('')
    }
  }

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }))
  }

  const addInsight = () => {
    if (currentInsight.trim() && !formData.keyInsights.includes(currentInsight.trim())) {
      setFormData(prev => ({
        ...prev,
        keyInsights: [...prev.keyInsights, currentInsight.trim()]
      }))
      setCurrentInsight('')
    }
  }

  const removeInsight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyInsights: prev.keyInsights.filter((_, i) => i !== index)
    }))
  }

  const addActionItem = () => {
    if (currentActionItem.task.trim()) {
      const newActionItem = {
        ...currentActionItem,
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task: currentActionItem.task.trim(),
      }
      setFormData(prev => ({
        ...prev,
        actionItems: [...prev.actionItems, newActionItem]
      }))
      setCurrentActionItem({
        task: '',
        priority: 'medium',
        completed: false,
        dueDate: '',
      })
    }
  }

  const removeActionItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== index)
    }))
  }

  const toggleActionItemCompletion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actionItems: prev.actionItems.map((item, i) => 
        i === index ? { ...item, completed: !item.completed } : item
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {editSession ? 'Edit Mentorship Session' : 'Log New Mentorship Session'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mentor Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mentor Name *
              </label>
              <input
                type="text"
                value={formData.mentorName}
                onChange={(e) => setFormData(prev => ({ ...prev, mentorName: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                  errors.mentorName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="Enter mentor's name"
              />
              {errors.mentorName && (
                <p className="text-red-500 text-sm mt-1">{errors.mentorName}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                  errors.date ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                  errors.duration ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="30"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Session Type *
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value as 'giving' | 'receiving' }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="receiving">Receiving Mentorship</option>
                <option value="giving">Giving Mentorship</option>
              </select>
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Topics Discussed
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Add a topic..."
              />
              <Button type="button" onClick={addTopic} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Key Insights
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentInsight}
                onChange={(e) => setCurrentInsight(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInsight())}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Add a key insight..."
              />
              <Button type="button" onClick={addInsight} variant="outline">
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.keyInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <p className="text-sm text-slate-900 dark:text-slate-100 flex-1">{insight}</p>
                  <button
                    type="button"
                    onClick={() => removeInsight(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Action Items
            </label>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2">
              <input
                type="text"
                value={currentActionItem.task}
                onChange={(e) => setCurrentActionItem(prev => ({ ...prev, task: e.target.value }))}
                className="md:col-span-6 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Add action item..."
              />
              <select
                value={currentActionItem.priority}
                onChange={(e) => setCurrentActionItem(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="md:col-span-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={currentActionItem.dueDate}
                onChange={(e) => setCurrentActionItem(prev => ({ ...prev, dueDate: e.target.value }))}
                className="md:col-span-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
              <Button type="button" onClick={addActionItem} variant="outline" className="md:col-span-2">
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.actionItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleActionItemCompletion(index)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${item.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                        {item.task}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`px-2 py-1 rounded ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        }`}>
                          {item.priority}
                        </span>
                        {item.dueDate && <span>Due: {item.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActionItem(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Session Rating (1-10) *
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="10"
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 min-w-[2rem]">
                {formData.rating}
              </span>
            </div>
            {errors.rating && (
              <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Session Notes *
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                errors.notes ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="Detailed notes about the session..."
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : editSession ? 'Update Session' : 'Log Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 