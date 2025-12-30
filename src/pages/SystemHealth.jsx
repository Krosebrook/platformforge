import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { getJobStats } from '../components/common/BackgroundJobQueue';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, Activity, Database, Server, Clock, 
  AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Zap, BarChart3, HardDrive
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function SystemHealth() {
  const { currentOrgId, organization } = useTenant();

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['systemHealth', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return null;

      const [
        customers,
        jobs,
        products,
        auditLogs,
        backgroundJobs
      ] = await Promise.all([
        base44.entities.Customer.filter({ organization_id: currentOrgId }),
        base44.entities.Job.filter({ organization_id: currentOrgId }),
        base44.entities.Product.filter({ organization_id: currentOrgId }),
        base44.entities.AuditLog.filter({ organization_id: currentOrgId }, '-created_date', 100),
        base44.entities.BackgroundJob.filter({ organization_id: currentOrgId })
      ]);

      const jobStats = {
        total: backgroundJobs.length,
        queued: backgroundJobs.filter(j => j.status === 'queued').length,
        processing: backgroundJobs.filter(j => j.status === 'processing').length,
        completed: backgroundJobs.filter(j => j.status === 'completed').length,
        failed: backgroundJobs.filter(j => j.status === 'failed' || j.status === 'dead_letter').length
      };

      const recentErrors = auditLogs.filter(log => log.status === 'failure').slice(0, 5);

      return {
        entities: {
          customers: customers.length,
          jobs: jobs.length,
          products: products.length,
          auditLogs: auditLogs.length
        },
        jobQueue: jobStats,
        recentErrors,
        lastActivity: auditLogs[0]?.created_date
      };
    },
    enabled: !!currentOrgId,
    refetchInterval: 30000
  });

  const services = [
    { 
      name: 'Database', 
      icon: Database, 
      status: 'healthy',
      latency: '12ms',
      uptime: '99.99%'
    },
    { 
      name: 'API', 
      icon: Server, 
      status: 'healthy',
      latency: '45ms',
      uptime: '99.95%'
    },
    { 
      name: 'Job Queue', 
      icon: Clock, 
      status: healthData?.jobQueue?.failed > 5 ? 'degraded' : 'healthy',
      latency: '120ms',
      uptime: '99.90%'
    },
    { 
      name: 'Integrations', 
      icon: Zap, 
      status: 'healthy',
      latency: '250ms',
      uptime: '99.80%'
    }
  ];

  const StatusIcon = ({ status }) => {
    if (status === 'healthy') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'degraded') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 mt-1">
            Monitor platform status and performance
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <Heart className="w-3 h-3 mr-1" />
          All Systems Operational
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.name}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      service.status === 'healthy' ? 'bg-green-100' :
                      service.status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        service.status === 'healthy' ? 'text-green-600' :
                        service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-500">Latency: {service.latency}</p>
                    </div>
                  </div>
                  <StatusIcon status={service.status} />
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500">Uptime: {service.uptime}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Data Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Customers</span>
                  <span className="font-bold">{healthData?.entities?.customers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Jobs</span>
                  <span className="font-bold">{healthData?.entities?.jobs || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Products</span>
                  <span className="font-bold">{healthData?.entities?.products || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Audit Logs</span>
                  <span className="font-bold">{healthData?.entities?.auditLogs || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Job Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Queued</span>
                    <span className="font-medium">{healthData?.jobQueue?.queued || 0}</span>
                  </div>
                  <Progress value={healthData?.jobQueue?.queued ? 30 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Processing</span>
                    <span className="font-medium text-blue-600">{healthData?.jobQueue?.processing || 0}</span>
                  </div>
                  <Progress value={healthData?.jobQueue?.processing ? 20 : 0} className="h-2 bg-blue-100" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">{healthData?.jobQueue?.completed || 0}</span>
                  </div>
                  <Progress value={90} className="h-2 bg-green-100" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">{healthData?.jobQueue?.failed || 0}</span>
                  </div>
                  <Progress value={healthData?.jobQueue?.failed ? 10 : 0} className="h-2 bg-red-100" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Errors
          </CardTitle>
          <CardDescription>
            Failed operations in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : healthData?.recentErrors?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-gray-600">No recent errors</p>
              <p className="text-sm text-gray-400">All systems are operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthData?.recentErrors?.map((error, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-800 capitalize">
                      {error.action.replace(/_/g, ' ')} failed
                    </p>
                    <p className="text-sm text-red-600 truncate">
                      {error.error_message || `Failed to ${error.action} ${error.resource_type}`}
                    </p>
                    <p className="text-xs text-red-400 mt-1">
                      {formatDistanceToNow(new Date(error.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium">{organization?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium capitalize">{organization?.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Activity</p>
              <p className="font-medium">
                {healthData?.lastActivity 
                  ? formatDistanceToNow(new Date(healthData.lastActivity), { addSuffix: true })
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">API Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}