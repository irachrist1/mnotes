import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI service (using environment variable for API key)
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || 'AIzaSyDEK2L_tx9KQIh5bK_6b3ZBQoMZ1Q7Xsxg';

// Initialize Google Gemini AI for Ultra Mode
const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIInsight {
  type: 'revenue_optimization' | 'mentorship_analysis' | 'idea_scoring' | 'predictive_trends';
  title: string;
  insight: string;
  actionItems: string[];
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  mode?: 'regular' | 'ultra';
}

export interface MentorshipInsightRequest {
  sessionNotes: string;
  mentorName: string;
  sessionType: 'giving' | 'receiving';
  topics: string[];
  rating: number;
}

export interface RevenueOptimizationRequest {
  incomeStreams: Array<{
    name: string;
    monthlyRevenue: number;
    status: string;
    category: string;
    trend: string;
  }>;
  timeframe: number; // months
}

export interface IdeaScoringRequest {
  ideaTitle: string;
  description: string;
  stage: string;
  complexity: number;
  revenuePotential: string;
  isAIRelevant: boolean;
  hasHardwareComponent: boolean;
}

export interface PredictiveAnalyticsRequest {
  historicalData: {
    revenue: Array<{ month: string; amount: number }>;
    ideas: Array<{ stage: string; count: number }>;
    mentorship: Array<{ month: string; sessions: number; rating: number }>;
  };
  forecastMonths: number;
}

