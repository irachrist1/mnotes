'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { 
  DollarSign, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Brain, 
  Zap,
  Loader2,
  Sparkles
} from 'lucide-react';

interface AIInsightsPanelProps {
  className?: string;
}

export function AIInsightsPanel({ className }: AIInsightsPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleQuickAnalysis = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <div className={cn("h-full", className)}>
      <Card className="relative overflow-hidden border-none shadow-lg">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          {/* Animated Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative p-6 h-full flex flex-col text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner ${isAnimating ? 'animate-pulse' : ''}`}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Business Intelligence
                </h2>
                <p className="text-xs text-blue-100 font-medium">
                  Smart analytics & insights
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full shadow-lg shadow-emerald-500/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-[10px] text-emerald-100 font-bold tracking-wide">LIVE</span>
            </div>
          </div>

          {/* Capabilities Preview */}
          <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
            <div className="flex items-start space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <div className="p-1.5 bg-blue-500/30 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Revenue</p>
                <p className="text-[10px] text-blue-100/80 leading-tight mt-0.5">Stream optimization</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <div className="p-1.5 bg-purple-500/30 rounded-lg">
                <Target className="w-4 h-4 text-purple-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Mentorship</p>
                <p className="text-[10px] text-purple-100/80 leading-tight mt-0.5">Insight extraction</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <div className="p-1.5 bg-yellow-500/30 rounded-lg">
                <Lightbulb className="w-4 h-4 text-yellow-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Evaluation</p>
                <p className="text-[10px] text-yellow-100/80 leading-tight mt-0.5">Idea scoring</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
              <div className="p-1.5 bg-pink-500/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-pink-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Predictive</p>
                <p className="text-[10px] text-pink-100/80 leading-tight mt-0.5">Trend forecast</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-2.5 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
              <div className="text-lg font-bold text-white">4</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wide">Modules</div>
            </div>
            <div className="text-center p-2.5 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
              <div className="flex justify-center mb-1">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wide">Smart</div>
            </div>
            <div className="text-center p-2.5 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5">
              <div className="text-lg font-bold text-emerald-300">24/7</div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wide">Active</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-auto">
            <Link href="/dashboard/ai-insights" className="block">
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 border-none shadow-lg font-semibold h-11">
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>Launch Intelligence Dashboard</span>
                </div>
              </Button>
            </Link>
            
            <Button
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
              onClick={handleQuickAnalysis}
              disabled={isAnimating}
            >
              {isAnimating ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Context...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Run Quick Analysis</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
