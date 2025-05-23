export interface OperationalArea {
  id: string;
  category: 'infrastructure' | 'projects' | 'hardware' | 'software' | 'team';
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'maintenance';
  lastChecked: string;
  nextReview: string;
  kpis: {
    metric: string;
    current: number;
    target: number;
    unit: string;
  }[];
  notes: string;
}

export const operationalAreas: OperationalArea[] = [
  {
    id: 'ops-001',
    category: 'infrastructure',
    name: 'Development Environment & Tools',
    status: 'healthy',
    lastChecked: '2024-12-01',
    nextReview: '2024-12-15',
    kpis: [
      { metric: 'System Uptime', current: 99.8, target: 99.5, unit: '%' },
      { metric: 'Build Time', current: 45, target: 60, unit: 'seconds' },
      { metric: 'Tool Efficiency', current: 8.5, target: 8.0, unit: '/10' }
    ],
    notes: 'All development tools running smoothly. Recent upgrade to development machine improved build times significantly.'
  },
  {
    id: 'ops-002',
    category: 'projects',
    name: 'SPCS TECH SOLUTION - Product Development',
    status: 'healthy',
    lastChecked: '2024-11-28',
    nextReview: '2024-12-05',
    kpis: [
      { metric: 'Sprint Velocity', current: 85, target: 80, unit: 'points' },
      { metric: 'Bug Resolution Time', current: 2.1, target: 3.0, unit: 'days' },
      { metric: 'Code Coverage', current: 87, target: 85, unit: '%' }
    ],
    notes: 'Product development on track for Series A milestone. Team productivity high, technical debt under control.'
  },
  {
    id: 'ops-003',
    category: 'software',
    name: 'Newsletter Publishing Pipeline',
    status: 'healthy',
    lastChecked: '2024-12-02',
    nextReview: '2024-12-09',
    kpis: [
      { metric: 'Publishing Consistency', current: 100, target: 95, unit: '%' },
      { metric: 'Content Quality Score', current: 8.7, target: 8.0, unit: '/10' },
      { metric: 'Automation Level', current: 75, target: 80, unit: '%' }
    ],
    notes: 'Both newsletters publishing consistently. Need to increase automation for content distribution and analytics tracking.'
  },
  {
    id: 'ops-004',
    category: 'projects',
    name: 'IT Consulting Client Projects',
    status: 'warning',
    lastChecked: '2024-11-30',
    nextReview: '2024-12-07',
    kpis: [
      { metric: 'Project Delivery Rate', current: 92, target: 95, unit: '%' },
      { metric: 'Client Satisfaction', current: 8.3, target: 8.5, unit: '/10' },
      { metric: 'Resource Utilization', current: 88, target: 85, unit: '%' }
    ],
    notes: 'One project slightly behind schedule due to hardware delivery delays. Client communication maintained, alternative solutions being explored.'
  },
  {
    id: 'ops-005',
    category: 'infrastructure',
    name: 'Content Creation & Distribution',
    status: 'healthy',
    lastChecked: '2024-12-01',
    nextReview: '2024-12-08',
    kpis: [
      { metric: 'Content Output', current: 12, target: 10, unit: 'pieces/month' },
      { metric: 'Engagement Rate', current: 6.8, target: 5.0, unit: '%' },
      { metric: 'Cross-platform Reach', current: 15200, target: 12000, unit: 'people' }
    ],
    notes: 'Content creation exceeding targets. Strong engagement across all platforms. LinkedIn and newsletter performance particularly strong.'
  },
  {
    id: 'ops-006',
    category: 'team',
    name: 'Professional Development & Learning',
    status: 'healthy',
    lastChecked: '2024-11-25',
    nextReview: '2024-12-25',
    kpis: [
      { metric: 'Learning Hours', current: 8, target: 6, unit: 'hours/week' },
      { metric: 'Skill Application', current: 85, target: 80, unit: '%' },
      { metric: 'Industry Knowledge', current: 9.2, target: 8.5, unit: '/10' }
    ],
    notes: 'Consistent learning schedule maintained. AI and hardware integration knowledge staying current with industry trends. Mentorship sessions providing valuable insights.'
  },
  {
    id: 'ops-007',
    category: 'hardware',
    name: 'IoT Lab & Testing Equipment',
    status: 'maintenance',
    lastChecked: '2024-11-20',
    nextReview: '2024-12-10',
    kpis: [
      { metric: 'Equipment Availability', current: 85, target: 90, unit: '%' },
      { metric: 'Testing Efficiency', current: 7.2, target: 8.0, unit: '/10' },
      { metric: 'Calibration Status', current: 78, target: 85, unit: '%' }
    ],
    notes: 'Some testing equipment needs calibration and updates. Planning hardware refresh for Q1 2025 to support growing client projects.'
  },
  {
    id: 'ops-008',
    category: 'projects',
    name: 'AI Trend Analysis & Research',
    status: 'healthy',
    lastChecked: '2024-12-02',
    nextReview: '2024-12-16',
    kpis: [
      { metric: 'Research Accuracy', current: 91, target: 85, unit: '%' },
      { metric: 'Trend Prediction Rate', current: 73, target: 70, unit: '%' },
      { metric: 'Source Diversity', current: 45, target: 40, unit: 'sources' }
    ],
    notes: 'AI trend research performing well. Newsletter content driving business inquiries. Consider developing this into standalone consulting service.'
  },
  {
    id: 'ops-009',
    category: 'software',
    name: 'Business Analytics & Tracking',
    status: 'warning',
    lastChecked: '2024-11-28',
    nextReview: '2024-12-05',
    kpis: [
      { metric: 'Data Completeness', current: 78, target: 90, unit: '%' },
      { metric: 'Reporting Automation', current: 65, target: 80, unit: '%' },
      { metric: 'Insight Actionability', current: 7.1, target: 8.0, unit: '/10' }
    ],
    notes: 'Need to improve business data tracking and automation. Manual processes taking too much time. Priority for Q1 2025 optimization.'
  },
  {
    id: 'ops-010',
    category: 'infrastructure',
    name: 'Financial Management & Planning',
    status: 'healthy',
    lastChecked: '2024-11-30',
    nextReview: '2024-12-30',
    kpis: [
      { metric: 'Cash Flow Predictability', current: 87, target: 85, unit: '%' },
      { metric: 'Expense Tracking', current: 95, target: 90, unit: '%' },
      { metric: 'Revenue Diversification', current: 8.2, target: 7.5, unit: '/10' }
    ],
    notes: 'Financial management systems working well. Good visibility into income streams and expenses. Revenue diversification strategy on track.'
  }
];

