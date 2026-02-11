'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MentorshipService, type MentorshipSession } from '@/services/mentorship.service';
import { cn } from '@/utils/cn';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  Star,
  Plus
} from 'lucide-react';

interface MentorshipInsightsProps {
  className?: string;
}

export function MentorshipInsights({ className }: MentorshipInsightsProps) {
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
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'low':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
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
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Mentorship
              </h2>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded mt-1"></div>
            </div>
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
      <div className={cn("h-full", className)}>
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Mentorship
              </h2>
              <p className="text-sm text-red-500 dark:text-red-400">
                {error}
              </p>
            </div>
            <Link href="/dashboard/mentorship">
              <Button variant="outline" size="small" className="gap-2">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                Unable to load mentorship data
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Mentorship
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">{stats?.totalSessions || 0}</span> sessions
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-amber-500">
                <Star className="w-3 h-3 fill-current mr-1" />
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '0'}
              </span>
            </p>
          </div>
          <Link href="/dashboard/mentorship">
            <Button variant="outline" size="small" className="gap-2">
              All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                No sessions yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Start tracking your mentorship journey
              </p>
              <Link href="/dashboard/mentorship">
                <Button variant="primary" size="small" className="gap-2">
                  <Plus className="w-4 h-4" /> Log Session
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Done</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {stats?.completedActionItems || 0}
                  </div>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending</span>
                  </div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {stats ? (stats.totalActionItems - stats.completedActionItems) : 0}
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Recent Sessions
                  </h3>
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                            {session.mentorName}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {formatDate(session.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">
                          {session.topics.slice(0, 2).join(', ')}
                          {session.topics.length > 2 && ` +${session.topics.length - 2}`}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {session.duration}m
                          </span>
                          <div className="flex items-center space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.floor(session.rating / 2)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
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
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Priority Actions
                  </h3>
                  <div className="space-y-2">
                    {allPendingActions.map((action, index) => (
                      <div key={`${action.id}-${index}`} className="flex items-start space-x-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          action.priority === 'high' ? 'bg-red-500 shadow-sm shadow-red-500/50' :
                          action.priority === 'medium' ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-emerald-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 dark:text-slate-100 truncate">
                            {action.task}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              from {action.mentorName}
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getActionPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
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
