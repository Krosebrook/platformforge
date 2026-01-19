import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from 'lucide-react';

export default function TemplateApprovalBuilder({ workflow = {}, onChange }) {
  const [workflow_state, setWorkflowState] = React.useState({
    enabled: workflow.enabled || false,
    trigger_stage: workflow.trigger_stage || 'in_progress',
    approvers: workflow.approvers || [],
    approval_type: workflow.approval_type || 'any',
    auto_approve_after_hours: workflow.auto_approve_after_hours || 48
  });

  const updateWorkflow = (field, value) => {
    const updated = { ...workflow_state, [field]: value };
    setWorkflowState(updated);
    onChange(updated);
  };

  const addApprover = () => {
    setWorkflowState(prev => ({
      ...prev,
      approvers: [...prev.approvers, '']
    }));
  };

  const updateApprover = (idx, value) => {
    const updated = [...workflow_state.approvers];
    updated[idx] = value;
    updateWorkflow('approvers', updated);
  };

  const removeApprover = (idx) => {
    updateWorkflow('approvers', workflow_state.approvers.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Approval Workflow</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={workflow_state.enabled}
              onCheckedChange={(checked) => updateWorkflow('enabled', checked)}
            />
            <Label className="font-normal">Enable approval workflow</Label>
          </div>
        </div>
      </CardHeader>

      {workflow_state.enabled && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trigger Stage</Label>
              <Select value={workflow_state.trigger_stage} onValueChange={(v) => updateWorkflow('trigger_stage', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">When Job Created</SelectItem>
                  <SelectItem value="in_progress">When In Progress</SelectItem>
                  <SelectItem value="review">When In Review</SelectItem>
                  <SelectItem value="completion">Before Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Approval Type</Label>
              <Select value={workflow_state.approval_type} onValueChange={(v) => updateWorkflow('approval_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Approver</SelectItem>
                  <SelectItem value="all">All Approvers</SelectItem>
                  <SelectItem value="sequential">Sequential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Auto-Approve After (hours)</Label>
              <Input
                type="number"
                value={workflow_state.auto_approve_after_hours}
                onChange={(e) => updateWorkflow('auto_approve_after_hours', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Approvers</Label>
              <Button size="sm" variant="outline" onClick={addApprover}>
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>
            {workflow_state.approvers.map((approver, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="Email or role"
                  value={approver}
                  onChange={(e) => updateApprover(idx, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeApprover(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}