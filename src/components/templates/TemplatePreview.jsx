import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield } from 'lucide-react';

export default function TemplatePreview({ template }) {
  if (!template) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Tasks ({template.predefined_tasks?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!template.predefined_tasks?.length ? (
            <p className="text-sm text-gray-500">No tasks defined</p>
          ) : (
            <ul className="space-y-2">
              {template.predefined_tasks.map((task, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">{task.priority}</Badge>
                      {task.estimated_hours > 0 && (
                        <Badge variant="outline" className="text-xs">{task.estimated_hours}h</Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {template.approval_workflow?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Approval Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Trigger:</strong> {template.approval_workflow.trigger_stage}</p>
            <p><strong>Type:</strong> {template.approval_workflow.approval_type}</p>
            <p><strong>Approvers:</strong> {template.approval_workflow.approvers?.join(', ') || 'None'}</p>
            <p><strong>Auto-approve:</strong> After {template.approval_workflow.auto_approve_after_hours} hours</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}