'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mentorshipSessions, mentorshipSummary } from '@/data/mentorshipSessions';

export function MentorshipInsights() {
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

  const recentSessions = mentorshipSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const pendingActions = mentorshipSummary.pendingActions.slice(0, 4);

  return (
    <div className="col-span-1">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Mentorship
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {mentorshipSummary.totalSessions} sessions • {mentorshipSummary.averageRating.toFixed(1)}/10 avg rating
            </p>
          </div>
          <Button variant="outline" size="small">
            View All
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {mentorshipSummary.completedActionItems}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
            </div>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {mentorshipSummary.totalActionItems - mentorshipSummary.completedActionItems}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Pending</div>
            </div>
          </div>

          {/* Recent Sessions */}
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
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {session.topics.slice(0, 2).join(', ')}
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
                            i < session.rating
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

          {/* Pending Actions */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Priority Actions
            </h3>
            <div className="space-y-2">
              {pendingActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    action.priority === 'high' ? 'bg-red-500' :
                    action.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {action.task}
                    </p>
                    <p className={`text-xs font-medium ${getActionPriorityColor(action.priority)}`}>
                      {action.priority} priority
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 