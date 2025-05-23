export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: 'raw-thought' | 'researching' | 'validating' | 'developing' | 'testing' | 'launched';
  potentialRevenue: 'low' | 'medium' | 'high' | 'very-high';
  implementationComplexity: 1 | 2 | 3 | 4 | 5;
  timeToMarket: string;
  requiredSkills: string[];
  marketSize: string;
  competitionLevel: 'low' | 'medium' | 'high';
  aiRelevance: boolean;
  hardwareComponent: boolean;
  relatedIncomeStream?: string;
  sourceOfInspiration: string;
  nextSteps: string[];
  tags: string[];
  createdDate: string;
  lastUpdated: string;
}

export const ideas: Idea[] = [
  {
    id: 'idea-001',
    title: 'AI-Powered Smart Building Assessment Platform',
    description: 'SaaS platform that uses AI to analyze building plans and current infrastructure to recommend smart building upgrades with ROI projections and implementation roadmaps.',
    category: 'B2B SaaS',
    stage: 'researching',
    potentialRevenue: 'very-high',
    implementationComplexity: 4,
    timeToMarket: '8-12 months',
    requiredSkills: ['AI/ML', 'Building systems', 'SaaS development', 'Computer vision'],
    marketSize: '$15B smart building market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: true,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Client requests for smart building assessments in consulting work',
    nextSteps: [
      'Survey 50 building managers on pain points',
      'Develop MVP assessment algorithm',
      'Partner with IoT hardware vendors'
    ],
    tags: ['AI', 'Smart Buildings', 'SaaS', 'IoT', 'Enterprise'],
    createdDate: '2024-02-15',
    lastUpdated: '2024-12-01'
  },
  {
    id: 'idea-002',
    title: 'AI Newsletter Content Syndication Network',
    description: 'Platform connecting AI newsletter creators with corporations needing curated AI content for internal communications and thought leadership.',
    category: 'Content Platform',
    stage: 'validating',
    potentialRevenue: 'high',
    implementationComplexity: 3,
    timeToMarket: '4-6 months',
    requiredSkills: ['Content curation', 'Platform development', 'B2B sales'],
    marketSize: '$8B content marketing market',
    competitionLevel: 'low',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-003',
    sourceOfInspiration: 'Corporate readers asking to license newsletter content',
    nextSteps: [
      'Interview 20 corporate content managers',
      'Build pilot syndication system',
      'Test with 3 newsletter creators'
    ],
    tags: ['AI', 'Content', 'B2B', 'Newsletter', 'Licensing'],
    createdDate: '2024-03-10',
    lastUpdated: '2024-11-28'
  },
  {
    id: 'idea-003',
    title: 'Hardware-Software Integration Certification Program',
    description: 'Online certification program for developers and engineers specializing in IoT and hardware-software integration, with hands-on labs and industry partnerships.',
    category: 'Education',
    stage: 'raw-thought',
    potentialRevenue: 'medium',
    implementationComplexity: 3,
    timeToMarket: '6-9 months',
    requiredSkills: ['Curriculum development', 'IoT expertise', 'Video production', 'Assessment design'],
    marketSize: '$366B online education market',
    competitionLevel: 'medium',
    aiRelevance: false,
    hardwareComponent: true,
    relatedIncomeStream: 'is-007',
    sourceOfInspiration: 'Lack of quality IoT integration training programs in market',
    nextSteps: [
      'Research competitor offerings',
      'Design curriculum outline',
      'Identify hardware lab partners'
    ],
    tags: ['Education', 'IoT', 'Certification', 'Hardware', 'Professional Development'],
    createdDate: '2024-01-20',
    lastUpdated: '2024-10-15'
  },
  {
    id: 'idea-004',
    title: 'AI Trend Prediction API for Businesses',
    description: 'API service that analyzes social media, research papers, and industry data to predict emerging AI trends with confidence scores and business impact assessments.',
    category: 'API Service',
    stage: 'developing',
    potentialRevenue: 'high',
    implementationComplexity: 5,
    timeToMarket: '10-15 months',
    requiredSkills: ['Machine learning', 'Data engineering', 'API development', 'Trend analysis'],
    marketSize: '$50B business intelligence market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-006',
    sourceOfInspiration: 'Newsletter research process revealing patterns in AI adoption',
    nextSteps: [
      'Build trend detection prototype',
      'Validate with newsletter data',
      'Interview potential enterprise customers'
    ],
    tags: ['AI', 'API', 'Prediction', 'Business Intelligence', 'Trends'],
    createdDate: '2024-04-05',
    lastUpdated: '2024-12-02'
  },
  {
    id: 'idea-005',
    title: 'Smart Office Space Design Consultation Bot',
    description: 'AI-powered chatbot that provides instant office space design recommendations based on team size, work style, and technology requirements.',
    category: 'AI Tool',
    stage: 'raw-thought',
    potentialRevenue: 'medium',
    implementationComplexity: 3,
    timeToMarket: '5-7 months',
    requiredSkills: ['Conversational AI', 'Office design knowledge', 'Chatbot development'],
    marketSize: '$13B office design market',
    competitionLevel: 'low',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Repetitive client questions about space optimization',
    nextSteps: [
      'Map common client questions',
      'Research conversational AI platforms',
      'Design conversation flow'
    ],
    tags: ['AI', 'Chatbot', 'Office Design', 'Consultation', 'Automation'],
    createdDate: '2024-05-12',
    lastUpdated: '2024-09-20'
  },
  {
    id: 'idea-006',
    title: 'Corporate AI Readiness Assessment Tool',
    description: 'Comprehensive assessment platform that evaluates company readiness for AI implementation across technical, organizational, and strategic dimensions.',
    category: 'Assessment Tool',
    stage: 'validating',
    potentialRevenue: 'high',
    implementationComplexity: 3,
    timeToMarket: '4-6 months',
    requiredSkills: ['AI strategy', 'Assessment design', 'Web development', 'Business analysis'],
    marketSize: '$126B AI market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-009',
    sourceOfInspiration: 'Corporate clients asking for AI implementation guidance',
    nextSteps: [
      'Complete assessment framework',
      'Test with 5 pilot companies',
      'Develop scoring algorithm'
    ],
    tags: ['AI', 'Assessment', 'Corporate', 'Strategy', 'Implementation'],
    createdDate: '2024-02-28',
    lastUpdated: '2024-11-30'
  },
  {
    id: 'idea-007',
    title: 'IoT Device Integration Marketplace',
    description: 'Platform connecting IoT device manufacturers with system integrators, featuring compatibility testing, integration guides, and certified partnerships.',
    category: 'Marketplace',
    stage: 'researching',
    potentialRevenue: 'very-high',
    implementationComplexity: 4,
    timeToMarket: '12-18 months',
    requiredSkills: ['Marketplace development', 'IoT protocols', 'Partner management', 'Testing frameworks'],
    marketSize: '$300B IoT market',
    competitionLevel: 'medium',
    aiRelevance: false,
    hardwareComponent: true,
    relatedIncomeStream: 'is-007',
    sourceOfInspiration: 'Difficulty finding compatible IoT solutions for client projects',
    nextSteps: [
      'Interview 30 IoT manufacturers',
      'Survey system integrators',
      'Research existing marketplaces'
    ],
    tags: ['IoT', 'Marketplace', 'Integration', 'Hardware', 'B2B'],
    createdDate: '2024-06-18',
    lastUpdated: '2024-11-15'
  },
  {
    id: 'idea-008',
    title: 'AI-Enhanced Physical Security System',
    description: 'Integrated physical security solution combining AI video analytics, access control, and environmental monitoring for smart buildings.',
    category: 'Security Solution',
    stage: 'raw-thought',
    potentialRevenue: 'very-high',
    implementationComplexity: 5,
    timeToMarket: '15-24 months',
    requiredSkills: ['Computer vision', 'Security systems', 'Hardware integration', 'AI/ML'],
    marketSize: '$45B physical security market',
    competitionLevel: 'high',
    aiRelevance: true,
    hardwareComponent: true,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Client requests for AI-powered security in building projects',
    nextSteps: [
      'Research security market requirements',
      'Identify hardware partners',
      'Analyze competitor solutions'
    ],
    tags: ['AI', 'Security', 'Computer Vision', 'Smart Buildings', 'Hardware'],
    createdDate: '2024-03-25',
    lastUpdated: '2024-08-10'
  },
  {
    id: 'idea-009',
    title: 'Newsletter Analytics & Monetization Platform',
    description: 'Comprehensive platform for newsletter creators to track performance, identify monetization opportunities, and connect with potential sponsors.',
    category: 'Creator Tools',
    stage: 'developing',
    potentialRevenue: 'medium',
    implementationComplexity: 3,
    timeToMarket: '6-8 months',
    requiredSkills: ['Analytics development', 'Creator economy', 'Dashboard design', 'Monetization strategies'],
    marketSize: '$104B creator economy',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-003',
    sourceOfInspiration: 'Own experience growing newsletters and tracking performance',
    nextSteps: [
      'Survey 100 newsletter creators',
      'Build MVP analytics dashboard',
      'Identify key monetization metrics'
    ],
    tags: ['Newsletter', 'Analytics', 'Monetization', 'Creator Economy', 'SaaS'],
    createdDate: '2024-07-02',
    lastUpdated: '2024-12-01'
  },
  {
    id: 'idea-010',
    title: 'AI-Powered Building Energy Optimization',
    description: 'System that uses AI to optimize building energy consumption by analyzing occupancy patterns, weather data, and equipment performance.',
    category: 'Energy Tech',
    stage: 'researching',
    potentialRevenue: 'high',
    implementationComplexity: 4,
    timeToMarket: '9-12 months',
    requiredSkills: ['Energy systems', 'AI/ML', 'IoT sensors', 'Building automation'],
    marketSize: '$6B building energy management market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: true,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Client concerns about rising energy costs in smart buildings',
    nextSteps: [
      'Study building energy patterns',
      'Research sensor technologies',
      'Interview facility managers'
    ],
    tags: ['AI', 'Energy', 'Optimization', 'Smart Buildings', 'Sustainability'],
    createdDate: '2024-04-30',
    lastUpdated: '2024-10-22'
  },
  {
    id: 'idea-011',
    title: 'Fractional CTO Matching Platform',
    description: 'Platform connecting experienced tech leaders with startups and SMBs needing part-time CTO expertise, with AI-powered matching and project management.',
    category: 'Professional Services',
    stage: 'validating',
    potentialRevenue: 'high',
    implementationComplexity: 3,
    timeToMarket: '5-7 months',
    requiredSkills: ['Platform development', 'Matching algorithms', 'Professional networking', 'Project management'],
    marketSize: '$1.2B fractional executive market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-002',
    sourceOfInspiration: 'Experience as CTO and requests for similar expertise from other companies',
    nextSteps: [
      'Interview 50 startup founders',
      'Survey experienced CTOs',
      'Design matching algorithm'
    ],
    tags: ['Fractional', 'CTO', 'Matching', 'Professional Services', 'Platform'],
    createdDate: '2024-08-14',
    lastUpdated: '2024-11-25'
  },
  {
    id: 'idea-012',
    title: 'AI Content Authenticity Verification Service',
    description: 'Service that helps businesses verify the authenticity of AI-generated content and detect potential deepfakes or misinformation.',
    category: 'Security Service',
    stage: 'raw-thought',
    potentialRevenue: 'high',
    implementationComplexity: 5,
    timeToMarket: '12-18 months',
    requiredSkills: ['AI detection', 'Content analysis', 'Security expertise', 'API development'],
    marketSize: '$2B content security market',
    competitionLevel: 'low',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-003',
    sourceOfInspiration: 'Growing concern about AI-generated misinformation in newsletter research',
    nextSteps: [
      'Research AI detection technologies',
      'Study content authenticity standards',
      'Interview corporate security teams'
    ],
    tags: ['AI', 'Security', 'Content', 'Verification', 'Detection'],
    createdDate: '2024-09-08',
    lastUpdated: '2024-11-10'
  },
  {
    id: 'idea-013',
    title: 'Smart Conference Room Management System',
    description: 'Integrated system for managing conference rooms with AI-powered scheduling, automatic setup, and usage analytics.',
    category: 'Workplace Tech',
    stage: 'researching',
    potentialRevenue: 'medium',
    implementationComplexity: 3,
    timeToMarket: '6-9 months',
    requiredSkills: ['IoT integration', 'Scheduling systems', 'Workplace analytics', 'Hardware setup'],
    marketSize: '$4B workplace management market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: true,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Client frustrations with conference room booking and setup inefficiencies',
    nextSteps: [
      'Research existing room management systems',
      'Interview office managers',
      'Design IoT sensor architecture'
    ],
    tags: ['Conference Rooms', 'IoT', 'Workplace', 'Management', 'Analytics'],
    createdDate: '2024-05-20',
    lastUpdated: '2024-09-30'
  },
  {
    id: 'idea-014',
    title: 'AI-Powered Business Process Documentation',
    description: 'Tool that uses AI to automatically document business processes by analyzing employee activities, system interactions, and workflow patterns.',
    category: 'Process Automation',
    stage: 'raw-thought',
    potentialRevenue: 'high',
    implementationComplexity: 4,
    timeToMarket: '9-12 months',
    requiredSkills: ['Process mining', 'AI/ML', 'Business analysis', 'Documentation automation'],
    marketSize: '$20B business process management market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-009',
    sourceOfInspiration: 'Time spent documenting processes for AI implementation consulting',
    nextSteps: [
      'Research process mining technologies',
      'Study documentation standards',
      'Interview operations managers'
    ],
    tags: ['AI', 'Process Documentation', 'Automation', 'Business Process', 'Documentation'],
    createdDate: '2024-06-12',
    lastUpdated: '2024-08-15'
  },
  {
    id: 'idea-015',
    title: 'Hardware-Software Testing Lab as a Service',
    description: 'Cloud-based testing lab that allows companies to remotely test IoT devices and hardware-software integrations without maintaining physical infrastructure.',
    category: 'Testing Service',
    stage: 'validating',
    potentialRevenue: 'high',
    implementationComplexity: 4,
    timeToMarket: '10-15 months',
    requiredSkills: ['Hardware testing', 'Remote access systems', 'Lab management', 'Quality assurance'],
    marketSize: '$5B testing services market',
    competitionLevel: 'low',
    aiRelevance: false,
    hardwareComponent: true,
    relatedIncomeStream: 'is-007',
    sourceOfInspiration: 'Difficulty accessing testing facilities for hardware integration projects',
    nextSteps: [
      'Survey hardware companies',
      'Research remote testing technologies',
      'Design lab architecture'
    ],
    tags: ['Testing', 'Hardware', 'IoT', 'Lab', 'Remote Access'],
    createdDate: '2024-07-25',
    lastUpdated: '2024-11-20'
  },
  {
    id: 'idea-016',
    title: 'Corporate AI Ethics Compliance Platform',
    description: 'Platform helping corporations develop and maintain AI ethics policies, monitor compliance, and generate regulatory reports.',
    category: 'Compliance Tech',
    stage: 'researching',
    potentialRevenue: 'very-high',
    implementationComplexity: 4,
    timeToMarket: '8-12 months',
    requiredSkills: ['AI ethics', 'Compliance systems', 'Policy management', 'Regulatory knowledge'],
    marketSize: '$30B compliance software market',
    competitionLevel: 'low',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-009',
    sourceOfInspiration: 'Corporate clients asking about AI ethics and regulatory compliance',
    nextSteps: [
      'Research AI ethics regulations',
      'Interview compliance officers',
      'Study existing compliance platforms'
    ],
    tags: ['AI Ethics', 'Compliance', 'Corporate', 'Regulatory', 'Platform'],
    createdDate: '2024-08-30',
    lastUpdated: '2024-11-18'
  },
  {
    id: 'idea-017',
    title: 'Predictive Maintenance for Building Systems',
    description: 'AI system that predicts maintenance needs for building systems (HVAC, elevators, security) by analyzing sensor data and usage patterns.',
    category: 'Maintenance Tech',
    stage: 'raw-thought',
    potentialRevenue: 'high',
    implementationComplexity: 4,
    timeToMarket: '10-14 months',
    requiredSkills: ['Predictive analytics', 'Building systems', 'IoT sensors', 'Maintenance planning'],
    marketSize: '$12B predictive maintenance market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: true,
    relatedIncomeStream: 'is-001',
    sourceOfInspiration: 'Client requests for reducing unexpected building system failures',
    nextSteps: [
      'Research building maintenance data',
      'Study predictive analytics models',
      'Interview facility managers'
    ],
    tags: ['Predictive Maintenance', 'Building Systems', 'AI', 'IoT', 'Facilities'],
    createdDate: '2024-10-05',
    lastUpdated: '2024-11-12'
  },
  {
    id: 'idea-018',
    title: 'AI-Powered Newsletter Topic Generator',
    description: 'Tool that analyzes trending topics, audience engagement, and content gaps to suggest high-potential newsletter topics with content outlines.',
    category: 'Content Tool',
    stage: 'developing',
    potentialRevenue: 'medium',
    implementationComplexity: 2,
    timeToMarket: '3-4 months',
    requiredSkills: ['Content analysis', 'Trend detection', 'Newsletter expertise', 'AI/ML'],
    marketSize: '$400B content creation market',
    competitionLevel: 'medium',
    aiRelevance: true,
    hardwareComponent: false,
    relatedIncomeStream: 'is-003',
    sourceOfInspiration: 'Weekly struggle to identify engaging topics for newsletter content',
    nextSteps: [
      'Build topic trend analysis prototype',
      'Test with own newsletter data',
      'Survey other newsletter creators'
    ],
    tags: ['Newsletter', 'Content Generation', 'AI', 'Topic Research', 'Trend Analysis'],
    createdDate: '2024-11-01',
    lastUpdated: '2024-12-03'
  }
];

