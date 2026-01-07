import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateId,
  createMockOrganization,
  createMockCustomer,
  createMockJob,
  createMockProduct,
  createMockArray,
  resetIdCounter,
} from '../factories';

describe('Test Factories', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('createMockOrganization', () => {
    it('should create a valid organization', () => {
      const org = createMockOrganization();
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org.status).toBe('active');
    });

    it('should allow overrides', () => {
      const org = createMockOrganization({ name: 'Custom Org' });
      expect(org.name).toBe('Custom Org');
    });
  });

  describe('createMockCustomer', () => {
    it('should create a valid customer', () => {
      const customer = createMockCustomer();
      expect(customer).toHaveProperty('id');
      expect(customer.status).toBe('active');
    });
  });

  describe('createMockJob', () => {
    it('should create a valid job', () => {
      const job = createMockJob();
      expect(job).toHaveProperty('id');
      expect(job.status).toBe('pending');
    });
  });

  describe('createMockProduct', () => {
    it('should create a valid product', () => {
      const product = createMockProduct();
      expect(product).toHaveProperty('id');
      expect(product.price).toBeGreaterThan(0);
    });
  });

  describe('createMockArray', () => {
    it('should create an array of entities', () => {
      const customers = createMockArray(createMockCustomer, 5);
      expect(customers).toHaveLength(5);
    });
  });
});
