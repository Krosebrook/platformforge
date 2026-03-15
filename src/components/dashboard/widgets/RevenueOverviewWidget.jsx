import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const DATA = [
  { month: 'Apr', revenue: 42000 }, { month: 'May', revenue: 48000 },
  { month: 'Jun', revenue: 51000 }, { month: 'Jul', revenue: 47000 },
  { month: 'Aug', revenue: 55000 }, { month: 'Sep', revenue: 60000 },
  { month: 'Oct', revenue: 58000 }, { month: 'Nov', revenue: 63000 },
  { month: 'Dec', revenue: 71000 }, { month: 'Jan', revenue: 68000 },
  { month: 'Feb', revenue: 74000 }, { month: 'Mar', revenue: 78000 },
];

export default function RevenueOverviewWidget() {
  const total = DATA.reduce((s, d) => s + d.revenue, 0);
  const avg = Math.round(total / DATA.length);
  const last = DATA[DATA.length - 1].revenue;
  const prev = DATA[DATA.length - 2].revenue;
  const trend = (((last - prev) / prev) * 100).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 text-sm">
        <div><p className="text-gray-400">Total</p><p className="font-bold text-gray-900">${(total / 1000).toFixed(0)}K</p></div>
        <div><p className="text-gray-400">Avg/mo</p><p className="font-bold text-gray-900">${(avg / 1000).toFixed(0)}K</p></div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="font-bold text-green-600">+{trend}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} />
          <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}