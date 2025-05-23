import { supabase } from '@/utils/supabase'
import type { IdeaRow, IdeaInsert, IdeaUpdate } from '@/utils/supabase'

export interface Idea {
  id: string
  title: string
  description: string
  category: string
  stage: 'raw-thought' | 'researching' | 'validating' | 'developing' | 'testing' | 'launched'
  potentialRevenue: 'low' | 'medium' | 'high' | 'very-high'
  implementationComplexity: 1 | 2 | 3 | 4 | 5
  timeToMarket: string
  requiredSkills: string[]
  marketSize: string
  competitionLevel: 'low' | 'medium' | 'high'
  aiRelevance: boolean
  hardwareComponent: boolean
  relatedIncomeStream?: string
  sourceOfInspiration: string
  nextSteps: string[]
  tags: string[]
  createdDate: string
  lastUpdated: string
}

export interface CreateIdeaData {
  title: string
  description: string
  category: string
  stage: 'raw-thought' | 'researching' | 'validating' | 'developing' | 'testing' | 'launched'
  potentialRevenue: 'low' | 'medium' | 'high' | 'very-high'
  implementationComplexity: 1 | 2 | 3 | 4 | 5
  timeToMarket: string
  requiredSkills: string[]
  marketSize: string
  competitionLevel: 'low' | 'medium' | 'high'
  aiRelevance: boolean
  hardwareComponent: boolean
  relatedIncomeStream?: string
  sourceOfInspiration: string
  nextSteps: string[]
  tags: string[]
}

export interface UpdateIdeaData extends Partial<CreateIdeaData> {}

// Transform Supabase row to frontend format
function transformIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    stage: row.stage,
    potentialRevenue: row.potential_revenue,
    implementationComplexity: row.implementation_complexity,
    timeToMarket: row.time_to_market,
    requiredSkills: row.required_skills,
    marketSize: row.market_size,
    competitionLevel: row.competition_level,
    aiRelevance: row.ai_relevance,
    hardwareComponent: row.hardware_component,
    relatedIncomeStream: row.related_income_stream || undefined,
    sourceOfInspiration: row.source_of_inspiration,
    nextSteps: row.next_steps,
    tags: row.tags,
    createdDate: row.created_date,
    lastUpdated: row.last_updated
  }
}

// Transform frontend data to Supabase format
function transformToSupabaseInsert(data: CreateIdeaData): IdeaInsert {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    stage: data.stage,
    potential_revenue: data.potentialRevenue,
    implementation_complexity: data.implementationComplexity,
    time_to_market: data.timeToMarket,
    required_skills: data.requiredSkills,
    market_size: data.marketSize,
    competition_level: data.competitionLevel,
    ai_relevance: data.aiRelevance,
    hardware_component: data.hardwareComponent,
    related_income_stream: data.relatedIncomeStream,
    source_of_inspiration: data.sourceOfInspiration,
    next_steps: data.nextSteps,
    tags: data.tags,
    created_date: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
}

function transformToSupabaseUpdate(data: UpdateIdeaData): IdeaUpdate {
  const update: IdeaUpdate = {}
  
  if (data.title !== undefined) update.title = data.title
  if (data.description !== undefined) update.description = data.description
  if (data.category !== undefined) update.category = data.category
  if (data.stage !== undefined) update.stage = data.stage
  if (data.potentialRevenue !== undefined) update.potential_revenue = data.potentialRevenue
  if (data.implementationComplexity !== undefined) update.implementation_complexity = data.implementationComplexity
  if (data.timeToMarket !== undefined) update.time_to_market = data.timeToMarket
  if (data.requiredSkills !== undefined) update.required_skills = data.requiredSkills
  if (data.marketSize !== undefined) update.market_size = data.marketSize
  if (data.competitionLevel !== undefined) update.competition_level = data.competitionLevel
  if (data.aiRelevance !== undefined) update.ai_relevance = data.aiRelevance
  if (data.hardwareComponent !== undefined) update.hardware_component = data.hardwareComponent
  if (data.relatedIncomeStream !== undefined) update.related_income_stream = data.relatedIncomeStream
  if (data.sourceOfInspiration !== undefined) update.source_of_inspiration = data.sourceOfInspiration
  if (data.nextSteps !== undefined) update.next_steps = data.nextSteps
  if (data.tags !== undefined) update.tags = data.tags
  
  // Always update last_updated timestamp
  update.last_updated = new Date().toISOString()
  
  return update
}

