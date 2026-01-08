# Entity Access Rules (RBAC)

## Overview

PlatformForge implements Role-Based Access Control (RBAC) to ensure secure access to data and features. This document provides a detailed explanation of access rules for each database entity based on user roles.

## Role Definitions

### Admin
- Full access to all features and data within their organization/workspace
- Can manage team members and assign roles
- Can modify workspace settings
- Can approve/reject all approval requests

### Editor
- Read and write access to business entities (customers, jobs, products)
- Cannot manage team members or roles
- Cannot modify workspace settings
- Can submit approval requests

### Viewer
- Read-only access to business entities
- Cannot create, update, or delete any data
- Cannot submit approval requests
- Can view audit logs for their own actions only

## Multi-Tenancy Model

### Organization Level
- Top-level tenant isolation
- Users belong to one organization
- Data is strictly isolated between organizations

### Workspace Level
- Sub-tenant within an organization
- Users can access multiple workspaces
- Data access is workspace-scoped

## Entity Access Rules

### Customers

#### Create
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Full access |
| Editor | ✅ Yes | Can create customers in their workspace |
| Viewer | ❌ No | Read-only access |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All customers in workspace |
| Editor | ✅ Yes | All customers in workspace |
| Viewer | ✅ Yes | All customers in workspace |

#### Update
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Any customer in workspace |
| Editor | ✅ Yes | Any customer in workspace |
| Viewer | ❌ No | Read-only access |

#### Delete
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Any customer in workspace |
| Editor | ⚠️ Requires Approval | Must submit approval request |
| Viewer | ❌ No | No access |

#### Field-Level Access
All roles can view all customer fields. No field-level restrictions.

### Jobs (Orders)

#### Create
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Full access |
| Editor | ✅ Yes | Can create jobs in their workspace |
| Viewer | ❌ No | Read-only access |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All jobs in workspace |
| Editor | ✅ Yes | All jobs in workspace |
| Viewer | ✅ Yes | All jobs in workspace |

#### Update
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Any job in workspace |
| Editor | ✅ Yes | Jobs they created or are assigned to |
| Viewer | ❌ No | Read-only access |

#### Delete
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Any job in workspace |
| Editor | ⚠️ Requires Approval | Must submit approval request |
| Viewer | ❌ No | No access |

#### Status Transitions
| From Status | To Status | Admin | Editor | Viewer |
|------------|-----------|-------|--------|--------|
| draft | pending | ✅ | ✅ | ❌ |
| pending | in_progress | ✅ | ✅ | ❌ |
| in_progress | completed | ✅ | ✅ | ❌ |
| any | cancelled | ✅ | ⚠️ Approval | ❌ |

### Products

#### Create
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Full access |
| Editor | ✅ Yes | Can create products in their workspace |
| Viewer | ❌ No | Read-only access |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All products in workspace |
| Editor | ✅ Yes | All products in workspace |
| Viewer | ✅ Yes | Only active products |

#### Update
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Any product in workspace |
| Editor | ✅ Yes | Can update name, description, quantity |
| Viewer | ❌ No | Read-only access |

#### Delete
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can permanently delete |
| Editor | ✅ Yes | Can mark as inactive only |
| Viewer | ❌ No | No access |

#### Field-Level Access (Editor)
| Field | Create | Update |
|-------|--------|--------|
| name | ✅ | ✅ |
| description | ✅ | ✅ |
| sku | ✅ | ⚠️ Approval |
| price | ✅ | ⚠️ Approval |
| cost | ✅ | ⚠️ Approval |
| quantity | ✅ | ✅ |
| category | ✅ | ✅ |
| isActive | ✅ | ✅ |

### Team Members

#### Create (Invite)
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can invite any role |
| Editor | ❌ No | Cannot invite members |
| Viewer | ❌ No | Cannot invite members |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All members in workspace |
| Editor | ✅ Yes | All members in workspace |
| Viewer | ✅ Yes | All members in workspace |

#### Update
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can change roles and permissions |
| Editor | ❌ No | Cannot modify members |
| Viewer | ❌ No | Cannot modify members |

#### Delete (Remove)
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can remove any member except themselves |
| Editor | ❌ No | Cannot remove members |
| Viewer | ❌ No | Cannot remove members |

### Approvals

#### Create
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can create approval requests |
| Editor | ✅ Yes | Must use for certain operations |
| Viewer | ❌ No | Cannot create approvals |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All approvals in workspace |
| Editor | ✅ Yes | Approvals they created or are reviewing |
| Viewer | ❌ No | No access |

