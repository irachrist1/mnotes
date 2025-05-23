-- Insert Mentorship Sessions Data
-- Execute this in the Supabase SQL Editor after running schema.sql

INSERT INTO mentorship_sessions (
  mentor_name, date, duration, session_type, topics, key_insights, action_items, rating, notes
) VALUES
(
  'James Muigai',
  '2025-01-15',
  45,
  'receiving',
  ARRAY['Business Strategy', 'Decision Making', 'Growth Planning'],
  ARRAY['Avoid analysis paralysis - take action with 80% information', 'Focus on one revenue stream at a time for maximum impact', 'Business strategy is about saying no to good opportunities to focus on great ones'],
  '[
    {
      "id": "ai-001",
      "task": "Prioritize top 3 income streams and create focused action plan",
      "priority": "high",
      "completed": true,
      "due_date": "2025-01-22"
    },
    {
      "id": "ai-002",
      "task": "Set weekly decision-making deadline to avoid overthinking",
      "priority": "medium",
      "completed": true,
      "due_date": "2025-01-20"
    }
  ]'::jsonb,
  9,
  'James emphasized the importance of decisive action over perfect analysis. His "avoid analysis paralysis" mantra really resonated with current challenges in prioritizing multiple opportunities.'
),
(
  'Elizabeth Babalola',
  '2025-01-22',
  60,
  'receiving',
  ARRAY['Business Development', 'Client Relations', 'Revenue Growth'],
  ARRAY['Relationships drive revenue - invest in long-term client partnerships', 'Every client interaction is a business development opportunity', 'Focus on delivering value first, revenue will follow naturally'],
  '[
    {
      "id": "ai-003",
      "task": "Develop client relationship nurturing system for SPCS clients",
      "priority": "high",
      "completed": false,
      "due_date": "2025-02-05"
    },
    {
      "id": "ai-004",
      "task": "Create value-first proposal template for new consulting opportunities",
      "priority": "medium",
      "completed": false,
      "due_date": "2025-01-30"
    }
  ]'::jsonb,
  8,
  'Elizabeth provided excellent insights on building sustainable client relationships. Her approach to value-first business development aligns well with current consulting strategy.'
),
(
  'Jimmy Nsenga',
  '2025-02-01',
  50,
  'receiving',
  ARRAY['Technology Leadership', 'IoT Implementation', 'Startup Scaling'],
  ARRAY['IoT success requires understanding both hardware and software ecosystems', 'Technical leadership is about enabling others, not being the smartest person', 'Job in Rwanda experience: matching market needs with available talent'],
  '[
    {
      "id": "ai-005",
      "task": "Research IoT market opportunities in Rwanda/East Africa",
      "priority": "medium",
      "completed": true,
      "due_date": "2025-02-10"
    },
    {
      "id": "ai-006",
      "task": "Develop technical mentorship program for SPCS team",
      "priority": "low",
      "completed": false,
      "due_date": "2025-03-01"
    }
  ]'::jsonb,
  9,
  'Jimmy''s experience with Job in Rwanda and IoT development provided valuable perspective on scaling tech solutions in emerging markets. Great insights on technical leadership.'
),
(
  'Catherine Njane',
  '2025-02-08',
  40,
  'receiving',
  ARRAY['Business Development', 'Strategic Partnerships', 'Market Expansion'],
  ARRAY['Strategic partnerships multiply your capabilities without multiplying your costs', 'Business development is about creating win-win scenarios for all parties', 'Market expansion requires deep understanding of local business culture'],
  '[
    {
      "id": "ai-007",
      "task": "Identify 3 potential strategic partners for SPCS expansion",
      "priority": "high",
      "completed": false,
      "due_date": "2025-02-20"
    },
    {
      "id": "ai-008",
      "task": "Create partnership proposal framework for mutual value creation",
      "priority": "medium",
      "completed": false,
      "due_date": "2025-02-25"
    }
  ]'::jsonb,
  8,
  'Catherine''s expertise in strategic partnerships opened new perspectives on scaling without heavy investment. Her insights on local market dynamics are particularly valuable.'
),
(
  'Timothy',
  '2025-02-12',
  35,
  'receiving',
  ARRAY['Critical Thinking', 'Problem Solving', 'Perspective Challenge'],
  ARRAY['Common sense is not common - question every assumption', 'The best solutions often come from challenging conventional wisdom', 'Critical thinking requires intellectual humility and willingness to be wrong'],
  '[
    {
      "id": "ai-009",
      "task": "Implement weekly assumption-challenging exercise for business decisions",
      "priority": "medium",
      "completed": true,
      "due_date": "2025-02-19"
    },
    {
      "id": "ai-010",
      "task": "Review and challenge current business model assumptions",
      "priority": "high",
      "completed": false,
      "due_date": "2025-03-01"
    }
  ]'::jsonb,
  7,
  'Timothy''s "Common Sense PHD" approach forced me to question several assumptions about newsletter monetization and consulting pricing. Valuable perspective-challenging session.'
),
(
  'Shaan Puri',
  '2025-02-18',
  55,
  'receiving',
  ARRAY['Business Development', 'Content Marketing', 'Revenue Optimization'],
  ARRAY['Content is the best business development tool when done strategically', 'Every piece of content should have a clear business objective', 'Distribution beats creation - focus on getting content in front of right people'],
  '[
    {
      "id": "ai-011",
      "task": "Develop content distribution strategy for newsletters to maximize BD impact",
      "priority": "high",
      "completed": false,
      "due_date": "2025-03-05"
    },
    {
      "id": "ai-012",
      "task": "Create content calendar with specific business development goals",
      "priority": "medium",
      "completed": false,
      "due_date": "2025-03-10"
    }
  ]'::jsonb,
  9,
  'Shaan''s insights on content as a business development tool were game-changing. His emphasis on distribution over creation quality really shifted my perspective on newsletter strategy.'
); 