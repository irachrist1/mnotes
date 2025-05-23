'use client';

import { type MentorshipSession } from '@/services/mentorship.service';
import { Button } from '@/components/ui/Button';

interface MentorshipRowProps {
  session: MentorshipSession;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MentorshipRow({ session, onEdit, onDelete }: MentorshipRowProps) {
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
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
      {/* Mentor & Date */}
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {session.mentorName}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(session.date)}
          </div>
        </div>
      </td>

      {/* Session Type */}
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(session.sessionType)}`}>
          {session.sessionType === 'receiving' ? 'Receiving' : 'Giving'}
        </span>
      </td>

      {/* Duration */}
      <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
        {session.duration}min
      </td>

      {/* Topics */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {session.topics.slice(0, 2).map((topic, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
            >
              {topic}
            </span>
          ))}
          {session.topics.length > 2 && (
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded">
              +{session.topics.length - 2}
            </span>
          )}
        </div>
      </td>

      {/* Key Insights */}
      <td className="px-6 py-4 max-w-xs">
        <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
          {session.keyInsights[0] || 'No insights recorded'}
        </div>
        {session.keyInsights.length > 1 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            +{session.keyInsights.length - 1} more
          </div>
        )}
      </td>

      {/* Action Items */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400">
            {completedActions.length}
          </span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-amber-600 dark:text-amber-400">
            {session.actionItems.length}
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {pendingActions.length} pending
        </div>
      </td>

      {/* Rating */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < Math.floor(session.rating / 2)
                    ? 'bg-amber-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
          <span className={`text-sm font-medium ${getRatingColor(session.rating)}`}>
            {session.rating}/10
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
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
      </td>
    </tr>
  );
} 