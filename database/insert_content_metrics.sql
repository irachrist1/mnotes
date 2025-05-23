-- Insert Content Metrics Data
-- Execute this in the Supabase SQL Editor after running schema.sql

INSERT INTO content_metrics (
  title, platform, publish_date, type, reach, engagement_score, conversions, roi, top_performing, business_opportunity
) VALUES
(
  'AI Trends Q4 2024: What Every Business Leader Needs to Know',
  'Last Week in AI',
  '2024-12-20',
  'newsletter',
  1300,
  78.00,
  3,
  320.00,
  true,
  '{
    "type": "consulting",
    "value": 1200,
    "notes": "Generated 3 consulting inquiries for AI strategy work"
  }'::jsonb
),
(
  'Smart Building Technology Implementation Guide',
  'Sunday Scoop',
  '2024-12-15',
  'newsletter',
  1600,
  82.00,
  2,
  850.00,
  true,
  '{
    "type": "client",
    "value": 2500,
    "notes": "Led to 2 new SPCS TECH client meetings"
  }'::jsonb
),
(
  'The Future of Hardware-Software Integration in Enterprise',
  'LinkedIn',
  '2024-12-10',
  'blog',
  2400,
  85.00,
  5,
  450.00,
  true,
  '{
    "type": "partnership",
    "value": 1800,
    "notes": "Connected with 3 potential hardware partners"
  }'::jsonb
),
(
  'AI Implementation Mistakes Most Companies Make',
  'The Hustle',
  '2024-12-05',
  'blog',
  45000,
  72.00,
  8,
  75.00,
  false,
  '{
    "type": "consulting",
    "value": 950,
    "notes": "Brand awareness and consulting leads from wider audience"
  }'::jsonb
),
(
  'IoT Security Best Practices for Small Businesses',
  'Last Week in AI',
  '2024-11-28',
  'newsletter',
  1250,
  74.00,
  2,
  180.00,
  false,
  null
),
(
  'Entrepreneurial Lessons from Rwanda''s Tech Scene',
  'Sunday Scoop',
  '2024-11-22',
  'newsletter',
  1580,
  79.00,
  4,
  425.00,
  false,
  '{
    "type": "speaking",
    "value": 800,
    "notes": "Invited to speak at 2 local tech events"
  }'::jsonb
),
(
  'Digital Transformation in Physical Spaces',
  'Tech Conference Presentation',
  '2024-11-15',
  'speaking',
  320,
  92.00,
  6,
  1200.00,
  true,
  '{
    "type": "client",
    "value": 3500,
    "notes": "Direct client acquisition from conference presentation"
  }'::jsonb
),
(
  'Machine Learning for Building Management Systems',
  'YouTube',
  '2024-11-08',
  'video',
  1850,
  68.00,
  3,
  220.00,
  false,
  null
),
(
  'Weekly AI News Roundup - Week 45',
  'Last Week in AI',
  '2024-11-01',
  'newsletter',
  1280,
  71.00,
  1,
  95.00,
  false,
  null
),
(
  'Corporate Innovation Strategies for 2025',
  'Sunday Scoop',
  '2024-10-25',
  'newsletter',
  1520,
  76.00,
  3,
  380.00,
  false,
  '{
    "type": "consulting",
    "value": 1100,
    "notes": "Generated strategic consulting inquiries"
  }'::jsonb
); 