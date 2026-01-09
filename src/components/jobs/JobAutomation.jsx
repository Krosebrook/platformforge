import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../common/TenantContext';
import { logAuditEvent } from '../common/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight, Loader2, User, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function JobAutomation({ job, onUpdate }) {
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: similarJobs = [] } = useQuery({
    queryKey: ['similarJobs', currentOrgId, job?.id],
    queryFn: async () => {
      return await base44.entities.Job.filter({
        organization_id: currentOrgId,
        status: 'completed'
      }, '-completed_at', 20);
    },
    enabled: !!currentOrgId && !!job?.id
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

  const { data: memberJobs = [] } = useQuery({
    queryKey: ['memberJobs', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Job.filter({
        organization_id: currentOrgId,
        status: 'in_progress'
      });
    },
    enabled: !!currentOrgId
  });

  const updateJobMutation = useMutation({
    mutationFn: async (updates) => {
      await base44.entities.Job.update(job.id, updates);
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        action: 'update',
        resource_type: 'job',
        resource_id: job.id,
        resource_name: job.title,
        changes: { after: updates }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
      if (onUpdate) onUpdate();
    }
  });

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const memberWorkload = {};
      memberJobs.forEach(j => {
        if (j.assigned_to) {
          memberWorkload[j.assigned_to] = (memberWorkload[j.assigned_to] || 0) + 1;
        }
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `
Analyze this job and provide automation suggestions:

Current Job:
- Title: ${job.title}
- Description: ${job.description || 'N/A'}
- Current Status: ${job.status}
- Priority: ${job.priority}
- Due Date: ${job.due_date || 'N/A'}
- Assigned To: ${job.assigned_to || 'Unassigned'}

Historical Context (${similarJobs.length} completed jobs):
${similarJobs.slice(0, 10).map(j => `
- ${j.title} | ${j.status} | Duration: ${j.actual_hours || 'N/A'}h | Value: $${j.value || 0}
`).join('')}

Available Team Members and Current Workload:
${members.map(m => `- ${m.user_email} (${m.role}) - ${memberWorkload[m.user_email] || 0} active jobs`).join('\n')}

Provide:
1. Recommended next status based on current progress
2. Best team member to assign (considering skills and workload)
3. Estimated completion time
4. Risk factors and recommendations
`,
        response_json_schema: {
          type: "object",
          properties: {
            next_status: {
              type: "object",
              properties: {
                status: { type: "string" },
                reason: { type: "string" },
                confidence: { type: "string" }
              }
            },
            recommended_assignment: {
              type: "object",
              properties: {
                member_email: { type: "string" },
                reason: { type: "string" },
                confidence: { type: "string" }
              }
            },
            completion_estimate: {
              type: "object",
              properties: {
                days: { type: "number" },
                reasoning: { type: "string" }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  risk: { type: "string" },
                  severity: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      toast.error('Failed to generate suggestions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyStatusSuggestion = () => {
    if (suggestions?.next_status?.status) {
      updateJobMutation.mutate({ status: suggestions.next_status.status });
    }
  };

  const applyAssignmentSuggestion = () => {
    if (suggestions?.recommended_assignment?.member_email) {
      updateJobMutation.mutate({ assigned_to: suggestions.recommended_assignment.member_email });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Automation</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={getSuggestions}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Get Suggestions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions && !loading && (
          <p className="text-sm text-gray-500">
            Click "Get Suggestions" to analyze this job and receive AI-powered recommendations for status transitions and team assignments.
          </p>
        )}

        {suggestions && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Recommended Status Change</h4>
                  <div className="flex items-center gap-2">
                    <Badge>{job.status}</Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge className="bg-blue-100 text-blue-800">{suggestions.next_status?.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{suggestions.next_status?.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">Confidence: {suggestions.next_status?.confidence}</p>
                </div>
                <Button
                  size="sm"
                  onClick={applyStatusSuggestion}
                  disabled={updateJobMutation.isPending}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Recommended Assignment</h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{suggestions.recommended_assignment?.member_email}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{suggestions.recommended_assignment?.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">Confidence: {suggestions.recommended_assignment?.confidence}</p>
                </div>
                <Button
                  size="sm"
                  onClick={applyAssignmentSuggestion}
                  disabled={updateJobMutation.isPending}
                >
                  Apply
                </Button>
              </div>
            </div>

            {suggestions.completion_estimate && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Estimated Completion</h4>
                    <p className="text-2xl font-bold text-blue-600">{suggestions.completion_estimate.days} days</p>
                    <p className="text-sm text-gray-600 mt-1">{suggestions.completion_estimate.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {suggestions.risks?.length > 0 && (
              <div className="border rounded-lg p-4 bg-amber-50">
                <h4 className="font-medium text-sm mb-2">Risk Analysis</h4>
                <div className="space-y-2">
                  {suggestions.risks.map((risk, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                          risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {risk.severity}
                        </Badge>
                        <span className="font-medium">{risk.risk}</span>
                      </div>
                      <p className="text-gray-600 mt-1 ml-16">{risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}