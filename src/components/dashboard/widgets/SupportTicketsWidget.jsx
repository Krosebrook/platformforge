import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DATA = [
  { week: 'W1', open: 18, progress: 12, resolved: 34 },
  { week: 'W2', open: 22, progress: 15, resolved: 29 },
  { week: 'W3', open: 15, progress: 18, resolved: 38 },
  { week: 'W4', open: 27, progress: 10, resolved: 31 },
  { week: 'W5', open: 19, progress: 14, resolved: 42 },
  { week: 'W6', open: 21, progress: 16, resolved: 35 },
  { week: 'W7', open: 25, progress: 11, resolved: 39 },
  { week: 'W8', open: 23, progress: 13, resolved: 36 },
];

export default function SupportTicketsWidget() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 text-sm">
        <div><p className="text-xs text-gray-400">Currently Open</p><p className="font-bold text-red-600">23</p></div>
        <div><p className="text-xs text-gray-400">Avg Resolution</p><p className="font-bold text-gray-900">4.2 hrs</p></div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="resolved" stackId="a" fill="#22c55e" name="Resolved" radius={[0,0,0,0]} />
          <Bar dataKey="progress" stackId="a" fill="#f59e0b" name="In Progress" />
          <Bar dataKey="open" stackId="a" fill="#ef4444" name="Open" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}