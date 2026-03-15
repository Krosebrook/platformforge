import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const DATA = [
  { month: 'Oct', mrr: 52000 }, { month: 'Nov', mrr: 55400 }, { month: 'Dec', mrr: 57800 },
  { month: 'Jan', mrr: 59200 }, { month: 'Feb', mrr: 61000 }, { month: 'Mar', mrr: 63400 },
];
const GOAL = 75000;

export default function MRRTrackerWidget() {
  const current = DATA[DATA.length - 1].mrr;
  const pct = Math.round((current / GOAL) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">${current.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Current MRR</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-blue-600">{pct}% to goal</p>
          <p className="text-xs text-gray-400">Goal: ${GOAL.toLocaleString()}</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
          <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'MRR']} />
          <ReferenceLine y={GOAL} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Goal', fontSize: 10, fill: '#f59e0b', position: 'insideTopRight' }} />
          <Line type="monotone" dataKey="mrr" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}