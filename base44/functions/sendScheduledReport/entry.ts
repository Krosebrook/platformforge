/**
 * Scheduled Report Email Sender
 * Generates and emails custom reports on schedule
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Allow system/automation to call this
    if (!user && !req.headers.get('x-automation-key')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    // Fetch the report configuration
    const reports = await base44.asServiceRole.entities.SavedReport.filter({ id: report_id });
    const report = reports[0];

    if (!report || !report.schedule?.enabled) {
      return Response.json({ error: 'Report not found or not scheduled' }, { status: 404 });
    }

    // Fetch data based on report metrics and filters
    const jobs = await base44.asServiceRole.entities.Job.filter({
      organization_id: report.organization_id,
      ...(report.filters || {})
    });

    // Generate report summary
    const summary = generateReportSummary(jobs, report.metrics);

    // Send email to recipients
    for (const recipient of report.schedule.recipients || []) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        subject: `Scheduled Report: ${report.name}`,
        body: `
          <h2>${report.name}</h2>
          <p>${report.description || ''}</p>
          
          <h3>Summary</h3>
          ${Object.entries(summary).map(([key, value]) => 
            `<p><strong>${key}:</strong> ${value}</p>`
          ).join('')}
          
          <p><em>This is an automated report. View the full report in your dashboard.</em></p>
        `
      });
    }

    // Update next run time
    const nextRun = calculateNextRun(report.schedule.frequency);
    await base44.asServiceRole.entities.SavedReport.update(report.id, {
      schedule: {
        ...report.schedule,
        next_run: nextRun
      }
    });

    return Response.json({ success: true, sent_to: report.schedule.recipients.length });

  } catch (error) {
    console.error('Report email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReportSummary(jobs, metrics) {
  const summary = {};
  
  if (metrics.includes('total_jobs')) {
    summary['Total Jobs'] = jobs.length;
  }
  if (metrics.includes('completed_jobs')) {
    summary['Completed Jobs'] = jobs.filter(j => j.status === 'completed').length;
  }
  if (metrics.includes('total_value')) {
    summary['Total Value'] = `$${jobs.reduce((sum, j) => sum + (j.value || 0), 0).toLocaleString()}`;
  }
  if (metrics.includes('avg_completion_time')) {
    const completed = jobs.filter(j => j.completed_at && j.started_at);
    if (completed.length > 0) {
      const avgDays = completed.reduce((sum, j) => {
        const days = (new Date(j.completed_at) - new Date(j.started_at)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / completed.length;
      summary['Avg Completion Time'] = `${avgDays.toFixed(1)} days`;
    }
  }
  
  return summary;
}

function calculateNextRun(frequency) {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }
  
  return now.toISOString();
}