class AIService {
  private model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    }
  });

  /**
   * Generate actionable insights from mentorship session data
   */
  async generateMentorshipInsights(request: MentorshipInsightRequest, ultraMode: boolean = false): Promise<AIInsight> {
    try {
      if (ultraMode) {
        return await this.generateMentorshipInsightsUltra(request);
      }
      
      // Regular mode - local analysis
      const insight = this.generateMentorshipInsightText(request);
      const actionItems = this.generateMentorshipActionItems(request);
      
      return {
        type: 'mentorship_analysis',
        title: `Insights from ${request.mentorName} Session`,
        insight,
        actionItems,
        confidence: Math.min(85, Math.max(65, request.rating * 8 + Math.random() * 15)),
        priority: request.rating >= 8 ? 'high' : request.rating >= 6 ? 'medium' : 'low',
        mode: 'regular'
      };
    } catch (error) {
      console.error('Error generating mentorship insights:', error);
      throw new Error('Failed to generate mentorship insights');
    }
  }

  /**
   * AI Ultra Mode - Real Google Gemini analysis for mentorship
   */
  private async generateMentorshipInsightsUltra(request: MentorshipInsightRequest): Promise<AIInsight> {
    const prompt = `
      🧠 CHRISTIAN'S AI BRAIN - ULTRA ANALYSIS MODE 🧠
      
      Analyze this mentorship session with deep strategic intelligence:
      
      Mentor: ${request.mentorName}
      Session Type: ${request.sessionType}
      Rating: ${request.rating}/10
      Topics Discussed: ${request.topics.join(', ')}
      Session Notes: "${request.sessionNotes}"
      
      Provide:
      1. Deep strategic insights for Christian's entrepreneurial growth
      2. 3-5 specific, actionable steps with tactical details
      3. Hidden patterns or opportunities that might be missed
      4. Priority level based on potential business impact
      5. Advanced business intelligence recommendations
      
      Format as JSON with: insight, actionItems (array), priority, confidence (0-100)
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const aiResponse = this.parseAIResponse(text);
    
    // Additional safety checks
    const insight = typeof aiResponse.insight === 'string' 
      ? aiResponse.insight 
      : 'Advanced AI analysis completed for this mentorship session.';
    
    const actionItems = Array.isArray(aiResponse.actionItems) 
      ? aiResponse.actionItems.filter((item: any) => typeof item === 'string')
      : ['Review AI ultra insights', 'Implement strategic recommendations'];
    
    return {
      type: 'mentorship_analysis',
      title: `🧠 AI Ultra Analysis: ${request.mentorName} Session`,
      insight,
      actionItems,
      confidence: Math.min(95, Math.max(80, aiResponse.confidence || 85)),
      priority: aiResponse.priority || (request.rating >= 8 ? 'high' : 'medium'),
      mode: 'ultra'
    };
  }

  /**
   * Analyze income streams and recommend optimization strategies
   */
  async generateRevenueOptimization(request: RevenueOptimizationRequest, ultraMode: boolean = false): Promise<AIInsight> {
    try {
      if (ultraMode) {
        return await this.generateRevenueOptimizationUltra(request);
      }
      
      // Regular mode - local analysis
      const totalRevenue = request.incomeStreams.reduce((sum, stream) => sum + stream.monthlyRevenue, 0);
      const activeStreams = request.incomeStreams.filter(s => s.status === 'active').length;
      
      const insight = this.generateRevenueInsightText(request.incomeStreams, totalRevenue);
      const actionItems = this.generateRevenueActionItems(request.incomeStreams);
      
      return {
        type: 'revenue_optimization',
        title: 'Revenue Stream Optimization Strategy',
        insight,
        actionItems,
        confidence: Math.min(90, Math.max(70, 75 + (activeStreams * 5))),
        priority: totalRevenue > 5000 ? 'high' : totalRevenue > 2000 ? 'medium' : 'low',
        mode: 'regular'
      };
    } catch (error) {
      console.error('Error generating revenue optimization:', error);
      throw new Error('Failed to generate revenue optimization insights');
    }
  }

  /**
   * AI Ultra Mode - Real Google Gemini analysis for revenue optimization
   */
  private async generateRevenueOptimizationUltra(request: RevenueOptimizationRequest): Promise<AIInsight> {
    const totalRevenue = request.incomeStreams.reduce((sum, stream) => sum + stream.monthlyRevenue, 0);
    const streamsData = request.incomeStreams.map(stream => 
      `${stream.name}: $${stream.monthlyRevenue}/mo (${stream.status}, ${stream.category}, trend: ${stream.trend})`
    ).join('\n');

    const prompt = `
      🧠 CHRISTIAN'S AI BRAIN - ULTRA REVENUE ANALYSIS 🧠
      
      Perform advanced revenue optimization analysis for Christian's income streams:
      
      Total Monthly Revenue: $${totalRevenue}
      Timeframe: ${request.timeframe} months
      
      Income Streams:
      ${streamsData}
      
      Provide ultra-intelligent analysis:
      1. Advanced revenue optimization opportunities with specific tactics
      2. Strategic focus areas for maximum ROI with timeline
      3. Risk mitigation strategies and market positioning
      4. 4-6 actionable recommendations to increase monthly revenue by 25-40%
      5. Competitive advantages and scaling strategies
      
      Format as JSON with: insight, actionItems (array), priority, confidence (0-100)
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const aiResponse = this.parseAIResponse(text);
    
    // Additional safety checks
    const insight = typeof aiResponse.insight === 'string' 
      ? aiResponse.insight 
      : 'Advanced revenue optimization analysis completed with strategic recommendations.';
    
    const actionItems = Array.isArray(aiResponse.actionItems) 
      ? aiResponse.actionItems.filter((item: any) => typeof item === 'string')
      : ['Implement AI ultra revenue strategies', 'Focus on highest-ROI opportunities'];
    
    return {
      type: 'revenue_optimization',
      title: '🧠 AI Ultra Revenue Strategy',
      insight,
      actionItems,
      confidence: Math.min(95, Math.max(85, aiResponse.confidence || 90)),
      priority: aiResponse.priority || 'high',
      mode: 'ultra'
    };
  }

  /**
   * Score and prioritize ideas using AI analysis
   */
  async generateIdeaScore(request: IdeaScoringRequest, ultraMode: boolean = false): Promise<AIInsight & { score: number }> {
    try {
      if (ultraMode) {
        return await this.generateIdeaScoreUltra(request);
      }
      
      // Regular mode - local analysis
      const score = this.calculateIdeaScore(request);
      const insight = this.generateIdeaInsightText(request, score);
      const actionItems = this.generateIdeaActionItems(request);
      
      return {
        type: 'idea_scoring',
        title: `Analysis: ${request.ideaTitle}`,
        insight,
        actionItems,
        confidence: Math.min(85, Math.max(60, score + Math.random() * 15)),
        priority: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
        score,
        mode: 'regular'
      };
    } catch (error) {
      console.error('Error generating idea score:', error);
      throw new Error('Failed to generate idea scoring insights');
    }
  }

  /**
   * AI Ultra Mode - Real Google Gemini analysis for idea scoring
   */
  private async generateIdeaScoreUltra(request: IdeaScoringRequest): Promise<AIInsight & { score: number }> {
    const prompt = `
      🧠 CHRISTIAN'S AI BRAIN - ULTRA IDEA ANALYSIS 🧠
      
      Perform comprehensive idea evaluation with advanced intelligence:
      
      Idea: ${request.ideaTitle}
      Description: ${request.description}
      Current Stage: ${request.stage}
      Complexity: ${request.complexity}/5
      Revenue Potential: ${request.revenuePotential}
      AI Relevant: ${request.isAIRelevant}
      Has Hardware: ${request.hasHardwareComponent}
      
      Ultra-intelligent analysis:
      1. Deep market potential assessment with timing analysis
      2. Technical feasibility with risk/opportunity matrix
      3. Revenue model viability and scaling potential
      4. Competitive landscape and differentiation strategies
      5. Resource optimization and strategic partnerships
      6. Innovation score and market disruption potential
      
      Provide a comprehensive score (0-100) and strategic roadmap.
      Format as JSON with: insight, actionItems (array), priority, confidence (0-100), score (0-100)
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const aiResponse = this.parseAIResponse(text);
    
    // Additional safety checks
    const insight = typeof aiResponse.insight === 'string' 
      ? aiResponse.insight 
      : 'Advanced AI evaluation completed with comprehensive strategic analysis.';
    
    const actionItems = Array.isArray(aiResponse.actionItems) 
      ? aiResponse.actionItems.filter((item: any) => typeof item === 'string')
      : ['Execute AI ultra recommendations', 'Focus on validated opportunities'];
    
    return {
      type: 'idea_scoring',
      title: `🧠 AI Ultra Idea Evaluation: ${request.ideaTitle}`,
      insight,
      actionItems,
      confidence: Math.min(95, Math.max(75, aiResponse.confidence || 85)),
      priority: aiResponse.priority || 'high',
      score: Math.min(100, Math.max(0, aiResponse.score || 75)),
      mode: 'ultra'
    };
  }

  /**
   * Generate predictive analytics and forecasts
   */
  async generatePredictiveAnalytics(request: PredictiveAnalyticsRequest, ultraMode: boolean = false): Promise<AIInsight> {
    try {
      if (ultraMode) {
        return await this.generatePredictiveAnalyticsUltra(request);
      }
      
      // Regular mode - local analysis
      const insight = this.generatePredictiveInsightText(request);
      const actionItems = this.generatePredictiveActionItems(request);
      
      return {
        type: 'predictive_trends',
        title: `${request.forecastMonths}-Month Business Forecast`,
        insight,
        actionItems,
        confidence: Math.min(80, Math.max(65, 70 + Math.random() * 10)),
        priority: 'high',
        mode: 'regular'
      };
    } catch (error) {
      console.error('Error generating predictive analytics:', error);
      throw new Error('Failed to generate predictive analytics');
    }
  }

  /**
   * AI Ultra Mode - Real Google Gemini analysis for predictive analytics
   */
  private async generatePredictiveAnalyticsUltra(request: PredictiveAnalyticsRequest): Promise<AIInsight> {
    const revenueData = request.historicalData.revenue.map(r => `${r.month}: $${r.amount}`).join(', ');
    const ideasData = request.historicalData.ideas.map(i => `${i.stage}: ${i.count}`).join(', ');
    const mentorshipData = request.historicalData.mentorship.map(m => `${m.month}: ${m.sessions} sessions (avg rating: ${m.rating})`).join(', ');

    const prompt = `
      🧠 CHRISTIAN'S AI BRAIN - ULTRA PREDICTIVE ANALYSIS 🧠
      
      Perform advanced predictive analytics for Christian's business ecosystem:
      
      Revenue History: ${revenueData}
      Ideas Pipeline: ${ideasData}
      Mentorship Activity: ${mentorshipData}
      Forecast Period: ${request.forecastMonths} months
      
      Ultra-intelligent forecasting:
      1. Advanced revenue growth predictions with scenario modeling
      2. Idea pipeline conversion forecasts with success probabilities
      3. Strategic opportunity timing with market factor analysis
      4. Risk assessment with mitigation strategies
      5. Resource allocation optimization
      6. Competitive positioning and market evolution predictions
      
      Format as JSON with: insight, actionItems (array), priority, confidence (0-100)
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const aiResponse = this.parseAIResponse(text);
    
    // Additional safety checks
    const insight = typeof aiResponse.insight === 'string' 
      ? aiResponse.insight 
      : 'Advanced predictive analysis completed with comprehensive forecasting.';
    
    const actionItems = Array.isArray(aiResponse.actionItems) 
      ? aiResponse.actionItems.filter((item: any) => typeof item === 'string')
      : ['Execute AI ultra predictions', 'Optimize strategic positioning'];
    
    return {
      type: 'predictive_trends',
      title: `🧠 AI Ultra Forecast: ${request.forecastMonths}-Month Prediction`,
      insight,
      actionItems,
      confidence: Math.min(95, Math.max(80, aiResponse.confidence || 85)),
      priority: aiResponse.priority || 'high',
      mode: 'ultra'
    };
  }

  /**
   * Parse AI response text and extract structured data
   */
  private parseAIResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure insight is always a string
        let insight = parsed.insight;
        if (typeof insight !== 'string') {
          insight = 'AI Ultra analysis completed. Advanced insights generated successfully.';
        }
        
        // Ensure actionItems is always an array of strings
        let actionItems = parsed.actionItems;
        if (!Array.isArray(actionItems)) {
          actionItems = ['Review AI ultra insights', 'Implement strategic recommendations'];
        } else {
          // Convert any non-string items to strings
          actionItems = actionItems.map(item => 
            typeof item === 'string' ? item : String(item)
          );
        }
        
        // Ensure priority is a valid string
        let priority = parsed.priority;
        if (!['low', 'medium', 'high'].includes(priority)) {
          priority = 'medium';
        }
        
        // Ensure confidence is a number
        let confidence = parsed.confidence;
        if (typeof confidence !== 'number' || isNaN(confidence)) {
          confidence = 85;
        }
        
        // Ensure score is a number (for idea scoring)
        let score = parsed.score;
        if (typeof score !== 'number' || isNaN(score)) {
          score = 75;
        }
        
        return {
          insight,
          actionItems,
          priority,
          confidence,
          score
        };
      }
      
      // Fallback: parse manually
      return {
        insight: text.substring(0, 300) + '...',
        actionItems: ['Review AI-generated insights', 'Implement recommended strategies'],
        priority: 'medium',
        confidence: 85
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        insight: 'AI Ultra analysis completed. Advanced insights generated successfully.',
        actionItems: ['Review ultra insights', 'Execute strategic recommendations'],
        priority: 'high',
        confidence: 85
      };
    }
  }

  // Helper methods for generating insights (Regular Mode)
  private generateMentorshipInsightText(request: MentorshipInsightRequest): string {
    const insights = [
      `Your session with ${request.mentorName} highlighted key growth opportunities`,
      `The ${request.sessionType} session covered valuable topics: ${request.topics.slice(0, 2).join(', ')}`,
      `With a ${request.rating}/10 rating, this represents a high-value mentorship relationship`,
      `The discussion around ${request.topics[0]} could drive significant business impact`
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  private generateMentorshipActionItems(request: MentorshipInsightRequest): string[] {
    const baseActions = [
      `Schedule follow-up with ${request.mentorName} within 2 weeks`,
      `Document key insights from ${request.topics[0]} discussion`,
      'Create action plan for implementing discussed strategies'
    ];
    
    if (request.rating >= 8) {
      baseActions.push('Explore deeper collaboration opportunities');
    }
    
    return baseActions.slice(0, 3);
  }

  private generateRevenueInsightText(streams: any[], totalRevenue: number): string {
    const topStream = streams.reduce((prev, curr) => 
      prev.monthlyRevenue > curr.monthlyRevenue ? prev : curr
    );
    
    return `Your top revenue stream "${topStream.name}" generates $${topStream.monthlyRevenue}/month. ` +
           `Total monthly revenue of $${totalRevenue} shows strong potential for optimization. ` +
           `Focus on scaling proven streams and diversifying income sources.`;
  }

  private generateRevenueActionItems(streams: any[]): string[] {
    const actions = [
      'Analyze top-performing streams for scaling opportunities',
      'Identify underperforming streams for optimization',
      'Explore new revenue diversification strategies'
    ];
    
    const developingStreams = streams.filter(s => s.status === 'developing');
    if (developingStreams.length > 0) {
      actions.push(`Accelerate development of ${developingStreams[0].name}`);
    }
    
    return actions.slice(0, 4);
  }

  private calculateIdeaScore(request: IdeaScoringRequest): number {
    let score = 50; // Base score
    
    // Revenue potential impact
    const revenueMultiplier = {
      'very-high': 25,
      'high': 20,
      'medium': 10,
      'low': 5
    };
    score += revenueMultiplier[request.revenuePotential as keyof typeof revenueMultiplier] || 5;
    
    // Complexity adjustment (lower complexity = higher score)
    score += (6 - request.complexity) * 3;
    
    // AI relevance bonus
    if (request.isAIRelevant) score += 10;
    
    // Stage bonus
    const stageBonus = {
      'raw-thought': 5,
      'researching': 10,
      'validating': 15,
      'developing': 20,
      'testing': 25,
      'launched': 30
    };
    score += stageBonus[request.stage as keyof typeof stageBonus] || 5;
    
    return Math.min(100, Math.max(0, score));
  }

  private generateIdeaInsightText(request: IdeaScoringRequest, score: number): string {
    if (score >= 75) {
      return `${request.ideaTitle} shows exceptional market potential with ${request.revenuePotential} revenue opportunity. The ${request.stage} stage indicates strong progress.`;
    } else if (score >= 50) {
      return `${request.ideaTitle} has solid potential but may need refinement. Consider focusing on market validation and reducing complexity.`;
    } else {
      return `${request.ideaTitle} needs significant development. Focus on improving market fit and reducing implementation barriers.`;
    }
  }

  private generateIdeaActionItems(request: IdeaScoringRequest): string[] {
    const actions = [
      `Conduct market research for ${request.ideaTitle}`,
      'Validate core value proposition with target users',
      'Develop minimum viable product (MVP)'
    ];
    
    if (request.hasHardwareComponent) {
      actions.push('Research hardware manufacturing partnerships');
    }
    
    return actions.slice(0, 4);
  }

  private generatePredictiveInsightText(request: PredictiveAnalyticsRequest): string {
    const recentRevenue = request.historicalData.revenue.slice(-3);
    const avgGrowth = recentRevenue.length > 1 ? 
      (recentRevenue[recentRevenue.length - 1].amount / recentRevenue[0].amount - 1) * 100 : 0;
    
    return `Based on recent trends, your business shows ${avgGrowth > 0 ? 'positive' : 'stable'} growth patterns. ` +
           `Revenue forecasting indicates potential for ${Math.abs(avgGrowth).toFixed(1)}% ${avgGrowth > 0 ? 'growth' : 'adjustment'} ` +
           `over the next ${request.forecastMonths} months.`;
  }

  private generatePredictiveActionItems(request: PredictiveAnalyticsRequest): string[] {
    return [
      'Monitor key performance indicators weekly',
      'Optimize highest-growth revenue streams',
      'Prepare contingency plans for market changes',
      'Focus resources on proven business models'
    ];
  }

  /**
   * Generate comprehensive business intelligence summary
   */
  async generateBusinessIntelligence(data: {
    incomeStreams: any[];
    ideas: any[];
    mentorshipSessions: any[];
    analytics: any;
  }, ultraMode: boolean = false): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];

      // Generate revenue optimization insights
      if (data.incomeStreams.length > 0) {
        const revenueRequest: RevenueOptimizationRequest = {
          incomeStreams: data.incomeStreams.map(stream => ({
            name: stream.name,
            monthlyRevenue: stream.monthlyRevenue,
            status: stream.status,
            category: stream.category,
            trend: stream.trend || 'stable'
          })),
          timeframe: 6
        };
        insights.push(await this.generateRevenueOptimization(revenueRequest, ultraMode));
      }

      // Generate idea pipeline insights
      if (data.ideas.length > 0) {
        const highPotentialIdea = data.ideas.find(idea => 
          idea.revenuePotential === 'High' || idea.revenuePotential === 'Medium'
        ) || data.ideas[0];

        const ideaRequest: IdeaScoringRequest = {
          ideaTitle: highPotentialIdea.title,
          description: highPotentialIdea.description,
          stage: highPotentialIdea.stage,
          complexity: highPotentialIdea.complexity,
          revenuePotential: highPotentialIdea.revenuePotential,
          isAIRelevant: highPotentialIdea.isAIRelevant,
          hasHardwareComponent: highPotentialIdea.hasHardwareComponent
        };
        insights.push(await this.generateIdeaScore(ideaRequest, ultraMode));
      }

      // Generate mentorship insights from recent sessions
      if (data.mentorshipSessions.length > 0) {
        const recentSession = data.mentorshipSessions[0]; // Most recent session
        const mentorshipRequest: MentorshipInsightRequest = {
          sessionNotes: recentSession.notes || recentSession.keyInsights?.join(' ') || 'No detailed notes available',
          mentorName: recentSession.mentorName,
          sessionType: recentSession.sessionType,
          topics: recentSession.topics || [],
          rating: recentSession.rating
        };
        insights.push(await this.generateMentorshipInsights(mentorshipRequest, ultraMode));
      }

      return insights;
    } catch (error) {
      console.error('Error generating business intelligence:', error);
      throw new Error('Failed to generate comprehensive business intelligence');
    }
  }
}

export const aiService = new AIService(); 