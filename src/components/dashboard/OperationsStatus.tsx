'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { operationalAreas, operationsSummary } from '@/data/operations';

export function OperationsStatus() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'warning':
        return '⚠';
      case 'critical':
        return '✗';
      case 'maintenance':
        return '🔧';
      default:
        return '○';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'infrastructure':
        return 'text-blue-600 dark:text-blue-400';
      case 'projects':
        return 'text-purple-600 dark:text-purple-400';
      case 'hardware':
        return 'text-orange-600 dark:text-orange-400';
      case 'software':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'team':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const criticalAreas = operationalAreas.filter(area => 
    area.status === 'critical' || area.status === 'warning'
  );

  const upcomingReviews = operationsSummary.upcomingReviews.slice(0, 3);

  return (
    <div className="col-span-1 md:col-span-2">
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Operations Status
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {operationsSummary.statusBreakdown.healthy} healthy • {operationsSummary.statusBreakdown.warning} warning • {operationsSummary.statusBreakdown.critical} critical
            </p>
          </div>
          <Button variant="outline" size="small">
            View Details
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Status Overview */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {operationsSummary.statusBreakdown.healthy}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Healthy</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {operationsSummary.statusBreakdown.warning}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Warning</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {operationsSummary.statusBreakdown.critical}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Critical</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {operationsSummary.statusBreakdown.maintenance}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Maintenance</div>
              </div>
            </div>
          </div>

          {/* Areas Needing Attention */}
          {criticalAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Needs Attention
              </h3>
              <div className="space-y-3">
                {criticalAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {getStatusIcon(area.status)}
                      </span>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {area.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs font-medium ${getCategoryColor(area.category)}`}>
                            {area.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Review due: {new Date(area.nextReview).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(area.status)}`}>
                      {area.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Reviews */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Upcoming Reviews
            </h3>
            <div className="space-y-2">
              {upcomingReviews.map((review, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {review.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(review.nextReview).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              By Category
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(operationsSummary.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded">
                  <div className={`text-lg font-bold ${getCategoryColor(category)}`}>
                    {count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {category}
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