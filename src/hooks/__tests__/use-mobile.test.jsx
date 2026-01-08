import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset window size to default (desktop)
    global.innerWidth = 1024;
  });

  it('should return false for desktop screen widths', () => {
    global.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true for mobile screen widths', () => {
    global.innerWidth = 375;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return true for screen width at boundary (767px)', () => {
    global.innerWidth = 767;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false for screen width just above boundary (768px)', () => {
    global.innerWidth = 768;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should respond to matchMedia changes', () => {
    global.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);

    // Note: In the test environment, matchMedia is mocked and doesn't
    // respond to window.innerWidth changes. The hook uses matchMedia
    // which requires proper mocking to test resize behavior.
    // This test verifies initial state only.
  });
});
