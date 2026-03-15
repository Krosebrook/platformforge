import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const SEGMENTS = [
  { name: 'Paid', value: 42, color: '#22c55e' },
  { name: 'Pending', value: 18, color: '#f59e0b' },
  { name: 'Overdue', value: 7, color: '#ef4444' },
  { name: 'Draft', value: 11, color: '#9ca3af' },
];

const INVOICES = {
  Paid: [{ id: 'INV-1041', client: 'Acme Corp', amount: '$4,500' }, { id: 'INV-1039', client: 'TechFlow', amount: '$2,200' }],
  Pending: [{ id: 'INV-1044', client: 'Globex', amount: '$8,000' }, { id: 'INV-1043', client: 'Initech', amount: '$1,750' }],
  Overdue: [{ id: 'INV-1035', client: 'Umbrella', amount: '$12,000' }, { id: 'INV-1031', client: 'Wonka', amount: '$3,400' }],
  Draft: [{ id: 'INV-1046', client: 'Dunder', amount: '$5,600' }],
};

export default function InvoiceStatusWidget() {
  const [active, setActive] = useState(null);
  const filtered = active ? INVOICES[active] || [] : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={SEGMENTS} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={52} onClick={(d) => setActive(active === d.name ? null : d.name)}>
              {SEGMENTS.map(s => <Cell key={s.name} fill={s.color} stroke={active === s.name ? '#1e3a5f' : 'transparent'} strokeWidth={2} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [v, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 flex-1">
          {SEGMENTS.map(s => (
            <button key={s.name} onClick={() => setActive(active === s.name ? null : s.name)}
              className={`flex items-center justify-between w-full text-xs rounded px-2 py-1 transition-colors ${active === s.name ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-gray-700">{s.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{s.value}</span>
            </button>
          ))}
        </div>
      </div>
      {active && filtered.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">{active} Invoices</div>
          {filtered.map(inv => (
            <div key={inv.id} className="flex justify-between items-center px-3 py-2 text-xs border-t">
              <span className="text-gray-500">{inv.id}</span>
              <span className="text-gray-700">{inv.client}</span>
              <span className="font-semibold text-gray-900">{inv.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}