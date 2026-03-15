import React from 'react';

const CUSTOMERS = [
  { name: 'Sarah Mitchell', company: 'Vertex Systems', ltv: 284000, last: '2 days ago' },
  { name: 'James Thornton', company: 'Apex Dynamics', ltv: 241000, last: '1 week ago' },
  { name: 'Priya Nair', company: 'Crestline Tech', ltv: 198000, last: '3 days ago' },
  { name: 'Carlos Rivera', company: 'Meridian Corp', ltv: 175000, last: 'Today' },
  { name: 'Emma Clarke', company: 'BlueSky Labs', ltv: 162000, last: '5 days ago' },
  { name: 'David Kim', company: 'Orion Ventures', ltv: 144000, last: '2 weeks ago' },
  { name: 'Natalie Ford', company: 'SummitEdge', ltv: 131000, last: '1 day ago' },
  { name: 'Raj Patel', company: 'Cascade Digital', ltv: 118000, last: '3 weeks ago' },
  { name: 'Olivia Burns', company: 'Greenfield AI', ltv: 104000, last: '4 days ago' },
  { name: 'Marcus Webb', company: 'Sterling Group', ltv: 98000, last: '1 week ago' },
];

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500'];

export default function TopCustomersWidget() {
  return (
    <div className="space-y-2">
      {CUSTOMERS.map((c, i) => (
        <div key={c.name} className="flex items-center gap-3 py-1">
          <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
          <div className={`w-7 h-7 rounded-full ${COLORS[i]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{c.company}</p>
            <p className="text-xs text-gray-400 truncate">{c.last}</p>
          </div>
          <span className="text-sm font-semibold text-gray-900">${(c.ltv / 1000).toFixed(0)}K</span>
        </div>
      ))}
    </div>
  );
}