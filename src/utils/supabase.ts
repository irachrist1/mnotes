import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client only if credentials are available, otherwise create a dummy that will error on use
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Database types matching exactly with our existing interfaces
export type Database = {
  public: {
    Tables: {
      income_streams: {
        Row: IncomeStreamRow
        Insert: IncomeStreamInsert
        Update: IncomeStreamUpdate
      }
      ideas: {
        Row: IdeaRow
        Insert: IdeaInsert
        Update: IdeaUpdate
      }
      mentorship_sessions: {
        Row: MentorshipSessionRow
        Insert: MentorshipSessionInsert
        Update: MentorshipSessionUpdate
      }
      content_metrics: {
        Row: ContentMetricRow
        Insert: ContentMetricInsert
        Update: ContentMetricUpdate
      }
      newsletter_stats: {
        Row: NewsletterStatsRow
        Insert: NewsletterStatsInsert
        Update: NewsletterStatsUpdate
      }
      operational_areas: {
        Row: OperationalAreaRow
        Insert: OperationalAreaInsert
        Update: OperationalAreaUpdate
      }
    }
  }
}

// Type definitions based on our existing interfaces
export type IncomeStreamRow = {
  id: string
  name: string
  category: 'consulting' | 'employment' | 'content' | 'product' | 'project-based'
  status: 'active' | 'developing' | 'planned' | 'paused'
  monthly_revenue: number
  time_investment: number
  growth_rate: number
  notes?: string
  client_info?: string
  created_at: string
}

export type IncomeStreamInsert = Omit<IncomeStreamRow, 'id' | 'created_at'>
export type IncomeStreamUpdate = Partial<IncomeStreamInsert>

export type IdeaRow = {
  id: string
  title: string
  description: string
  category: string
  stage: 'raw-thought' | 'researching' | 'validating' | 'developing' | 'testing' | 'launched'
  potential_revenue: 'low' | 'medium' | 'high' | 'very-high'
  implementation_complexity: 1 | 2 | 3 | 4 | 5
  time_to_market: string
  required_skills: string[]
  market_size: string
  competition_level: 'low' | 'medium' | 'high'
  ai_relevance: boolean
  hardware_component: boolean
  related_income_stream?: string
  source_of_inspiration: string
  next_steps: string[]
  tags: string[]
  created_date: string
  last_updated: string
}

export type IdeaInsert = Omit<IdeaRow, 'id'>
export type IdeaUpdate = Partial<IdeaInsert>

export type MentorshipSessionRow = {
  id: string
  mentor_name: string
  date: string
  duration: number
  session_type: 'giving' | 'receiving'
  topics: string[]
  key_insights: string[]
  action_items: {
    id: string
    task: string
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    due_date?: string
  }[]
  rating: number
  notes: string
  created_at: string
}

export type MentorshipSessionInsert = Omit<MentorshipSessionRow, 'id' | 'created_at'>
export type MentorshipSessionUpdate = Partial<MentorshipSessionInsert>

export type ContentMetricRow = {
  id: string
  title: string
  platform: string
  publish_date: string
  type: 'newsletter' | 'blog' | 'social' | 'video' | 'speaking'
  reach: number
  engagement_score: number
  conversions?: number
  roi: number
  top_performing: boolean
  business_opportunity?: {
    type: 'consulting' | 'partnership' | 'client' | 'speaking'
    value: number
    notes: string
  }
  created_at: string
}

export type ContentMetricInsert = Omit<ContentMetricRow, 'id' | 'created_at'>
export type ContentMetricUpdate = Partial<ContentMetricInsert>

export type NewsletterStatsRow = {
  id: string
  name: string
  subscriber_count: number
  open_rate: number
  click_through_rate: number
  growth_rate: number
  monetization_readiness: number
  primary_value: string
  notes: string
  created_at: string
  updated_at: string
}

export type NewsletterStatsInsert = Omit<NewsletterStatsRow, 'id' | 'created_at' | 'updated_at'>
export type NewsletterStatsUpdate = Partial<NewsletterStatsInsert>

export type OperationalAreaRow = {
  id: string
  category: 'infrastructure' | 'projects' | 'hardware' | 'software' | 'team'
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'maintenance'
  last_checked: string
  next_review: string
  kpis: {
    metric: string
    current: number
    target: number
    unit: string
  }[]
  notes: string
  created_at: string
}

export type OperationalAreaInsert = Omit<OperationalAreaRow, 'id' | 'created_at'>
export type OperationalAreaUpdate = Partial<OperationalAreaInsert> 