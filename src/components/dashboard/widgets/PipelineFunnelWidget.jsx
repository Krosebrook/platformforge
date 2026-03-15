import React from 'react';

const STAGES = [
  { label: 'Lead',        count: 284, value: 1420000, color: '#bfdbfe' },
  { label: 'Qualified',   count: 156, value: 890000,  color: '#93c5fd' },
  { label: 'Proposal',    count: 87,  value: 612000,  color: '#60a5fa' },
  { label: 'Negotiation', count: 42,  value: 384000,  color: '#3b82f6' },
  { label: 'Closed',      count: 21,  value: 218000,  color: '#1d4ed8' },
];
const MAX = STAGES[0].count;

export default function PipelineFunnelWidget() {
  return (
    <div className="space-y-2">
      {STAGES.map((s, i) => {
        const pct = (s.count / MAX) * 100;
        const width = 100 - i * 12;
        return (
          <div key={s.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{s.label}</span>
              <span>{s.count} · ${(s.value / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-center">
              <div className="h-7 rounded flex items-center justify-center text-xs font-semibold text-white transition-all"
                style={{ width: `${width}%`, background: s.color, color: i < 2 ? '#1e40af' : '#fff' }}>
                {s.count}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}