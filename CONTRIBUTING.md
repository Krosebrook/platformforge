# Contributing to PlatformForge

Thank you for your interest in contributing to PlatformForge! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Feature Development](#feature-development)
- [Bug Reports](#bug-reports)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Base44 account for backend testing
- Basic knowledge of React, Vite, and modern JavaScript

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/platformforge.git
   cd platformforge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Base44 credentials
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Verify Setup**
   - Open http://localhost:5173
   - Ensure the application loads without errors
   - Test authentication flow

### Project Structure

```
platformforge/
├── src/
│   ├── api/              # API client configuration
│   ├── components/       # Reusable React components
│   │   ├── common/       # Shared business components
│   │   └── ui/           # UI primitives (Radix UI wrappers)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page-level components
│   ├── utils/            # Helper functions
│   ├── App.jsx           # Main application component
│   ├── Layout.jsx        # Main layout wrapper
│   └── pages.config.js   # Route configuration
├── public/               # Static assets
├── .github/              # GitHub configuration
└── docs/                 # Additional documentation

```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with the following prefixes:

- `feature/` - New features (e.g., `feature/add-analytics-dashboard`)
- `fix/` - Bug fixes (e.g., `fix/customer-form-validation`)
- `docs/` - Documentation updates (e.g., `docs/improve-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-auth-logic`)
- `test/` - Test additions or improvements (e.g., `test/add-customer-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Development Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, readable code
   - Follow existing patterns and conventions
   - Add comments for complex logic

3. **Test Locally**
   ```bash
   npm run lint          # Check for linting errors
   npm run lint:fix      # Auto-fix linting issues
   npm run typecheck     # Verify JSDoc types
   npm run build         # Ensure production build works
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### JavaScript/React Style

1. **Use Modern JavaScript**
   - ES6+ syntax (arrow functions, destructuring, etc.)
   - Prefer `const` over `let`, avoid `var`
   - Use template literals for string interpolation

2. **React Best Practices**
   - Functional components with hooks
   - Proper dependency arrays for `useEffect`
   - Memoization with `useMemo` and `useCallback` when needed
   - Extract complex logic into custom hooks

3. **Component Structure**
   ```javascript
   // 1. Imports
   import React, { useState } from 'react';
   import { useQuery } from '@tanstack/react-query';
   
   // 2. Component definition
   export default function MyComponent({ prop1, prop2 }) {
     // 3. Hooks
     const [state, setState] = useState();
     const { data } = useQuery(...);
     
     // 4. Event handlers
     const handleClick = () => { ... };
     
     // 5. Effects
     useEffect(() => { ... }, []);
     
     // 6. Render
     return <div>...</div>;
   }
   ```

4. **Naming Conventions**
   - Components: PascalCase (e.g., `CustomerForm`)
   - Files: PascalCase for components, camelCase for utilities
   - Functions: camelCase (e.g., `handleSubmit`)
   - Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
   - Hooks: camelCase starting with `use` (e.g., `useTenant`)

5. **JSDoc Type Annotations**
   ```javascript
   /**
    * Fetches customer data from the API
    * @param {string} customerId - The customer ID
    * @param {Object} options - Query options
    * @returns {Promise<Customer>} The customer data
    */
   async function fetchCustomer(customerId, options) {
     // ...
   }
   ```

### Styling Guidelines

1. **Use Tailwind CSS**
   - Utility-first approach
   - Use existing design tokens
   - Responsive design with breakpoint prefixes

2. **Component Styling**
   - Use Radix UI primitives for accessibility
   - Leverage existing UI components from `src/components/ui`
   - Keep inline styles minimal

3. **Responsive Design**
   ```jsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
     {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
   </div>
   ```

### State Management

1. **React Query** for server state
   - All API calls should use `useQuery` or `useMutation`
   - Use consistent query keys: `['entity', orgId, workspaceId]`
   - Invalidate queries after mutations

2. **React Context** for global client state
   - Use `TenantContext` for organization/workspace state
   - Create new contexts sparingly

3. **Local State** for component-specific state
   - Use `useState` for simple state
   - Use `useReducer` for complex state logic

### Security Guidelines

1. **Never commit secrets**
   - Use environment variables
   - Add sensitive files to `.gitignore`

2. **Always validate inputs**
   - Use Zod schemas for form validation
   - Sanitize user inputs

3. **Use tenant boundaries**
   - Always use `buildFilter` from `useTenantBoundary`
   - Enforce organization/workspace isolation

4. **Audit logging**
   - Log all sensitive operations
   - Use `logAuditEvent` utility

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(customers): add bulk export functionality

Implement CSV export for customer data with filters.
Includes progress indicator and error handling.

Closes #123

---

fix(auth): resolve login redirect loop

Fixed issue where users were stuck in redirect loop
after logout. Now properly clears session state.

---

docs(readme): update installation instructions

Added troubleshooting section and clarified Base44 setup.
```

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **Review your changes**
   - Read through the diff
   - Remove debugging code and console.logs
   - Ensure no unintended changes

### PR Template

Use the following template for your PR description:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Added X functionality
- Updated Y component
- Fixed Z bug

## Testing
- Tested on Chrome, Firefox, Safari
- Verified responsive design
- Tested with different user roles

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Dependent changes merged
```

### Review Process

1. **Automated Checks**
   - Linting must pass
   - Build must succeed
   - No security vulnerabilities

2. **Code Review**
   - At least one approval required
   - Address all feedback
   - Resolve conversations

3. **Merge**
   - Squash and merge (for clean history)
   - Delete branch after merge

## Feature Development

For new features, use the [COPILOT_FEATURE_TEMPLATE.md](.github/COPILOT_FEATURE_TEMPLATE.md):

1. **Step 0: Context Scan**
   - Review existing patterns
   - Find reference implementations
   - Check CI/CD constraints

2. **Step 1: Plan**
   - List files to change
   - Define implementation strategy
   - Create test plan
   - Assess risks

3. **Step 2: Implement**
   - Follow code quality checklist
   - Implement security checks
   - Optimize performance

4. **Step 3: Document**
   - Update relevant docs
   - Add code comments
   - Update CHANGELOG.md

## Bug Reports

### Creating an Issue

Use this template for bug reports:

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
 - Browser: [e.g., Chrome 120]
 - Device: [e.g., Desktop, iPhone 12]
 - OS: [e.g., macOS, Windows]

**Additional context**
Any other relevant information
```

### Fixing Bugs

1. Create an issue first (unless trivial)
2. Reference the issue in your PR
3. Add regression test if applicable
4. Update CHANGELOG.md

## Documentation

### Types of Documentation

1. **README.md** - Getting started guide
2. **Code Comments** - Inline explanations
3. **JSDoc** - API documentation
4. **Architecture Docs** - System design
5. **Feature Docs** - Detailed feature guides

### Writing Good Documentation

- **Be clear and concise**
- **Use examples** liberally
- **Keep it updated** with code changes
- **Think like a beginner** when writing guides
- **Use proper formatting** (headers, lists, code blocks)

### Documentation PRs

Documentation-only PRs are welcome and appreciated! They follow the same process but don't require extensive testing.

## Questions?

If you have questions:

1. Check existing documentation
2. Search closed issues
3. Ask in discussions
4. Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

**Thank you for contributing to PlatformForge!** 🚀
