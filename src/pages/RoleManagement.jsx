import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Users, Edit, Trash } from 'lucide-react';
import RoleEditor from '../components/roles/RoleEditor';
import { toast } from 'sonner';

export default function RoleManagement() {
  const queryClient = useQueryClient();
  const { currentOrgId, hasPermission } = useTenant();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Role.filter({
        organization_id: currentOrgId,
        is_active: true
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['memberships', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Membership.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Role.update(id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success('Role deleted');
    }
  });

  if (!hasPermission('manage_settings')) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">You don't have permission to manage roles</p>
        </CardContent>
      </Card>
    );
  }

  const getRoleMemberCount = (roleId) => {
    return memberships.filter(m => m.custom_role_id === roleId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500 mt-1">Define custom roles and permissions for your organization</p>
        </div>
        <Button onClick={() => {
          setEditingRole(null);
          setShowEditor(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <Card key={role.id} className={role.is_system_role ? 'border-blue-200 bg-blue-50/50' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    {role.is_system_role && (
                      <Badge variant="outline" className="text-xs">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {getRoleMemberCount(role.id)} members
                </div>

                <div className="flex flex-wrap gap-1">
                  {Object.entries(role.permissions || {}).map(([module, perms]) => {
                    const enabledPerms = Object.entries(perms).filter(([_, enabled]) => enabled);
                    if (enabledPerms.length === 0) return null;
                    return (
                      <Badge key={module} variant="secondary" className="text-xs capitalize">
                        {module}
                      </Badge>
                    );
                  })}
                </div>

                {!role.is_system_role && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRole(role);
                        setShowEditor(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRoleMutation.mutate(role.id)}
                      disabled={getRoleMemberCount(role.id) > 0}
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoleEditor
        open={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingRole(null);
        }}
        role={editingRole}
        organizationId={currentOrgId}
        onSuccess={() => {
          queryClient.invalidateQueries(['roles']);
          setShowEditor(false);
          setEditingRole(null);
        }}
      />
    </div>
  );
}