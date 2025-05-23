export interface IncomeStream {
  id: string;
  name: string;
  category: 'consulting' | 'employment' | 'content' | 'product' | 'project-based';
  status: 'active' | 'developing' | 'planned' | 'paused';
  monthlyRevenue: number;
  timeInvestment: number; // hours per week
  growthRate: number; // percentage
  notes?: string;
  clientInfo?: string;
}

export const incomeStreams: IncomeStream[] = [
  {
    id: '1',
    name: 'Andersen Digital Operations Associate',
    category: 'employment',
    status: 'active',
    monthlyRevenue: 385,
    timeInvestment: 40,
    growthRate: 0,
    notes: 'Stable employment income (converted from 550,000 RWF)',
    clientInfo: 'Andersen Global'
  },
  {
    id: '2',
    name: 'IT Consulting via SPCS TECH SOLUTIONS',
    category: 'project-based',
    status: 'active',
    monthlyRevenue: 140,
    timeInvestment: 15,
    growthRate: 5,
    notes: '45% earnings from consulting work, average of $105-175 range',
    clientInfo: 'Posinove (primary client)'
  },
  {
    id: '3',
    name: 'General Writing Services',
    category: 'project-based',
    status: 'active',
    monthlyRevenue: 80,
    timeInvestment: 8,
    growthRate: 10,
    notes: 'Various writing projects, average of $55-105 range (80k-150k RWF)',
    clientInfo: 'Multiple clients'
  },
  {
    id: '4',
    name: 'Writing for The Hustle',
    category: 'content',
    status: 'active',
    monthlyRevenue: 50,
    timeInvestment: 6,
    growthRate: 15,
    notes: '$25-75 per piece, estimated 1-2 pieces per month',
    clientInfo: 'The Hustle Media'
  },
  {
    id: '5',
    name: 'Last Week in AI Newsletter',
    category: 'content',
    status: 'active',
    monthlyRevenue: 5,
    timeInvestment: 4,
    growthRate: 8,
    notes: 'Primary value from referrals for consulting/other work, not direct subscription revenue',
    clientInfo: '1300 subscribers'
  },
  {
    id: '6',
    name: 'Sunday Scoop Newsletter',
    category: 'content',
    status: 'active',
    monthlyRevenue: 5,
    timeInvestment: 3,
    growthRate: 12,
    notes: 'Primary value from referrals for consulting/other work, not direct subscription revenue',
    clientInfo: '1600 subscribers'
  },
  {
    id: '7',
    name: 'Hardware Consulting & IoT Projects',
    category: 'consulting',
    status: 'developing',
    monthlyRevenue: 25,
    timeInvestment: 5,
    growthRate: 25,
    notes: 'Emerging opportunities in IoT and hardware-software integration',
    clientInfo: 'SPCS TECH SOLUTIONS pipeline'
  },
  {
    id: '8',
    name: 'AI Trends Analysis & Research',
    category: 'consulting',
    status: 'developing',
    monthlyRevenue: 15,
    timeInvestment: 3,
    growthRate: 30,
    notes: 'Consulting on AI implementation and trend analysis',
    clientInfo: 'Various tech companies'
  },
  {
    id: '9',
    name: 'Speaking & Workshop Facilitation',
    category: 'content',
    status: 'planned',
    monthlyRevenue: 0,
    timeInvestment: 2,
    growthRate: 0,
    notes: 'Future revenue stream leveraging AI and entrepreneurship expertise',
    clientInfo: 'Tech conferences and corporate events'
  },
  {
    id: '10',
    name: 'Digital Product Development',
    category: 'product',
    status: 'planned',
    monthlyRevenue: 0,
    timeInvestment: 8,
    growthRate: 0,
    notes: 'SaaS tools for entrepreneurs and newsletter automation',
    clientInfo: 'B2B market focus'
  }
];

// Calculate summary statistics
export const incomeStreamSummary = {
  totalMonthlyRevenue: incomeStreams.reduce((sum, stream) => sum + stream.monthlyRevenue, 0),
  streamsByStatus: {
    active: incomeStreams.filter(stream => stream.status === 'active').length,
    developing: incomeStreams.filter(stream => stream.status === 'developing').length,
    planned: incomeStreams.filter(stream => stream.status === 'planned').length,
    paused: incomeStreams.filter(stream => stream.status === 'paused').length,
  },
  streamsByCategory: {
    employment: incomeStreams.filter(stream => stream.category === 'employment').length,
    'project-based': incomeStreams.filter(stream => stream.category === 'project-based').length,
    consulting: incomeStreams.filter(stream => stream.category === 'consulting').length,
    content: incomeStreams.filter(stream => stream.category === 'content').length,
    product: incomeStreams.filter(stream => stream.category === 'product').length,
  },
  averageGrowthRate: incomeStreams
    .filter(stream => stream.status === 'active')
    .reduce((sum, stream) => sum + stream.growthRate, 0) / 
    incomeStreams.filter(stream => stream.status === 'active').length,
  totalTimeInvestment: incomeStreams.reduce((sum, stream) => sum + stream.timeInvestment, 0),
}; 