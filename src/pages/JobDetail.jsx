import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Edit, Save, User, Calendar, Clock,
  DollarSign, AlertTriangle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

const STATUS_FLOW = ['draft', 'pending', 'in_progress', 'review', 'completed'];

export default function JobDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const jobs = await base44.entities.Job.filter({ id: jobId });
      return jobs[0];
    },
    enabled: !!jobId
  });

  const { data: customer } = useQuery({
    queryKey: ['jobCustomer', job?.customer_id],
    queryFn: async () => {
      if (!job?.customer_id) return null;
      const customers = await base44.entities.Customer.filter({ id: job.customer_id });
      return customers[0];
    },
    enabled: !!job?.customer_id
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

  React.useEffect(() => {
    if (job) {
      setFormData(job);
    }
  }, [job]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const updateData = {
        ...data,
        workflow_state: {
          ...job.workflow_state,
          current_stage: data.status,
          stage_entered_at: data.status !== job.status 
            ? new Date().toISOString() 
            : job.workflow_state?.stage_entered_at
        }
      };

      if (data.status === 'completed' && job.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      await base44.entities.Job.update(jobId, updateData);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        actor_role: role,
        action: data.status !== job.status ? 'status_change' : 'update',
        resource_type: 'job',
        resource_id: jobId,
        resource_name: job.title,
        changes: {
          before: { status: job.status },
          after: { status: data.status }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['job', jobId]);
      setIsEditing(false);
      toast.success('Job updated');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job not found</p>
        <Link to={createPageUrl('Jobs')}>
          <Button className="mt-4">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const currentStageIndex = STATUS_FLOW.indexOf(job.status);
  const progress = job.status === 'completed' ? 100 : 
    job.status === 'cancelled' ? 0 :
    ((currentStageIndex + 1) / STATUS_FLOW.length) * 100;

  const isOverdue = job.due_date && 
    new Date(job.due_date) < new Date() && 
    !['completed', 'cancelled'].includes(job.status);

  const daysUntilDue = job.due_date 
    ? differenceInDays(new Date(job.due_date), new Date())
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
          </div>
          <p className="text-gray-500">{job.reference_number}</p>
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => {
            if (isEditing) {
              updateMutation.mutate(formData);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      {isOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">This job is overdue</p>
              <p className="text-sm text-red-600">
                Due date was {format(new Date(job.due_date), 'PPP')} ({formatDistanceToNow(new Date(job.due_date))} ago)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Progress</h3>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STATUS_FLOW.map((status, index) => (
              <button
                key={status}
                onClick={() => {
                  if (!isEditing) return;
                  setFormData(prev => ({ ...prev, status }));
                }}
                className={`text-xs capitalize ${
                  index <= currentStageIndex 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-400'
                } ${isEditing ? 'cursor-pointer hover:text-gray-900' : ''}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-500">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700">{job.description || 'No description provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map(s => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace('_', ' ')}
                          </SelectItem>
                        ))}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={job.status} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Priority</Label>
                  {isEditing ? (
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
                  ) : (
                    <PriorityBadge priority={job.priority} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Due Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.due_date?.split('T')[0] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  ) : (
                    <p className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : ''}`}>
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {job.due_date ? format(new Date(job.due_date), 'PPP') : '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Assigned To</Label>
                  {isEditing ? (
                    <Select
                      value={formData.assigned_to || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Unassigned</SelectItem>
                        {members.map(m => (
                          <SelectItem key={m.user_email} value={m.user_email}>
                            {m.user_email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {job.assigned_to || 'Unassigned'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  to={createPageUrl('CustomerDetail') + `?id=${customer.id}`}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-lg">
                      {customer.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Value</span>
                <span className="font-bold text-lg">${(job.value || 0).toLocaleString()}</span>
              </div>
              {job.estimated_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Estimated</span>
                  <span className="font-medium">{job.estimated_hours}h</span>
                </div>
              )}
              {job.actual_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Actual</span>
                  <span className="font-medium">{job.actual_hours}h</span>
                </div>
              )}
              {daysUntilDue !== null && !['completed', 'cancelled'].includes(job.status) && (
                <div className={`flex items-center justify-between ${isOverdue ? 'text-red-600' : ''}`}>
                  <span className="text-gray-500">Days Until Due</span>
                  <span className="font-medium">
                    {isOverdue ? `${Math.abs(daysUntilDue)} overdue` : daysUntilDue}
                  </span>
                </div>
              )}
              {job.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {format(new Date(job.completed_at), 'PP')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityFeed 
            resourceType="job" 
            resourceId={jobId} 
            limit={10}
            maxHeight="300px"
          />
        </div>
      </div>
    </div>
  );
}