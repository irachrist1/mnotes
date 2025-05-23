'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MentorshipService, type MentorshipSession } from '@/services/mentorship.service';

export function MentorshipInsights() {
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [stats, setStats] = useState<{
    totalSessions: number;
    averageRating: number;
    totalActionItems: number;
    completedActionItems: number;
    topMentors: { name: string; sessions: number; avgRating: number }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch both sessions and stats
        const [sessionsResult, statsResult] = await Promise.all([
          MentorshipService.getAll(),
          MentorshipService.getStats()
        ]);
        
        if (sessionsResult.error) {
          setError(sessionsResult.error);
        } else {
          setSessions(sessionsResult.data || []);
        }
        
        if (statsResult.error) {
          setError(statsResult.error);
        } else {
          setStats(statsResult.data);
        }
      } catch (err) {
        setError('Failed to load mentorship data');
        console.error('Error fetching mentorship data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getActionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get recent sessions (last 3)
  const recentSessions = sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Get pending actions from all sessions (prioritized by high, then medium, then low)
  const allPendingActions = sessions
    .flatMap(session => 
      session.actionItems
        .filter(item => !item.completed)
        .map(item => ({ ...item, mentorName: session.mentorName }))
    )
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Mentorship
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading...
              </p>
            </div>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-1">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Mentorship
              </h2>
              <p className="text-sm text-red-500 dark:text-red-400">
                {error}
              </p>
            </div>
            <Link href="/dashboard/mentorship">
              <Button variant="outline" size="small">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Unable to load mentorship data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="col-span-1">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Mentorship
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stats?.totalSessions || 0} sessions • {stats?.averageRating ? stats.averageRating.toFixed(1) : '0'}/10 avg rating
            </p>
          </div>
          <Link href="/dashboard/mentorship">
            <Button variant="outline" size="small">
              View All
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                No mentorship sessions yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Start tracking your mentorship journey
              </p>
              <Link href="/dashboard/mentorship">
                <Button variant="primary" size="small">
                  Log First Session
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.completedActionItems || 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {stats ? (stats.totalActionItems - stats.completedActionItems) : 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
                </div>
              </div>

              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Recent Sessions
                  </h3>
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {session.mentorName}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(session.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {session.topics.slice(0, 2).join(', ')}
                          {session.topics.length > 2 && ` +${session.topics.length - 2} more`}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {session.duration}min • {session.actionItems.length} actions
                          </span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < Math.floor(session.rating / 2)
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Actions */}
              {allPendingActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Priority Actions
                  </h3>
                  <div className="space-y-2">
                    {allPendingActions.map((action, index) => (
                      <div key={`${action.id}-${index}`} className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          action.priority === 'high' ? 'bg-red-500' :
                          action.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-900 dark:text-slate-100">
                            {action.task}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-medium ${getActionPriorityColor(action.priority)}`}>
                              {action.priority} priority
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              from {action.mentorName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 