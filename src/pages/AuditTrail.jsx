import React from 'react';
import { useTenant } from '../components/common/TenantContext';
import AuditTrailViewer from '../components/audit/AuditTrailViewer';

export default function AuditTrail() {
  const { currentOrgId, hasPermission } = useTenant();

  if (!hasPermission('manage_settings')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 mt-1">Monitor detailed user actions, data changes, and permission checks</p>
      </div>

      <AuditTrailViewer organizationId={currentOrgId} limit={100} />
    </div>
  );
}