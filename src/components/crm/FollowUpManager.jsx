/**
 * Follow-up Activity Manager
 * Schedule and track customer follow-up activities
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';

export default function FollowUpManager({ customerId }) {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'task',
    priority: 'medium',
    due_date: '',
    assigned_to: user?.email || ''
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['followUpActivities', customerId],
    queryFn: async () => {
      return await base44.entities.FollowUpActivity.filter({
        customer_id: customerId
      }, 'due_date');
    },
    enabled: !!customerId
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.FollowUpActivity.create({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        customer_id: customerId,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpActivities']);
      setShowDialog(false);
      setFormData({
        title: '',
        description: '',
        activity_type: 'task',
        priority: 'medium',
        due_date: '',
        assigned_to: user?.email || ''
      });
      toast.success('Follow-up activity created');
    }
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.FollowUpActivity.update(id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followUpActivities']);
      toast.success('Activity completed');
    }
  });

  const pendingActivities = activities.filter(a => a.status === 'pending');
  const overdueActivities = pendingActivities.filter(a => isPast(new Date(a.due_date)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Follow-up Activities</CardTitle>
            {overdueActivities.length > 0 && (
              <p className="text-sm text-red-600 mt-1">
                {overdueActivities.length} overdue
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No follow-up activities scheduled</p>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => {
              const isOverdue = activity.status === 'pending' && isPast(new Date(activity.due_date));
              return (
                <div key={activity.id} className={`flex items-start gap-3 p-3 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                  <Checkbox
                    checked={activity.status === 'completed'}
                    onCheckedChange={() => completeActivityMutation.mutate(activity.id)}
                    disabled={activity.status === 'completed'}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${activity.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                        {activity.title}
                      </p>
                      {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.activity_type}
                      </Badge>
                      <Badge className="text-xs capitalize">
                        {activity.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {format(new Date(activity.due_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.activity_type} onValueChange={(activity_type) => setFormData({ ...formData, activity_type })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(priority) => setFormData({ ...formData, priority })}>
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

            <div className="space-y-2">
              <Label>Due Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => addActivityMutation.mutate(formData)} disabled={!formData.title || !formData.due_date || addActivityMutation.isPending}>
              {addActivityMutation.isPending ? 'Scheduling...' : 'Schedule Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}