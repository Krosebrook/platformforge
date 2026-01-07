import { describe, it, expect } from 'vitest';
import { cn, isIframe } from '../utils';

describe('cn (className merge utility)', () => {
  it('should merge multiple class names', () => {
    const result = cn('foo', 'bar', 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // twMerge should keep only the last px- class
    expect(result).toBe('py-1 px-4');
  });

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle complex Tailwind merge scenarios', () => {
    const result = cn(
      'bg-red-500 hover:bg-blue-500',
      'bg-green-500'
    );
    // Should keep last bg color but preserve hover
    expect(result).toBe('hover:bg-blue-500 bg-green-500');
  });
});

describe('isIframe', () => {
  it('should return a boolean', () => {
    expect(typeof isIframe).toBe('boolean');
  });

  it('should return false when not in iframe (test environment)', () => {
    // In test environment, window.self === window.top
    expect(isIframe).toBe(false);
  });
});
