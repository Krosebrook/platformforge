import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';

const MODULES = [
  {
    name: 'customers',
    label: 'Customers',
    permissions: ['view', 'create', 'edit', 'delete', 'export']
  },
  {
    name: 'jobs',
    label: 'Jobs',
    permissions: ['view', 'create', 'edit', 'delete', 'assign']
  },
  {
    name: 'products',
    label: 'Products',
    permissions: ['view', 'create', 'edit', 'delete']
  },
  {
    name: 'tasks',
    label: 'Tasks',
    permissions: ['view', 'create', 'edit', 'delete']
  },
  {
    name: 'reports',
    label: 'Reports & Analytics',
    permissions: ['view', 'create', 'export']
  },
  {
    name: 'workflows',
    label: 'Workflows',
    permissions: ['view', 'create', 'edit']
  },
  {
    name: 'team',
    label: 'Team Management',
    permissions: ['view', 'invite', 'manage_roles']
  },
  {
    name: 'settings',
    label: 'Organization Settings',
    permissions: ['view', 'edit']
  }
];

export default function RoleEditor({ open, onClose, role, organizationId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || MODULES.reduce((acc, module) => ({
      ...acc,
      [module.name]: module.permissions.reduce((perms, perm) => ({ ...perms, [perm]: false }), {})
    }), {})
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (role) {
        return await base44.entities.Role.update(role.id, data);
      } else {
        return await base44.entities.Role.create({
          organization_id: organizationId,
          is_system_role: false,
          ...data
        });
      }
    },
    onSuccess: () => {
      toast.success(role ? 'Role updated' : 'Role created');
      onSuccess();
    }
  });

  const togglePermission = (module, permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: !prev.permissions[module]?.[permission]
        }
      }
    }));
  };

  const toggleAllModule = (module, enabled) => {
    const moduleConfig = MODULES.find(m => m.name === module);
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: moduleConfig.permissions.reduce((acc, perm) => ({ ...acc, [perm]: enabled }), {})
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create Role'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g., Sales Representative"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this role do?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Permissions</h3>
            {MODULES.map(module => {
              const allEnabled = module.permissions.every(p => formData.permissions[module.name]?.[p]);
              const someEnabled = module.permissions.some(p => formData.permissions[module.name]?.[p]);
              
              return (
                <Card key={module.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{module.label}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllModule(module.name, !allEnabled)}
                      >
                        {allEnabled ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {module.permissions.map(permission => (
                        <div key={permission} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.permissions[module.name]?.[permission] || false}
                            onCheckedChange={() => togglePermission(module.name, permission)}
                          />
                          <Label className="capitalize cursor-pointer text-sm" onClick={() => togglePermission(module.name, permission)}>
                            {permission.replace('_', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate(formData)} disabled={!formData.name || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : role ? 'Update' : 'Create'} Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}