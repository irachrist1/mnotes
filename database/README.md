# Supabase Database Setup for mnotes Project

This directory contains all the SQL scripts needed to set up your Supabase database for the mnotes entrepreneurial dashboard.

## Project Details
- **Supabase Project ID**: `hbxcdaxthkmyquujdvej`
- **Supabase URL**: `https://hbxcdaxthkmyquujdvej.supabase.co`
- **Project Name**: mnotes

## Execution Order

Execute these SQL files in the Supabase SQL Editor in the following order:

### 1. Schema Creation
**File**: `schema.sql`
**Description**: Creates all database tables, indexes, and security policies
**Tables Created**:
- `income_streams` - Revenue stream tracking
- `ideas` - Business idea pipeline management
- `mentorship_sessions` - Mentorship session records
- `content_metrics` - Content performance tracking
- `newsletter_stats` - Newsletter analytics
- `operational_areas` - Operational health monitoring

### 2. Data Population
Execute these files in any order after the schema is created:

#### Income Streams Data
**File**: `insert_income_streams.sql`
**Records**: 10 income streams
**Includes**: Employment, consulting, content, and planned revenue streams

#### Ideas Data
**File**: `insert_ideas.sql`
**Records**: 7 business ideas (sample from larger dataset)
**Includes**: AI-powered platforms, IoT solutions, and educational programs

#### Mentorship Sessions Data
**File**: `insert_mentorship_sessions.sql`
**Records**: 6 mentorship sessions
**Includes**: Sessions with James Muigai, Elizabeth Babalola, Jimmy Nsenga, Catherine Njane, Timothy, and Shaan Puri

#### Content Metrics Data
**File**: `insert_content_metrics.sql`
**Records**: 10 content pieces
**Includes**: Newsletter issues, blog posts, speaking engagements, and social media content

#### Newsletter Stats Data
**File**: `insert_newsletter_stats.sql`
**Records**: 2 newsletters
**Includes**: "Last Week in AI" and "Sunday Scoop" performance metrics

#### Operational Areas Data
**File**: `insert_operational_areas.sql`
**Records**: 10 operational areas
**Includes**: Infrastructure, projects, hardware, software, and team management areas

## How to Execute

1. **Access Supabase SQL Editor**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `mnotes` (ID: `hbxcdaxthkmyquujdvej`)
   - Navigate to "SQL Editor" in the left sidebar

2. **Execute Schema First**:
   - Copy the contents of `schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Execute Data Insertion Scripts**:
   - For each `insert_*.sql` file:
     - Copy the file contents
     - Paste into the SQL Editor
     - Click "Run" to execute

## Verification

After executing all scripts, verify the setup by running these queries:

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check data population
SELECT 'income_streams' as table_name, count(*) as records FROM income_streams
UNION ALL
SELECT 'ideas', count(*) FROM ideas
UNION ALL
SELECT 'mentorship_sessions', count(*) FROM mentorship_sessions
UNION ALL
SELECT 'content_metrics', count(*) FROM content_metrics
UNION ALL
SELECT 'newsletter_stats', count(*) FROM newsletter_stats
UNION ALL
SELECT 'operational_areas', count(*) FROM operational_areas;
```

Expected results:
- 6 tables created
- 10 income streams
- 7 ideas
- 6 mentorship sessions
- 10 content metrics
- 2 newsletter stats
- 10 operational areas

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Current policies allow all operations (suitable for development)
- For production, consider implementing user-specific policies

## Next Steps

After successful database setup:
1. Update your Next.js application to use Supabase client
2. Replace hardcoded data imports with Supabase queries
3. Implement CRUD operations for each data type
4. Add real-time subscriptions for live updates

## Troubleshooting

**Common Issues**:
- **UUID Extension Error**: The schema script includes `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` which should resolve UUID generation issues
- **Permission Errors**: Ensure you're using the correct project and have admin access
- **Constraint Violations**: Check that enum values match exactly (case-sensitive)
- **JSON Format Errors**: Ensure JSONB data is properly formatted

**Support**:
- Check Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Review error messages in the SQL Editor for specific issues 