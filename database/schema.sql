-- Supabase Database Schema for mnotes Project
-- Execute this in the Supabase SQL Editor for project: hbxcdaxthkmyquujdvej

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Income Streams Table
CREATE TABLE income_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consulting', 'employment', 'content', 'product', 'project-based')),
  status TEXT NOT NULL CHECK (status IN ('active', 'developing', 'planned', 'paused')),
  monthly_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  time_investment INTEGER NOT NULL DEFAULT 0,
  growth_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  client_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ideas Table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('raw-thought', 'researching', 'validating', 'developing', 'testing', 'launched')),
  potential_revenue TEXT NOT NULL CHECK (potential_revenue IN ('low', 'medium', 'high', 'very-high')),
  implementation_complexity INTEGER NOT NULL CHECK (implementation_complexity BETWEEN 1 AND 5),
  time_to_market TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  market_size TEXT NOT NULL,
  competition_level TEXT NOT NULL CHECK (competition_level IN ('low', 'medium', 'high')),
  ai_relevance BOOLEAN NOT NULL DEFAULT FALSE,
  hardware_component BOOLEAN NOT NULL DEFAULT FALSE,
  related_income_stream TEXT,
  source_of_inspiration TEXT NOT NULL,
  next_steps TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_date DATE NOT NULL,
  last_updated DATE NOT NULL
);

-- Mentorship Sessions Table
CREATE TABLE mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_name TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('giving', 'receiving')),
  topics TEXT[] NOT NULL DEFAULT '{}',
  key_insights TEXT[] NOT NULL DEFAULT '{}',
  action_items JSONB NOT NULL DEFAULT '[]',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Metrics Table
CREATE TABLE content_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  publish_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('newsletter', 'blog', 'social', 'video', 'speaking')),
  reach INTEGER NOT NULL DEFAULT 0,
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  conversions INTEGER,
  roi DECIMAL(10,2) NOT NULL DEFAULT 0,
  top_performing BOOLEAN NOT NULL DEFAULT FALSE,
  business_opportunity JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Stats Table
CREATE TABLE newsletter_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  open_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  click_through_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  growth_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  monetization_readiness INTEGER NOT NULL CHECK (monetization_readiness BETWEEN 1 AND 10),
  primary_value TEXT NOT NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Operational Areas Table
CREATE TABLE operational_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('infrastructure', 'projects', 'hardware', 'software', 'team')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'maintenance')),
  last_checked DATE NOT NULL,
  next_review DATE NOT NULL,
  kpis JSONB NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_income_streams_status ON income_streams(status);
CREATE INDEX idx_income_streams_category ON income_streams(category);
CREATE INDEX idx_ideas_stage ON ideas(stage);
CREATE INDEX idx_ideas_ai_relevance ON ideas(ai_relevance);
CREATE INDEX idx_mentorship_sessions_date ON mentorship_sessions(date);
CREATE INDEX idx_content_metrics_platform ON content_metrics(platform);
CREATE INDEX idx_content_metrics_type ON content_metrics(type);
CREATE INDEX idx_operational_areas_status ON operational_areas(status);
CREATE INDEX idx_operational_areas_category ON operational_areas(category);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_areas ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on income_streams" ON income_streams FOR ALL USING (true);
CREATE POLICY "Allow all operations on ideas" ON ideas FOR ALL USING (true);
CREATE POLICY "Allow all operations on mentorship_sessions" ON mentorship_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on content_metrics" ON content_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on newsletter_stats" ON newsletter_stats FOR ALL USING (true);
CREATE POLICY "Allow all operations on operational_areas" ON operational_areas FOR ALL USING (true); 