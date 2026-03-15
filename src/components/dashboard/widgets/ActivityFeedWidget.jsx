import React from 'react';
import { UserPlus, DollarSign, Zap, FileText, Mail, CheckCircle, Bell, RefreshCw } from 'lucide-react';

const FEED = [
  { icon: UserPlus, color: 'text-blue-500 bg-blue-50', text: 'New customer added: Priya Nair (Crestline Tech)', time: '2m ago', actor: 'James T.' },
  { icon: DollarSign, color: 'text-green-500 bg-green-50', text: 'Invoice #1042 paid — $4,500', time: '14m ago', actor: 'System' },
  { icon: Zap, color: 'text-purple-500 bg-purple-50', text: "Workflow 'Onboarding' triggered for Apex Dynamics", time: '32m ago', actor: 'Auto' },
  { icon: FileText, color: 'text-amber-500 bg-amber-50', text: 'Proposal sent to BlueSky Labs', time: '1h ago', actor: 'Sarah M.' },
  { icon: Mail, color: 'text-indigo-500 bg-indigo-50', text: 'Re-engagement email sent to Irongate Inc', time: '1h ago', actor: 'Auto' },
  { icon: CheckCircle, color: 'text-green-500 bg-green-50', text: 'Task "Schedule QBR" marked complete', time: '2h ago', actor: 'Carlos R.' },
  { icon: Bell, color: 'text-red-500 bg-red-50', text: 'Invoice #1035 overdue (Umbrella Corp)', time: '3h ago', actor: 'System' },
  { icon: UserPlus, color: 'text-blue-500 bg-blue-50', text: 'Lead imported: Marcus Webb (Sterling Group)', time: '4h ago', actor: 'CSV Import' },
  { icon: DollarSign, color: 'text-green-500 bg-green-50', text: 'Invoice #1041 paid — $8,200', time: '5h ago', actor: 'System' },
  { icon: Zap, color: 'text-purple-500 bg-purple-50', text: "Workflow 'Win-Back' triggered for 3 accounts", time: '6h ago', actor: 'Auto' },
  { icon: RefreshCw, color: 'text-cyan-500 bg-cyan-50', text: 'Customer profile enriched: David Kim', time: '7h ago', actor: 'AI' },
  { icon: Mail, color: 'text-indigo-500 bg-indigo-50', text: 'Campaign "Q1 Newsletter" sent to 1,204 contacts', time: '8h ago', actor: 'Emma C.' },
  { icon: CheckCircle, color: 'text-green-500 bg-green-50', text: 'Support ticket #4821 resolved', time: '9h ago', actor: 'Support' },
  { icon: UserPlus, color: 'text-blue-500 bg-blue-50', text: 'New customer: Natalie Ford (SummitEdge)', time: '10h ago', actor: 'Web' },
  { icon: FileText, color: 'text-amber-500 bg-amber-50', text: 'Contract renewal draft sent to Orion Ventures', time: '11h ago', actor: 'Raj P.' },
];

export default function ActivityFeedWidget() {
  return (
    <div className="space-y-1 max-h-72 overflow-y-auto">
      {FEED.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
            <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-snug">{item.text}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.actor} · {item.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}