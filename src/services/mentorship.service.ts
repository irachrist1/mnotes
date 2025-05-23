import { supabase } from '@/utils/supabase'
import type { MentorshipSessionRow, MentorshipSessionInsert, MentorshipSessionUpdate } from '@/utils/supabase'

export interface MentorshipSession {
  id: string
  mentorName: string
  date: string
  duration: number
  sessionType: 'giving' | 'receiving'
  topics: string[]
  keyInsights: string[]
  actionItems: {
    id: string
    task: string
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    dueDate?: string
  }[]
  rating: number
  notes: string
  createdAt: string
}

export interface CreateMentorshipSessionData {
  mentorName: string
  date: string
  duration: number
  sessionType: 'giving' | 'receiving'
  topics: string[]
  keyInsights: string[]
  actionItems: {
    id: string
    task: string
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    dueDate?: string
  }[]
  rating: number
  notes: string
}

export interface UpdateMentorshipSessionData extends Partial<CreateMentorshipSessionData> {}

// Transform Supabase row to frontend format
function transformMentorshipSession(row: MentorshipSessionRow): MentorshipSession {
  return {
    id: row.id,
    mentorName: row.mentor_name,
    date: row.date,
    duration: row.duration,
    sessionType: row.session_type,
    topics: row.topics,
    keyInsights: row.key_insights,
    actionItems: row.action_items,
    rating: row.rating,
    notes: row.notes,
    createdAt: row.created_at
  }
}

// Transform frontend data to Supabase format
function transformToSupabaseInsert(data: CreateMentorshipSessionData): MentorshipSessionInsert {
  return {
    mentor_name: data.mentorName,
    date: data.date,
    duration: data.duration,
    session_type: data.sessionType,
    topics: data.topics,
    key_insights: data.keyInsights,
    action_items: data.actionItems,
    rating: data.rating,
    notes: data.notes
  }
}

// Transform update data to Supabase format
function transformToSupabaseUpdate(data: UpdateMentorshipSessionData): MentorshipSessionUpdate {
  const update: Partial<MentorshipSessionInsert> = {}
  
  if (data.mentorName !== undefined) update.mentor_name = data.mentorName
  if (data.date !== undefined) update.date = data.date
  if (data.duration !== undefined) update.duration = data.duration
  if (data.sessionType !== undefined) update.session_type = data.sessionType
  if (data.topics !== undefined) update.topics = data.topics
  if (data.keyInsights !== undefined) update.key_insights = data.keyInsights
  if (data.actionItems !== undefined) update.action_items = data.actionItems
  if (data.rating !== undefined) update.rating = data.rating
  if (data.notes !== undefined) update.notes = data.notes
  
  return update
}

export class MentorshipService {
  
