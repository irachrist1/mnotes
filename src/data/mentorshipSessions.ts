export interface MentorshipSession {
  id: string;
  mentorName: string;
  date: string;
  duration: number; // minutes
  sessionType: 'giving' | 'receiving';
  topics: string[];
  keyInsights: string[];
  actionItems: {
    id: string;
    task: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
  }[];
  rating: number; // 1-10
  notes: string;
}

export const mentorshipSessions: MentorshipSession[] = [
  {
    id: 'ms-001',
    mentorName: 'James Muigai',
    date: '2025-01-15',
    duration: 45,
    sessionType: 'receiving',
    topics: ['Business Strategy', 'Decision Making', 'Growth Planning'],
    keyInsights: [
      'Avoid analysis paralysis - take action with 80% information',
      'Focus on one revenue stream at a time for maximum impact',
      'Business strategy is about saying no to good opportunities to focus on great ones'
    ],
    actionItems: [
      {
        id: 'ai-001',
        task: 'Prioritize top 3 income streams and create focused action plan',
        priority: 'high',
        completed: true,
        dueDate: '2025-01-22'
      },
      {
        id: 'ai-002',
        task: 'Set weekly decision-making deadline to avoid overthinking',
        priority: 'medium',
        completed: true,
        dueDate: '2025-01-20'
      }
    ],
    rating: 9,
    notes: 'James emphasized the importance of decisive action over perfect analysis. His "avoid analysis paralysis" mantra really resonated with current challenges in prioritizing multiple opportunities.'
  },
  {
    id: 'ms-002',
    mentorName: 'Elizabeth Babalola',
    date: '2025-01-22',
    duration: 60,
    sessionType: 'receiving',
    topics: ['Business Development', 'Client Relations', 'Revenue Growth'],
    keyInsights: [
      'Relationships drive revenue - invest in long-term client partnerships',
      'Every client interaction is a business development opportunity',
      'Focus on delivering value first, revenue will follow naturally'
    ],
    actionItems: [
      {
        id: 'ai-003',
        task: 'Develop client relationship nurturing system for SPCS clients',
        priority: 'high',
        completed: false,
        dueDate: '2025-02-05'
      },
      {
        id: 'ai-004',
        task: 'Create value-first proposal template for new consulting opportunities',
        priority: 'medium',
        completed: false,
        dueDate: '2025-01-30'
      }
    ],
    rating: 8,
    notes: 'Elizabeth provided excellent insights on building sustainable client relationships. Her approach to value-first business development aligns well with current consulting strategy.'
  },
  {
    id: 'ms-003',
    mentorName: 'Jimmy Nsenga',
    date: '2025-02-01',
    duration: 50,
    sessionType: 'receiving',
    topics: ['Technology Leadership', 'IoT Implementation', 'Startup Scaling'],
    keyInsights: [
      'IoT success requires understanding both hardware and software ecosystems',
      'Technical leadership is about enabling others, not being the smartest person',
      'Job in Rwanda experience: matching market needs with available talent'
    ],
    actionItems: [
      {
        id: 'ai-005',
        task: 'Research IoT market opportunities in Rwanda/East Africa',
        priority: 'medium',
        completed: true,
        dueDate: '2025-02-10'
      },
      {
        id: 'ai-006',
        task: 'Develop technical mentorship program for SPCS team',
        priority: 'low',
        completed: false,
        dueDate: '2025-03-01'
      }
    ],
    rating: 9,
    notes: 'Jimmy\'s experience with Job in Rwanda and IoT development provided valuable perspective on scaling tech solutions in emerging markets. Great insights on technical leadership.'
  },
  {
    id: 'ms-004',
    mentorName: 'Catherine Njane',
    date: '2025-02-08',
    duration: 40,
    sessionType: 'receiving',
    topics: ['Business Development', 'Strategic Partnerships', 'Market Expansion'],
    keyInsights: [
      'Strategic partnerships multiply your capabilities without multiplying your costs',
      'Business development is about creating win-win scenarios for all parties',
      'Market expansion requires deep understanding of local business culture'
    ],
    actionItems: [
      {
        id: 'ai-007',
        task: 'Identify 3 potential strategic partners for SPCS expansion',
        priority: 'high',
        completed: false,
        dueDate: '2025-02-20'
      },
      {
        id: 'ai-008',
        task: 'Create partnership proposal framework for mutual value creation',
        priority: 'medium',
        completed: false,
        dueDate: '2025-02-25'
      }
    ],
    rating: 8,
    notes: 'Catherine\'s expertise in strategic partnerships opened new perspectives on scaling without heavy investment. Her insights on local market dynamics are particularly valuable.'
  },
  {
    id: 'ms-005',
    mentorName: 'Timothy',
    date: '2025-02-12',
    duration: 35,
    sessionType: 'receiving',
    topics: ['Critical Thinking', 'Problem Solving', 'Perspective Challenge'],
    keyInsights: [
      'Common sense is not common - question every assumption',
      'The best solutions often come from challenging conventional wisdom',
      'Critical thinking requires intellectual humility and willingness to be wrong'
    ],
    actionItems: [
      {
        id: 'ai-009',
        task: 'Implement weekly assumption-challenging exercise for business decisions',
        priority: 'medium',
        completed: true,
        dueDate: '2025-02-19'
      },
      {
        id: 'ai-010',
        task: 'Review and challenge current business model assumptions',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-01'
      }
    ],
    rating: 7,
    notes: 'Timothy\'s "Common Sense PHD" approach forced me to question several assumptions about newsletter monetization and consulting pricing. Valuable perspective-challenging session.'
  },
  {
    id: 'ms-006',
    mentorName: 'Shaan Puri',
    date: '2025-02-18',
    duration: 55,
    sessionType: 'receiving',
    topics: ['Business Development', 'Content Marketing', 'Revenue Optimization'],
    keyInsights: [
      'Content is the best business development tool when done strategically',
      'Every piece of content should have a clear business objective',
      'Distribution beats creation - focus on getting content in front of right people'
    ],
    actionItems: [
      {
        id: 'ai-011',
        task: 'Develop content distribution strategy for newsletters to maximize BD impact',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-05'
      },
      {
        id: 'ai-012',
        task: 'Create content calendar with specific business development goals',
        priority: 'medium',
        completed: false,
        dueDate: '2025-02-28'
      }
    ],
    rating: 9,
    notes: 'Shaan provided excellent insights on leveraging content for business development. His perspective on distribution over creation is reshaping newsletter strategy.'
  },
  {
    id: 'ms-007',
    mentorName: 'James Muigai',
    date: '2025-03-01',
    duration: 40,
    sessionType: 'receiving',
    topics: ['Strategic Focus', 'Resource Allocation', 'Goal Setting'],
    keyInsights: [
      'Avoid analysis paralysis by setting decision deadlines',
      'Resource allocation should reflect strategic priorities, not just opportunities',
      'Clear goals enable better decision making under uncertainty'
    ],
    actionItems: [
      {
        id: 'ai-013',
        task: 'Set Q2 2025 strategic goals with specific success metrics',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-10'
      },
      {
        id: 'ai-014',
        task: 'Implement resource allocation framework based on strategic priorities',
        priority: 'medium',
        completed: false,
        dueDate: '2025-03-15'
      }
    ],
    rating: 8,
    notes: 'Follow-up session with James focusing on implementation of previous insights. His consistent emphasis on avoiding analysis paralysis is helping with decision speed.'
  },
  {
    id: 'ms-008',
    mentorName: 'Elizabeth Babalola',
    date: '2025-03-08',
    duration: 45,
    sessionType: 'receiving',
    topics: ['Client Retention', 'Service Scaling', 'Business Development'],
    keyInsights: [
      'Client retention is more profitable than client acquisition',
      'Scaling services requires systematizing processes, not just adding capacity',
      'Business development success comes from consistent relationship building'
    ],
    actionItems: [
      {
        id: 'ai-015',
        task: 'Develop client retention strategy for consulting services',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-20'
      },
      {
        id: 'ai-016',
        task: 'Create service delivery process documentation for scaling',
        priority: 'medium',
        completed: false,
        dueDate: '2025-03-25'
      }
    ],
    rating: 8,
    notes: 'Elizabeth provided practical frameworks for scaling consulting services. Her emphasis on retention over acquisition is shifting focus to deeper client relationships.'
  },
  {
    id: 'ms-009',
    mentorName: 'Jimmy Nsenga',
    date: '2025-03-15',
    duration: 50,
    sessionType: 'receiving',
    topics: ['Technical Innovation', 'Market Validation', 'Product Development'],
    keyInsights: [
      'Innovation without market validation is just expensive experimentation',
      'Technical solutions must solve real business problems',
      'Product development should start with customer pain points, not technology capabilities'
    ],
    actionItems: [
      {
        id: 'ai-017',
        task: 'Validate IoT consulting demand with 5 potential clients',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-30'
      },
      {
        id: 'ai-018',
        task: 'Document technical capabilities to match with market needs',
        priority: 'medium',
        completed: false,
        dueDate: '2025-04-05'
      }
    ],
    rating: 9,
    notes: 'Jimmy emphasized the importance of market validation before technical development. His Job in Rwanda experience provides great examples of market-first approaches.'
  },
  {
    id: 'ms-010',
    mentorName: 'Timothy',
    date: '2025-03-22',
    duration: 30,
    sessionType: 'receiving',
    topics: ['Decision Making', 'Risk Assessment', 'Strategic Thinking'],
    keyInsights: [
      'Every decision has hidden assumptions that should be made explicit',
      'Risk assessment should include opportunity costs, not just downside risks',
      'Strategic thinking requires both logical analysis and intuitive insight'
    ],
    actionItems: [
      {
        id: 'ai-019',
        task: 'Create decision-making framework that exposes assumptions',
        priority: 'medium',
        completed: false,
        dueDate: '2025-04-01'
      },
      {
        id: 'ai-020',
        task: 'Apply assumption-challenging technique to current strategic decisions',
        priority: 'high',
        completed: false,
        dueDate: '2025-03-29'
      }
    ],
    rating: 8,
    notes: 'Timothy\'s systematic approach to challenging assumptions is becoming a valuable tool for strategic decision making. His "Common Sense PHD" methodology is practical and effective.'
  }
];

