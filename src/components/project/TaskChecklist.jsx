import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical, User, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TaskChecklist({ jobId, organizationId, workspaceId, members = [] }) {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', jobId],
    queryFn: async () => {
      return await base44.entities.Task.filter({ job_id: jobId }, 'order');
    },
    enabled: !!jobId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Task.create({
        organization_id: organizationId,
        workspace_id: workspaceId,
        job_id: jobId,
        ...data,
        order: tasks.length
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', jobId]);
      setNewTask('');
      toast.success('Task added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Task.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', jobId]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Task.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks', jobId]);
      toast.success('Task deleted');
    }
  });

  const handleToggle = (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateMutation.mutate({
      id: task.id,
      data: {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }
    });
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    createMutation.mutate({ title: newTask });
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Task Checklist
              <Badge variant="secondary">{completedCount}/{tasks.length}</Badge>
            </CardTitle>
            <Progress value={progress} className="w-24 h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button onClick={handleAddTask} disabled={!newTask.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 group"
              >
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleToggle(task)}
                />
                <div className="flex-1 cursor-pointer" onClick={() => {
                  setSelectedTask(task);
                  setShowDetailDialog(true);
                }}>
                  <p className={`${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.assigned_to && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {task.assigned_to.split('@')[0]}
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.due_date), 'MMM d')}
                      </div>
                    )}
                    {task.estimated_hours && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {task.estimated_hours}h
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => deleteMutation.mutate(task.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTask && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select
                    value={selectedTask.assigned_to || ''}
                    onValueChange={(value) => setSelectedTask({ ...selectedTask, assigned_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Unassigned</SelectItem>
                      {members.map(m => (
                        <SelectItem key={m.user_email} value={m.user_email}>
                          {m.user_email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(value) => setSelectedTask({ ...selectedTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={selectedTask.start_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={selectedTask.due_date || ''}
                    onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  value={selectedTask.estimated_hours || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, estimated_hours: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                updateMutation.mutate({ id: selectedTask.id, data: selectedTask });
                setShowDetailDialog(false);
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}