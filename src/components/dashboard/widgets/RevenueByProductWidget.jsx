import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DATA = [
  { name: 'Managed IT Pro', revenue: 184000 },
  { name: 'Cloud Migration', revenue: 142000 },
  { name: 'Cybersecurity', revenue: 98000 },
  { name: 'IT Enterprise', revenue: 76000 },
  { name: 'Custom Dev', revenue: 54000 },
];
const TOTAL = DATA.reduce((s, d) => s + d.revenue, 0);
const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export default function RevenueByProductWidget() {
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={DATA} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v) => `$${(v/1000).toFixed(0)}k`, fontSize: 10, fill: '#6b7280' }}>
            {DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {DATA.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
            {((d.revenue / TOTAL) * 100).toFixed(0)}%
          </div>
        ))}
      </div>
    </div>
  );
}