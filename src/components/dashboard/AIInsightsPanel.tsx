'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AIInsightsPanel() {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleQuickAnalysis = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg ${isAnimating ? 'animate-pulse' : ''}`}>
              <span className="text-white text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Business Intelligence
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Smart analytics & insights
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700 dark:text-green-300 font-medium">LIVE</span>
          </div>
        </div>

        {/* Capabilities Preview */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Revenue Optimization</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Income stream analysis & recommendations</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Mentorship Insights</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Extract actionable business guidance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Idea Evaluation</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart scoring and prioritization</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <span className="text-lg">📈</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Predictive Analytics</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Future trend forecasting</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">4</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Analysis Types</div>
          </div>
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">📊</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Smart</div>
          </div>
          <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">24/7</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/dashboard/ai-insights" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <div className="flex items-center justify-center space-x-2">
                <span>🧠</span>
                <span>Launch Intelligence Dashboard</span>
              </div>
            </Button>
          </Link>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={handleQuickAnalysis}
            disabled={isAnimating}
          >
            {isAnimating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>⚡</span>
                <span>Quick Analysis</span>
              </div>
            )}
          </Button>
        </div>

        {/* Phase Badge */}
        <div className="mt-4 flex justify-center">
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
            🚀 PHASE 3: BUSINESS INTELLIGENCE
          </div>
        </div>
      </div>
    </Card>
  );
} 