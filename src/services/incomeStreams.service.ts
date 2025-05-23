import { supabase } from '@/utils/supabase'
import type { IncomeStreamRow, IncomeStreamInsert, IncomeStreamUpdate } from '@/utils/supabase'

export interface IncomeStream {
  id: string
  name: string
  category: 'consulting' | 'employment' | 'content' | 'product' | 'project-based'
  status: 'active' | 'developing' | 'planned' | 'paused'
  monthlyRevenue: number
  timeInvestment: number
  growthRate: number
  notes?: string
  clientInfo?: string
  createdAt: string
}

export interface CreateIncomeStreamData {
  name: string
  category: 'consulting' | 'employment' | 'content' | 'product' | 'project-based'
  status: 'active' | 'developing' | 'planned' | 'paused'
  monthlyRevenue: number
  timeInvestment: number
  growthRate: number
  notes?: string
  clientInfo?: string
}

export interface UpdateIncomeStreamData extends Partial<CreateIncomeStreamData> {}

// Transform Supabase row to frontend format
function transformIncomeStream(row: IncomeStreamRow): IncomeStream {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status,
    monthlyRevenue: Number(row.monthly_revenue),
    timeInvestment: row.time_investment,
    growthRate: Number(row.growth_rate),
    notes: row.notes || undefined,
    clientInfo: row.client_info || undefined,
    createdAt: row.created_at
  }
}

// Transform frontend data to Supabase format
function transformToSupabaseInsert(data: CreateIncomeStreamData): IncomeStreamInsert {
  return {
    name: data.name,
    category: data.category,
    status: data.status,
    monthly_revenue: data.monthlyRevenue,
    time_investment: data.timeInvestment,
    growth_rate: data.growthRate,
    notes: data.notes,
    client_info: data.clientInfo
  }
}

function transformToSupabaseUpdate(data: UpdateIncomeStreamData): IncomeStreamUpdate {
  const update: IncomeStreamUpdate = {}
  
  if (data.name !== undefined) update.name = data.name
  if (data.category !== undefined) update.category = data.category
  if (data.status !== undefined) update.status = data.status
  if (data.monthlyRevenue !== undefined) update.monthly_revenue = data.monthlyRevenue
  if (data.timeInvestment !== undefined) update.time_investment = data.timeInvestment
  if (data.growthRate !== undefined) update.growth_rate = data.growthRate
  if (data.notes !== undefined) update.notes = data.notes
  if (data.clientInfo !== undefined) update.client_info = data.clientInfo
  
  return update
}

export class IncomeStreamsService {
  
  /**
   * Fetch all income streams
   */
  static async getAll(): Promise<{ data: IncomeStream[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('income_streams')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching income streams:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformIncomeStream) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching income streams:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch income streams by status
   */
  static async getByStatus(status: IncomeStream['status']): Promise<{ data: IncomeStream[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('income_streams')
        .select('*')
        .eq('status', status)
        .order('monthly_revenue', { ascending: false })
      
      if (error) {
        console.error('Error fetching income streams by status:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformIncomeStream) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching income streams by status:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch a single income stream by ID
   */
  static async getById(id: string): Promise<{ data: IncomeStream | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('income_streams')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching income stream:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIncomeStream(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching income stream:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Create a new income stream
   */
  static async create(streamData: CreateIncomeStreamData): Promise<{ data: IncomeStream | null; error: string | null }> {
    try {
      const insertData = transformToSupabaseInsert(streamData)
      
      const { data, error } = await supabase
        .from('income_streams')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating income stream:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIncomeStream(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error creating income stream:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Update an existing income stream
   */
  static async update(id: string, updateData: UpdateIncomeStreamData): Promise<{ data: IncomeStream | null; error: string | null }> {
    try {
      const supabaseUpdate = transformToSupabaseUpdate(updateData)
      
      const { data, error } = await supabase
        .from('income_streams')
        .update(supabaseUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating income stream:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformIncomeStream(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error updating income stream:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Delete an income stream
   */
  static async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('income_streams')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting income stream:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error deleting income stream:', err)
      return { success: false, error: errorMessage }
    }
  }
  
  /**
   * Get income stream statistics
   */
  static async getStats(): Promise<{ 
    data: { 
      totalRevenue: number; 
      activeStreams: number; 
      averageGrowthRate: number; 
      totalTimeInvestment: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('income_streams')
        .select('monthly_revenue, status, growth_rate, time_investment')
      
      if (error) {
        console.error('Error fetching income stream stats:', error)
        return { data: null, error: error.message }
      }
      
      const stats = data.reduce((acc, stream) => {
        acc.totalRevenue += Number(stream.monthly_revenue) || 0
        acc.totalTimeInvestment += stream.time_investment || 0
        acc.totalGrowthRate += Number(stream.growth_rate) || 0
        
        if (stream.status === 'active') {
          acc.activeStreams += 1
        }
        
        return acc
      }, {
        totalRevenue: 0,
        activeStreams: 0,
        totalGrowthRate: 0,
        totalTimeInvestment: 0
      })
      
      const averageGrowthRate = data.length > 0 ? stats.totalGrowthRate / data.length : 0
      
      return {
        data: {
          totalRevenue: stats.totalRevenue,
          activeStreams: stats.activeStreams,
          averageGrowthRate,
          totalTimeInvestment: stats.totalTimeInvestment
        },
        error: null
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching income stream stats:', err)
      return { data: null, error: errorMessage }
    }
  }
}

// Export a singleton instance for consistency with other services
export const incomeStreamsService = {
  getAll: () => IncomeStreamsService.getAll(),
  getById: (id: string) => IncomeStreamsService.getById(id),
  getByStatus: (status: IncomeStream['status']) => IncomeStreamsService.getByStatus(status),
  create: (data: CreateIncomeStreamData) => IncomeStreamsService.create(data),
  update: (id: string, data: UpdateIncomeStreamData) => IncomeStreamsService.update(id, data),
  delete: (id: string) => IncomeStreamsService.delete(id),
  getStats: () => IncomeStreamsService.getStats()
}; 