import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFeed } from '../components/ui/ActivityFeed';
import TaskWidget from '../components/dashboard/TaskWidget';
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge';
import { 
  Users, Package, Briefcase, TrendingUp, TrendingDown, 
  ArrowRight, Plus, Clock, CheckCircle, AlertTriangle,
  BarChart3, Calendar, Zap
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const { currentOrgId, currentWorkspaceId, organization, planLimits } = useTenant();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return null;
      
      const baseFilter = { organization_id: currentOrgId };
      if (currentWorkspaceId) baseFilter.workspace_id = currentWorkspaceId;

      const [customers, jobs, products] = await Promise.all([
        base44.entities.Customer.filter(baseFilter),
        base44.entities.Job.filter(baseFilter),
        base44.entities.Product.filter(baseFilter)
      ]);

      const activeJobs = jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status));
      const completedThisMonth = jobs.filter(j => {
        if (j.status !== 'completed') return false;
        const completed = new Date(j.completed_at || j.updated_date);
        return completed >= startOfMonth(new Date()) && completed <= endOfMonth(new Date());
      });
      const overdueJobs = jobs.filter(j => {
        if (!j.due_date || j.status === 'completed' || j.status === 'cancelled') return false;
        return new Date(j.due_date) < new Date();
      });

      const totalValue = jobs.reduce((sum, j) => sum + (j.value || 0), 0);

      return {
        customers: {
          total: customers.length,
          active: customers.filter(c => c.status === 'active').length,
          new: customers.filter(c => new Date(c.created_date) > subDays(new Date(), 30)).length
        },
        jobs: {
          total: jobs.length,
          active: activeJobs.length,
          completedThisMonth: completedThisMonth.length,
          overdue: overdueJobs.length,
          totalValue
        },
        products: {
          total: products.length,
          active: products.filter(p => p.status === 'active').length,
          lowStock: products.filter(p => p.inventory_count && p.low_stock_threshold && p.inventory_count <= p.low_stock_threshold).length
        }
      };
    },
    enabled: !!currentOrgId
  });

  const { data: recentJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['recentJobs', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Job.filter(filter, '-created_date', 5);
    },
    enabled: !!currentOrgId
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pendingApprovals', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.ApprovalRequest.filter({
        organization_id: currentOrgId,
        status: 'pending'
      }, '-created_date', 5);
    },
    enabled: !!currentOrgId
  });

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, href }) => (
    <Link to={href}>
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-20 mt-1" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-3 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">{trendValue}</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening in {organization?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlanBadge plan={organization?.plan} />
          <Button asChild>
            <Link to={createPageUrl('Jobs') + '?action=new'}>
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.customers.total || 0}
          subtitle={`${stats?.customers.new || 0} new this month`}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          href={createPageUrl('Customers')}
        />
        <StatCard
          title="Active Jobs"
          value={stats?.jobs.active || 0}
          subtitle={`${stats?.jobs.overdue || 0} overdue`}
          icon={Briefcase}
          color="bg-purple-100 text-purple-600"
          href={createPageUrl('Jobs')}
        />
        <StatCard
          title="Products"
          value={stats?.products.total || 0}
          subtitle={`${stats?.products.lowStock || 0} low stock`}
          icon={Package}
          color="bg-green-100 text-green-600"
          href={createPageUrl('Products')}
        />
        <StatCard
          title="Revenue This Month"
          value={`$${(stats?.jobs.totalValue || 0).toLocaleString()}`}
          subtitle={`${stats?.jobs.completedThisMonth || 0} jobs completed`}
          icon={BarChart3}
          color="bg-amber-100 text-amber-600"
          href={createPageUrl('Jobs')}
        />
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
              </div>
              <Link to={createPageUrl('Approvals')}>
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map(approval => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="font-medium capitalize">
                        {approval.request_type.replace(/_/g, ' ')} Request
                      </p>
                      <p className="text-sm text-gray-500">
                        By {approval.requester_email}
                      </p>
                    </div>
                  </div>
                  <Link to={createPageUrl('Approvals')}>
                    <Button size="sm" variant="outline">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Jobs</CardTitle>
                <Link to={createPageUrl('Jobs')}>
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No jobs yet</p>
                <Link to={createPageUrl('Jobs') + '?action=new'}>
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Job
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <Link 
                    key={job.id} 
                    to={createPageUrl('JobDetail') + `?id=${job.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      job.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      job.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.reference_number || `JOB-${job.id.slice(0, 8)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} size="sm" />
                      {job.due_date && (
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          Due {format(new Date(job.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
          </Card>

          <TaskWidget />
        </div>

        <ActivityFeed limit={10} maxHeight="400px" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <CardContent className="p-6">
            <Zap className="w-8 h-8 mb-4 text-yellow-400" />
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link to={createPageUrl('Customers') + '?action=new'}>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
              <Link to={createPageUrl('Jobs') + '?action=new'}>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job
                </Button>
              </Link>
              <Link to={createPageUrl('Products') + '?action=new'}>
                <Button variant="secondary" className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.filter(j => j.due_date && new Date(j.due_date) > new Date()).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {recentJobs
                  .filter(j => j.due_date && new Date(j.due_date) > new Date())
                  .slice(0, 3)
                  .map(job => (
                    <div key={job.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(job.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Usage & Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Customers</span>
                  <span className="font-medium">
                    {stats?.customers.total || 0} / {planLimits?.max_customers === -1 ? '∞' : planLimits?.max_customers}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ 
                      width: planLimits?.max_customers === -1 
                        ? '10%' 
                        : `${Math.min(100, ((stats?.customers.total || 0) / planLimits?.max_customers) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Jobs</span>
                  <span className="font-medium">
                    {stats?.jobs.total || 0} / {planLimits?.max_jobs === -1 ? '∞' : planLimits?.max_jobs}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ 
                      width: planLimits?.max_jobs === -1 
                        ? '10%' 
                        : `${Math.min(100, ((stats?.jobs.total || 0) / planLimits?.max_jobs) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}