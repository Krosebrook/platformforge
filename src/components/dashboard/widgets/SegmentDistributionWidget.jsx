import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DATA = [
  { name: 'SMB', value: 41, color: '#3b82f6' },
  { name: 'Mid-Market', value: 32, color: '#6366f1' },
  { name: 'Enterprise', value: 18, color: '#8b5cf6' },
  { name: 'Startup', value: 9, color: '#a78bfa' },
];

export default function SegmentDistributionWidget() {
  const navigate = useNavigate();
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={DATA} dataKey="value" cx="50%" cy="50%" outerRadius={65}
            onClick={() => navigate(createPageUrl('CustomerSegments'))}
            style={{ cursor: 'pointer' }}>
            {DATA.map(s => <Cell key={s.name} fill={s.color} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v}%`, n]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-gray-400 italic">Click to view segments</p>
    </div>
  );
}