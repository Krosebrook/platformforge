import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AT_RISK = [
  { company: 'Pinnacle Labs', score: 82, days: 67 },
  { company: 'Wavecrest Co', score: 74, days: 54 },
  { company: 'Irongate Inc', score: 68, days: 48 },
  { company: 'Solis Brands', score: 61, days: 42 },
  { company: 'Dawnwood Tech', score: 55, days: 38 },
];

function Gauge({ value }) {
  const angle = -90 + (value / 100) * 180;
  const color = value > 70 ? '#ef4444' : value > 40 ? '#f59e0b' : '#22c55e';
  const r = 44, cx = 60, cy = 60;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x = cx + r * Math.cos(toRad(angle - 90));
  const y = cy + r * Math.sin(toRad(angle - 90));

  return (
    <svg width="120" height="70" viewBox="0 0 120 70">
      <path d="M16 60 A44 44 0 0 1 104 60" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
      <path d="M16 60 A44 44 0 0 1 104 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${(value / 100) * 138.2} 138.2`} />
      <line x1={cx} y1={cy} x2={x} y2={y} stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3" fill="#1f2937" />
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>{value}</text>
    </svg>
  );
}

export default function ChurnRiskWidget() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Gauge value={42} />
        <div>
          <p className="text-xs text-gray-400">Overall Risk Score</p>
          <p className="text-lg font-bold text-amber-600">Moderate</p>
          <p className="text-xs text-gray-400 mt-0.5">5 accounts need attention</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {AT_RISK.map(c => (
          <div key={c.company} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="font-medium text-gray-700">{c.company}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">{c.days}d silent</span>
              <span className={`font-bold ${c.score > 70 ? 'text-red-600' : 'text-amber-600'}`}>{c.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}