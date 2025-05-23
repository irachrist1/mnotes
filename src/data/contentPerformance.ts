export interface ContentMetric {
  id: string;
  title: string;
  platform: string;
  publishDate: string;
  type: 'newsletter' | 'blog' | 'social' | 'video' | 'speaking';
  reach: number;
  engagementScore: number; // 1-100
  conversions?: number;
  roi: number; // in USD
  topPerforming: boolean;
  businessOpportunity?: {
    type: 'consulting' | 'partnership' | 'client' | 'speaking';
    value: number;
    notes: string;
  };
}

export interface NewsletterStats {
  name: string;
  subscriberCount: number;
  openRate: number; // percentage
  clickThroughRate: number; // percentage
  growthRate: number; // monthly percentage
  monetizationReadiness: number; // 1-10 scale
  primaryValue: string;
  notes: string;
}

export const contentMetrics: ContentMetric[] = [
  {
    id: 'cm-001',
    title: 'AI Trends Q4 2024: What Every Business Leader Needs to Know',
    platform: 'Last Week in AI',
    publishDate: '2024-12-20',
    type: 'newsletter',
    reach: 1300,
    engagementScore: 78,
    conversions: 3,
    roi: 320,
    topPerforming: true,
    businessOpportunity: {
      type: 'consulting',
      value: 1200,
      notes: 'Generated 3 consulting inquiries for AI strategy work'
    }
  },
  {
    id: 'cm-002',
    title: 'Smart Building Technology Implementation Guide',
    platform: 'Sunday Scoop',
    publishDate: '2024-12-15',
    type: 'newsletter',
    reach: 1600,
    engagementScore: 82,
    conversions: 2,
    roi: 850,
    topPerforming: true,
    businessOpportunity: {
      type: 'client',
      value: 2500,
      notes: 'Led to 2 new SPCS TECH client meetings'
    }
  },
  {
    id: 'cm-003',
    title: 'The Future of Hardware-Software Integration in Enterprise',
    platform: 'LinkedIn',
    publishDate: '2024-12-10',
    type: 'blog',
    reach: 2400,
    engagementScore: 85,
    conversions: 5,
    roi: 450,
    topPerforming: true,
    businessOpportunity: {
      type: 'partnership',
      value: 1800,
      notes: 'Connected with 3 potential hardware partners'
    }
  },
  {
    id: 'cm-004',
    title: 'AI Implementation Mistakes Most Companies Make',
    platform: 'The Hustle',
    publishDate: '2024-12-05',
    type: 'blog',
    reach: 45000,
    engagementScore: 72,
    conversions: 8,
    roi: 75,
    topPerforming: false,
    businessOpportunity: {
      type: 'consulting',
      value: 950,
      notes: 'Brand awareness and consulting leads from wider audience'
    }
  },
  {
    id: 'cm-005',
    title: 'IoT Security Best Practices for Small Businesses',
    platform: 'Last Week in AI',
    publishDate: '2024-11-28',
    type: 'newsletter',
    reach: 1250,
    engagementScore: 74,
    conversions: 2,
    roi: 180,
    topPerforming: false
  },
  {
    id: 'cm-006',
    title: 'Entrepreneurial Lessons from Rwanda\'s Tech Scene',
    platform: 'Sunday Scoop',
    publishDate: '2024-11-22',
    type: 'newsletter',
    reach: 1580,
    engagementScore: 79,
    conversions: 4,
    roi: 425,
    topPerforming: false,
    businessOpportunity: {
      type: 'speaking',
      value: 800,
      notes: 'Invited to speak at 2 local tech events'
    }
  },
  {
    id: 'cm-007',
    title: 'Digital Transformation in Physical Spaces',
    platform: 'Tech Conference Presentation',
    publishDate: '2024-11-15',
    type: 'speaking',
    reach: 320,
    engagementScore: 92,
    conversions: 6,
    roi: 1200,
    topPerforming: true,
    businessOpportunity: {
      type: 'client',
      value: 3500,
      notes: 'Direct client acquisition from conference presentation'
    }
  },
  {
    id: 'cm-008',
    title: 'Machine Learning for Building Management Systems',
    platform: 'YouTube',
    publishDate: '2024-11-08',
    type: 'video',
    reach: 1850,
    engagementScore: 68,
    conversions: 3,
    roi: 220,
    topPerforming: false
  },
  {
    id: 'cm-009',
    title: 'Weekly AI News Roundup - Week 45',
    platform: 'Last Week in AI',
    publishDate: '2024-11-01',
    type: 'newsletter',
    reach: 1280,
    engagementScore: 71,
    conversions: 1,
    roi: 95,
    topPerforming: false
  },
  {
    id: 'cm-010',
    title: 'Corporate Innovation Strategies for 2025',
    platform: 'Sunday Scoop',
    publishDate: '2024-10-25',
    type: 'newsletter',
    reach: 1520,
    engagementScore: 76,
    conversions: 3,
    roi: 380,
    topPerforming: false,
    businessOpportunity: {
      type: 'consulting',
      value: 1100,
      notes: 'Generated strategic consulting inquiries'
    }
  },
  {
    id: 'cm-011',
    title: 'Scaling Technical Teams in Emerging Markets',
    platform: 'Medium',
    publishDate: '2024-10-18',
    type: 'blog',
    reach: 890,
    engagementScore: 83,
    conversions: 2,
    roi: 150,
    topPerforming: false
  },
  {
    id: 'cm-012',
    title: 'AI Tools Every Entrepreneur Should Know',
    platform: 'Twitter/X',
    publishDate: '2024-10-12',
    type: 'social',
    reach: 5200,
    engagementScore: 65,
    conversions: 7,
    roi: 280,
    topPerforming: false,
    businessOpportunity: {
      type: 'consulting',
      value: 650,
      notes: 'Social media engagement leading to consultation requests'
    }
  }
];

