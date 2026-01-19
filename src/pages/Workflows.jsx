/**
 * Workflow Management Page
 * Configure automated workflows and triggers for job events
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Play, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import WorkflowBuilder from '../components/workflows/WorkflowBuilder';

export default function Workflows() {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: rules = [] } = useQuery({
    queryKey: ['workflowRules', currentOrgId],
    queryFn: async () => {
      return await base44.entities.WorkflowRule.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      await base44.entities.WorkflowRule.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowRules']);
      toast.success('Workflow rule updated');
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.WorkflowRule.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowRules']);
      toast.success('Workflow rule deleted');
    }
  });

  const getActionBadges = (actions) => {
    const actionTypes = {
      assign_tasks: '✓ Assign Tasks',
      send_email: '✉ Send Email',
      create_follow_up: '→ Create Follow-up',
      notify_team: '🔔 Notify Team',
      update_field: '✎ Update Field'
    };
    return actions.map(a => actionTypes[a.type] || a.type);
  };

  const getTriggerDescription = (trigger) => {
    if (trigger.event === 'status_change') {
      const from = trigger.from_status || 'any';
      const to = trigger.to_status || 'any';
      return `Status: ${from} → ${to}`;
    }
    return trigger.event.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-500 mt-1">
            Automate actions based on job status changes and events
          </p>
        </div>
        <Button onClick={() => {
          setEditingRule(null);
          setShowBuilder(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Workflows</p>
            <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Executions</p>
            <p className="text-2xl font-bold">
              {rules.reduce((sum, r) => sum + (r.execution_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Automation Rate</p>
            <p className="text-2xl font-bold">
              {rules.length > 0 ? Math.round((rules.filter(r => r.is_active).length / rules.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first workflow to automate repetitive tasks
              </p>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className={`w-5 h-5 ${rule.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => 
                          toggleRuleMutation.mutate({ id: rule.id, is_active: checked })
                        }
                      />
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingRule(rule);
                        setShowBuilder(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Trigger</p>
                    <Badge variant="outline" className="capitalize">
                      <Play className="w-3 h-3 mr-1" />
                      {getTriggerDescription(rule.trigger)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {getActionBadges(rule.actions).map((badge, idx) => (
                        <Badge key={idx} variant="secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {rule.execution_count > 0 && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Executed {rule.execution_count} times
                      </span>
                      {rule.last_executed_at && (
                        <span>
                          Last run: {format(new Date(rule.last_executed_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WorkflowBuilder
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        rule={editingRule}
        organizationId={currentOrgId}
        workspaceId={currentWorkspaceId}
        onSuccess={() => {
          queryClient.invalidateQueries(['workflowRules']);
          setShowBuilder(false);
        }}
      />
    </div>
  );
}