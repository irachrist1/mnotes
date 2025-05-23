'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { Idea, CreateIdeaData, UpdateIdeaData } from '@/services/ideas.service'

interface IdeaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateIdeaData | UpdateIdeaData) => Promise<void>
  editIdea?: Idea | null
  isLoading?: boolean
}

export default function IdeaModal({
  isOpen,
  onClose,
  onSubmit,
  editIdea = null,
  isLoading = false
}: IdeaModalProps) {
  const [formData, setFormData] = useState<CreateIdeaData>({
    title: '',
    description: '',
    category: '',
    stage: 'raw-thought',
    potentialRevenue: 'medium',
    implementationComplexity: 3,
    timeToMarket: '',
    requiredSkills: [],
    marketSize: '',
    competitionLevel: 'medium',
    aiRelevance: false,
    hardwareComponent: false,
    relatedIncomeStream: '',
    sourceOfInspiration: '',
    nextSteps: [],
    tags: []
  })

  const [skillsInput, setSkillsInput] = useState('')
  const [nextStepsInput, setNextStepsInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill form when editing
  useEffect(() => {
    if (editIdea) {
      setFormData({
        title: editIdea.title,
        description: editIdea.description,
        category: editIdea.category,
        stage: editIdea.stage,
        potentialRevenue: editIdea.potentialRevenue,
        implementationComplexity: editIdea.implementationComplexity,
        timeToMarket: editIdea.timeToMarket,
        requiredSkills: editIdea.requiredSkills,
        marketSize: editIdea.marketSize,
        competitionLevel: editIdea.competitionLevel,
        aiRelevance: editIdea.aiRelevance,
        hardwareComponent: editIdea.hardwareComponent,
        relatedIncomeStream: editIdea.relatedIncomeStream || '',
        sourceOfInspiration: editIdea.sourceOfInspiration,
        nextSteps: editIdea.nextSteps,
        tags: editIdea.tags
      })
      setSkillsInput(editIdea.requiredSkills.join(', '))
      setNextStepsInput(editIdea.nextSteps.join('\n'))
      setTagsInput(editIdea.tags.join(', '))
    } else {
      // Reset form for new idea
      setFormData({
        title: '',
        description: '',
        category: '',
        stage: 'raw-thought',
        potentialRevenue: 'medium',
        implementationComplexity: 3,
        timeToMarket: '',
        requiredSkills: [],
        marketSize: '',
        competitionLevel: 'medium',
        aiRelevance: false,
        hardwareComponent: false,
        relatedIncomeStream: '',
        sourceOfInspiration: '',
        nextSteps: [],
        tags: []
      })
      setSkillsInput('')
      setNextStepsInput('')
      setTagsInput('')
    }
    setErrors({})
  }, [editIdea, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Idea title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (!formData.timeToMarket.trim()) {
      newErrors.timeToMarket = 'Time to market is required'
    }

    if (!formData.marketSize.trim()) {
      newErrors.marketSize = 'Market size is required'
    }

    if (!formData.sourceOfInspiration.trim()) {
      newErrors.sourceOfInspiration = 'Source of inspiration is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Parse array fields
    const finalData = {
      ...formData,
      requiredSkills: skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(s => s) : [],
      nextSteps: nextStepsInput ? nextStepsInput.split('\n').map(s => s.trim()).filter(s => s) : [],
      tags: tagsInput ? tagsInput.split(',').map(s => s.trim()).filter(s => s) : []
    }

    try {
      await onSubmit(finalData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleInputChange = (field: keyof CreateIdeaData, value: any) => {
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editIdea ? 'Edit Idea' : 'Add New Idea'}
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idea Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., AI-Powered Smart Building Assessment Platform"
                  disabled={isLoading}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., B2B SaaS, Content Platform, API Service"
                  disabled={isLoading}
                />
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Stage */}
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Stage
                </label>
                <select
                  id="stage"
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="raw-thought">Raw Thought</option>
                  <option value="researching">Researching</option>
                  <option value="validating">Validating</option>
                  <option value="developing">Developing</option>
                  <option value="testing">Testing</option>
                  <option value="launched">Launched</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your idea in detail..."
                disabled={isLoading}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Revenue & Market Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="potentialRevenue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Revenue Potential
                </label>
                <select
                  id="potentialRevenue"
                  value={formData.potentialRevenue}
                  onChange={(e) => handleInputChange('potentialRevenue', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="very-high">Very High</option>
                </select>
              </div>

              <div>
                <label htmlFor="implementationComplexity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complexity (1-5)
                </label>
                <select
                  id="implementationComplexity"
                  value={formData.implementationComplexity}
                  onChange={(e) => handleInputChange('implementationComplexity', Number(e.target.value) as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value={1}>1 - Very Simple</option>
                  <option value={2}>2 - Simple</option>
                  <option value={3}>3 - Moderate</option>
                  <option value={4}>4 - Complex</option>
                  <option value={5}>5 - Very Complex</option>
                </select>
              </div>

              <div>
                <label htmlFor="competitionLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Competition Level
                </label>
                <select
                  id="competitionLevel"
                  value={formData.competitionLevel}
                  onChange={(e) => handleInputChange('competitionLevel', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Time to Market & Market Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="timeToMarket" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time to Market *
                </label>
                <input
                  type="text"
                  id="timeToMarket"
                  value={formData.timeToMarket}
                  onChange={(e) => handleInputChange('timeToMarket', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.timeToMarket ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 6-8 months, 1-2 years"
                  disabled={isLoading}
                />
                {errors.timeToMarket && <p className="mt-1 text-sm text-red-600">{errors.timeToMarket}</p>}
              </div>

              <div>
                <label htmlFor="marketSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Market Size *
                </label>
                <input
                  type="text"
                  id="marketSize"
                  value={formData.marketSize}
                  onChange={(e) => handleInputChange('marketSize', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.marketSize ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., $15B smart building market"
                  disabled={isLoading}
                />
                {errors.marketSize && <p className="mt-1 text-sm text-red-600">{errors.marketSize}</p>}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aiRelevance"
                  checked={formData.aiRelevance}
                  onChange={(e) => handleInputChange('aiRelevance', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isLoading}
                />
                <label htmlFor="aiRelevance" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  AI Relevant
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hardwareComponent"
                  checked={formData.hardwareComponent}
                  onChange={(e) => handleInputChange('hardwareComponent', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isLoading}
                />
                <label htmlFor="hardwareComponent" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Has Hardware Component
                </label>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                id="requiredSkills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., AI/ML, SaaS development, Computer vision"
                disabled={isLoading}
              />
            </div>

            {/* Source of Inspiration */}
            <div>
              <label htmlFor="sourceOfInspiration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source of Inspiration *
              </label>
              <input
                type="text"
                id="sourceOfInspiration"
                value={formData.sourceOfInspiration}
                onChange={(e) => handleInputChange('sourceOfInspiration', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.sourceOfInspiration ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Client requests, market research, personal experience"
                disabled={isLoading}
              />
              {errors.sourceOfInspiration && <p className="mt-1 text-sm text-red-600">{errors.sourceOfInspiration}</p>}
            </div>

            {/* Related Income Stream */}
            <div>
              <label htmlFor="relatedIncomeStream" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Related Income Stream (optional)
              </label>
              <input
                type="text"
                id="relatedIncomeStream"
                value={formData.relatedIncomeStream}
                onChange={(e) => handleInputChange('relatedIncomeStream', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Consulting Work, Newsletter"
                disabled={isLoading}
              />
            </div>

            {/* Next Steps */}
            <div>
              <label htmlFor="nextSteps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Next Steps (one per line)
              </label>
              <textarea
                id="nextSteps"
                value={nextStepsInput}
                onChange={(e) => setNextStepsInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Survey 50 building managers on pain points&#10;Develop MVP assessment algorithm&#10;Partner with IoT hardware vendors"
                disabled={isLoading}
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., AI, Smart Buildings, SaaS, IoT, Enterprise"
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
                    {editIdea ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editIdea ? 'Update Idea' : 'Create Idea'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 