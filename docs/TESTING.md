# Testing Guide

This document provides comprehensive guidelines for testing in PlatformForge.

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Writing Unit Tests](#writing-unit-tests)
4. [Writing Integration Tests](#writing-integration-tests)
5. [Writing E2E Tests](#writing-e2e-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

PlatformForge uses a multi-layered testing approach:

- **Unit Tests**: Test individual functions, hooks, and utilities in isolation
- **Integration Tests**: Test component interactions and data flows
- **E2E Tests**: Test complete user workflows in a browser environment

### Test Stack

- **Vitest**: Fast unit test runner with Vite integration
- **Testing Library**: React component testing utilities
- **Playwright**: Cross-browser E2E testing framework

### Coverage Goals

- **Overall**: 80%+ coverage
- **Critical paths**: 100% coverage (auth, payments, data mutations)
- **UI components**: 70%+ coverage
- **Utilities**: 100% coverage

## Test Infrastructure

### Configuration Files

- `vitest.config.js` - Vitest configuration
- `playwright.config.js` - Playwright configuration
- `.env.test` - Test environment variables

### Test Utilities

- `src/test-utils/setup.js` - Global test setup and mocks
- `src/test-utils/test-utils.jsx` - Custom render function with providers
- `src/test-utils/factories.js` - Test data factories

### Running Tests

```bash
# Unit/Integration tests
npm test                    # Watch mode
npm run test:ci             # Single run
npm run test:coverage       # With coverage
npm run test:ui             # Interactive UI

# E2E tests
npm run test:e2e            # Headless
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:codegen    # Generate tests
```

## Writing Unit Tests

Unit tests focus on individual functions and hooks in isolation.

### Example: Testing a Utility Function

```javascript
// src/lib/__tests__/utils.test.js
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });
});
```

### Example: Testing a Custom Hook

```javascript
// src/hooks/__tests__/use-mobile.test.jsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  it('should return false for desktop', () => {
    global.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
```

### Testing Patterns

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the code under test
3. **Assert**: Verify the expected outcome

## Writing Integration Tests

Integration tests verify that components work correctly with their dependencies.

### Example: Testing a React Component

```javascript
// src/components/ui/__tests__/button.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils/test-utils';
import { Button } from '../button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Custom Render Function

Use the custom `render` function from `test-utils` to wrap components with providers:

```javascript
import { render } from '@/test-utils/test-utils';

// Automatically wraps with:
// - QueryClientProvider
// - MemoryRouter
// - Toaster
render(<YourComponent />);
```

### Mocking Base44 SDK

The Base44 SDK is automatically mocked in `setup.js`. To customize:

```javascript
import { vi } from 'vitest';

// Override mock for specific test
vi.mocked(base44.entities.Customer.filter).mockResolvedValueOnce([
  { id: '1', name: 'Test Customer' }
]);
```

### Testing with Test Data

Use factories to create consistent test data:

```javascript
import { createMockCustomer, createMockArray } from '@/test-utils/factories';

const customer = createMockCustomer({ name: 'Custom Name' });
const customers = createMockArray(createMockCustomer, 5);
```

## Writing E2E Tests

E2E tests verify complete user workflows in a real browser.

### Example: Basic E2E Test

```javascript
// e2e/smoke.spec.js
import { test, expect } from '@playwright/test';

test('should load application', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/PlatformForge/);
});
```

### Example: User Flow Test

```javascript
// e2e/customer-flow.spec.js
import { test, expect } from '@playwright/test';

test('should create a customer', async ({ page }) => {
  // Navigate to customers page
  await page.goto('/Customers');
  
  // Click create button
  await page.click('text=New Customer');
  
  // Fill form
  await page.fill('input[name="name"]', 'Test Customer');
  await page.fill('input[name="email"]', 'test@example.com');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('text=Customer created')).toBeVisible();
});
```

### E2E Best Practices

1. **Use data-testid**: Add `data-testid` attributes for stable selectors
2. **Wait for actions**: Use `waitFor` instead of fixed timeouts
3. **Clean up**: Ensure tests clean up created data
4. **Isolate tests**: Each test should be independent

## Best Practices

### General

- **Test behavior, not implementation**: Focus on what users see/do
- **Write descriptive test names**: `it('should show error when email is invalid')`
- **Keep tests focused**: One concept per test
- **Avoid test interdependence**: Tests should run in any order

### Component Testing

- **Test user interactions**: Clicks, typing, form submissions
- **Test accessibility**: Use `getByRole` over `getByTestId`
- **Test error states**: Verify error messages and validation
- **Test loading states**: Mock async operations

### Mocking

- **Mock at boundaries**: Mock external services, not internal functions
- **Prefer stubs over spies**: Use `vi.fn()` with return values
- **Reset mocks**: Use `beforeEach` to reset state

### Coverage

- **Don't aim for 100%**: Focus on critical paths
- **Ignore boilerplate**: Config files, types, simple getters
- **Review uncovered lines**: Decide if they need tests

### Performance

- **Keep tests fast**: Unit tests should run in milliseconds
- **Parallelize when possible**: Vitest runs tests in parallel by default
- **Use beforeAll sparingly**: Can cause test interdependence

## Troubleshooting

### Common Issues

#### "Cannot find module '@/...'"

The `@` alias is configured in `vite.config.js`. Ensure your test imports use the full path or the alias correctly.

#### "window is not defined"

Some code may assume browser APIs. Mock them in `setup.js` or use `vi.stubGlobal()`.

#### "React Query tests are flaky"

Ensure you're using the test QueryClient with disabled retries:

```javascript
import { createTestQueryClient } from '@/test-utils/test-utils';
```

#### "E2E tests fail locally but pass in CI"

Check environment variables. E2E tests may need mock credentials set in `.env.test`.

### Debugging Tests

```bash
# Run specific test file
npm test -- button.test.jsx

# Run tests matching pattern
npm test -- --grep "Button"

# Run with debugging
npm test -- --inspect-brk

# Open Playwright inspector
npm run test:e2e:ui
```

### Getting Help

- Check the [Vitest docs](https://vitest.dev/)
- Check the [Testing Library docs](https://testing-library.com/)
- Check the [Playwright docs](https://playwright.dev/)

## Continuous Integration

Tests run automatically on every PR via GitHub Actions. See `.github/workflows/ci.yml`.

### CI Workflow

1. **Lint**: Code style checks
2. **Type Check**: TypeScript validation
3. **Unit Tests**: Fast feedback
4. **Coverage**: Enforce 80% threshold
5. **E2E Tests**: Critical path verification
6. **Build**: Production build validation

### Coverage Enforcement

CI fails if coverage drops below 80%. To disable temporarily (not recommended):

```javascript
// vitest.config.js
coverage: {
  thresholds: {
    lines: 0, // Temporarily disable
  }
}
```

## Next Steps

1. Run `npm test` to verify tests work
2. Add tests for new features before implementation (TDD)
3. Review coverage reports: `npm run test:coverage`
4. Write E2E tests for critical user flows

---

**Version**: 1.0  
**Last Updated**: January 7, 2025
