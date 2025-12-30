import { useTenant } from './TenantContext';

export function enforceTenantBoundary(data, tenantContext) {
  const { currentOrgId, currentWorkspaceId } = tenantContext;
  
  if (!currentOrgId) {
    throw new Error('No organization selected');
  }

  return {
    ...data,
    organization_id: currentOrgId,
    ...(currentWorkspaceId ? { workspace_id: currentWorkspaceId } : {})
  };
}

export function validateTenantAccess(record, tenantContext) {
  const { currentOrgId } = tenantContext;
  
  if (!record || !record.organization_id) {
    return false;
  }

  return record.organization_id === currentOrgId;
}

export function buildTenantFilter(baseFilter, tenantContext, options = {}) {
  const { currentOrgId, currentWorkspaceId } = tenantContext;
  const { includeWorkspace = true } = options;

  if (!currentOrgId) {
    throw new Error('No organization selected');
  }

  const filter = {
    ...baseFilter,
    organization_id: currentOrgId
  };

  if (includeWorkspace && currentWorkspaceId) {
    filter.workspace_id = currentWorkspaceId;
  }

  return filter;
}

export function useTenantBoundary() {
  const tenantContext = useTenant();

  return {
    enforce: (data) => enforceTenantBoundary(data, tenantContext),
    validate: (record) => validateTenantAccess(record, tenantContext),
    buildFilter: (baseFilter, options) => buildTenantFilter(baseFilter, tenantContext, options),
    orgId: tenantContext.currentOrgId,
    workspaceId: tenantContext.currentWorkspaceId
  };
}

export function sanitizeForDisplay(record, sensitiveFields = []) {
  if (!record) return null;
  
  const defaultSensitiveFields = [
    'password', 'secret', 'token', 'api_key', 'private_key',
    'webhook_secret', 'credentials'
  ];
  
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
  const sanitized = { ...record };

  for (const field of allSensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '••••••••';
    }
    
    if (sanitized.config && typeof sanitized.config === 'object') {
      for (const key of Object.keys(sanitized.config)) {
        if (allSensitiveFields.some(sf => key.toLowerCase().includes(sf))) {
          sanitized.config[key] = '••••••••';
        }
      }
    }
  }

  return sanitized;
}

export function validateInput(value, rules) {
  const errors = [];

  if (rules.required && !value) {
    errors.push('This field is required');
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }

  if (rules.maxLength && value && value.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
  }

  if (rules.pattern && value && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || 'Invalid format');
  }

  if (rules.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push('Invalid email format');
    }
  }

  if (rules.url && value) {
    try {
      new URL(value);
    } catch {
      errors.push('Invalid URL format');
    }
  }

  if (rules.custom && value) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

export function sanitizeHtml(input) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}