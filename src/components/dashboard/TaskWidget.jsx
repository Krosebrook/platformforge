import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ListTodo, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskWidget() {
  const { currentOrgId, user } = useTenant();

  const { data: myTasks = [] } = useQuery({
    queryKey: ['myTasks', currentOrgId, user?.email],
    queryFn: async () => {
      return await base44.entities.Task.filter({
        organization_id: currentOrgId,
        assigned_to: user?.email,
        status: ['todo', 'in_progress']
      }, 'due_date', 5);
    },
    enabled: !!currentOrgId && !!user?.email
  });

  const updateTask = async (taskId, status) => {
    await base44.entities.Task.update(taskId, {
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            My Tasks
          </CardTitle>
          <Link to={createPageUrl('Tasks')}>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {myTasks.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No pending tasks</p>
        ) : (
          <div className="space-y-3">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2 rounded hover:bg-gray-50">
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={(checked) => updateTask(task.id, checked ? 'completed' : 'todo')}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        Due {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}