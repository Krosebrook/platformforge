# API Reference

## Overview

PlatformForge is built on the Base44 serverless platform. This document provides a reference for the database collections, their schemas, and how to interact with them using the Base44 SDK.

## Base44 SDK

### Installation

```bash
npm install @base44/sdk
```

### Initialization

```javascript
import { createBase44Client } from '@base44/sdk';

const base44 = createBase44Client({
  appId: process.env.VITE_BASE44_APP_ID,
  baseUrl: process.env.VITE_BASE44_APP_BASE_URL
});
```

## Authentication

### Current User

```javascript
// Get current authenticated user
const currentUser = base44.auth.currentUser;

// Check authentication status
const isAuthenticated = base44.auth.isAuthenticated();

// Sign out
await base44.auth.signOut();
```

## Database Collections

### Customers Collection

#### Schema
```javascript
{
  _id: string,              // Auto-generated
  name: string,             // Required
  email: string,            // Optional
  phone: string,            // Optional
  address: string,          // Optional
  notes: string,            // Optional
  status: string,           // 'active' | 'inactive'
  organizationId: string,   // Required
  workspaceId: string,      // Required
  createdAt: Date,          // Auto-generated
  updatedAt: Date,          // Auto-updated
  createdBy: string,        // User ID
  updatedBy: string         // User ID
}
```

#### Operations

##### Get All Customers
```javascript
const customers = await base44.database
  .collection('customers')
  .find({
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });
```

##### Get Customer by ID
```javascript
const customer = await base44.database
  .collection('customers')
  .findOne({ _id: customerId });
```

##### Create Customer
```javascript
const newCustomer = await base44.database
  .collection('customers')
  .insertOne({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    status: 'active',
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });
```

##### Update Customer
```javascript
const updated = await base44.database
  .collection('customers')
  .updateOne(
    { _id: customerId },
    { 
      $set: { 
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
    }
  );
```

##### Delete Customer
```javascript
await base44.database
  .collection('customers')
  .deleteOne({ _id: customerId });
```

### Jobs Collection

#### Schema
```javascript
{
  _id: string,
  title: string,            // Required
  description: string,      // Optional
  customerId: string,       // Reference to customer
  status: string,           // 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: string,         // 'low' | 'medium' | 'high' | 'urgent'
  dueDate: Date,           // Optional
  assignedTo: string[],     // Array of user IDs
  products: Array,          // Associated products
  totalAmount: number,      // Calculated total
  organizationId: string,
  workspaceId: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  updatedBy: string
}
```

#### Operations

##### Get All Jobs
```javascript
const jobs = await base44.database
  .collection('jobs')
  .find({
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  })
  .sort({ createdAt: -1 });
```

##### Get Jobs by Customer
```javascript
const customerJobs = await base44.database
  .collection('jobs')
  .find({
    customerId: customerId,
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });
```

##### Create Job
```javascript
const newJob = await base44.database
  .collection('jobs')
  .insertOne({
    title: 'Website Redesign',
    description: 'Complete website overhaul',
    customerId: customer._id,
    status: 'pending',
    priority: 'high',
    assignedTo: [userId],
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });
```

##### Update Job Status
```javascript
await base44.database
  .collection('jobs')
  .updateOne(
    { _id: jobId },
    { $set: { status: 'in_progress' } }
  );
```

### Products Collection

#### Schema
```javascript
{
  _id: string,
  name: string,             // Required
  description: string,      // Optional
  sku: string,              // Stock Keeping Unit
  price: number,            // Required
  cost: number,             // Optional
  quantity: number,         // Inventory count
  category: string,         // Optional
  imageUrl: string,         // Optional
  isActive: boolean,        // Default: true
  organizationId: string,
  workspaceId: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  updatedBy: string
}
```

#### Operations

##### Get All Products
```javascript
const products = await base44.database
  .collection('products')
  .find({
    organizationId: currentOrg,
    workspaceId: currentWorkspace,
    isActive: true
  });
```

##### Search Products
```javascript
const searchResults = await base44.database
  .collection('products')
  .find({
    name: { $regex: searchTerm, $options: 'i' },
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });
```

##### Update Inventory
```javascript
await base44.database
  .collection('products')
  .updateOne(
    { _id: productId },
    { $inc: { quantity: -5 } } // Decrease by 5
  );
```

### Team Members Collection

