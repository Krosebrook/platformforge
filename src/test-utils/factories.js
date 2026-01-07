/**
 * Test data factories for generating mock entities
 */

let idCounter = 0;

export function generateId() {
  return `test-id-${++idCounter}`;
}

export function createMockOrganization(overrides = {}) {
  return {
    id: generateId(),
    name: 'Test Organization',
    plan: 'professional',
    status: 'active',
    settings: {},
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockWorkspace(overrides = {}) {
  return {
    id: generateId(),
    organization_id: 'test-org-id',
    name: 'Test Workspace',
    description: 'A test workspace',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    id: generateId(),
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    status: 'active',
    created_date: new Date().toISOString(),
    last_login: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCustomer(overrides = {}) {
  return {
    id: generateId(),
    organization_id: 'test-org-id',
    workspace_id: 'test-workspace-id',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+1234567890',
    company: 'Test Company',
    status: 'active',
    tier: 'standard',
    tags: [],
    metadata: {},
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockJob(overrides = {}) {
  return {
    id: generateId(),
    organization_id: 'test-org-id',
    workspace_id: 'test-workspace-id',
    customer_id: 'test-customer-id',
    title: 'Test Job',
    description: 'A test job description',
    reference_number: `JOB-${Date.now()}`,
    status: 'pending',
    priority: 'medium',
    assigned_to: 'test-user-id',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: null,
    value: 1000,
    metadata: {},
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockProduct(overrides = {}) {
  return {
    id: generateId(),
    organization_id: 'test-org-id',
    workspace_id: 'test-workspace-id',
    name: 'Test Product',
    sku: `SKU-${Date.now()}`,
    description: 'A test product',
    category: 'General',
    price: 99.99,
    cost: 50.00,
    status: 'active',
    inventory_count: 100,
    low_stock_threshold: 10,
    metadata: {},
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockArray(factory, count = 3, overrides = {}) {
  return Array.from({ length: count }, (_, index) =>
    factory({ ...overrides, name: `${overrides.name || 'Test'} ${index + 1}` })
  );
}

export function resetIdCounter() {
  idCounter = 0;
}
