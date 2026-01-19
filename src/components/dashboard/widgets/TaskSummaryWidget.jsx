import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from 'lucide-react';

export default function TaskSummaryWidget({ widget }) {
  const { currentOrgId, currentWorkspaceId, user } = useTenant();

  const { data: tasks = [] } = useQuery({
    queryKey: ['myTasks', currentOrgId, currentWorkspaceId, user?.email],
    queryFn: async () => {
      return await base44.entities.Task.filter({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId || undefined,
        assigned_to: user?.email
      }, '-due_date', widget?.filters?.limit || 10);
    },
    enabled: !!currentOrgId && !!user?.email
  });

  const getStatusColor = (status) => {
    return {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      blocked: 'bg-red-100 text-red-800'
    }[status];
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-lg font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-lg font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-600">Done</p>
          </div>
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-lg font-bold">{stats.todo}</p>
            <p className="text-xs text-gray-600">To Do</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}