import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { RequireFeature } from '../components/common/PermissionGate';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Activity, Filter, Download, Eye,
  Plus, Edit, Trash2, LogIn, Shield, Settings
} from 'lucide-react';
import { format, subDays } from 'date-fns';

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  login: LogIn,
  approve: Shield,
  reject: Shield,
  settings_change: Settings
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-700',
  login: 'bg-purple-100 text-purple-700',
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  settings_change: 'bg-yellow-100 text-yellow-700'
};

export default function AuditLog() {
  const { currentOrgId, hasFeature } = useTenant();
  const [filters, setFilters] = useState({
    action: 'all',
    resource_type: 'all',
    dateRange: '7'
  });
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['auditLogs', currentOrgId, filters],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = { organization_id: currentOrgId };
      if (filters.action !== 'all') filter.action = filters.action;
      if (filters.resource_type !== 'all') filter.resource_type = filters.resource_type;
      
      return await base44.entities.AuditLog.filter(filter, '-created_date', 100);
    },
    enabled: !!currentOrgId && hasFeature('audit_logs')
  });

  const filteredLogs = auditLogs.filter(log => {
    const logDate = new Date(log.created_date);
    const cutoffDate = subDays(new Date(), parseInt(filters.dateRange));
    return logDate >= cutoffDate;
  });

  const columns = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const Icon = ACTION_ICONS[row.original.action] || Activity;
        const colorClass = ACTION_COLORS[row.original.action] || 'bg-gray-100 text-gray-700';
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="capitalize font-medium">
              {row.original.action.replace(/_/g, ' ')}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'resource_type',
      header: 'Resource',
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="capitalize">
            {row.original.resource_type}
          </Badge>
          {row.original.resource_name && (
            <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px]">
              {row.original.resource_name}
            </p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'actor_email',
      header: 'Actor',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.actor_email}</p>
          <p className="text-sm text-gray-500 capitalize">{row.original.actor_role}</p>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      accessorKey: 'created_date',
      header: 'Time',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{format(new Date(row.original.created_date), 'MMM d, yyyy')}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(row.original.created_date), 'HH:mm:ss')}
          </p>
        </div>
      )
    }
  ];

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'Resource Name', 'Actor', 'Status'].join(','),
      ...filteredLogs.map(log => [
        log.created_date,
        log.action,
        log.resource_type,
        log.resource_name || '',
        log.actor_email,
        log.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <RequireFeature feature="audit_logs" showMessage>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-500 mt-1">
              Track all activity in your organization
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select
                value={filters.resource_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, resource_type: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="membership">Members</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={filteredLogs}
              isLoading={isLoading}
              onRowClick={setSelectedLog}
              showSearch={true}
              searchPlaceholder="Search audit logs..."
            />
          </CardContent>
        </Card>

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Action</p>
                    <p className="mt-1 capitalize">{selectedLog.action.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <StatusBadge status={selectedLog.status} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Resource</p>
                    <p className="mt-1 capitalize">{selectedLog.resource_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Resource Name</p>
                    <p className="mt-1">{selectedLog.resource_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Actor</p>
                    <p className="mt-1">{selectedLog.actor_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Timestamp</p>
                    <p className="mt-1">{format(new Date(selectedLog.created_date), 'PPpp')}</p>
                  </div>
                </div>

                {selectedLog.changes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Changes</p>
                    <pre className="p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Metadata</p>
                    <pre className="p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-2">Error</p>
                    <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RequireFeature>
  );
}