#### Schema
```javascript
{
  _id: string,
  userId: string,           // Base44 user ID
  email: string,
  name: string,
  role: string,             // 'admin' | 'editor' | 'viewer'
  permissions: string[],    // Array of permission strings
  status: string,           // 'active' | 'inactive'
  organizationId: string,
  workspaceId: string,
  invitedBy: string,
  joinedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Approvals Collection

#### Schema
```javascript
{
  _id: string,
  entityType: string,       // 'job' | 'product' | 'customer'
  entityId: string,         // Reference to entity
  requestedBy: string,      // User ID
  status: string,           // 'pending' | 'approved' | 'rejected'
  reviewedBy: string,       // User ID (optional)
  reviewedAt: Date,         // Optional
  reason: string,           // Optional
  metadata: object,         // Additional data
  organizationId: string,
  workspaceId: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Audit Logs Collection

#### Schema
```javascript
{
  _id: string,
  action: string,           // 'create' | 'update' | 'delete' | 'view'
  entityType: string,       // Type of entity
  entityId: string,         // Entity ID
  userId: string,           // Who performed action
  changes: object,          // Before/after data
  metadata: object,         // Additional context
  ipAddress: string,        // Optional
  userAgent: string,        // Optional
  organizationId: string,
  workspaceId: string,
  timestamp: Date
}
```

## Query Operations

### Find Operations

#### Basic Find
```javascript
const results = await base44.database
  .collection('collectionName')
  .find({ field: 'value' });
```

#### Find with Multiple Conditions
```javascript
const results = await base44.database
  .collection('collectionName')
  .find({
    status: 'active',
    priority: 'high'
  });
```

#### Find with Comparison Operators
```javascript
// Greater than
const results = await base44.database
  .collection('products')
  .find({ price: { $gt: 100 } });

// Less than or equal
const results = await base44.database
  .collection('products')
  .find({ quantity: { $lte: 10 } });

// In array
const results = await base44.database
  .collection('jobs')
  .find({ status: { $in: ['pending', 'in_progress'] } });
```

#### Find with Regex
```javascript
const results = await base44.database
  .collection('customers')
  .find({
    name: { $regex: 'John', $options: 'i' } // Case-insensitive
  });
```

### Sorting

```javascript
// Ascending
const results = await base44.database
  .collection('jobs')
  .find()
  .sort({ createdAt: 1 });

// Descending
const results = await base44.database
  .collection('jobs')
  .find()
  .sort({ createdAt: -1 });

// Multiple fields
const results = await base44.database
  .collection('jobs')
  .find()
  .sort({ priority: -1, createdAt: 1 });
```

### Pagination

```javascript
const results = await base44.database
  .collection('customers')
  .find()
  .skip(20)
  .limit(10);
```

### Projection (Select Fields)

```javascript
const results = await base44.database
  .collection('customers')
  .find()
  .project({ name: 1, email: 1 }); // Only return name and email
```

## Update Operations

### Update One Document

```javascript
await base44.database
  .collection('customers')
  .updateOne(
    { _id: customerId },
    { $set: { status: 'inactive' } }
  );
```

### Update Multiple Documents

```javascript
await base44.database
  .collection('jobs')
  .updateMany(
    { status: 'pending' },
    { $set: { status: 'in_progress' } }
  );
```

### Update Operators

#### $set - Set field value
```javascript
{ $set: { name: 'New Name' } }
```

#### $inc - Increment numeric value
```javascript
{ $inc: { quantity: -1 } } // Decrease by 1
```

#### $push - Add to array
```javascript
{ $push: { assignedTo: userId } }
```

#### $pull - Remove from array
```javascript
{ $pull: { assignedTo: userId } }
```

#### $unset - Remove field
```javascript
{ $unset: { tempField: '' } }
```

## Real-time Subscriptions

### Subscribe to Changes

```javascript
const unsubscribe = base44.database
  .collection('jobs')
  .watch()
  .on('change', (change) => {
    console.log('Change detected:', change);
    // Handle change event
  });

// Cleanup
unsubscribe();
```

### Subscribe with Filter

```javascript
const unsubscribe = base44.database
  .collection('jobs')
  .watch({ status: 'pending' })
  .on('change', (change) => {
    // Only notified of pending jobs changes
  });
```

## File Storage

### Upload File

```javascript
const file = event.target.files[0];
const uploadedFile = await base44.storage.upload(file, {
  folder: 'customer-documents',
  metadata: {
    customerId: customer._id
  }
});
```

### Get File URL

```javascript
const url = base44.storage.getUrl(fileId);
```

### Delete File

```javascript
await base44.storage.delete(fileId);
```

## Error Handling

### Try-Catch Pattern

```javascript
try {
  const customer = await base44.database
    .collection('customers')
    .findOne({ _id: customerId });
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    console.error('Access denied');
  } else if (error.code === 'NOT_FOUND') {
    console.error('Customer not found');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Common Error Codes

- `PERMISSION_DENIED`: User lacks required permissions
- `NOT_FOUND`: Document not found
- `VALIDATION_ERROR`: Data validation failed
- `NETWORK_ERROR`: Connection issue
- `UNAUTHENTICATED`: User not logged in

## Best Practices

### 1. Always Filter by Organization and Workspace

```javascript
// Good
const customers = await base44.database
  .collection('customers')
  .find({
    organizationId: currentOrg,
    workspaceId: currentWorkspace
  });

// Bad - Returns data from all workspaces
const customers = await base44.database
  .collection('customers')
  .find();
```

### 2. Use Projection for Large Documents

```javascript
// Only fetch needed fields
const customers = await base44.database
  .collection('customers')
  .find()
  .project({ name: 1, email: 1 });
```

### 3. Implement Pagination

```javascript
const pageSize = 20;
const page = 1;

const customers = await base44.database
  .collection('customers')
  .find()
  .skip((page - 1) * pageSize)
  .limit(pageSize);
```

### 4. Use Indexes for Performance

Ensure frequently queried fields are indexed in Base44 console.

### 5. Validate Data

```javascript
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive'])
});

// Validate before insert
const validated = customerSchema.parse(customerData);
```

## Rate Limits

Base44 enforces rate limits:
- **Queries**: 100 requests per minute per user
- **Writes**: 50 requests per minute per user
- **Subscriptions**: 10 concurrent subscriptions per user

## Support

For Base44-specific issues:
- [Base44 Documentation](https://base44.com/docs)
- [Base44 Support](https://base44.com/support)

For PlatformForge API questions:
- GitHub Issues
- Team discussions

---

*Last Updated: 2026-01-08*  
*Version: 1.0.0*