  /**
   * Fetch all mentorship sessions
   */
  static async getAll(): Promise<{ data: MentorshipSession[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) {
        console.error('Error fetching mentorship sessions:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformMentorshipSession) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching mentorship sessions:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch mentorship sessions by session type
   */
  static async getBySessionType(sessionType: MentorshipSession['sessionType']): Promise<{ data: MentorshipSession[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('session_type', sessionType)
        .order('date', { ascending: false })
      
      if (error) {
        console.error('Error fetching mentorship sessions by type:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformMentorshipSession) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching mentorship sessions by type:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch mentorship sessions by mentor
   */
  static async getByMentor(mentorName: string): Promise<{ data: MentorshipSession[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('mentor_name', mentorName)
        .order('date', { ascending: false })
      
      if (error) {
        console.error('Error fetching mentorship sessions by mentor:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data?.map(transformMentorshipSession) || []
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching mentorship sessions by mentor:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Fetch a single mentorship session by ID
   */
  static async getById(id: string): Promise<{ data: MentorshipSession | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching mentorship session:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformMentorshipSession(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching mentorship session:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Create a new mentorship session
   */
  static async create(sessionData: CreateMentorshipSessionData): Promise<{ data: MentorshipSession | null; error: string | null }> {
    try {
      const insertData = transformToSupabaseInsert(sessionData)
      
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating mentorship session:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformMentorshipSession(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error creating mentorship session:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Update an existing mentorship session
   */
  static async update(id: string, updateData: UpdateMentorshipSessionData): Promise<{ data: MentorshipSession | null; error: string | null }> {
    try {
      const supabaseUpdate = transformToSupabaseUpdate(updateData)
      
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .update(supabaseUpdate)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating mentorship session:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = transformMentorshipSession(data)
      return { data: transformedData, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error updating mentorship session:', err)
      return { data: null, error: errorMessage }
    }
  }
  
  /**
   * Delete a mentorship session
   */
  static async delete(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('mentorship_sessions')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting mentorship session:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, error: null }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error deleting mentorship session:', err)
      return { success: false, error: errorMessage }
    }
  }
  
  /**
   * Get mentorship session statistics
   */
  static async getStats(): Promise<{ 
    data: { 
      totalSessions: number;
      averageRating: number;
      totalActionItems: number;
      completedActionItems: number;
      sessionsByType: Record<string, number>;
      sessionsByMentor: Record<string, number>;
      topMentors: { name: string; sessions: number; avgRating: number }[];
    } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .select('*')
      
      if (error) {
        console.error('Error fetching mentorship session stats:', error)
        return { data: null, error: error.message }
      }
      
      const transformedData = data.map(transformMentorshipSession)
      
      const stats = transformedData.reduce((acc, session) => {
        // Count by session type
        acc.sessionsByType[session.sessionType] = (acc.sessionsByType[session.sessionType] || 0) + 1
        
        // Count by mentor
        acc.sessionsByMentor[session.mentorName] = (acc.sessionsByMentor[session.mentorName] || 0) + 1
        
        // Rating total for average
        acc.totalRating += session.rating
        
        // Action items total and completed
        acc.totalActionItems += session.actionItems.length
        acc.completedActionItems += session.actionItems.filter(item => item.completed).length
        
        return acc
      }, {
        totalSessions: transformedData.length,
        sessionsByType: {} as Record<string, number>,
        sessionsByMentor: {} as Record<string, number>,
        totalRating: 0,
        totalActionItems: 0,
        completedActionItems: 0
      })
      
      const averageRating = transformedData.length > 0 ? stats.totalRating / transformedData.length : 0
      
      // Calculate top mentors with average ratings
      const topMentors = Object.entries(stats.sessionsByMentor).map(([name, sessionCount]) => {
        const mentorSessions = transformedData.filter(s => s.mentorName === name)
        const avgRating = mentorSessions.reduce((sum, s) => sum + s.rating, 0) / mentorSessions.length
        return { name, sessions: sessionCount, avgRating }
      }).sort((a, b) => b.sessions - a.sessions).slice(0, 5)
      
      return {
        data: {
          totalSessions: stats.totalSessions,
          averageRating,
          totalActionItems: stats.totalActionItems,
          completedActionItems: stats.completedActionItems,
          sessionsByType: stats.sessionsByType,
          sessionsByMentor: stats.sessionsByMentor,
          topMentors
        },
        error: null
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Service error fetching mentorship session stats:', err)
      return { data: null, error: errorMessage }
    }
  }
}

// Export a singleton instance for consistency with other services
export const mentorshipService = {
  getAll: () => MentorshipService.getAll(),
  getById: (id: string) => MentorshipService.getById(id),
  getBySessionType: (sessionType: MentorshipSession['sessionType']) => MentorshipService.getBySessionType(sessionType),
  getByMentor: (mentorName: string) => MentorshipService.getByMentor(mentorName),
  create: (data: CreateMentorshipSessionData) => MentorshipService.create(data),
  update: (id: string, data: UpdateMentorshipSessionData) => MentorshipService.update(id, data),
  delete: (id: string) => MentorshipService.delete(id),
  getStats: () => MentorshipService.getStats()
}; 