import React from 'react';
import { Zap } from 'lucide-react';

const WORKFLOWS = [
  { name: 'New Customer Onboarding', pct: 84, enrolled: 42 },
  { name: 'Churn Prevention', pct: 61, enrolled: 18 },
  { name: 'Lead Nurture Sequence', pct: 72, enrolled: 67 },
  { name: 'Invoice Follow-Up', pct: 90, enrolled: 23 },
  { name: 'Win-Back Campaign', pct: 48, enrolled: 11 },
];

function colorForPct(p) {
  if (p >= 80) return 'bg-green-500';
  if (p >= 60) return 'bg-blue-500';
  return 'bg-amber-500';
}

export default function WorkflowCompletionWidget() {
  return (
    <div className="space-y-3">
      {WORKFLOWS.map(w => (
        <div key={w.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="font-medium text-gray-700 truncate max-w-[160px]">{w.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
              <span>{w.enrolled} enrolled</span>
              <span className="font-semibold text-gray-700">{w.pct}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`${colorForPct(w.pct)} h-1.5 rounded-full transition-all`} style={{ width: `${w.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}