import { describe, it, expect } from 'vitest';
import { createPageUrl } from '../index';

describe('createPageUrl', () => {
  it('should create URL with forward slash prefix', () => {
    const result = createPageUrl('Dashboard');
    expect(result).toBe('/Dashboard');
  });

  it('should replace spaces with hyphens', () => {
    const result = createPageUrl('My Page Name');
    expect(result).toBe('/My-Page-Name');
  });

  it('should handle multiple spaces', () => {
    const result = createPageUrl('Page  With  Multiple  Spaces');
    expect(result).toBe('/Page--With--Multiple--Spaces');
  });

  it('should handle single word', () => {
    const result = createPageUrl('Customers');
    expect(result).toBe('/Customers');
  });

  it('should handle empty string', () => {
    const result = createPageUrl('');
    expect(result).toBe('/');
  });

  it('should handle page names with leading/trailing spaces', () => {
    const result = createPageUrl(' My Page ');
    expect(result).toBe('/-My-Page-');
  });

  it('should handle common page names', () => {
    expect(createPageUrl('Dashboard')).toBe('/Dashboard');
    expect(createPageUrl('Customers')).toBe('/Customers');
    expect(createPageUrl('Jobs')).toBe('/Jobs');
    expect(createPageUrl('Products')).toBe('/Products');
    expect(createPageUrl('Team Members')).toBe('/Team-Members');
  });
});
