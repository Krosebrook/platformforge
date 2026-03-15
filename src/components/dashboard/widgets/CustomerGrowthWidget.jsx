import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

const DATA = [
  { month: 'Apr', new: 18, total: 1740 }, { month: 'May', new: 21, total: 1761 },
  { month: 'Jun', new: 19, total: 1780 }, { month: 'Jul', new: 23, total: 1803 },
  { month: 'Aug', new: 26, total: 1829 }, { month: 'Sep', new: 22, total: 1851 },
  { month: 'Oct', new: 20, total: 1871 }, { month: 'Nov', new: 25, total: 1896 },
  { month: 'Dec', new: 28, total: 1924 }, { month: 'Jan', new: 19, total: 1943 },
  { month: 'Feb', new: 22, total: 1965 }, { month: 'Mar', new: 24, total: 1989 },
];

export default function CustomerGrowthWidget() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <div><p className="text-gray-400 text-xs">Total</p><p className="font-bold text-gray-900">1,989</p></div>
        </div>
        <div><p className="text-gray-400 text-xs">New this month</p><p className="font-bold text-gray-900">24</p></div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="font-semibold text-green-600 text-sm">+3.2%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip />
          <Area yAxisId="left" type="monotone" dataKey="new" fill="#bfdbfe" stroke="#3b82f6" strokeWidth={2} name="New" />
          <Line yAxisId="right" type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={1.5} dot={false} name="Total" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}