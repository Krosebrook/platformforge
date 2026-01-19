/**
 * Task Management Page
 * Centralized task management across jobs and customers
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import TaskFilters from '../components/tasks/TaskFilters';
import { toast } from 'sonner';

export default function Tasks() {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', assigned: 'all' });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Task.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Job.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Customer.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task updated');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.Task.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Task deleted');
    }
  });

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assigned !== 'all' && task.assigned_to !== filters.assigned) return false;
    return true;
  });

  const myTasks = filteredTasks.filter(t => t.assigned_to === user?.email);
  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const stats = [
    { label: 'My Tasks', value: myTasks.length, icon: ListTodo, color: 'text-blue-600' },
    { label: 'To Do', value: todoTasks.length, icon: Clock, color: 'text-gray-600' },
    { label: 'In Progress', value: inProgressTasks.length, icon: AlertCircle, color: 'text-yellow-600' },
    { label: 'Completed', value: completedTasks.length, icon: CheckCircle2, color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and track tasks across jobs and customers</p>
        </div>
        <Button onClick={() => {
          setEditingTask(null);
          setShowForm(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TaskFilters filters={filters} onFilterChange={setFilters} />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="my">My Tasks ({myTasks.length})</TabsTrigger>
          <TabsTrigger value="todo">To Do ({todoTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TaskList
            tasks={filteredTasks}
            jobs={jobs}
            customers={customers}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onUpdate={updateTaskMutation.mutate}
            onDelete={deleteTaskMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          <TaskList
            tasks={myTasks}
            jobs={jobs}
            customers={customers}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onUpdate={updateTaskMutation.mutate}
            onDelete={deleteTaskMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="todo" className="mt-6">
          <TaskList
            tasks={todoTasks}
            jobs={jobs}
            customers={customers}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onUpdate={updateTaskMutation.mutate}
            onDelete={deleteTaskMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <TaskList
            tasks={inProgressTasks}
            jobs={jobs}
            customers={customers}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onUpdate={updateTaskMutation.mutate}
            onDelete={deleteTaskMutation.mutate}
          />
        </TabsContent>
      </Tabs>

      <TaskForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        task={editingTask}
        organizationId={currentOrgId}
        workspaceId={currentWorkspaceId}
        onSuccess={() => {
          queryClient.invalidateQueries(['tasks']);
          setShowForm(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}

function TaskList({ tasks, jobs, customers, onEdit, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ListTodo className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No tasks found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          job={jobs.find(j => j.id === task.job_id)}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}