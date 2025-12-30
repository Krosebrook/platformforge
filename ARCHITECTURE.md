# PlatformForge Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Data Model](#data-model)
8. [Security Architecture](#security-architecture)
9. [Scalability & Performance](#scalability--performance)
10. [Deployment Architecture](#deployment-architecture)
11. [Integration Architecture](#integration-architecture)
12. [Future Architecture Considerations](#future-architecture-considerations)

## System Overview

PlatformForge is a modern, multi-tenant B2B SaaS platform designed to streamline business operations through customer relationship management, job/order tracking, product management, and team collaboration.

### Key Characteristics

- **Multi-tenant**: Organization and workspace-level data isolation
- **Serverless**: Built on Base44 serverless platform
- **Real-time**: Live data synchronization via React Query
- **Scalable**: Horizontal scaling via serverless architecture
- **Secure**: Role-based access control with comprehensive audit logging

### Core Capabilities

1. **Customer Relationship Management (CRM)**
2. **Job/Order Management**
3. **Product Catalog & Inventory**
4. **Team Collaboration**
5. **Approval Workflows**
6. **Audit Logging & Compliance**
7. **System Health Monitoring**

## Architecture Principles

### 1. Separation of Concerns

- **Presentation Layer**: React components focused on UI
- **Business Logic Layer**: Custom hooks and utilities
- **Data Access Layer**: Base44 SDK client
- **State Management**: React Query for server state, Context for client state

### 2. Component-Based Design

- Atomic design methodology
- Reusable UI primitives (Radix UI)
- Domain-specific composite components
- Page-level orchestration components

### 3. Multi-Tenancy

- **Organization Level**: Top-level tenant boundary
- **Workspace Level**: Secondary isolation within organizations
- **Row-Level Security**: All queries filtered by tenant context
- **Permission-Based Access**: Role-based authorization

### 4. Progressive Enhancement

- Mobile-first responsive design
- Graceful degradation for older browsers
- Optimistic UI updates with fallback
- Client-side caching with server synchronization

### 5. Security by Design

- Authentication at the edge (Base44)
- Authorization at every API call
- Input validation (client and server)
- Comprehensive audit trails
- No sensitive data in client-side code

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **Vite** | 6.1.0 | Build tool and dev server |
| **React Router** | 6.26.0 | Client-side routing |
| **TanStack Query** | 5.84.1 | Server state management |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **Radix UI** | Latest | Accessible component primitives |
| **React Hook Form** | 7.54.2 | Form state management |
| **Zod** | 3.24.2 | Schema validation |
| **Lucide React** | 0.475.0 | Icon library |
| **date-fns** | 3.6.0 | Date manipulation |

### Backend & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Base44 SDK** | 0.8.3 | Serverless backend platform |
| **Base44 Vite Plugin** | 0.2.14 | Development integration |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and style enforcement |
| **TypeScript (via JSDoc)** | Type safety without compilation |
| **PostCSS** | CSS processing |
| **Autoprefixer** | CSS vendor prefixing |

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        End Users                             │
│                   (Web Browsers)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CDN / Edge Network                          │
│              (Static Asset Delivery)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  React SPA                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Presentation Layer                       │  │
│  │  • Pages    • Components    • UI Library             │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │              Application Layer                        │  │
│  │  • Hooks    • Utilities    • State Management        │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │           Data Access Layer                           │  │
│  │  • Base44 SDK    • React Query    • Caching          │  │
│  └──────────────────┬───────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────┘
                     │
                     │ API Calls (REST/GraphQL)
                     │ Authentication (JWT)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Base44 Platform                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Authentication Service                      │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │           Authorization Service                       │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │           Serverless Functions                        │  │
│  │  • Business Logic    • Validation    • Workflows     │  │
│  └──────────────────┬───────────────────────────────────┘  │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │           Database Layer (NoSQL/SQL)                  │  │
│  │  • Multi-tenant data    • Indexes    • Backups       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App.jsx (Root)
  │
  ├── AuthProvider (Authentication context)
  │    │
  │    └── QueryClientProvider (React Query)
  │         │
  │         └── Router (React Router)
  │              │
  │              └── Layout.jsx (Main layout wrapper)
  │                   │
  │                   ├── TenantProvider (Multi-tenancy)
  │                   │
  │                   ├── Sidebar Navigation
  │                   │
  │                   ├── Header (Search, Notifications, User menu)
  │                   │
  │                   └── Main Content Area
  │                        │
  │                        └── Page Components
  │                             ├── Dashboard
  │                             ├── Customers
  │                             ├── Jobs
  │                             ├── Products
  │                             ├── Team
  │                             └── Settings
```

### State Management Strategy

#### 1. Server State (React Query)

All server data is managed through TanStack Query:

```javascript
// Query Keys follow this pattern:
const queryKey = ['entityType', organizationId, workspaceId, ...filters];

// Example:
const { data: customers } = useQuery({
  queryKey: ['customers', currentOrgId, currentWorkspaceId],
  queryFn: () => base44.entities.Customer.filter(filter)
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication
- Automatic retries

#### 2. Global Client State (React Context)

- **AuthContext**: User authentication state
- **TenantContext**: Organization/workspace context
- **GlobalSearchContext**: Search modal state

#### 3. Local Component State (useState/useReducer)

- Form inputs
- UI toggles (modals, dropdowns)
- Temporary selections
- Validation errors

### Routing Architecture

```javascript
// Configuration-based routing (pages.config.js)
const pagesConfig = {
  mainPage: "Dashboard",
  Pages: {
    Dashboard,
    Customers,
    Jobs,
    Products,
    // ... more pages
  },
  Layout: MainLayout
};

// Automatic route generation:
// "/" -> Dashboard
// "/Customers" -> Customers page
// "/Jobs" -> Jobs page
```

### Form Handling Pattern

All forms use React Hook Form + Zod validation:

```javascript
// 1. Define schema
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email")
});

// 2. Initialize form
const form = useForm({
  resolver: zodResolver(customerSchema)
});

// 3. Handle submission
const mutation = useMutation({
  mutationFn: (data) => base44.entities.Customer.create(data),
  onSuccess: () => queryClient.invalidateQueries(['customers'])
});
```

## Backend Architecture

### Base44 Platform Overview

Base44 provides a serverless backend-as-a-service (BaaS) with:

- **Entity Management**: CRUD operations on defined entities
- **Authentication**: Built-in user management
- **Authorization**: Role-based access control
- **File Storage**: Asset management
- **Serverless Functions**: Custom business logic
- **Real-time Subscriptions**: WebSocket support (planned)

### Entity System

Entities are defined in Base44 and accessed via SDK:

```javascript
// Entity access pattern
const customers = await base44.entities.Customer.filter({
  organization_id: currentOrgId,
  status: 'active'
}, '-created_date', 100);

// Entities automatically include:
// - id (unique identifier)
// - created_date (timestamp)
// - updated_date (timestamp)
// - created_by (user reference)
// - updated_by (user reference)
```

### Multi-Tenancy Implementation

```javascript
// Tenant boundary enforcement
const { buildFilter, enforce } = useTenantBoundary();

// Automatically adds organization_id and workspace_id
const filter = buildFilter({ status: 'active' });
// Result: { organization_id: "...", workspace_id: "...", status: "active" }

// Enforce tenant context on create/update
const customerData = enforce({ name: "New Customer" });
// Adds organization_id and workspace_id automatically
```

### API Communication Flow

```
Client Component
      ↓
React Query Hook
      ↓
Base44 SDK Client
      ↓
API Request (REST/GraphQL)
      ↓
Base44 Platform
      ↓
Authentication Check
      ↓
Authorization Check
      ↓
Business Logic Execution
      ↓
Database Query
      ↓
Response + Cache Headers
      ↓
Client (React Query Cache)
      ↓
UI Update
```

## Data Model

### Core Entities

#### 1. Organization

```javascript
{
  id: string,
  name: string,
  plan: 'free' | 'starter' | 'professional' | 'enterprise',
  status: 'active' | 'suspended' | 'cancelled',
  settings: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 2. Workspace

```javascript
{
  id: string,
  organization_id: string,
  name: string,
  description: string,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 3. User

```javascript
{
  id: string,
  email: string,
  full_name: string,
  avatar_url: string,
  status: 'active' | 'inactive',
  created_date: timestamp,
  last_login: timestamp
}
```

#### 4. OrganizationMember

```javascript
{
  id: string,
  organization_id: string,
  user_id: string,
  role: 'admin' | 'editor' | 'viewer',
  permissions: string[],
  invited_by: string,
  joined_date: timestamp
}
```

#### 5. Customer

```javascript
{
  id: string,
  organization_id: string,
  workspace_id: string,
  name: string,
  email: string,
  phone: string,
  company: string,
  status: 'active' | 'inactive',
  tier: 'standard' | 'premium' | 'enterprise',
  tags: string[],
  metadata: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 6. Job

```javascript
{
  id: string,
  organization_id: string,
  workspace_id: string,
  customer_id: string,
  title: string,
  description: string,
  reference_number: string,
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  assigned_to: string,
  due_date: timestamp,
  completed_at: timestamp,
  value: number,
  metadata: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 7. Product

```javascript
{
  id: string,
  organization_id: string,
  workspace_id: string,
  name: string,
  sku: string,
  description: string,
  category: string,
  price: number,
  cost: number,
  status: 'active' | 'inactive' | 'discontinued',
  inventory_count: number,
  low_stock_threshold: number,
  metadata: object,
  created_date: timestamp,
  updated_date: timestamp
}
```

#### 8. AuditLog

```javascript
{
  id: string,
  organization_id: string,
  workspace_id: string,
  actor_email: string,
  actor_role: string,
  action: 'create' | 'update' | 'delete' | 'view' | 'export',
  resource_type: string,
  resource_id: string,
  resource_name: string,
  metadata: object,
  ip_address: string,
  user_agent: string,
  created_date: timestamp
}
```

#### 9. ApprovalRequest

```javascript
{
  id: string,
  organization_id: string,
  requester_id: string,
  requester_email: string,
  request_type: 'role_change' | 'delete_entity' | 'export_data',
  status: 'pending' | 'approved' | 'rejected',
  resource_type: string,
  resource_id: string,
  justification: string,
  approved_by: string,
  reviewed_date: timestamp,
  created_date: timestamp
}
```

### Entity Relationships

```
Organization (1) ──< (N) Workspace
Organization (1) ──< (N) OrganizationMember
Organization (1) ──< (N) Customer
Organization (1) ──< (N) Job
Organization (1) ──< (N) Product
Organization (1) ──< (N) AuditLog
Organization (1) ──< (N) ApprovalRequest

Workspace (1) ──< (N) Customer
Workspace (1) ──< (N) Job
Workspace (1) ──< (N) Product

Customer (1) ──< (N) Job

User (1) ──< (N) OrganizationMember
User (1) ──< (N) Job (assigned_to)
```

## Security Architecture

### Authentication Flow

```
1. User accesses application
   ↓
2. Redirect to Base44 login page
   ↓
3. User provides credentials
   ↓
4. Base44 validates credentials
   ↓
5. JWT token issued with claims
   ↓
6. Redirect back to app with token
   ↓
7. Token stored securely (httpOnly cookie)
   ↓
8. Token included in all API requests
   ↓
9. Token validated on every request
```

### Authorization Model

#### Roles

- **Admin**: Full access to organization
- **Editor**: Can create and modify entities
- **Viewer**: Read-only access

#### Permissions

```javascript
const PERMISSIONS = {
  // Customer permissions
  'customers.view': ['admin', 'editor', 'viewer'],
  'customers.create': ['admin', 'editor'],
  'customers.update': ['admin', 'editor'],
  'customers.delete': ['admin'],
  
  // Job permissions
  'jobs.view': ['admin', 'editor', 'viewer'],
  'jobs.create': ['admin', 'editor'],
  'jobs.update': ['admin', 'editor'],
  'jobs.delete': ['admin'],
  
  // Organization permissions
  'organization.manage_settings': ['admin'],
  'organization.manage_members': ['admin'],
  'organization.manage_billing': ['admin'],
};
```

#### Permission Checking

```javascript
// In components
<RequireEditor>
  <Button onClick={handleDelete}>Delete</Button>
</RequireEditor>

// In code
if (!tenant.hasPermission('customers.delete')) {
  toast.error('Insufficient permissions');
  return;
}
```

### Data Security

1. **Row-Level Security**: All queries automatically filtered by tenant context
2. **Input Validation**: Zod schemas on client, Base44 validation on server
3. **Output Sanitization**: No raw HTML rendering, React escapes by default
4. **Audit Logging**: All sensitive operations logged
5. **HTTPS Only**: All traffic encrypted in transit
6. **Secure Headers**: CSP, HSTS, X-Frame-Options

## Scalability & Performance

### Frontend Performance

1. **Code Splitting**
   - Route-based lazy loading
   - Dynamic imports for heavy components
   - Vite automatic chunking

2. **Caching Strategy**
   - React Query cache (5 minutes default)
   - Browser cache for static assets
   - Service worker (future)

3. **Optimizations**
   - Memoization with useMemo/useCallback
   - Virtual scrolling for large lists (future)
   - Image lazy loading
   - Debounced search inputs

### Backend Scalability

1. **Serverless Architecture**
   - Auto-scaling based on demand
   - Pay-per-use model
   - No server management

2. **Database Optimization**
   - Indexed queries on common filters
   - Composite indexes for multi-field queries
   - Pagination for large datasets

3. **Caching**
   - CDN for static assets
   - API response caching
   - Client-side query cache

## Deployment Architecture

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Lint code
npm run lint

# 3. Type check
npm run typecheck

# 4. Build production bundle
npm run build
# Output: dist/ directory

# 5. Deploy to CDN/hosting
```

### Environment Configuration

```bash
# Development
VITE_BASE44_APP_ID=dev_app_id
VITE_BASE44_APP_BASE_URL=https://dev.base44.app

# Staging
VITE_BASE44_APP_ID=staging_app_id
VITE_BASE44_APP_BASE_URL=https://staging.base44.app

# Production
VITE_BASE44_APP_ID=prod_app_id
VITE_BASE44_APP_BASE_URL=https://api.platformforge.com
```

### Deployment Targets

- **Static Site Hosting**: Vercel, Netlify, AWS S3 + CloudFront
- **Container**: Docker + Kubernetes (if needed)
- **Edge**: Cloudflare Pages, AWS CloudFront Functions

## Integration Architecture

### Current Integrations

1. **Base44 Platform** (Core backend)
2. **Stripe** (Payment processing - frontend only)
3. **Lucide Icons** (Icon library)

### Integration Patterns

```javascript
// Future integration pattern
const integration = {
  id: 'stripe',
  name: 'Stripe',
  type: 'payment',
  config: {
    apiKey: encrypted,
    webhookSecret: encrypted
  },
  status: 'active'
};
```

### Webhook Architecture (Planned)

```
External Service
      ↓
Webhook POST /api/webhooks/{integration}
      ↓
Base44 Serverless Function
      ↓
Validate Signature
      ↓
Process Event
      ↓
Update Database
      ↓
Trigger Internal Events
      ↓
Notify Users (if applicable)
```

## Future Architecture Considerations

### 1. Microservices Migration (if needed)

- Extract heavy operations to separate services
- Message queue for async processing
- Event-driven architecture

### 2. Real-Time Features

- WebSocket connections via Base44
- Live collaborative editing
- Real-time notifications
- Presence indicators

### 3. Advanced Caching

- Redis for session management
- Edge caching for API responses
- GraphQL with Apollo Client

### 4. Mobile Applications

- React Native for iOS/Android
- Shared business logic
- Platform-specific UI

### 5. Internationalization (i18n)

- Multi-language support
- RTL language support
- Locale-specific formatting

### 6. Advanced Analytics

- Time-series data for metrics
- Data warehouse for reporting
- Business intelligence integration

### 7. AI/ML Features

- Predictive analytics
- Automated data entry
- Smart recommendations
- Natural language search

---

**Document Version**: 1.0  
**Last Updated**: January 1, 2025  
**Maintained By**: PlatformForge Team
