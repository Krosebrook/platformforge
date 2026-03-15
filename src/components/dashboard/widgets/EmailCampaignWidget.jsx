import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Mail, MousePointer, AlertCircle, Send } from 'lucide-react';

const SPARKLINE = [58, 64, 61, 68, 65, 70, 67, 63, 69, 71, 66, 72, 68, 74, 67, 69, 71, 73, 65, 70, 68, 72, 74, 67, 71, 68, 73, 70, 67, 69];

const STATS = [
  { label: 'Sent', value: '4,200', icon: Send, color: 'text-gray-600 bg-gray-100' },
  { label: 'Opened', value: '2,814', sub: '67%', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  { label: 'Clicked', value: '891', sub: '21.2%', icon: MousePointer, color: 'text-green-600 bg-green-50' },
  { label: 'Bounced', value: '63', sub: '1.5%', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
];

export default function EmailCampaignWidget() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-xl p-3 flex items-center gap-2 ${s.color.split(' ')[1]}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color.split(' ')[0]} bg-white/70`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-gray-900 text-sm">{s.value} {s.sub && <span className="text-xs font-normal text-gray-400">({s.sub})</span>}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-1">Open rate — last 30 days</p>
        <ResponsiveContainer width="100%" height={48}>
          <LineChart data={SPARKLINE.map((v, i) => ({ day: i + 1, rate: v }))}>
            <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            <Tooltip formatter={(v) => [`${v}%`, 'Open Rate']} labelFormatter={(l) => `Day ${l}`} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}