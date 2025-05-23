-- Insert Newsletter Stats Data
-- Execute this in the Supabase SQL Editor after running schema.sql

INSERT INTO newsletter_stats (
  name, subscriber_count, open_rate, click_through_rate, growth_rate, monetization_readiness, primary_value, notes
) VALUES
(
  'Last Week in AI',
  1300,
  68.5,
  12.3,
  8.2,
  3,
  'Referral Generation',
  'Primary value from referrals for consulting/other work, not direct subscription revenue. Strong engagement with tech professionals and decision makers.'
),
(
  'Sunday Scoop',
  1600,
  72.1,
  15.8,
  11.5,
  4,
  'Business Development',
  'Primary value from referrals for consulting/other work, not direct subscription revenue. Higher monetization potential through corporate focus and executive readership.'
); 