import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Book, Search, Code, Database, Shield, Server,
  Users, Settings, Zap, FileText, ChevronRight,
  ExternalLink, Copy, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DOCS_SECTIONS = {
  overview: {
    title: 'Platform Overview',
    icon: Book,
    content: `
# Platform Overview

Welcome to the enterprise multi-tenant SaaS platform. This documentation covers all aspects of platform usage, architecture, and operations.

## Key Features

- **Multi-tenant Architecture**: Complete tenant isolation with organization and workspace boundaries
- **Role-Based Access Control**: Granular permissions with Owner, Admin, Editor, and Viewer roles
- **Workflow Engine**: Customizable status pipelines with SLA tracking
- **Approval Workflows**: Configurable approval gates for sensitive operations
- **Audit Logging**: Comprehensive activity tracking for compliance
- **Background Jobs**: Reliable async processing with retry logic
- **Integrations**: Connect external services via OAuth or API keys

## Getting Started

1. Create your organization during onboarding
2. Invite team members and assign roles
3. Set up your first workspace
4. Configure integrations as needed
5. Start creating customers, jobs, and products
    `
  },
  architecture: {
    title: 'Architecture',
    icon: Server,
    content: `
# Architecture

## System Components

### Frontend Layer
- React-based SPA with TailwindCSS
- Real-time updates via polling
- Responsive design for all devices

### Backend Services
- RESTful API endpoints
- Entity-based data model
- Background job processing
- Integration connectors

### Data Layer
- Multi-tenant data isolation
- Automatic tenant_id scoping
- Audit trail for all mutations

## Module Boundaries

\`\`\`
/components
  /common      - Shared utilities (TenantContext, AuditLogger, etc.)
  /ui          - Reusable UI components
/pages         - Route-level components
/entities      - Data schema definitions
/functions     - Backend functions
\`\`\`

## Data Flow

1. User action triggers API call
2. TenantBoundary enforces organization_id
3. PermissionGate validates access
4. Entity operation executed
5. AuditLog entry created
6. Activity feed updated
    `
  },
  dataModel: {
    title: 'Data Model',
    icon: Database,
    content: `
# Data Model

## Core Entities

### Organization
- Top-level tenant boundary
- Contains settings, plan info, billing
- Has many Workspaces and Memberships

### Workspace
- Sub-division within Organization
- Optional additional data isolation
- Belongs to one Organization

### Membership
- Links Users to Organizations
- Defines role (owner/admin/editor/viewer)
- Tracks invite and activity status

### Customer
- Client/contact records
- Scoped to Organization + optional Workspace
- Supports custom fields and tags

### Job
- Work orders/tasks
- Workflow status tracking
- Links to Customer and Products

### Product
- Catalog items
- Inventory tracking
- Pricing and cost data

## Supporting Entities

### AuditLog
- Immutable activity records
- Actor, action, resource tracking
- Change diff storage

### ApprovalRequest
- Pending approval workflow items
- Linked to any resource type
- Approver tracking

### BackgroundJob
- Async processing queue
- Retry with backoff
- Dead letter handling

### Integration
- External service connections
- OAuth and API key support
- Webhook configuration

## Tenancy Rules

All entities (except FeatureFlag, SystemHealth) require:
- \`organization_id\` - mandatory tenant boundary
- \`workspace_id\` - optional sub-tenant boundary

All queries are automatically scoped via TenantBoundary utilities.
    `
  },
  security: {
    title: 'Security',
    icon: Shield,
    content: `
# Security

## Authentication

- Session-based authentication via Base44 platform
- Automatic login redirect for unauthenticated users
- Logout clears all session data

## Authorization

### Role Hierarchy
1. **Owner**: Full access including billing and deletion
2. **Admin**: Manage members, settings, approvals
3. **Editor**: Create/update content and export
4. **Viewer**: Read-only access

### Permission Checks
- PermissionGate component for UI gating
- useTenant().hasPermission() for logic checks
- Backend validation via TenantBoundary

## Multi-Tenancy

### Data Isolation
- All queries include organization_id filter
- enforceTenantBoundary() adds org_id to mutations
- validateTenantAccess() checks record ownership

### Cross-Tenant Prevention
- No listing without organization context
- Resource IDs alone cannot access data
- Audit logging for all cross-boundary attempts

## Sensitive Data Handling

### Secrets
- Never logged or displayed in UI
- Masked in audit logs
- Stored encrypted at rest

### Input Validation
- validateInput() utility for common patterns
- XSS prevention via sanitizeHtml()
- URL and email format validation

## Audit Trail

All sensitive actions are logged:
- Create, Update, Delete operations
- Role changes and invites
- Approval decisions
- Integration connections
- Settings modifications
    `
  },
  operations: {
    title: 'Operations',
    icon: Settings,
    content: `
# Operations

## Runbooks

### High Error Rate
1. Check System Health page for affected services
2. Review recent errors in Audit Log
3. Check Background Job queue for failures
4. Verify integration connectivity
5. Escalate if unresolved after 15 minutes

### Failed Background Jobs
1. Navigate to System Health > Job Queue
2. Identify failed/dead-letter jobs
3. Review error messages
4. Retry or manually process as needed
5. Monitor for recurrence

### Member Access Issues
1. Verify membership exists and is active
2. Check assigned role permissions
3. Verify organization subscription status
4. Review audit log for recent changes

## Monitoring

### Key Metrics
- API response time (target: <200ms)
- Error rate (target: <1%)
- Job queue depth (alert: >100)
- Active user sessions

### Health Checks
- Database connectivity
- API availability
- Job processor status
- Integration health

## Data Management

### Retention Policies
- Audit logs: Configurable per org (default 90 days)
- Deleted records: 30-day soft delete
- Background jobs: 7 days completed, 30 days failed

### Export
- CSV export from Audit Log
- JSON export from Settings
- Scheduled exports via Background Jobs

### Deletion
- Soft delete with approval workflow
- Permanent deletion after retention period
- Cascading deletes for related records
    `
  },
  api: {
    title: 'API Reference',
    icon: Code,
    content: `
# API Reference

## Authentication

All API requests require authentication via the Base44 SDK:

\`\`\`javascript
import { base44 } from '@/api/base44Client';

// Check authentication
const user = await base44.auth.me();

// Logout
base44.auth.logout();
\`\`\`

## Entities SDK

### List Records

\`\`\`javascript
// List all (filtered by tenant)
const items = await base44.entities.Customer.list();

// With sorting and limit
const recent = await base44.entities.Customer.list('-created_date', 10);

// With filtering
const active = await base44.entities.Customer.filter(
  { status: 'active' },
  '-created_date',
  20
);
\`\`\`

### Create Record

\`\`\`javascript
const customer = await base44.entities.Customer.create({
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
});
\`\`\`

### Update Record

\`\`\`javascript
await base44.entities.Customer.update(customerId, {
  status: 'inactive'
});
\`\`\`

### Delete Record

\`\`\`javascript
await base44.entities.Customer.delete(customerId);
\`\`\`

## Integrations

### Upload File

\`\`\`javascript
const { file_url } = await base44.integrations.Core.UploadFile({
  file: fileObject
});
\`\`\`

### Send Email

\`\`\`javascript
await base44.integrations.Core.SendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Email body content'
});
\`\`\`

### Invoke LLM

\`\`\`javascript
const response = await base44.integrations.Core.InvokeLLM({
  prompt: 'Your prompt here',
  response_json_schema: { type: 'object', ... }
});
\`\`\`
    `
  }
};

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';
    const elements = [];
    let key = 0;

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3);
          codeContent = '';
        } else {
          inCodeBlock = false;
          elements.push(
            <div key={key++} className="relative group my-4">
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{codeContent.trim()}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                onClick={() => copyCode(codeContent.trim())}
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(<h1 key={key++} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-2xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-xl font-medium mt-4 mb-2">{line.slice(4)}</h3>);
      } else if (line.startsWith('- **')) {
        const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)$/);
        if (match) {
          elements.push(
            <li key={key++} className="ml-4 my-1">
              <strong>{match[1]}</strong>: {match[2]}
            </li>
          );
        }
      } else if (line.startsWith('- ')) {
        elements.push(<li key={key++} className="ml-4 my-1">{line.slice(2)}</li>);
      } else if (line.match(/^\d+\. /)) {
        elements.push(<li key={key++} className="ml-4 my-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>);
      } else if (line.trim()) {
        elements.push(<p key={key++} className="my-2 text-gray-600">{line}</p>);
      }
    });

    return elements;
  };

  const filteredSections = Object.entries(DOCS_SECTIONS).filter(([key, section]) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
          <p className="text-gray-500 mt-1">
            Platform guides, API reference, and operations runbooks
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        <Card className="w-64 shrink-0 hidden lg:block">
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <nav className="space-y-1">
              {filteredSections.map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      activeSection === key
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.title}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-8">
            <ScrollArea className="h-[calc(100vh-250px)]">
              {renderContent(DOCS_SECTIONS[activeSection].content)}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}