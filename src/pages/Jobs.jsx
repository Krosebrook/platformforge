import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { useTenantBoundary } from '../components/common/TenantBoundary';
import { logAuditEvent } from '../components/common/AuditLogger';
import { RequireEditor } from '../components/common/PermissionGate';
import { DataTable } from '../components/ui/DataTable';
import { JobsEmptyState } from '../components/ui/EmptyState';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Briefcase, Calendar, Clock, User,
  AlertTriangle, CheckCircle, Play, Pause
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { AIJobAssistant } from '../components/jobs/AIJobAssistant';

const STATUS_ORDER = ['draft', 'pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold'];

export default function Jobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  const { enforce, buildFilter } = useTenantBoundary();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [aiSuggestions, setAISuggestions] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    due_date: '',
    customer_id: '',
    value: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const showNewForm = urlParams.get('action') === 'new';

  React.useEffect(() => {
    if (showNewForm) {
      setShowCreateDialog(true);
    }
  }, [showNewForm]);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = buildFilter({});
      return await base44.entities.Job.filter(filter, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = buildFilter({});
      return await base44.entities.Customer.filter(filter);
    },
    enabled: !!currentOrgId
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = buildFilter({ status: 'active' });
      return await base44.entities.Product.filter(filter);
    },
    enabled: !!currentOrgId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const jobData = enforce({
        ...data,
        reference_number: `JOB-${Date.now().toString(36).toUpperCase()}`,
        workflow_state: {
          current_stage: data.status,
          stage_entered_at: new Date().toISOString()
        }
      });
      const job = await base44.entities.Job.create(jobData);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        actor_role: role,
        action: 'create',
        resource_type: 'job',
        resource_id: job.id,
        resource_name: job.title
      });

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', status: 'draft', priority: 'medium', due_date: '', customer_id: '', value: '' });
      setAISuggestions(null);
      toast.success('Job created successfully');
      if (showNewForm) {
        navigate(createPageUrl('Jobs'));
      }
    },
    onError: (error) => {
      toast.error('Failed to create job: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Job.delete(id);
        await logAuditEvent({
          organization_id: currentOrgId,
          workspace_id: currentWorkspaceId,
          actor_email: user.email,
          actor_role: role,
          action: 'delete',
          resource_type: 'job',
          resource_id: id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      setSelectedRows([]);
      toast.success('Jobs deleted');
    }
  });

  const filteredJobs = React.useMemo(() => {
    if (activeTab === 'all') return jobs;
    if (activeTab === 'active') return jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status));
    if (activeTab === 'completed') return jobs.filter(j => j.status === 'completed');
    if (activeTab === 'overdue') return jobs.filter(j => {
      if (!j.due_date || j.status === 'completed' || j.status === 'cancelled') return false;
      return new Date(j.due_date) < new Date();
    });
    return jobs;
  }, [jobs, activeTab]);

  const stats = React.useMemo(() => {
    return {
      all: jobs.length,
      active: jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status)).length,
      completed: jobs.filter(j => j.status === 'completed').length,
      overdue: jobs.filter(j => {
        if (!j.due_date || j.status === 'completed' || j.status === 'cancelled') return false;
        return new Date(j.due_date) < new Date();
      }).length
    };
  }, [jobs]);

  const columns = [
    {
      accessorKey: 'title',
      header: 'Job',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.original.priority === 'urgent' ? 'bg-red-100' :
            row.original.priority === 'high' ? 'bg-orange-100' :
            'bg-purple-100'
          }`}>
            <Briefcase className={`w-5 h-5 ${
              row.original.priority === 'urgent' ? 'text-red-600' :
              row.original.priority === 'high' ? 'text-orange-600' :
              'text-purple-600'
            }`} />
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-sm text-gray-500">{row.original.reference_number}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        if (!row.original.due_date) return <span className="text-gray-400">-</span>;
        const isOverdue = new Date(row.original.due_date) < new Date() && 
                         !['completed', 'cancelled'].includes(row.original.status);
        return (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            {isOverdue && <AlertTriangle className="w-4 h-4" />}
            {format(new Date(row.original.due_date), 'MMM d, yyyy')}
          </div>
        );
      }
    },
    {
      accessorKey: 'assigned_to',
      header: 'Assigned',
      cell: ({ row }) => (
        row.original.assigned_to ? (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{row.original.assigned_to.split('@')[0]}</span>
          </div>
        ) : (
          <span className="text-gray-400">Unassigned</span>
        )
      )
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-medium">
          ${(row.original.value || 0).toLocaleString()}
        </span>
      )
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">
            Track and manage all your jobs and orders
          </p>
        </div>
        <RequireEditor>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        </RequireEditor>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">All Jobs</p>
            <p className="text-2xl font-bold">{stats.all}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('active')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('completed')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('overdue')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>

          <DataTable
            columns={columns}
            data={filteredJobs}
            isLoading={isLoading}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            onRowClick={(row) => navigate(createPageUrl('JobDetail') + `?id=${row.id}`)}
            onDelete={(ids) => deleteMutation.mutate(ids)}
            emptyState={<JobsEmptyState onAdd={() => setShowCreateDialog(true)} />}
            searchPlaceholder="Search jobs..."
          />
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setAISuggestions(null);
          if (showNewForm) {
            navigate(createPageUrl('Jobs'));
          }
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>
              Enter the job details below. Get AI-powered recommendations for products, value estimation, and delay risk.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">.
              <AIJobAssistant
                jobTitle={formData.title}
                jobDescription={formData.description}
                currentValue={formData.value}
                historicalJobs={jobs}
                products={products}
                onValueEstimated={(value) => setFormData(prev => ({ ...prev, value: value.toString() }))}
                onProductsSuggested={(suggestions) => setAISuggestions(suggestions)}
                onDelayPredicted={(prediction) => {
                  if (prediction.risk_level?.toLowerCase().includes('high')) {
                    toast.warning('High delay risk detected. Review AI recommendations.');
                  }
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Job title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Job description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Estimated Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Enter or let AI estimate"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}