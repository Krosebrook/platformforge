import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Base44 SDK
vi.mock('@base44/sdk', () => {
  return {
    Base44Client: vi.fn(() => ({
      entities: {
        Customer: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
          delete: vi.fn(() => Promise.resolve(true)),
        },
        Job: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
          delete: vi.fn(() => Promise.resolve(true)),
        },
        Product: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
          delete: vi.fn(() => Promise.resolve(true)),
        },
        Organization: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
        },
        Workspace: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
        },
        OrganizationMember: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
        },
        AuditLog: {
          filter: vi.fn(() => Promise.resolve([])),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
        },
        ApprovalRequest: {
          filter: vi.fn(() => Promise.resolve([])),
          get: vi.fn(() => Promise.resolve(null)),
          create: vi.fn((data) => Promise.resolve({ id: 'test-id', ...data })),
          update: vi.fn((id, data) => Promise.resolve({ id, ...data })),
        },
      },
      auth: {
        getCurrentUser: vi.fn(() => Promise.resolve({
          id: 'test-user-id',
          email: 'test@example.com',
          full_name: 'Test User',
        })),
        signIn: vi.fn(() => Promise.resolve({ token: 'test-token' })),
        signOut: vi.fn(() => Promise.resolve()),
        signUp: vi.fn(() => Promise.resolve({ token: 'test-token' })),
      },
    })),
  };
});

// Mock environment variables
vi.stubEnv('VITE_BASE44_APP_ID', 'test_app_id_12345');
vi.stubEnv('VITE_BASE44_APP_BASE_URL', 'http://localhost:5000/mock-api');

// Mock window.matchMedia (for responsive design tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
