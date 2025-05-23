'use client';

import React from 'react';
import { AIInsight } from '@/services/ai.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AIInsightCardProps {
  insight: AIInsight;
  onImplement: (actionItem: string) => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, onImplement }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue_optimization':
        return '💰';
      case 'mentorship_analysis':
        return '🎯';
      case 'idea_scoring':
        return '💡';
      case 'predictive_trends':
        return '📈';
      default:
        return '📊';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'revenue_optimization':
        return 'Revenue Optimization';
      case 'mentorship_analysis':
        return 'Mentorship Analysis';
      case 'idea_scoring':
        return 'Idea Evaluation';
      case 'predictive_trends':
        return 'Predictive Analytics';
      default:
        return 'Business Intelligence';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const isUltraMode = insight.mode === 'ultra';

  return (
    <Card className={`h-full transition-all hover:shadow-lg ${
      isUltraMode 
        ? 'border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isUltraMode 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <span className={`text-xl ${isUltraMode ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                {getTypeIcon(insight.type)}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isUltraMode 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {getTypeLabel(insight.type)}
                </span>
                {isUltraMode && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
                    ⚡ AI Ultra
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {insight.title}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Priority Badge */}
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityColor(insight.priority)}`}>
              {insight.priority.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Insight Content */}
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {insight.insight}
          </p>
          
          {/* Confidence Score */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isUltraMode 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                    : 'bg-gradient-to-r from-blue-600 to-green-600'
                }`}
                style={{ width: `${insight.confidence}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              isUltraMode 
                ? 'text-purple-600 dark:text-purple-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {insight.confidence}%
            </span>
          </div>
        </div>

        {/* Action Items */}
        {insight.actionItems && insight.actionItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {isUltraMode ? '🧠 Strategic Actions:' : '📋 Recommended Actions:'}
            </h4>
            <div className="space-y-2">
              {insight.actionItems.map((action, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUltraMode 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {action}
                  </span>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => onImplement(action)}
                    className={`ml-3 ${
                      isUltraMode 
                        ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    ✓ Track
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {isUltraMode ? '🧠 AI Ultra Analysis' : '📊 Christian\'s AI Brain'}
            </span>
            <span>
              Priority: {insight.priority} • {insight.confidence}% confident
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}; 