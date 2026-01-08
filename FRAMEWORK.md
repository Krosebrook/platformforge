# Framework and Technology Stack

## Overview

PlatformForge is built on modern web technologies with a focus on developer experience, performance, and scalability. This document describes the core technologies, libraries, and architectural patterns used in the project.

## Technology Stack

### Frontend Stack

#### Core Framework
- **React 18.2**: Modern UI library with concurrent features
  - Functional components with hooks
  - Concurrent rendering for better UX
  - Automatic batching for performance

#### Build Tool
- **Vite 6**: Next-generation frontend build tool
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Native ES modules
  - Plugin ecosystem

#### Language
- **JavaScript (ES2022+)**: Modern JavaScript features
- **JSDoc with TypeScript checking**: Type safety without full TypeScript
  - Type checking via `jsconfig.json`
  - IntelliSense support
  - Gradual typing approach

### Backend Stack

#### Platform
- **Base44**: Serverless backend platform
  - Managed authentication
  - Database with real-time sync
  - File storage
  - Server-side functions
  - API gateway

#### SDK
- **@base44/sdk (^0.8.3)**: Official Base44 JavaScript SDK
  - Database operations
  - Authentication
  - File management
  - Real-time subscriptions

### Styling

#### CSS Framework
- **Tailwind CSS (^3.4.17)**: Utility-first CSS framework
  - Responsive design utilities
  - Dark mode support
  - Custom design system
  - JIT (Just-In-Time) compilation

#### Additional Styling Tools
- **PostCSS (^8.5.3)**: CSS transformation
- **Autoprefixer (^10.4.20)**: Automatic vendor prefixing
- **tailwindcss-animate (^1.0.7)**: Animation utilities
- **tailwind-merge (^3.0.2)**: Intelligent class merging
- **class-variance-authority (^0.7.1)**: Component variants
- **clsx (^2.1.1)**: Conditional class names

### UI Component Library

#### Base Components
- **Radix UI**: Unstyled, accessible component primitives
  - Accordion, Alert Dialog, Avatar
  - Checkbox, Dialog, Dropdown Menu
  - Label, Popover, Radio Group
  - Select, Slider, Switch, Tabs
  - Toast, Tooltip, and more

#### Extended Components
- **Sonner (^2.0.1)**: Toast notifications
- **cmdk (^1.0.0)**: Command menu
- **vaul (^1.1.2)**: Drawer component
- **react-resizable-panels (^2.1.7)**: Resizable layouts

### State Management

#### Server State
- **TanStack Query (^5.84.1)**: Server state management
  - Data fetching and caching
  - Automatic refetching
  - Optimistic updates
  - Pagination and infinite queries

#### Client State
- **React Context**: Global client state
  - Theme management
  - User preferences
  - UI state

#### Form State
- **React Hook Form (^7.54.2)**: Form state management
  - Performant form handling
  - Built-in validation
  - Easy integration with UI libraries

### Routing

- **React Router DOM (^6.26.0)**: Client-side routing
  - Nested routes
  - Lazy loading
  - Route protection
  - Navigation guards

### Data Validation

- **Zod (^3.24.2)**: TypeScript-first schema validation
  - Runtime type checking
  - Form validation
  - API response validation
  - Error messages

### Utilities

#### Date Handling
- **date-fns (^3.6.0)**: Modern date utility library
- **moment (^2.30.1)**: Date manipulation (legacy support)
- **react-day-picker (^8.10.1)**: Date picker component

#### UI Utilities
- **Framer Motion (^11.16.4)**: Animation library
- **Lucide React (^0.475.0)**: Icon library
- **next-themes (^0.4.4)**: Theme management

#### Rich Content
- **React Quill (^2.0.0)**: Rich text editor
- **React Markdown (^9.0.1)**: Markdown rendering

#### Data Visualization
- **Recharts (^2.15.4)**: Composable charting library

#### Specialized Features
- **@hello-pangea/dnd (^17.0.0)**: Drag and drop
- **canvas-confetti (^1.9.4)**: Celebration effects
- **html2canvas (^1.4.1)**: Screenshot generation
- **jspdf (^2.5.2)**: PDF generation
- **react-leaflet (^4.2.1)**: Map components
- **three (^0.171.0)**: 3D graphics

#### General Utilities
- **lodash (^4.17.21)**: Utility functions
- **input-otp (^1.4.2)**: OTP input component

### Testing

#### Unit & Integration Testing
- **Vitest (^4.0.16)**: Fast unit test framework
  - Compatible with Jest API
  - Native ES modules
  - TypeScript support
  - Watch mode

#### Testing Utilities
- **@testing-library/react (^16.3.1)**: React testing utilities
- **@testing-library/user-event (^14.6.1)**: User interaction simulation
- **@testing-library/jest-dom (^6.9.1)**: Custom matchers
- **@vitest/ui (^4.0.16)**: Test UI dashboard
- **@vitest/coverage-v8 (^4.0.16)**: Code coverage

