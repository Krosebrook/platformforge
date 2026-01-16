import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../components/common/TenantContext';
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, DollarSign, AlertTriangle, Download } from 'lucide-react';

// Modular component imports - improved separation of concerns
import MetricCard from '../components/analytics/MetricCard';
import FilterBar from '../components/analytics/FilterBar';
import StatusDistributionChart from '../components/analytics/charts/StatusDistributionChart';
import MemberPerformanceChart from '../components/analytics/charts/MemberPerformanceChart';
import MonthlyTrendChart from '../components/analytics/charts/MonthlyTrendChart';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

/**
 * Analytics dashboard page - displays job performance metrics and visualizations
 * Refactored for improved modularity and maintainability
 * - Split into smaller, reusable components
 * - Extracted data processing logic into custom hook
 * - Improved filter state management
 */
export default function AnalyticsPage() {
  const { currentOrgId, currentWorkspaceId } = useTenant();
  
  // Unified filter state object - easier to manage than separate state variables
  const [filters, setFilters] = useState({
    status: 'all',
    member: 'all',
    customer: 'all'
  });

  // Fetch jobs data with React Query
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Job.filter(filter, '-created_date', 1000);
    },
    enabled: !!currentOrgId
  });

  // Fetch team members for filter dropdown
  const { data: members = [] } = useQuery({
    queryKey: ['members', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Membership.filter({
        organization_id: currentOrgId,
        status: 'active'
      });
    },
    enabled: !!currentOrgId
  });

  // Fetch customers for filter dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Customer.filter(filter);
    },
    enabled: !!currentOrgId
  });

  // Use custom hook for data processing - separates business logic from UI
  const { metrics, statusDistribution, memberPerformance, monthlyTrend } = useAnalyticsData(jobs, filters);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Performance Analytics</h1>
          <p className="text-gray-500">Track metrics, identify bottlenecks, and optimize processes</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filter controls - now a separate component */}
      <FilterBar 
        filters={filters}
        onFilterChange={setFilters}
        members={members}
        customers={customers}
      />

      {/* Key metrics grid - using reusable MetricCard component */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Jobs"
          value={metrics.totalJobs}
          subtitle={`${metrics.completed} completed, ${metrics.inProgress} in progress`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Completion Time"
          value={`${metrics.avgCompletionTime} days`}
          subtitle="From start to finish"
          icon={Clock}
        />
        <MetricCard
          title="Total Value"
          value={`$${(metrics.totalValue / 1000).toFixed(1)}K`}
          subtitle={`$${(metrics.completedValue / 1000).toFixed(1)}K completed`}
          icon={DollarSign}
        />
        <MetricCard
          title="On-Time Delivery"
          value={`${metrics.onTimeRate}%`}
          subtitle={`${metrics.overdue} currently overdue`}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts grid - split into separate components for better maintainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistributionChart data={statusDistribution} />
        <MemberPerformanceChart data={memberPerformance} />
      </div>

      {/* Monthly trends - full width chart */}
      <MonthlyTrendChart data={monthlyTrend} />
    </div>
  );
}