// Calculate summary statistics
export const mentorshipSummary = {
  totalSessions: mentorshipSessions.length,
  averageRating: mentorshipSessions.reduce((sum, session) => sum + session.rating, 0) / mentorshipSessions.length,
  totalActionItems: mentorshipSessions.reduce((sum, session) => sum + session.actionItems.length, 0),
  completedActionItems: mentorshipSessions.reduce((sum, session) => 
    sum + session.actionItems.filter(item => item.completed).length, 0
  ),
  mentorBreakdown: {
    'James Muigai': mentorshipSessions.filter(s => s.mentorName === 'James Muigai').length,
    'Elizabeth Babalola': mentorshipSessions.filter(s => s.mentorName === 'Elizabeth Babalola').length,
    'Catherine Njane': mentorshipSessions.filter(s => s.mentorName === 'Catherine Njane').length,
    'Shaan Puri': mentorshipSessions.filter(s => s.mentorName === 'Shaan Puri').length,
    'Jimmy Nsenga': mentorshipSessions.filter(s => s.mentorName === 'Jimmy Nsenga').length,
    'Timothy': mentorshipSessions.filter(s => s.mentorName === 'Timothy').length,
  },
  topicsFrequency: {
    'Business Strategy': 3,
    'Business Development': 5,
    'Technology Leadership': 2,
    'Critical Thinking': 3,
    'Client Relations': 2,
    'Strategic Planning': 4
  },
  pendingActions: mentorshipSessions
    .flatMap(session => session.actionItems)
    .filter(item => !item.completed)
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 10)
}; 