#### Update (Approve/Reject)
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Can approve/reject any request |
| Editor | ❌ No | Cannot approve own requests |
| Viewer | ❌ No | No access |

#### Approval Workflow
```
Editor submits request → Admin reviews → Approved/Rejected
                                      ↓
                          If approved: Action executed automatically
                          If rejected: Request closed, action not executed
```

### Audit Logs

#### Create
| Role | Permission | Notes |
|------|-----------|-------|
| System | Auto | Automatically created for all actions |

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | All logs in workspace |
| Editor | ✅ Limited | Only their own actions |
| Viewer | ✅ Limited | Only their own actions |

#### Update/Delete
| Role | Permission | Notes |
|------|-----------|-------|
| All | ❌ No | Audit logs are immutable |

#### Retention Policy
- Audit logs are retained for **2 years**
- After 2 years, logs are archived
- Archived logs available upon request

### System Health

#### Read
| Role | Permission | Notes |
|------|-----------|-------|
| Admin | ✅ Yes | Full system health metrics |
| Editor | ✅ Limited | Basic health indicators |
| Viewer | ✅ Limited | Basic health indicators |

#### Update
| Role | Permission | Notes |
|------|-----------|-------|
| System | Auto | Automatically updated |

## Access Control Implementation

### Database Level

Each entity includes tenant fields:
```javascript
{
  organizationId: string,  // Organization tenant
  workspaceId: string,     // Workspace tenant
  createdBy: string,       // User who created
  updatedBy: string        // User who last updated
}
```

### Query Filters

All queries must include tenant filters:
```javascript
// Correct
await base44.database.collection('customers').find({
  organizationId: currentOrg,
  workspaceId: currentWorkspace
});

// Incorrect - Will fail permission check
await base44.database.collection('customers').find();
```

### Permission Checks

Before operations:
```javascript
function canDeleteCustomer(user, customer) {
  // Check role
  if (user.role === 'admin') return true;
  if (user.role === 'viewer') return false;
  
  // Editor needs approval
  if (user.role === 'editor') {
    return { requiresApproval: true };
  }
  
  return false;
}
```

## Special Cases

### Self-Service Operations

Users can always:
- View their own profile
- Update their own profile (name, email, preferences)
- View their own audit logs
- View their own approval requests

### Cross-Workspace Access

Admins with multiple workspace access:
- Must explicitly switch workspace context
- Each workspace maintains separate data isolation
- No automatic cross-workspace queries

### Workspace Transfer

When a job/customer needs to move between workspaces:
- Requires Admin approval in both workspaces
- Audit log created for transfer
- Related entities do not transfer automatically

## Security Considerations

### Principle of Least Privilege
- Users granted minimum necessary access
- Roles cannot escalate their own permissions
- Time-limited elevated access (not implemented yet)

### Defense in Depth
- Client-side role checks (UX)
- API-level permission validation
- Database-level access rules
- Audit logging for all actions

### Data Isolation
- Strict organization/workspace boundaries
- No data leakage between tenants
- Separate database queries per tenant

## Compliance

### GDPR Considerations
- Users can request data export
- Data deletion follows approval workflow
- Audit logs maintained for compliance

### SOC 2 Compliance
- All access logged in audit trail
- Role assignments tracked
- Permission changes audited

## Custom Permissions (Future)

Planned for v0.4.0:
- Fine-grained permissions
- Custom role creation
- Permission inheritance
- Resource-level permissions

Example future permission:
```javascript
{
  resource: 'customers',
  actions: ['read', 'create', 'update'],
  conditions: {
    ownedBy: userId,
    region: 'US'
  }
}
```

## API Examples

### Check Permission

```javascript
import { checkPermission } from '@/lib/permissions';

const canEdit = checkPermission(user, 'customers', 'update', customer);
if (!canEdit) {
  throw new Error('Permission denied');
}
```

### Require Approval

```javascript
import { requiresApproval } from '@/lib/permissions';

const needsApproval = requiresApproval(user, 'products', 'delete', product);
if (needsApproval) {
  // Create approval request
  await createApprovalRequest({
    entityType: 'product',
    entityId: product._id,
    action: 'delete'
  });
} else {
  // Execute directly
  await deleteProduct(product._id);
}
```

## Troubleshooting

### Permission Denied Errors

1. Verify user role: `console.log(user.role)`
2. Check tenant context: `console.log({ organizationId, workspaceId })`
3. Review audit logs for denied access
4. Confirm entity belongs to current workspace

### Approval Request Issues

1. Verify approver has Admin role
2. Check approval is in 'pending' status
3. Ensure approver is in same workspace
4. Review approval workflow configuration

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*