export const operationsSummary = {
  totalAreas: operationalAreas.length,
  statusBreakdown: {
    healthy: operationalAreas.filter(area => area.status === 'healthy').length,
    warning: operationalAreas.filter(area => area.status === 'warning').length,
    critical: operationalAreas.filter(area => area.status === 'critical').length,
    maintenance: operationalAreas.filter(area => area.status === 'maintenance').length
  },
  categoryBreakdown: {
    infrastructure: operationalAreas.filter(area => area.category === 'infrastructure').length,
    projects: operationalAreas.filter(area => area.category === 'projects').length,
    hardware: operationalAreas.filter(area => area.category === 'hardware').length,
    software: operationalAreas.filter(area => area.category === 'software').length,
    team: operationalAreas.filter(area => area.category === 'team').length
  },
  upcomingReviews: operationalAreas
    .filter(area => new Date(area.nextReview) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
    .map(area => ({ name: area.name, nextReview: area.nextReview, status: area.status })),
  kpiPerformance: operationalAreas.flatMap(area => 
    area.kpis.map(kpi => ({
      area: area.name,
      metric: kpi.metric,
      performance: (kpi.current / kpi.target) * 100,
      status: kpi.current >= kpi.target ? 'meeting' : 'below'
    }))
  ).filter(kpi => kpi.status === 'below').slice(0, 5)
}; 