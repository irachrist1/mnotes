export interface MonthlyRevenueTrend {
  month: string;
  totalRevenue: number;
  breakdown: {
    employment: number;
    consulting: number;
    content: number;
    projectBased: number;
    product: number;
  };
}

export interface NewsletterGrowthTrend {
  month: string;
  lastWeekInAI: {
    subscribers: number;
    openRate: number;
    clickRate: number;
  };
  sundayScoop: {
    subscribers: number;
    openRate: number;
    clickRate: number;
  };
}

export interface IdeaFunnelMetrics {
  stage: string;
  currentCount: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  averageTimeInStage: number; // days
  conversionRate: number; // percentage to next stage
}

export interface ContentROITrend {
  month: string;
  totalROI: number;
  byPlatform: {
    newsletter: number;
    blog: number;
    social: number;
    speaking: number;
    video: number;
  };
  businessOpportunities: number;
}

// Historical revenue trends (last 6 months)
export const monthlyRevenueTrends: MonthlyRevenueTrend[] = [
  {
    month: '2024-07',
    totalRevenue: 585,
    breakdown: { employment: 385, consulting: 105, content: 35, projectBased: 60, product: 0 }
  },
  {
    month: '2024-08',
    totalRevenue: 610,
    breakdown: { employment: 385, consulting: 120, content: 40, projectBased: 65, product: 0 }
  },
  {
    month: '2024-09',
    totalRevenue: 635,
    breakdown: { employment: 385, consulting: 125, content: 45, projectBased: 80, product: 0 }
  },
  {
    month: '2024-10',
    totalRevenue: 660,
    breakdown: { employment: 385, consulting: 135, content: 50, projectBased: 90, product: 0 }
  },
  {
    month: '2024-11',
    totalRevenue: 685,
    breakdown: { employment: 385, consulting: 145, content: 55, projectBased: 100, product: 0 }
  },
  {
    month: '2024-12',
    totalRevenue: 705,
    breakdown: { employment: 385, consulting: 140, content: 60, projectBased: 120, product: 0 }
  }
];

// Newsletter growth trends (last 6 months)
export const newsletterGrowthTrends: NewsletterGrowthTrend[] = [
  {
    month: '2024-07',
    lastWeekInAI: { subscribers: 850, openRate: 42, clickRate: 8 },
    sundayScoop: { subscribers: 1200, openRate: 38, clickRate: 6 }
  },
  {
    month: '2024-08',
    lastWeekInAI: { subscribers: 920, openRate: 44, clickRate: 9 },
    sundayScoop: { subscribers: 1280, openRate: 40, clickRate: 7 }
  },
  {
    month: '2024-09',
    lastWeekInAI: { subscribers: 1050, openRate: 46, clickRate: 10 },
    sundayScoop: { subscribers: 1350, openRate: 41, clickRate: 8 }
  },
  {
    month: '2024-10',
    lastWeekInAI: { subscribers: 1150, openRate: 47, clickRate: 11 },
    sundayScoop: { subscribers: 1420, openRate: 43, clickRate: 9 }
  },
  {
    month: '2024-11',
    lastWeekInAI: { subscribers: 1220, openRate: 48, clickRate: 12 },
    sundayScoop: { subscribers: 1520, openRate: 44, clickRate: 10 }
  },
  {
    month: '2024-12',
    lastWeekInAI: { subscribers: 1300, openRate: 49, clickRate: 13 },
    sundayScoop: { subscribers: 1600, openRate: 45, clickRate: 11 }
  }
];

// Content ROI trends (last 6 months)
export const contentROITrends: ContentROITrend[] = [
  {
    month: '2024-07',
    totalROI: 1250,
    byPlatform: { newsletter: 450, blog: 320, social: 180, speaking: 200, video: 100 },
    businessOpportunities: 3
  },
  {
    month: '2024-08',
    totalROI: 1420,
    byPlatform: { newsletter: 520, blog: 380, social: 200, speaking: 220, video: 100 },
    businessOpportunities: 4
  },
  {
    month: '2024-09',
    totalROI: 1680,
    byPlatform: { newsletter: 600, blog: 450, social: 230, speaking: 280, video: 120 },
    businessOpportunities: 5
  },
  {
    month: '2024-10',
    totalROI: 1950,
    byPlatform: { newsletter: 720, blog: 480, social: 250, speaking: 350, video: 150 },
    businessOpportunities: 6
  },
  {
    month: '2024-11',
    totalROI: 2180,
    byPlatform: { newsletter: 800, blog: 520, social: 280, speaking: 400, video: 180 },
    businessOpportunities: 7
  },
  {
    month: '2024-12',
    totalROI: 2450,
    byPlatform: { newsletter: 900, blog: 580, social: 320, speaking: 450, video: 200 },
    businessOpportunities: 8
  }
];

// Idea funnel metrics (current state)
export const ideaFunnelMetrics: IdeaFunnelMetrics[] = [
  {
    stage: 'raw-thought',
    currentCount: 8,
    monthlyInflow: 12,
    monthlyOutflow: 8,
    averageTimeInStage: 14,
    conversionRate: 65
  },
  {
    stage: 'researching',
    currentCount: 6,
    monthlyInflow: 8,
    monthlyOutflow: 5,
    averageTimeInStage: 21,
    conversionRate: 55
  },
  {
    stage: 'validating',
    currentCount: 4,
    monthlyInflow: 5,
    monthlyOutflow: 3,
    averageTimeInStage: 35,
    conversionRate: 45
  },
  {
    stage: 'developing',
    currentCount: 3,
    monthlyInflow: 3,
    monthlyOutflow: 2,
    averageTimeInStage: 60,
    conversionRate: 40
  },
  {
    stage: 'testing',
    currentCount: 2,
    monthlyInflow: 2,
    monthlyOutflow: 1,
    averageTimeInStage: 45,
    conversionRate: 35
  },
  {
    stage: 'launched',
    currentCount: 1,
    monthlyInflow: 1,
    monthlyOutflow: 0,
    averageTimeInStage: 0,
    conversionRate: 100
  }
];

// Key Performance Indicators
export const analyticsKPIs = {
  revenueGrowth: {
    current: 705,
    lastMonth: 685,
    growthRate: 2.9,
    yearToDate: 4120,
    target: 5000
  },
  contentPerformance: {
    totalSubscribers: 2900,
    subscriberGrowth: 8.5,
    averageEngagement: 47,
    monthlyROI: 2450,
    roiGrowth: 12.4
  },
  ideaPipeline: {
    totalIdeas: 24,
    activeIdeas: 16,
    launchedThisYear: 3,
    averageTimeToLaunch: 180,
    successRate: 35
  },
  businessDevelopment: {
    newOpportunities: 8,
    conversionRate: 25,
    averageDealValue: 1850,
    pipelineValue: 14800
  }
};

// Chart color schemes
export const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  neutral: '#6B7280',
  gradients: {
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#047857'],
    yellow: ['#F59E0B', '#D97706'],
    purple: ['#8B5CF6', '#7C3AED'],
    red: ['#EF4444', '#DC2626']
  }
}; 