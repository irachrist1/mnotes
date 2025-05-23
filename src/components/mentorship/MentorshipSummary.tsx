'use client';

import { useState, useEffect } from 'react';
import { MentorshipService } from '@/services/mentorship.service';
import { Card } from '@/components/ui/Card';

export function MentorshipSummary() {
  const [stats, setStats] = useState<{
    totalSessions: number;
    averageRating: number;
    totalActionItems: number;
    completedActionItems: number;
    sessionsByType: Record<string, number>;
    sessionsByMentor: Record<string, number>;
    topMentors: { name: string; sessions: number; avgRating: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      
      const { data, error: statsError } = await MentorshipService.getStats();
      
      if (statsError) {
        setError(statsError);
        console.error('Failed to fetch mentorship stats:', statsError);
      } else {
        setStats(data);
      }
      
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error || 'Failed to load mentorship statistics'}
        </p>
      </div>
    );
  }

  const completionRate = stats.totalActionItems > 0 
    ? (stats.completedActionItems / stats.totalActionItems) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Sessions
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalSessions}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats.sessionsByType.receiving || 0} receiving • {stats.sessionsByType.giving || 0} giving
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        </div>
      </Card>

      {/* Average Rating */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Average Rating
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.averageRating.toFixed(1)}
            </p>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full mr-1 ${
                    i < Math.floor(stats.averageRating / 2)
                      ? 'bg-amber-400'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                out of 10
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
      </Card>

      {/* Action Items Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Action Items
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.completedActionItems}
            </p>
            <div className="flex items-center mt-1">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 mr-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {Math.round(completionRate)}% complete
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </Card>

      {/* Top Mentor */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Top Mentor
            </p>
            {stats.topMentors.length > 0 ? (
              <>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {stats.topMentors[0].name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {stats.topMentors[0].sessions} sessions • {stats.topMentors[0].avgRating.toFixed(1)} avg
                </p>
              </>
            ) : (
              <p className="text-lg text-slate-500 dark:text-slate-400">
                No sessions yet
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
} 