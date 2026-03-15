import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { TrendingUp, TrendingDown, Users, Briefcase, DollarSign, CheckCircle } from 'lucide-react';

function KPICard({ title, value, sub, trend, icon: Icon, color }) {
  const isUp = trend > 0;
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}

export default function KPISummaryBar() {
  const { currentOrgId } = useTenant();

  const { data: customers = [] } = useQuery({
    queryKey: ['kpi_customers', currentOrgId],
    queryFn: () => base44.entities.Customer.filter({ organization_id: currentOrgId }),
    enabled: !!currentOrgId,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['kpi_jobs', currentOrgId],
    queryFn: () => base44.entities.Job.filter({ organization_id: currentOrgId }),
    enabled: !!currentOrgId,
  });

  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + (j.value || 0), 0);

  const activeJobs = jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status)).length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;

  const now = new Date();
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastMonth = jobs.filter(j => {
    const d = new Date(j.created_date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });

  const jobTrend = lastMonth.length > 0
    ? Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
    : 0;

  const thisMonthCustomers = customers.filter(c => {
    const d = new Date(c.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastMonthCustomers = customers.filter(c => {
    const d = new Date(c.created_date);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length;

  const customerTrend = lastMonthCustomers > 0
    ? Math.round(((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KPICard
        title="Total Revenue"
        value={`$${totalRevenue.toLocaleString()}`}
        icon={DollarSign}
        color="bg-emerald-500"
        trend={8}
      />
      <KPICard
        title="Active Customers"
        value={activeCustomers.toLocaleString()}
        icon={Users}
        color="bg-blue-500"
        trend={customerTrend}
      />
      <KPICard
        title="Active Jobs"
        value={activeJobs.toLocaleString()}
        icon={Briefcase}
        color="bg-violet-500"
        trend={jobTrend}
      />
      <KPICard
        title="Jobs Completed"
        value={completedJobs.toLocaleString()}
        icon={CheckCircle}
        color="bg-amber-500"
        trend={5}
      />
    </div>
  );
}