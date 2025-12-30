import React from 'react';
import { useTenant } from './TenantContext';
import { AlertTriangle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PermissionGate({ 
  permission, 
  feature, 
  children, 
  fallback = null,
  showMessage = false 
}) {
  const { hasPermission, hasFeature, isLoading, role, organization } = useTenant();

  if (isLoading) {
    return null;
  }

  const hasRequiredPermission = permission ? hasPermission(permission) : true;
  const hasRequiredFeature = feature ? hasFeature(feature) : true;

  if (!hasRequiredPermission || !hasRequiredFeature) {
    if (fallback) {
      return fallback;
    }

    if (showMessage) {
      if (!hasRequiredFeature) {
        return (
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Feature Unavailable</AlertTitle>
            <AlertDescription className="text-amber-700">
              This feature requires the {getRequiredPlan(feature)} plan or higher. 
              Your current plan is {organization?.plan || 'free'}.
            </AlertDescription>
          </Alert>
        );
      }

      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this feature. 
            Your current role is {role}.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return children;
}

function getRequiredPlan(feature) {
  const featurePlans = {
    'basic_crm': 'Free',
    'basic_jobs': 'Free',
    'exports': 'Pro',
    'custom_fields': 'Pro',
    'api_access': 'Pro',
    'integrations': 'Team',
    'approvals': 'Team',
    'advanced_reports': 'Team',
    'sso': 'Enterprise',
    'audit_logs': 'Enterprise',
    'data_export': 'Enterprise',
    'custom_roles': 'Enterprise'
  };
  return featurePlans[feature] || 'Enterprise';
}

export function RequireAdmin({ children, fallback }) {
  return (
    <PermissionGate permission="manage_settings" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function RequireEditor({ children, fallback }) {
  return (
    <PermissionGate permission="write" fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function RequireFeature({ feature, children, fallback, showMessage = false }) {
  return (
    <PermissionGate feature={feature} fallback={fallback} showMessage={showMessage}>
      {children}
    </PermissionGate>
  );
}