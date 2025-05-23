'use client';

import { ideaSummary } from '@/data/ideas';
import { Card } from '@/components/ui/Card';

export function IdeasSummary() {
  const summaryCards = [
    {
      title: 'Total Ideas',
      value: ideaSummary.totalIdeas.toString(),
      subtitle: 'In pipeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'High Priority',
      value: ideaSummary.topPriorityIdeas.length.toString(),
      subtitle: 'High revenue, low complexity',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'AI-Relevant',
      value: `${ideaSummary.aiRelevantIdeas}/${ideaSummary.totalIdeas}`,
      subtitle: 'Leverage artificial intelligence',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Hardware Component',
      value: `${ideaSummary.hardwareComponentIdeas}/${ideaSummary.totalIdeas}`,
      subtitle: 'Involve physical hardware',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stage Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Pipeline Stage Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(ideaSummary.byStage).map(([stage, count]) => {
            const stageColors = {
              'raw-thought': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
              'researching': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
              'validating': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
              'developing': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
              'testing': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
              'launched': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            };

            return (
              <div key={stage} className="text-center">
                <div className={`rounded-lg p-3 ${stageColors[stage as keyof typeof stageColors]}`}>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs font-medium capitalize mt-1">
                    {stage.replace('-', ' ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
} 