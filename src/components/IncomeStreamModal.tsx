'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { IncomeStream, CreateIncomeStreamData, UpdateIncomeStreamData } from '@/services/incomeStreams.service'

interface IncomeStreamModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateIncomeStreamData | UpdateIncomeStreamData) => Promise<void>
  editStream?: IncomeStream | null
  isLoading?: boolean
}

export default function IncomeStreamModal({
  isOpen,
  onClose,
  onSubmit,
  editStream = null,
  isLoading = false
}: IncomeStreamModalProps) {
  const [formData, setFormData] = useState<CreateIncomeStreamData>({
    name: '',
    category: 'employment',
    status: 'planned',
    monthlyRevenue: 0,
    timeInvestment: 0,
    growthRate: 0,
    notes: '',
    clientInfo: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill form when editing
  useEffect(() => {
    if (editStream) {
      setFormData({
        name: editStream.name,
        category: editStream.category,
        status: editStream.status,
        monthlyRevenue: editStream.monthlyRevenue,
        timeInvestment: editStream.timeInvestment,
        growthRate: editStream.growthRate,
        notes: editStream.notes || '',
        clientInfo: editStream.clientInfo || ''
      })
    } else {
      // Reset form for new stream
      setFormData({
        name: '',
        category: 'employment',
        status: 'planned',
        monthlyRevenue: 0,
        timeInvestment: 0,
        growthRate: 0,
        notes: '',
        clientInfo: ''
      })
    }
    setErrors({})
  }, [editStream, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Income stream name is required'
    }

    if (formData.monthlyRevenue < 0) {
      newErrors.monthlyRevenue = 'Monthly revenue cannot be negative'
    }

    if (formData.timeInvestment < 0) {
      newErrors.timeInvestment = 'Time investment cannot be negative'
    }

    if (formData.growthRate < -100) {
      newErrors.growthRate = 'Growth rate cannot be less than -100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleInputChange = (field: keyof CreateIncomeStreamData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editStream ? 'Edit Income Stream' : 'Add New Income Stream'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Income Stream Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Consulting Work, Employment, Newsletter"
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="employment">Employment</option>
                  <option value="consulting">Consulting</option>
                  <option value="content">Content</option>
                  <option value="product">Product</option>
                  <option value="project-based">Project-based</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="active">Active</option>
                  <option value="developing">Developing</option>
                  <option value="planned">Planned</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Revenue ($)
                </label>
                <input
                  type="number"
                  id="monthlyRevenue"
                  value={formData.monthlyRevenue}
                  onChange={(e) => handleInputChange('monthlyRevenue', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.monthlyRevenue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
                {errors.monthlyRevenue && <p className="mt-1 text-sm text-red-600">{errors.monthlyRevenue}</p>}
              </div>

              <div>
                <label htmlFor="timeInvestment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Investment (hrs/week)
                </label>
                <input
                  type="number"
                  id="timeInvestment"
                  value={formData.timeInvestment}
                  onChange={(e) => handleInputChange('timeInvestment', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.timeInvestment ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  disabled={isLoading}
                />
                {errors.timeInvestment && <p className="mt-1 text-sm text-red-600">{errors.timeInvestment}</p>}
              </div>

              <div>
                <label htmlFor="growthRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Growth Rate (%)
                </label>
                <input
                  type="number"
                  id="growthRate"
                  value={formData.growthRate}
                  onChange={(e) => handleInputChange('growthRate', Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.growthRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.1"
                  disabled={isLoading}
                />
                {errors.growthRate && <p className="mt-1 text-sm text-red-600">{errors.growthRate}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Additional details about this income stream..."
                disabled={isLoading}
              />
            </div>

            {/* Client Info */}
            <div>
              <label htmlFor="clientInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client/Company Information
              </label>
              <input
                type="text"
                id="clientInfo"
                value={formData.clientInfo}
                onChange={(e) => handleInputChange('clientInfo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Company name, client details"
                disabled={isLoading}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-600">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editStream ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editStream ? 'Update Stream' : 'Create Stream'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 