export const ideaSummary = {
  totalIdeas: ideas.length,
  byStage: {
    'raw-thought': ideas.filter(i => i.stage === 'raw-thought').length,
    'researching': ideas.filter(i => i.stage === 'researching').length,
    'validating': ideas.filter(i => i.stage === 'validating').length,
    'developing': ideas.filter(i => i.stage === 'developing').length,
    'testing': ideas.filter(i => i.stage === 'testing').length,
    'launched': ideas.filter(i => i.stage === 'launched').length
  },
  byRevenuePotential: {
    'very-high': ideas.filter(i => i.potentialRevenue === 'very-high').length,
    'high': ideas.filter(i => i.potentialRevenue === 'high').length,
    'medium': ideas.filter(i => i.potentialRevenue === 'medium').length,
    'low': ideas.filter(i => i.potentialRevenue === 'low').length
  },
  aiRelevantIdeas: ideas.filter(i => i.aiRelevance).length,
  hardwareComponentIdeas: ideas.filter(i => i.hardwareComponent).length,
  topPriorityIdeas: ideas
    .filter(i => i.potentialRevenue === 'very-high' || i.potentialRevenue === 'high')
    .filter(i => i.implementationComplexity <= 3)
    .sort((a, b) => a.implementationComplexity - b.implementationComplexity)
    .slice(0, 5)
    .map(i => ({ id: i.id, title: i.title, stage: i.stage }))
}; 