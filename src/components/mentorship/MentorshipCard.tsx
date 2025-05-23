'use client';

import { type MentorshipSession } from '@/services/mentorship.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MentorshipCardProps {
  session: MentorshipSession;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MentorshipCard({ session, onEdit, onDelete }: MentorshipCardProps) {
  const getSessionTypeColor = (type: string) => {
    return type === 'receiving' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const pendingActions = session.actionItems.filter(item => !item.completed);
  const completedActions = session.actionItems.filter(item => item.completed);

  return (
    <Card className="h-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {session.mentorName}
            </h3>
            <div className="space-y-2">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(session.sessionType)}`}>
                  {session.sessionType === 'receiving' ? 'Receiving Mentorship' : 'Giving Mentorship'}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(session.date)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {[...Array(10)].map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < session.rating
                    ? 'bg-amber-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
            <span className={`ml-2 text-lg font-bold ${getRatingColor(session.rating)}`}>
              {session.rating}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Duration: {session.duration} minutes
        </div>

        {/* Topics */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Topics</h4>
          <div className="flex flex-wrap gap-1">
            {session.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
              >
                {topic}
              </span>
            ))}
            {session.topics.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
                +{session.topics.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Key Insights Preview */}
        {session.keyInsights.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Key Insights</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {session.keyInsights[0]}
            </p>
            {session.keyInsights.length > 1 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                +{session.keyInsights.length - 1} more insight{session.keyInsights.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Action Items Status */}
        {session.actionItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Action Items</h4>
            <div className="space-y-2">
              {/* Show first pending action */}
              {pendingActions.length > 0 && (
                <div className="flex items-start space-x-2 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    pendingActions[0].priority === 'high' ? 'bg-red-500' :
                    pendingActions[0].priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {pendingActions[0].task}
                    </p>
                    <p className={`text-xs font-medium ${getActionPriorityColor(pendingActions[0].priority)}`}>
                      {pendingActions[0].priority} priority
                    </p>
                  </div>
                </div>
              )}
              
              {/* Summary */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {completedActions.length} completed
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {pendingActions.length} pending
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {session.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Notes</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {session.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {formatDate(session.createdAt)}
          </div>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="small"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="small"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 