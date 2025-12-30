import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, Loader2, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function AIJobSummary({ job, historicalJobs = [], currentOrgId }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: similarJobs = [] } = useQuery({
    queryKey: ['similarJobs', job.id, currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const jobs = await base44.entities.Job.filter({
        organization_id: currentOrgId,
        status: 'completed'
      }, '-completed_at', 10);
      return jobs;
    },
    enabled: !!currentOrgId
  });

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job and provide an intelligent summary with actionable recommendations:

**Job Details:**
- Title: ${job.title}
- Reference: ${job.reference_number}
- Description: ${job.description || 'No description provided'}
- Status: ${job.status}
- Priority: ${job.priority}
- Due Date: ${job.due_date || 'Not set'}
- Assigned To: ${job.assigned_to || 'Unassigned'}
- Value: $${job.value || 0}
- Customer ID: ${job.customer_id || 'None'}

**Current Stage:**
- Workflow Stage: ${job.workflow_state?.current_stage || job.status}
- Stage Entered: ${job.workflow_state?.stage_entered_at || 'Unknown'}

**Historical Context:**
Similar completed jobs: ${JSON.stringify(similarJobs.slice(0, 5).map(j => ({
  title: j.title,
  status: j.status,
  duration_days: j.completed_at && j.started_at ? 
    Math.floor((new Date(j.completed_at) - new Date(j.started_at)) / (1000 * 60 * 60 * 24)) : null,
  value: j.value
})))}

Provide:
1. A concise 2-3 sentence summary of the job highlighting key aspects
2. Main tasks/objectives extracted from the description
3. Current status assessment
4. 3-5 specific next best actions based on the current stage, priority, and historical patterns
5. Any risks or concerns to watch for

Be specific, actionable, and focused on what will move this job forward.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Concise 2-3 sentence overview"
            },
            key_tasks: {
              type: "array",
              items: { type: "string" },
              description: "List of main tasks/objectives"
            },
            status_assessment: {
              type: "object",
              properties: {
                current_state: { type: "string" },
                health_indicator: { 
                  type: "string",
                  enum: ["on_track", "at_risk", "needs_attention"]
                },
                notes: { type: "string" }
              }
            },
            next_best_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { 
                    type: "string",
                    enum: ["high", "medium", "low"]
                  },
                  reasoning: { type: "string" }
                }
              }
            },
            risks: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSummary(response);
      toast.success('AI summary generated');
    } catch (error) {
      toast.error('Failed to generate summary: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (job && !summary) {
      generateSummary();
    }
  }, [job?.id]);

  if (!summary && !isGenerating) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Generate AI-powered insights for this job</p>
          <Button onClick={generateSummary} variant="outline" className="border-purple-200 hover:bg-purple-50">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            <p className="text-gray-600">AI is analyzing the job...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthColors = {
    on_track: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    at_risk: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    needs_attention: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Job Summary
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={generateSummary}
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary.summary}
          </p>

          {summary.key_tasks && summary.key_tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Tasks</p>
              <ul className="space-y-1.5">
                {summary.key_tasks.map((task, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.status_assessment && (
            <div className={`p-3 rounded-lg border ${healthColors[summary.status_assessment.health_indicator]?.border} ${healthColors[summary.status_assessment.health_indicator]?.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Status Assessment</p>
                <Badge className={`text-xs ${healthColors[summary.status_assessment.health_indicator]?.bg} ${healthColors[summary.status_assessment.health_indicator]?.text}`}>
                  {summary.status_assessment.health_indicator.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm font-medium mb-1">{summary.status_assessment.current_state}</p>
              <p className="text-xs text-gray-600">{summary.status_assessment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {summary.next_best_actions && summary.next_best_actions.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Next Best Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.next_best_actions.map((action, idx) => (
              <div key={idx} className="p-3 bg-white border border-blue-100 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {action.action}
                  </p>
                  <Badge className={`text-xs ${priorityColors[action.priority]} flex-shrink-0`}>
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 ml-6">{action.reasoning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {summary.risks && summary.risks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800">⚠️ Risks & Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {summary.risks.map((risk, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-orange-500 flex-shrink-0">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}