export const newsletterStats: NewsletterStats[] = [
  {
    name: 'Last Week in AI',
    subscriberCount: 1300,
    openRate: 68.5,
    clickThroughRate: 12.3,
    growthRate: 8.2,
    monetizationReadiness: 3,
    primaryValue: 'Referral Generation',
    notes: 'Primary value from referrals for consulting/other work, not direct subscription revenue. Strong engagement with tech professionals and decision makers.'
  },
  {
    name: 'Sunday Scoop',
    subscriberCount: 1600,
    openRate: 72.1,
    clickThroughRate: 15.8,
    growthRate: 11.5,
    monetizationReadiness: 4,
    primaryValue: 'Business Development',
    notes: 'Primary value from referrals for consulting/other work, not direct subscription revenue. Higher monetization potential through corporate focus and executive readership.'
  }
];

// Calculate summary statistics
export const contentSummary = {
  totalContent: contentMetrics.length,
  totalReach: contentMetrics.reduce((sum, content) => sum + content.reach, 0),
  totalConversions: contentMetrics.reduce((sum, content) => sum + (content.conversions || 0), 0),
  averageEngagement: contentMetrics.reduce((sum, content) => sum + content.engagementScore, 0) / contentMetrics.length,
  averageROI: contentMetrics.reduce((sum, content) => sum + content.roi, 0) / contentMetrics.length,
  topPerformingCount: contentMetrics.filter(content => content.topPerforming).length,
  businessOpportunityValue: contentMetrics
    .filter(content => content.businessOpportunity)
    .reduce((sum, content) => sum + (content.businessOpportunity?.value || 0), 0),
  contentByPlatform: {
    'Last Week in AI': contentMetrics.filter(c => c.platform === 'Last Week in AI').length,
    'Sunday Scoop': contentMetrics.filter(c => c.platform === 'Sunday Scoop').length,
    'LinkedIn': contentMetrics.filter(c => c.platform === 'LinkedIn').length,
    'The Hustle': contentMetrics.filter(c => c.platform === 'The Hustle').length,
    'Other': contentMetrics.filter(c => !['Last Week in AI', 'Sunday Scoop', 'LinkedIn', 'The Hustle'].includes(c.platform)).length
  },
  totalNewsletterSubscribers: newsletterStats.reduce((sum, newsletter) => sum + newsletter.subscriberCount, 0),
  averageNewsletterOpenRate: newsletterStats.reduce((sum, newsletter) => sum + newsletter.openRate, 0) / newsletterStats.length,
  combinedMonetizationReadiness: newsletterStats.reduce((sum, newsletter) => sum + newsletter.monetizationReadiness, 0) / newsletterStats.length
}; 