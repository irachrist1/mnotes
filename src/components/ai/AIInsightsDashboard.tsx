'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AIInsightCard } from './AIInsightCard';
import { aiService, AIInsight } from '@/services/ai.service';
import { incomeStreamsService } from '@/services/incomeStreams.service';
import { ideasService } from '@/services/ideas.service';
import { mentorshipService } from '@/services/mentorship.service';

export const AIInsightsDashboard: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [ultraMode, setUltraMode] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get data from services
      const [incomeStreamsResult, ideasResult, mentorshipSessionsResult] = await Promise.all([
        incomeStreamsService.getAll(),
        ideasService.getAll(),
        mentorshipService.getAll()
      ]);

      // Extract data from service responses
      const incomeStreams = incomeStreamsResult.data || [];
      const ideas = ideasResult.data || [];
      const mentorshipSessions = mentorshipSessionsResult.data || [];

      // Generate business insights with selected mode
      const businessIntelligence = await aiService.generateBusinessIntelligence({
        incomeStreams,
        ideas,
        mentorshipSessions,
        analytics: {}
      }, ultraMode);

      setInsights(businessIntelligence);
      setLastGenerated(new Date());
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(`Failed to generate ${ultraMode ? 'AI Ultra' : 'business'} insights. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleImplementAction = async (actionItem: string) => {
    // Track action implementation
    alert(`✅ Action tracked: ${actionItem}\n\nThis would integrate with your task management system.`);
  };

  const getInsightStats = () => {
    if (insights.length === 0) return null;

    const highPriority = insights.filter(i => i.priority === 'high').length;
    const avgConfidence = Math.round(
      insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
    );
    const types = [...new Set(insights.map(i => i.type))].length;
    const ultraCount = insights.filter(i => i.mode === 'ultra').length;

    return { highPriority, avgConfidence, types, ultraCount };
  };

  const stats = getInsightStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Christian's AI Brain
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Strategic insights and recommendations from your business data
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* AI Ultra Mode Toggle */}
          <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              onClick={() => setUltraMode(false)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                !ultraMode
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              🧠 Regular
            </button>
            <button
              onClick={() => setUltraMode(true)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                ultraMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              ⚡ AI Ultra
            </button>
          </div>
          
          <Button
            onClick={generateInsights}
            disabled={loading}
            className={ultraMode 
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            }
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{ultraMode ? 'AI Ultra Processing...' : 'Analyzing...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>{ultraMode ? '⚡' : '🧠'}</span>
                <span>{ultraMode ? 'Activate AI Ultra' : 'Analyze Entire Personal Data'}</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Mode Indicator */}
      {ultraMode && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
              <span className="text-white text-lg">⚡</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                AI Ultra Mode Activated
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Using real Google Gemini AI for advanced strategic analysis and creative insights
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-xl">🚨</span>
              </div>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">High Priority</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.highPriority}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-green-600 dark:text-green-400 text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Avg Confidence</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.avgConfidence}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Insight Types</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.types}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">AI Ultra</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.ultraCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error</h3>
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {insights.length === 0 && !loading && !error && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl">{ultraMode ? '⚡' : '📊'}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {ultraMode ? 'Ready for AI Ultra Analysis' : 'No Business Insights Generated Yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {ultraMode 
                ? 'AI Ultra Mode will use real Google Gemini AI for advanced strategic analysis with creative insights and deeper intelligence.'
                : 'Click "Analyze Entire Personal Data" to analyze your business data and receive intelligent recommendations for growth and optimization.'
              }
            </p>
            <div className="flex justify-center">
              <Button
                onClick={generateInsights}
                className={ultraMode 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                }
              >
                {ultraMode ? '⚡ Activate AI Ultra' : '🧠 Analyze Business Data'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="animate-pulse text-6xl">{ultraMode ? '⚡' : '📊'}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {ultraMode ? 'AI Ultra Processing Your Data...' : 'Analyzing Your Business Data...'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {ultraMode 
                ? 'Google Gemini AI is performing advanced strategic analysis of your income streams, ideas, and mentorship data.'
                : 'Processing income streams, ideas, and mentorship data to generate strategic insights.'
              }
            </p>
            <div className="flex justify-center">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${ultraMode ? 'border-purple-600' : 'border-blue-600'}`}></div>
            </div>
          </div>
        </Card>
      )}

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Strategic Insights & Recommendations
              {ultraMode && <span className="ml-2 text-purple-600 dark:text-purple-400">⚡ AI Ultra</span>}
            </h2>
            {lastGenerated && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generated {lastGenerated.toLocaleString()} • {ultraMode ? 'AI Ultra Mode' : 'Regular Mode'}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <AIInsightCard
                key={index}
                insight={insight}
                onImplement={handleImplementAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-500 text-lg">⚠️</span>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Christian's AI Brain Disclaimer</p>
            <p>
              These insights are generated based on Christian's personal data. 
              {ultraMode && ' AI Ultra Mode uses real Google Gemini AI for advanced analysis.'}
              {!ultraMode && ' Regular Mode uses local intelligent analysis algorithms.'}
              {' '}Always validate recommendations with your business judgment and current market conditions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};