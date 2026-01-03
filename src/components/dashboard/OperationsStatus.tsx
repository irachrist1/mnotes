'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { operationalAreas, operationsSummary } from '@/data/operations';
import { cn } from '@/utils/cn';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  Circle, 
  Activity, 
  ArrowRight,
  Layers,
  Server,
  Briefcase,
  Cpu,
  Code,
  Users
} from 'lucide-react';

interface OperationsStatusProps {
  className?: string;
}

export function OperationsStatus({ className }: OperationsStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'infrastructure':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'projects':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'hardware':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'software':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
      case 'team':
        return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'infrastructure':
        return <Server className="w-3 h-3 mr-1" />;
      case 'projects':
        return <Briefcase className="w-3 h-3 mr-1" />;
      case 'hardware':
        return <Cpu className="w-3 h-3 mr-1" />;
      case 'software':
        return <Code className="w-3 h-3 mr-1" />;
      case 'team':
        return <Users className="w-3 h-3 mr-1" />;
      default:
        return <Layers className="w-3 h-3 mr-1" />;
    }
  };

  const criticalAreas = operationalAreas.filter(area => 
    area.status === 'critical' || area.status === 'warning'
  );

  const upcomingReviews = operationsSummary.upcomingReviews.slice(0, 3);

  return (
    <div className={cn("col-span-1 md:col-span-2", className)}>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              Operations Status
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3 mr-1" /> {operationsSummary.statusBreakdown.healthy}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3 h-3 mr-1" /> {operationsSummary.statusBreakdown.warning}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
                <XCircle className="w-3 h-3 mr-1" /> {operationsSummary.statusBreakdown.critical}
              </span>
            </p>
          </div>
          <Button variant="outline" size="small" className="gap-2">
            Details <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Status Overview */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  {operationsSummary.statusBreakdown.healthy}
                </div>
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" /> Healthy
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {operationsSummary.statusBreakdown.warning}
                </div>
                <div className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Warning
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {operationsSummary.statusBreakdown.critical}
                </div>
                <div className="text-xs font-medium text-red-700 dark:text-red-300 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" /> Critical
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {operationsSummary.statusBreakdown.maintenance}
                </div>
                <div className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center">
                  <Wrench className="w-3 h-3 mr-1" /> Maint.
                </div>
              </div>
            </div>
          </div>

          {/* Areas Needing Attention */}
          {criticalAreas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Needs Attention
              </h3>
              <div className="space-y-3">
                {criticalAreas.map((area) => (
                  <div key={area.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(area.status)}
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {area.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center ${getCategoryColor(area.category)}`}>
                            {getCategoryIcon(area.category)}
                            {area.category}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            Due: {new Date(area.nextReview).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${getStatusColor(area.status)}`}>
                      {area.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Reviews & Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Upcoming Reviews
              </h3>
              <div className="space-y-2">
                {upcomingReviews.map((review, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {review.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {new Date(review.nextReview).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-3 h-3" /> By Category
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(operationsSummary.categoryBreakdown).slice(0, 6).map(([category, count]) => (
                  <div key={category} className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
                    <div className={`text-lg font-bold ${getCategoryColor(category).split(' ')[0]}`}>
                      {count}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate px-1">
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
