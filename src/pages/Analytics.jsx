import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, DollarSign, AlertTriangle, Download } from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { currentOrgId, currentWorkspaceId } = useTenant();
  const [filterMember, setFilterMember] = useState('all');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Job.filter(filter, '-created_date', 1000);
    },
    enabled: !!currentOrgId
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Customer.filter(filter);
    },
    enabled: !!currentOrgId
  });

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

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filterMember !== 'all' && job.assigned_to !== filterMember) return false;
      if (filterCustomer !== 'all' && job.customer_id !== filterCustomer) return false;
      if (filterStatus !== 'all' && job.status !== filterStatus) return false;
      return true;
    });
  }, [jobs, filterMember, filterCustomer, filterStatus]);

  const metrics = useMemo(() => {
    const completed = filteredJobs.filter(j => j.status === 'completed');
    const inProgress = filteredJobs.filter(j => j.status === 'in_progress');
    const overdue = filteredJobs.filter(j => j.due_date && new Date(j.due_date) < new Date() && j.status !== 'completed');

    const avgCompletionTime = completed.length > 0
      ? completed.reduce((sum, j) => {
          if (j.started_at && j.completed_at) {
            return sum + differenceInDays(parseISO(j.completed_at), parseISO(j.started_at));
          }
          return sum;
        }, 0) / completed.filter(j => j.started_at && j.completed_at).length
      : 0;

    const totalValue = filteredJobs.reduce((sum, j) => sum + (j.value || 0), 0);
    const completedValue = completed.reduce((sum, j) => sum + (j.value || 0), 0);

    const onTimeRate = completed.length > 0
      ? (completed.filter(j => !j.due_date || new Date(j.completed_at) <= new Date(j.due_date)).length / completed.length) * 100
      : 0;

    return {
      totalJobs: filteredJobs.length,
      completed: completed.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      avgCompletionTime: avgCompletionTime.toFixed(1),
      totalValue,
      completedValue,
      onTimeRate: onTimeRate.toFixed(1)
    };
  }, [filteredJobs]);

  const statusDistribution = useMemo(() => {
    const statusCounts = {};
    filteredJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredJobs]);

  const memberPerformance = useMemo(() => {
    const memberStats = {};
    filteredJobs.forEach(job => {
      if (!job.assigned_to) return;
      if (!memberStats[job.assigned_to]) {
        memberStats[job.assigned_to] = { name: job.assigned_to, completed: 0, total: 0, value: 0 };
      }
      memberStats[job.assigned_to].total++;
      if (job.status === 'completed') {
        memberStats[job.assigned_to].completed++;
        memberStats[job.assigned_to].value += job.value || 0;
      }
    });
    return Object.values(memberStats).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredJobs]);

  const monthlyTrend = useMemo(() => {
    const months = {};
    filteredJobs.forEach(job => {
      const month = format(parseISO(job.created_date), 'MMM yyyy');
      if (!months[month]) {
        months[month] = { month, created: 0, completed: 0, value: 0 };
      }
      months[month].created++;
      if (job.status === 'completed') {
        months[month].completed++;
        months[month].value += job.value || 0;
      }
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [filteredJobs]);

  return (
    <div className="space-y-6">
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

      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map(m => (
              <SelectItem key={m.user_email} value={m.user_email}>{m.user_email}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.completed} completed, {metrics.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgCompletionTime} days</div>
            <p className="text-xs text-gray-500 mt-1">
              From start to finish
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.totalValue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-500 mt-1">
              ${(metrics.completedValue / 1000).toFixed(1)}K completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <AlertTriangle className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.onTimeRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.overdue} currently overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers (by Value)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Value ($)" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Job Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
              <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              <Line yAxisId="right" type="monotone" dataKey="value" stroke="#f59e0b" name="Value ($)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}