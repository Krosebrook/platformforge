import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TenantContext = createContext(null);

const PLAN_LIMITS = {
  free: {
    max_members: 3,
    max_workspaces: 1,
    max_customers: 100,
    max_jobs: 50,
    features: ['basic_crm', 'basic_jobs'],
    audit_retention_days: 7,
  },
  pro: {
    max_members: 10,
    max_workspaces: 3,
    max_customers: 1000,
    max_jobs: 500,
    features: ['basic_crm', 'basic_jobs', 'exports', 'custom_fields', 'api_access'],
    audit_retention_days: 30,
  },
  team: {
    max_members: 50,
    max_workspaces: 10,
    max_customers: 10000,
    max_jobs: 5000,
    features: ['basic_crm', 'basic_jobs', 'exports', 'custom_fields', 'api_access', 'integrations', 'approvals', 'advanced_reports'],
    audit_retention_days: 90,
  },
  enterprise: {
    max_members: -1,
    max_workspaces: -1,
    max_customers: -1,
    max_jobs: -1,
    features: ['basic_crm', 'basic_jobs', 'exports', 'custom_fields', 'api_access', 'integrations', 'approvals', 'advanced_reports', 'sso', 'audit_logs', 'data_export', 'custom_roles'],
    audit_retention_days: 365,
  }
};

export function TenantProvider({ children }) {
  const queryClient = useQueryClient();
  const [currentOrgId, setCurrentOrgId] = useState(() => 
    localStorage.getItem('currentOrgId') || null
  );
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => 
    localStorage.getItem('currentWorkspaceId') || null
  );

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['membership', user?.email, currentOrgId],
    queryFn: async () => {
      if (!user?.email || !currentOrgId) return null;
      const memberships = await base44.entities.Membership.filter({
        organization_id: currentOrgId,
        user_email: user.email,
        status: 'active'
      });
      return memberships[0] || null;
    },
    enabled: !!user?.email && !!currentOrgId,
  });

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: currentOrgId });
      return orgs[0] || null;
    },
    enabled: !!currentOrgId,
  });

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const workspaces = await base44.entities.Workspace.filter({ id: currentWorkspaceId });
      return workspaces[0] || null;
    },
    enabled: !!currentWorkspaceId,
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['userOrganizations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const memberships = await base44.entities.Membership.filter({
        user_email: user.email,
        status: 'active'
      });
      const orgIds = memberships.map(m => m.organization_id);
      if (orgIds.length === 0) return [];
      const orgs = await base44.entities.Organization.filter({
        status: 'active'
      });
      return orgs.filter(o => orgIds.includes(o.id));
    },
    enabled: !!user?.email,
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['orgWorkspaces', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.Workspace.filter({
        organization_id: currentOrgId,
        status: 'active'
      });
    },
    enabled: !!currentOrgId,
  });

  const switchOrganization = useCallback((orgId) => {
    setCurrentOrgId(orgId);
    localStorage.setItem('currentOrgId', orgId);
    setCurrentWorkspaceId(null);
    localStorage.removeItem('currentWorkspaceId');
    queryClient.invalidateQueries({ queryKey: ['membership'] });
    queryClient.invalidateQueries({ queryKey: ['organization'] });
    queryClient.invalidateQueries({ queryKey: ['orgWorkspaces'] });
  }, [queryClient]);

  const switchWorkspace = useCallback((workspaceId) => {
    setCurrentWorkspaceId(workspaceId);
    if (workspaceId) {
      localStorage.setItem('currentWorkspaceId', workspaceId);
    } else {
      localStorage.removeItem('currentWorkspaceId');
    }
  }, []);

  useEffect(() => {
    if (!currentOrgId && organizations.length > 0) {
      switchOrganization(organizations[0].id);
    }
  }, [organizations, currentOrgId, switchOrganization]);

  useEffect(() => {
    if (!currentWorkspaceId && workspaces.length > 0 && currentOrgId) {
      switchWorkspace(workspaces[0].id);
    }
  }, [workspaces, currentWorkspaceId, currentOrgId, switchWorkspace]);

  const role = membership?.role || 'viewer';
  const planLimits = PLAN_LIMITS[organization?.plan || 'free'];

  const hasPermission = useCallback((permission) => {
    const rolePermissions = {
      owner: ['*'],
      admin: ['read', 'write', 'delete', 'manage_members', 'manage_settings', 'approve', 'export', 'view_audit'],
      editor: ['read', 'write', 'export'],
      viewer: ['read']
    };
    const perms = rolePermissions[role] || [];
    return perms.includes('*') || perms.includes(permission);
  }, [role]);

  const hasFeature = useCallback((feature) => {
    return planLimits.features.includes(feature);
  }, [planLimits]);

  const isLoading = userLoading || membershipLoading || orgLoading || workspaceLoading;

  const value = {
    user,
    organization,
    workspace,
    membership,
    organizations,
    workspaces,
    currentOrgId,
    currentWorkspaceId,
    role,
    planLimits,
    isLoading,
    switchOrganization,
    switchWorkspace,
    hasPermission,
    hasFeature,
    isOwner: role === 'owner',
    isAdmin: role === 'owner' || role === 'admin',
    isEditor: ['owner', 'admin', 'editor'].includes(role),
    refreshOrganization: () => queryClient.invalidateQueries({ queryKey: ['organization', currentOrgId] }),
    refreshMembership: () => queryClient.invalidateQueries({ queryKey: ['membership'] }),
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function useRequirePermission(permission) {
  const { hasPermission, isLoading } = useTenant();
  if (!isLoading && !hasPermission(permission)) {
    throw new Error(`Missing required permission: ${permission}`);
  }
  return hasPermission(permission);
}

export function useRequireFeature(feature) {
  const { hasFeature, isLoading } = useTenant();
  if (!isLoading && !hasFeature(feature)) {
    return false;
  }
  return hasFeature(feature);
}

export { PLAN_LIMITS };