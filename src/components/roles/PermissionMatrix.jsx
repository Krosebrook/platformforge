import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from 'lucide-react';

export default function PermissionMatrix({ role }) {
  const modules = [
    { key: 'customers', label: 'Customers' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'products', label: 'Products' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'reports', label: 'Reports' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'team', label: 'Team' },
    { key: 'settings', label: 'Settings' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Permission Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {modules.map(module => {
            const perms = role.permissions[module.key] || {};
            const enabledPerms = Object.entries(perms).filter(([_, enabled]) => enabled);
            
            if (enabledPerms.length === 0) return null;

            return (
              <div key={module.key} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{module.label}</span>
                <div className="flex gap-1">
                  {enabledPerms.map(([perm]) => (
                    <Badge key={perm} variant="secondary" className="text-xs capitalize">
                      {perm.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}