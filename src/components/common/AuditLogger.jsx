import { base44 } from '@/api/base44Client';

export async function logAuditEvent({
  organization_id,
  workspace_id,
  actor_email,
  actor_role,
  action,
  resource_type,
  resource_id,
  resource_name,
  changes,
  metadata,
  status = 'success',
  error_message
}) {
  if (!organization_id || !actor_email || !action || !resource_type) {
    console.warn('Audit log missing required fields');
    return null;
  }

  try {
    const auditEntry = await base44.entities.AuditLog.create({
      organization_id,
      workspace_id,
      actor_email,
      actor_role,
      action,
      resource_type,
      resource_id,
      resource_name,
      changes,
      metadata: {
        ...metadata,
        correlation_id: generateCorrelationId(),
        timestamp: new Date().toISOString()
      },
      status,
      error_message
    });

    await base44.entities.Activity.create({
      organization_id,
      workspace_id,
      actor_email,
      action,
      description: generateActivityDescription(action, resource_type, resource_name),
      resource_type,
      resource_id,
      resource_name,
      metadata: { audit_log_id: auditEntry.id }
    });

    return auditEntry;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateActivityDescription(action, resourceType, resourceName) {
  const actionVerbs = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    view: 'viewed',
    export: 'exported',
    import: 'imported',
    login: 'logged in',
    logout: 'logged out',
    invite: 'invited',
    role_change: 'changed role of',
    approve: 'approved',
    reject: 'rejected',
    status_change: 'changed status of',
    assignment_change: 'reassigned',
    settings_change: 'updated settings for',
    integration_connect: 'connected integration',
    integration_disconnect: 'disconnected integration',
    api_key_create: 'created API key for',
    api_key_revoke: 'revoked API key for',
    impersonate: 'impersonated'
  };

  const verb = actionVerbs[action] || action;
  const name = resourceName ? `"${resourceName}"` : resourceType;
  return `${verb} ${name}`;
}

export function useAuditLogger() {
  return { logAuditEvent };
}

export async function getAuditTrail(organization_id, options = {}) {
  const {
    resource_type,
    resource_id,
    actor_email,
    action,
    limit = 50,
    skip = 0
  } = options;

  const filter = { organization_id };
  if (resource_type) filter.resource_type = resource_type;
  if (resource_id) filter.resource_id = resource_id;
  if (actor_email) filter.actor_email = actor_email;
  if (action) filter.action = action;

  return await base44.entities.AuditLog.filter(filter, '-created_date', limit, skip);
}