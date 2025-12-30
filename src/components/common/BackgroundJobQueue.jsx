import { base44 } from '@/api/base44Client';
import { logAuditEvent } from './AuditLogger';

const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000];

export async function enqueueJob({
  organization_id,
  job_type,
  payload,
  priority = 5,
  scheduled_for,
  triggered_by,
  idempotency_key
}) {
  if (idempotency_key) {
    const existing = await base44.entities.BackgroundJob.filter({
      organization_id,
      idempotency_key,
      status: { $in: ['queued', 'processing'] }
    });
    
    if (existing.length > 0) {
      return existing[0];
    }
  }

  const job = await base44.entities.BackgroundJob.create({
    organization_id,
    job_type,
    payload,
    priority,
    scheduled_for: scheduled_for || new Date().toISOString(),
    triggered_by: triggered_by || 'system',
    idempotency_key: idempotency_key || `${job_type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    correlation_id: generateCorrelationId(),
    status: 'queued',
    retry_count: 0,
    max_retries: 3
  });

  await logAuditEvent({
    organization_id,
    actor_email: triggered_by || 'system',
    action: 'create',
    resource_type: 'background_job',
    resource_id: job.id,
    resource_name: job_type,
    metadata: { payload: sanitizePayload(payload) }
  });

  return job;
}

export async function processJob(jobId, processor) {
  const jobs = await base44.entities.BackgroundJob.filter({ id: jobId });
  const job = jobs[0];
  
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'queued') {
    return job;
  }

  await base44.entities.BackgroundJob.update(jobId, {
    status: 'processing',
    started_at: new Date().toISOString()
  });

  try {
    const result = await processor(job.payload, job);
    
    await base44.entities.BackgroundJob.update(jobId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      result
    });

    return { ...job, status: 'completed', result };
  } catch (error) {
    const newRetryCount = job.retry_count + 1;
    const shouldRetry = newRetryCount < job.max_retries;

    await base44.entities.BackgroundJob.update(jobId, {
      status: shouldRetry ? 'queued' : 'dead_letter',
      retry_count: newRetryCount,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ...(shouldRetry ? {
        scheduled_for: new Date(Date.now() + RETRY_DELAYS[newRetryCount - 1]).toISOString()
      } : {})
    });

    if (!shouldRetry) {
      await logAuditEvent({
        organization_id: job.organization_id,
        actor_email: 'system',
        action: 'update',
        resource_type: 'background_job',
        resource_id: jobId,
        resource_name: job.job_type,
        status: 'failure',
        error_message: `Job failed after ${job.max_retries} retries: ${error.message}`
      });
    }

    throw error;
  }
}

export async function getJobQueue(organization_id, options = {}) {
  const { status, job_type, limit = 50 } = options;
  
  const filter = { organization_id };
  if (status) filter.status = status;
  if (job_type) filter.job_type = job_type;

  return await base44.entities.BackgroundJob.filter(filter, '-created_date', limit);
}

export async function getJobStats(organization_id) {
  const allJobs = await base44.entities.BackgroundJob.filter({ organization_id });
  
  const stats = {
    total: allJobs.length,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead_letter: 0,
    by_type: {}
  };

  for (const job of allJobs) {
    stats[job.status] = (stats[job.status] || 0) + 1;
    
    if (!stats.by_type[job.job_type]) {
      stats.by_type[job.job_type] = { total: 0, completed: 0, failed: 0 };
    }
    stats.by_type[job.job_type].total++;
    if (job.status === 'completed') stats.by_type[job.job_type].completed++;
    if (job.status === 'failed' || job.status === 'dead_letter') stats.by_type[job.job_type].failed++;
  }

  return stats;
}

export async function retryDeadLetterJob(jobId, triggeredBy) {
  const jobs = await base44.entities.BackgroundJob.filter({ id: jobId });
  const job = jobs[0];
  
  if (!job || job.status !== 'dead_letter') {
    throw new Error('Job not found or not in dead letter queue');
  }

  await base44.entities.BackgroundJob.update(jobId, {
    status: 'queued',
    retry_count: 0,
    scheduled_for: new Date().toISOString(),
    error: null
  });

  await logAuditEvent({
    organization_id: job.organization_id,
    actor_email: triggeredBy,
    action: 'update',
    resource_type: 'background_job',
    resource_id: jobId,
    resource_name: job.job_type,
    metadata: { action: 'retry_dead_letter' }
  });

  return { ...job, status: 'queued' };
}

export async function cancelJob(jobId, triggeredBy) {
  const jobs = await base44.entities.BackgroundJob.filter({ id: jobId });
  const job = jobs[0];
  
  if (!job) {
    throw new Error('Job not found');
  }

  if (!['queued', 'processing'].includes(job.status)) {
    throw new Error('Job cannot be cancelled in current state');
  }

  await base44.entities.BackgroundJob.update(jobId, {
    status: 'cancelled',
    completed_at: new Date().toISOString()
  });

  await logAuditEvent({
    organization_id: job.organization_id,
    actor_email: triggeredBy,
    action: 'update',
    resource_type: 'background_job',
    resource_id: jobId,
    resource_name: job.job_type,
    metadata: { action: 'cancelled' }
  });

  return { ...job, status: 'cancelled' };
}

function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizePayload(payload) {
  if (!payload) return {};
  const sanitized = { ...payload };
  const sensitiveKeys = ['password', 'secret', 'token', 'api_key', 'credentials'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}