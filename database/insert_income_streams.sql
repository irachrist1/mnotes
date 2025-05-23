-- Insert Income Streams Data
-- Execute this in the Supabase SQL Editor after running schema.sql

INSERT INTO income_streams (name, category, status, monthly_revenue, time_investment, growth_rate, notes, client_info) VALUES
('Andersen Digital Operations Associate', 'employment', 'active', 385.00, 40, 0.00, 'Stable employment income (converted from 550,000 RWF)', 'Andersen Global'),
('IT Consulting via SPCS TECH SOLUTIONS', 'project-based', 'active', 140.00, 15, 5.00, '45% earnings from consulting work, average of $105-175 range', 'Posinove (primary client)'),
('General Writing Services', 'project-based', 'active', 80.00, 8, 10.00, 'Various writing projects, average of $55-105 range (80k-150k RWF)', 'Multiple clients'),
('Writing for The Hustle', 'content', 'active', 50.00, 6, 15.00, '$25-75 per piece, estimated 1-2 pieces per month', 'The Hustle Media'),
('Last Week in AI Newsletter', 'content', 'active', 5.00, 4, 8.00, 'Primary value from referrals for consulting/other work, not direct subscription revenue', '1300 subscribers'),
('Sunday Scoop Newsletter', 'content', 'active', 5.00, 3, 12.00, 'Primary value from referrals for consulting/other work, not direct subscription revenue', '1600 subscribers'),
('Hardware Consulting & IoT Projects', 'consulting', 'developing', 25.00, 5, 25.00, 'Emerging opportunities in IoT and hardware-software integration', 'SPCS TECH SOLUTIONS pipeline'),
('AI Trends Analysis & Research', 'consulting', 'developing', 15.00, 3, 30.00, 'Consulting on AI implementation and trend analysis', 'Various tech companies'),
('Speaking & Workshop Facilitation', 'content', 'planned', 0.00, 2, 0.00, 'Future revenue stream leveraging AI and entrepreneurship expertise', 'Tech conferences and corporate events'),
('Digital Product Development', 'product', 'planned', 0.00, 8, 0.00, 'SaaS tools for entrepreneurs and newsletter automation', 'B2B market focus'); 