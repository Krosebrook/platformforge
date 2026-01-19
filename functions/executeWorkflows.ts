/**
 * Workflow Execution Engine
 * Executes workflow rules based on job events
 * Triggered by entity automation on Job updates
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only process job update events
    if (event.entity_name !== 'Job' || event.type !== 'update') {
      return Response.json({ message: 'Skipped - not a job update' });
    }

    const job = data;
    const oldJob = old_data;
    const organizationId = job.organization_id;

    // Fetch active workflow rules for this organization
    const rules = await base44.asServiceRole.entities.WorkflowRule.filter({
      organization_id: organizationId,
      is_active: true
    });

    const executedRules = [];

    // Check each rule to see if it should trigger
    for (const rule of rules) {
      const shouldExecute = await evaluateTrigger(rule.trigger, job, oldJob);
      
      if (shouldExecute) {
        await executeActions(base44, rule, job);
        
        // Update execution count
        await base44.asServiceRole.entities.WorkflowRule.update(rule.id, {
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        });

        executedRules.push(rule.name);
      }
    }

    return Response.json({ 
      success: true, 
      executed: executedRules.length,
      rules: executedRules 
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Evaluate if a trigger condition is met
 */
async function evaluateTrigger(trigger, job, oldJob) {
  if (trigger.event === 'status_change') {
    const statusChanged = job.status !== oldJob?.status;
    const toStatusMatches = !trigger.to_status || job.status === trigger.to_status;
    const fromStatusMatches = !trigger.from_status || oldJob?.status === trigger.from_status;
    
    if (!statusChanged || !toStatusMatches || !fromStatusMatches) {
      return false;
    }
  } else if (trigger.event === 'assigned') {
    if (job.assigned_to === oldJob?.assigned_to) {
      return false;
    }
  }

  // Check additional conditions
  if (trigger.conditions) {
    if (trigger.conditions.priority && job.priority !== trigger.conditions.priority) {
      return false;
    }
    if (trigger.conditions.min_value && job.value < trigger.conditions.min_value) {
      return false;
    }
  }

  return true;
}

/**
 * Execute all actions for a workflow rule
 */
async function executeActions(base44, rule, job) {
  for (const action of rule.actions) {
    try {
      switch (action.type) {
        case 'assign_tasks':
          await assignTasks(base44, job, action.config);
          break;
        case 'send_email':
          await sendEmail(base44, job, action.config);
          break;
        case 'create_follow_up':
          await createFollowUp(base44, job, action.config);
          break;
        case 'notify_team':
          await notifyTeam(base44, job, action.config);
          break;
        case 'update_field':
          await updateJobField(base44, job, action.config);
          break;
      }
    } catch (error) {
      console.error(`Action ${action.type} failed:`, error);
    }
  }
}

/**
 * Action: Assign tasks from template
 */
async function assignTasks(base44, job, config) {
  const { task_template, assign_to } = config;
  
  if (!task_template || !Array.isArray(task_template)) return;

  for (const taskData of task_template) {
    await base44.asServiceRole.entities.Task.create({
      organization_id: job.organization_id,
      workspace_id: job.workspace_id,
      job_id: job.id,
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority || 'medium',
      assigned_to: assign_to || job.assigned_to,
      estimated_hours: taskData.estimated_hours
    });
  }
}

/**
 * Action: Send email notification
 */
async function sendEmail(base44, job, config) {
  const { recipient_type, subject, body } = config;

  // Fetch customer for email
  if (recipient_type === 'customer') {
    const customers = await base44.asServiceRole.entities.Customer.filter({
      id: job.customer_id
    });
    const customer = customers[0];
    
    if (customer && customer.email) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: customer.email,
        subject: subject.replace('{{job_title}}', job.title),
        body: body
          .replace('{{customer_name}}', customer.name)
          .replace('{{job_title}}', job.title)
          .replace('{{job_status}}', job.status)
      });

      // Log communication
      await base44.asServiceRole.entities.Communication.create({
        organization_id: job.organization_id,
        workspace_id: job.workspace_id,
        customer_id: job.customer_id,
        job_id: job.id,
        type: 'email',
        direction: 'outbound',
        subject: subject.replace('{{job_title}}', job.title),
        body: body,
        status: 'sent'
      });
    }
  } else if (recipient_type === 'assigned_user' && job.assigned_to) {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: job.assigned_to,
      subject: subject.replace('{{job_title}}', job.title),
      body: body.replace('{{job_title}}', job.title)
    });
  }
}

/**
 * Action: Create follow-up job
 */
async function createFollowUp(base44, job, config) {
  const { days_after, title_template, inherit_customer } = config;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (days_after || 7));

  await base44.asServiceRole.entities.Job.create({
    organization_id: job.organization_id,
    workspace_id: job.workspace_id,
    customer_id: inherit_customer ? job.customer_id : null,
    title: title_template.replace('{{original_job}}', job.title),
    description: `Follow-up for: ${job.title}`,
    status: 'draft',
    priority: 'medium',
    due_date: dueDate.toISOString(),
    reference_number: `JOB-${Date.now().toString(36).toUpperCase()}`
  });
}

/**
 * Action: Notify team members
 */
async function notifyTeam(base44, job, config) {
  const { members, message } = config;
  
  if (!members || members.length === 0) return;

  // Create activity notifications
  for (const memberEmail of members) {
    await base44.asServiceRole.entities.Activity.create({
      organization_id: job.organization_id,
      workspace_id: job.workspace_id,
      actor_email: 'system@workflow',
      actor_name: 'Workflow Automation',
      action: 'workflow_notification',
      description: message.replace('{{job_title}}', job.title),
      resource_type: 'job',
      resource_id: job.id,
      resource_name: job.title,
      metadata: { recipient: memberEmail }
    });
  }
}

/**
 * Action: Update job field
 */
async function updateJobField(base44, job, config) {
  const { field, value } = config;
  
  if (!field || value === undefined) return;

  await base44.asServiceRole.entities.Job.update(job.id, {
    [field]: value
  });
}