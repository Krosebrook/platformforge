# Base44 App

To work with the frontend environment locally, create an `.env.local` file with the following variables:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

e.g.

```
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

and then run `npm run dev` to start the development server.

## Testing

PlatformForge uses a comprehensive testing infrastructure to ensure code quality and reliability.

### Running Tests

```bash
# Run unit and integration tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:ci

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Structure

- **Unit Tests**: Test individual functions, hooks, and utilities
  - Location: `src/**/__tests__/*.test.{js,jsx}`
  - Framework: Vitest + Testing Library
  
- **Integration Tests**: Test component interactions and workflows
  - Location: `src/**/__tests__/*.test.{js,jsx}`
  - Framework: Vitest + Testing Library + React Testing Library

- **E2E Tests**: Test complete user flows
  - Location: `e2e/*.spec.js`
  - Framework: Playwright

### Writing Tests

See [docs/TESTING.md](docs/TESTING.md) for detailed testing guidelines.

### Coverage

The project maintains 80%+ test coverage for critical business logic. Coverage reports are generated automatically when running `npm run test:coverage`.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checking
npm run typecheck
```
