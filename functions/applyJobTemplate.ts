import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, templateId, organizationId } = await req.json();

    if (!jobId || !templateId) {
      return Response.json({ error: 'Missing jobId or templateId' }, { status: 400 });
    }

    // Fetch template and job
    const templates = await base44.entities.JobTemplate.filter({ id: templateId });
    const template = templates[0];

    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create predefined tasks
    if (template.predefined_tasks?.length > 0) {
      const tasksToCreate = template.predefined_tasks.map((task, idx) => ({
        organization_id: organizationId,
        job_id: jobId,
        title: task.title,
        description: task.description,
        priority: task.priority || 'medium',
        estimated_hours: task.estimated_hours || 0,
        order: task.order !== undefined ? task.order : idx,
        status: 'todo',
        dependencies: task.dependencies || []
      }));

      await base44.entities.Task.bulkCreate(tasksToCreate);
    }

    // Create approval workflow if enabled
    if (template.approval_workflow?.enabled) {
      const approval = await base44.entities.WorkflowApproval.create({
        organization_id: organizationId,
        workflow_id: templateId,
        job_id: jobId,
        status: 'pending',
        approval_type: template.approval_workflow.approval_type,
        approvers: template.approval_workflow.approvers.map(approver => ({
          email: approver,
          status: 'pending'
        })),
        auto_approve_at: template.approval_workflow.auto_approve_after_hours ?
          new Date(Date.now() + template.approval_workflow.auto_approve_after_hours * 3600000).toISOString() :
          null
      });

      // Update job workflow state to indicate approval is pending
      await base44.entities.Job.update(jobId, {
        workflow_state: {
          current_stage: template.approval_workflow.trigger_stage,
          stage_entered_at: new Date().toISOString(),
          sla_deadline: null,
          is_sla_breached: false
        }
      });
    }

    return Response.json({ success: true, message: 'Template applied successfully' });
  } catch (error) {
    console.error('Error applying template:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});