import React from 'react';
import { MapPin } from 'lucide-react';

const REGIONS = [
  { name: 'California', code: 'CA', count: 284, pct: 15 },
  { name: 'Texas', code: 'TX', count: 198, pct: 10 },
  { name: 'New York', code: 'NY', count: 176, pct: 9 },
  { name: 'Florida', code: 'FL', count: 143, pct: 7 },
  { name: 'Illinois', code: 'IL', count: 112, pct: 6 },
  { name: 'Washington', code: 'WA', count: 98, pct: 5 },
  { name: 'Massachusetts', code: 'MA', count: 87, pct: 4 },
  { name: 'Colorado', code: 'CO', count: 74, pct: 4 },
];

const MAX = REGIONS[0].count;

export default function GeoHeatmapWidget() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {REGIONS.map(r => {
          const intensity = Math.round((r.count / MAX) * 100);
          const opacity = 0.2 + (intensity / 100) * 0.8;
          return (
            <div key={r.code} className="flex flex-col items-center rounded-lg p-2 cursor-default"
              style={{ background: `rgba(59,130,246,${opacity})` }}
              title={`${r.name}: ${r.count} customers`}>
              <span className="text-xs font-bold" style={{ color: opacity > 0.5 ? '#fff' : '#1d4ed8' }}>{r.code}</span>
              <span className="text-xs" style={{ color: opacity > 0.5 ? 'rgba(255,255,255,0.8)' : '#3b82f6' }}>{r.count}</span>
            </div>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Top Regions</p>
        {REGIONS.slice(0, 5).map(r => (
          <div key={r.code} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span className="text-gray-700">{r.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${r.pct * 6.5}%` }} />
              </div>
              <span className="text-gray-500 w-8 text-right">{r.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}