-- Insert Operational Areas Data
-- Execute this in the Supabase SQL Editor after running schema.sql

INSERT INTO operational_areas (
  category, name, status, last_checked, next_review, kpis, notes
) VALUES
(
  'infrastructure',
  'Development Environment & Tools',
  'healthy',
  '2024-12-01',
  '2024-12-15',
  '[
    {"metric": "System Uptime", "current": 99.8, "target": 99.5, "unit": "%"},
    {"metric": "Build Time", "current": 45, "target": 60, "unit": "seconds"},
    {"metric": "Tool Efficiency", "current": 8.5, "target": 8.0, "unit": "/10"}
  ]'::jsonb,
  'All development tools running smoothly. Recent upgrade to development machine improved build times significantly.'
),
(
  'projects',
  'SPCS TECH SOLUTION - Product Development',
  'healthy',
  '2024-11-28',
  '2024-12-05',
  '[
    {"metric": "Sprint Velocity", "current": 85, "target": 80, "unit": "points"},
    {"metric": "Bug Resolution Time", "current": 2.1, "target": 3.0, "unit": "days"},
    {"metric": "Code Coverage", "current": 87, "target": 85, "unit": "%"}
  ]'::jsonb,
  'Product development on track for Series A milestone. Team productivity high, technical debt under control.'
),
(
  'software',
  'Newsletter Publishing Pipeline',
  'healthy',
  '2024-12-02',
  '2024-12-09',
  '[
    {"metric": "Publishing Consistency", "current": 100, "target": 95, "unit": "%"},
    {"metric": "Content Quality Score", "current": 8.7, "target": 8.0, "unit": "/10"},
    {"metric": "Automation Level", "current": 75, "target": 80, "unit": "%"}
  ]'::jsonb,
  'Both newsletters publishing consistently. Need to increase automation for content distribution and analytics tracking.'
),
(
  'projects',
  'IT Consulting Client Projects',
  'warning',
  '2024-11-30',
  '2024-12-07',
  '[
    {"metric": "Project Delivery Rate", "current": 92, "target": 95, "unit": "%"},
    {"metric": "Client Satisfaction", "current": 8.3, "target": 8.5, "unit": "/10"},
    {"metric": "Resource Utilization", "current": 88, "target": 85, "unit": "%"}
  ]'::jsonb,
  'One project slightly behind schedule due to hardware delivery delays. Client communication maintained, alternative solutions being explored.'
),
(
  'infrastructure',
  'Content Creation & Distribution',
  'healthy',
  '2024-12-01',
  '2024-12-08',
  '[
    {"metric": "Content Output", "current": 12, "target": 10, "unit": "pieces/month"},
    {"metric": "Engagement Rate", "current": 6.8, "target": 5.0, "unit": "%"},
    {"metric": "Cross-platform Reach", "current": 15200, "target": 12000, "unit": "people"}
  ]'::jsonb,
  'Content creation exceeding targets. Strong engagement across all platforms. LinkedIn and newsletter performance particularly strong.'
),
(
  'team',
  'Professional Development & Learning',
  'healthy',
  '2024-11-25',
  '2024-12-25',
  '[
    {"metric": "Learning Hours", "current": 8, "target": 6, "unit": "hours/week"},
    {"metric": "Skill Application", "current": 85, "target": 80, "unit": "%"},
    {"metric": "Industry Knowledge", "current": 9.2, "target": 8.5, "unit": "/10"}
  ]'::jsonb,
  'Consistent learning schedule maintained. AI and hardware integration knowledge staying current with industry trends. Mentorship sessions providing valuable insights.'
),
(
  'hardware',
  'IoT Lab & Testing Equipment',
  'maintenance',
  '2024-11-20',
  '2024-12-10',
  '[
    {"metric": "Equipment Availability", "current": 85, "target": 90, "unit": "%"},
    {"metric": "Testing Efficiency", "current": 7.2, "target": 8.0, "unit": "/10"},
    {"metric": "Calibration Status", "current": 78, "target": 85, "unit": "%"}
  ]'::jsonb,
  'Some testing equipment needs calibration and updates. Planning hardware refresh for Q1 2025 to support growing client projects.'
),
(
  'projects',
  'AI Trend Analysis & Research',
  'healthy',
  '2024-12-02',
  '2024-12-16',
  '[
    {"metric": "Research Accuracy", "current": 91, "target": 85, "unit": "%"},
    {"metric": "Trend Prediction Rate", "current": 73, "target": 70, "unit": "%"},
    {"metric": "Source Diversity", "current": 45, "target": 40, "unit": "sources"}
  ]'::jsonb,
  'AI trend research performing well. Newsletter content driving business inquiries. Consider developing this into standalone consulting service.'
),
(
  'software',
  'Business Analytics & Tracking',
  'warning',
  '2024-11-28',
  '2024-12-05',
  '[
    {"metric": "Data Completeness", "current": 78, "target": 90, "unit": "%"},
    {"metric": "Reporting Automation", "current": 65, "target": 80, "unit": "%"},
    {"metric": "Insight Actionability", "current": 7.1, "target": 8.0, "unit": "/10"}
  ]'::jsonb,
  'Need to improve business data tracking and automation. Manual processes taking too much time. Priority for Q1 2025 optimization.'
),
(
  'infrastructure',
  'Financial Management & Planning',
  'healthy',
  '2024-11-30',
  '2024-12-30',
  '[
    {"metric": "Cash Flow Predictability", "current": 87, "target": 85, "unit": "%"},
    {"metric": "Expense Tracking", "current": 95, "target": 90, "unit": "%"},
    {"metric": "Revenue Diversification", "current": 8.2, "target": 7.5, "unit": "/10"}
  ]'::jsonb,
  'Financial management systems working well. Good visibility into income streams and expenses. Revenue diversification strategy on track.'
); 