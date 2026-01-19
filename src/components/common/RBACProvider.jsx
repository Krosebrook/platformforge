import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from './TenantContext';

const RBACContext = createContext(null);

export function RBACProvider({ children }) {
  const { membership, currentOrgId } = useTenant();

  const { data: customRole } = useQuery({
    queryKey: ['customRole', membership?.custom_role_id],
    queryFn: async () => {
      if (!membership?.custom_role_id) return null;
      const roles = await base44.entities.Role.filter({ id: membership.custom_role_id });
      return roles[0];
    },
    enabled: !!membership?.custom_role_id
  });

  const hasModulePermission = (module, permission) => {
    // System roles (owner, admin) have full access
    if (membership?.role === 'owner' || membership?.role === 'admin') {
      return true;
    }

    // Check custom role permissions
    if (customRole?.permissions) {
      return customRole.permissions[module]?.[permission] === true;
    }

    // Default role permissions
    const rolePermissions = {
      editor: {
        customers: { view: true, create: true, edit: true, delete: false, export: true },
        jobs: { view: true, create: true, edit: true, delete: false, assign: true },
        products: { view: true, create: true, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false },
        reports: { view: true, create: false, export: true },
        workflows: { view: true, create: false, edit: false },
        team: { view: true, invite: false, manage_roles: false },
        settings: { view: true, edit: false }
      },
      viewer: {
        customers: { view: true, create: false, edit: false, delete: false, export: false },
        jobs: { view: true, create: false, edit: false, delete: false, assign: false },
        products: { view: true, create: false, edit: false, delete: false },
        tasks: { view: true, create: false, edit: false, delete: false },
        reports: { view: true, create: false, export: false },
        workflows: { view: false, create: false, edit: false },
        team: { view: true, invite: false, manage_roles: false },
        settings: { view: false, edit: false }
      }
    };

    return rolePermissions[membership?.role]?.[module]?.[permission] || false;
  };

  const value = {
    hasModulePermission,
    customRole
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
}

export function PermissionGuard({ module, permission, children, fallback = null }) {
  const { hasModulePermission } = useRBAC();
  
  if (!hasModulePermission(module, permission)) {
    return fallback;
  }
  
  return children;
}