#### E2E Testing
- **Playwright (^1.57.0)**: End-to-end testing framework
  - Cross-browser testing
  - Visual regression testing
  - Test generation
  - Debug tools

### Development Tools

#### Linting
- **ESLint (^9.19.0)**: JavaScript linter
  - Custom rules configuration
  - React plugin
  - React Hooks plugin
  - Unused imports plugin

#### Type Checking
- **TypeScript (^5.8.2)**: Type checking via JSDoc

#### Package Management
- **npm**: Package manager
  - Lock file for consistency
  - Scripts for automation

## Architectural Patterns

### Component Architecture

#### Component Organization
```
src/
├── components/
│   ├── ui/           # Reusable UI primitives
│   ├── features/     # Feature-specific components
│   └── layouts/      # Layout components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Page components
└── services/         # API services
```

#### Component Patterns
1. **Presentation Components**: Pure UI components
2. **Container Components**: Logic and data fetching
3. **Custom Hooks**: Reusable logic extraction
4. **Compound Components**: Related components working together

### State Management Patterns

#### Server State (TanStack Query)
```javascript
// Query for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['customers'],
  queryFn: fetchCustomers
});

// Mutation for data updates
const mutation = useMutation({
  mutationFn: createCustomer,
  onSuccess: () => {
    queryClient.invalidateQueries(['customers']);
  }
});
```

#### Client State (Context)
```javascript
// Theme context
const { theme, setTheme } = useTheme();

// User preferences
const { preferences, updatePreferences } = usePreferences();
```

#### Form State (React Hook Form + Zod)
```javascript
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

### Data Flow Architecture

```
User Interaction → Component → Custom Hook → Base44 SDK → Backend
                      ↓
                 React Query Cache
                      ↓
                 Component Re-render
```

### API Integration Pattern

```javascript
// Service layer
export const customerService = {
  getAll: () => base44.database.collection('customers').find(),
  getById: (id) => base44.database.collection('customers').findOne(id),
  create: (data) => base44.database.collection('customers').insertOne(data),
  update: (id, data) => base44.database.collection('customers').updateOne(id, data),
  delete: (id) => base44.database.collection('customers').deleteOne(id)
};

// Hook layer
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAll
  });
};
```

### Styling Patterns

#### Tailwind Utility Classes
```jsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click Me
</button>
```

#### Component Variants with CVA
```javascript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        outline: "border border-input"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-8 text-lg"
      }
    }
  }
);
```

### Error Handling Patterns

#### Error Boundaries
```jsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

#### Query Error Handling
```javascript
const { data, error } = useQuery({
  queryKey: ['customers'],
  queryFn: fetchCustomers,
  onError: (error) => {
    toast.error(`Failed to load customers: ${error.message}`);
  }
});
```

## Configuration Files

### Vite Configuration (`vite.config.js`)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { base44 } from '@base44/vite-plugin';

export default defineConfig({
  plugins: [react(), base44()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### Tailwind Configuration (`tailwind.config.js`)
- Custom color palette
- Design tokens
- Plugin configuration
- Dark mode settings

### ESLint Configuration (`eslint.config.js`)
- React rules
- React Hooks rules
- Import optimization
- Unused imports removal

### TypeScript/JSDoc Configuration (`jsconfig.json`)
- Path aliases
- Type checking options
- Include/exclude patterns

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests in watch mode
npm test

# Run linter
npm run lint
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing Workflow
```bash
# Unit tests
npm run test:ci

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Best Practices

### Component Development
1. Use functional components with hooks
2. Extract complex logic into custom hooks
3. Keep components small and focused
4. Use TypeScript/JSDoc for prop types
5. Follow single responsibility principle

### State Management
1. Use React Query for server state
2. Minimize client state
3. Colocate state with components
4. Avoid prop drilling with Context
5. Optimize re-renders

### Styling
1. Use Tailwind utility classes
2. Extract repeated patterns into components
3. Use CVA for component variants
4. Maintain consistent spacing
5. Follow responsive-first approach

### Performance
1. Lazy load routes and components
2. Memoize expensive computations
3. Optimize images and assets
4. Use pagination for large lists
5. Implement virtual scrolling when needed

### Testing
1. Write tests for business logic
2. Test user interactions
3. Mock external dependencies
4. Aim for 80%+ coverage
5. Use E2E tests for critical flows

## Migration and Upgrade Strategy

### Dependency Updates
- Review changelogs before upgrading
- Test thoroughly after major updates
- Update dependencies incrementally
- Monitor for breaking changes

### Framework Migrations
- Plan migrations in phases
- Maintain backward compatibility
- Document migration steps
- Provide migration guides

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Base44 Documentation](https://base44.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query)

### Community
- GitHub Discussions
- Stack Overflow
- Discord/Slack channels

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*