export class IdeasService {
  
  /**
   * Fetch all ideas
   */
  static async getAll(): Promise<{ data: Idea[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('last_updated', { ascending: false })
      
      if (error) {
        console.error('Error fetching ideas:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformIdea) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching ideas:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch ideas by stage
   */
  static async getByStage(stage: Idea['stage']): Promise<{ data: Idea[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('stage', stage)
        .order('last_updated', { ascending: false })
      
      if (error) {
        console.error('Error fetching ideas by stage:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformIdea) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching ideas by stage:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch a single idea by ID
   */
  static async getById(id: string): Promise<{ data: Idea | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching idea:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIdea(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching idea:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Create a new idea
   */
  static async create(ideaData: CreateIdeaData): Promise<{ data: Idea | null; error: string | null }> {
    try {
      const insertData = transformToSupabaseInsert(ideaData)
      
      const { data, error } = await supabase
        .from('ideas')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating idea:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIdea(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error creating idea:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Update an existing idea
   */
  static async update(id: string, updateData: UpdateIdeaData): Promise<{ data: Idea | null; error: string | null }> {
    try {
      const supabaseUpdate = transformToSupabaseUpdate(updateData)
      
      const { data, error } = await supabase
        .from('ideas')
        .update(supabaseUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating idea:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIdea(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error updating idea:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Delete an idea
   */
  static async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting idea:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error deleting idea:', err)
      return { success: false, error: errorMessage }
    }
  }
  
  /**
   * Get ideas statistics
   */
  static async getStats(): Promise<{ 
    data: { 
      totalIdeas: number;
      aiRelevantIdeas: number;
      hardwareComponentIdeas: number;
      byStage: Record<string, number>;
      byRevenuePotential: Record<string, number>;
      averageComplexity: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('stage, potential_revenue, implementation_complexity, ai_relevance, hardware_component')
      
      if (error) {
        console.error('Error fetching ideas stats:', error)
        return { data: null, error: error.message }
      }
      
      const stats = data.reduce((acc, idea) => {
        // Count by stage
        acc.byStage[idea.stage] = (acc.byStage[idea.stage] || 0) + 1
        
        // Count by revenue potential
        acc.byRevenuePotential[idea.potential_revenue] = (acc.byRevenuePotential[idea.potential_revenue] || 0) + 1
        
        // AI relevance count
        if (idea.ai_relevance) {
          acc.aiRelevantIdeas += 1
        }
        
        // Hardware component count
        if (idea.hardware_component) {
          acc.hardwareComponentIdeas += 1
        }
        
        // Complexity total for average
        acc.totalComplexity += idea.implementation_complexity
        
        return acc
      }, {
        totalIdeas: data.length,
        aiRelevantIdeas: 0,
        hardwareComponentIdeas: 0,
        byStage: {} as Record<string, number>,
        byRevenuePotential: {} as Record<string, number>,
        totalComplexity: 0
      })
      
      const averageComplexity = data.length > 0 ? stats.totalComplexity / data.length : 0
      
      return {
        data: {
          totalIdeas: stats.totalIdeas,
          aiRelevantIdeas: stats.aiRelevantIdeas,
          hardwareComponentIdeas: stats.hardwareComponentIdeas,
          byStage: stats.byStage,
          byRevenuePotential: stats.byRevenuePotential,
          averageComplexity
        },
        error: null
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching ideas stats:', err)
      return { data: null, error: errorMessage }
    }
  }
}

// Export a singleton instance for consistency with other services
export const ideasService = {
  getAll: () => IdeasService.getAll(),
  getById: (id: string) => IdeasService.getById(id),
  getByStage: (stage: Idea['stage']) => IdeasService.getByStage(stage),
  create: (data: CreateIdeaData) => IdeasService.create(data),
  update: (id: string, data: UpdateIdeaData) => IdeasService.update(id, data),
  delete: (id: string) => IdeasService.delete(id),
  getStats: () => IdeasService.getStats()
}; 