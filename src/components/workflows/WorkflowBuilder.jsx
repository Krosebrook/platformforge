/**
 * Workflow Builder Component
 * Visual builder for creating and editing workflow rules
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConditionalBuilder from './ConditionalBuilder';
import { Badge } from "@/components/ui/badge";
import { Plus, X, Mail, CheckSquare, FileText, Bell, Edit } from 'lucide-react';
import { toast } from 'sonner';

const ACTION_TYPES = [
  { value: 'assign_tasks', label: 'Assign Tasks', icon: CheckSquare },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'create_follow_up', label: 'Create Follow-up Job', icon: FileText },
  { value: 'notify_team', label: 'Notify Team', icon: Bell },
  { value: 'update_field', label: 'Update Field', icon: Edit }
];

export default function WorkflowBuilder({ open, onClose, rule, organizationId, workspaceId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger: rule?.trigger || {
      event: 'status_change',
      to_status: '',
      from_status: ''
    },
    actions: rule?.actions || [],
    is_active: rule?.is_active ?? true
  });

  const [editingAction, setEditingAction] = useState(null);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (rule) {
        return await base44.entities.WorkflowRule.update(rule.id, data);
      } else {
        return await base44.entities.WorkflowRule.create({
          organization_id: organizationId,
          workspace_id: workspaceId,
          ...data
        });
      }
    },
    onSuccess: () => {
      toast.success(rule ? 'Workflow updated' : 'Workflow created');
      onSuccess();
    }
  });

  const addAction = (type) => {
    const defaultConfigs = {
      assign_tasks: { task_template: [] },
      send_email: { recipient_type: 'customer', subject: '', body: '' },
      create_follow_up: { days_after: 7, title_template: '', inherit_customer: true },
      notify_team: { members: [], message: '' },
      update_field: { field: '', value: '' }
    };

    setEditingAction({ type, config: defaultConfigs[type] || {} });
  };

  const saveAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, editingAction]
    }));
    setEditingAction(null);
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workflow Name</Label>
              <Input
                placeholder="e.g., Auto-assign tasks on in-progress"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this workflow does..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Trigger Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trigger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>When</Label>
                <Select
                  value={formData.trigger.event}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    trigger: { ...formData.trigger, event: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_change">Job status changes</SelectItem>
                    <SelectItem value="created">Job is created</SelectItem>
                    <SelectItem value="assigned">Job is assigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.trigger.event === 'status_change' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>From Status</Label>
                    <Select
                      value={formData.trigger.from_status || ''}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        trigger: { ...formData.trigger, from_status: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Any status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>To Status</Label>
                    <Select
                      value={formData.trigger.to_status || ''}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        trigger: { ...formData.trigger, to_status: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Any status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Actions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addAction('assign_tasks')}
                  disabled={!!editingAction}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Action
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.actions.map((action, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {ACTION_TYPES.find(t => t.value === action.type)?.icon && 
                      React.createElement(ACTION_TYPES.find(t => t.value === action.type).icon, { className: 'w-4 h-4 text-gray-500' })
                    }
                    <span className="font-medium">
                      {ACTION_TYPES.find(t => t.value === action.type)?.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAction(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {editingAction && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select
                      value={editingAction.type}
                      onValueChange={(value) => setEditingAction({ 
                        type: value, 
                        config: editingAction.config 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingAction.type === 'send_email' && (
                    <>
                      <div className="space-y-2">
                        <Label>Send To</Label>
                        <Select
                          value={editingAction.config.recipient_type}
                          onValueChange={(value) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, recipient_type: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="assigned_user">Assigned User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          placeholder="Use {{job_title}} for job title"
                          value={editingAction.config.subject}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, subject: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                          placeholder="Use {{customer_name}}, {{job_title}}, {{job_status}}"
                          value={editingAction.config.body}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, body: e.target.value }
                          })}
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  {editingAction.type === 'create_follow_up' && (
                    <>
                      <div className="space-y-2">
                        <Label>Days After Completion</Label>
                        <Input
                          type="number"
                          value={editingAction.config.days_after}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, days_after: parseInt(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Job Title Template</Label>
                        <Input
                          placeholder="Use {{original_job}} for original job title"
                          value={editingAction.config.title_template}
                          onChange={(e) => setEditingAction({
                            ...editingAction,
                            config: { ...editingAction.config, title_template: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveAction}>
                      Save Action
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingAction(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => saveMutation.mutate(formData)}
            disabled={!formData.name || formData.actions.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : rule ? 'Update' : 'Create'} Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}