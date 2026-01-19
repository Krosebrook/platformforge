import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from 'lucide-react';

export default function TemplateTaskBuilder({ tasks = [], onChange }) {
  const [tasks_state, setTasksState] = useState(tasks);

  const addTask = () => {
    setTasksState([...tasks_state, {
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: 0,
      order: tasks_state.length,
      dependencies: []
    }]);
  };

  const updateTask = (idx, field, value) => {
    const updated = [...tasks_state];
    updated[idx] = { ...updated[idx], [field]: value };
    setTasksState(updated);
    onChange(updated);
  };

  const removeTask = (idx) => {
    const updated = tasks_state.filter((_, i) => i !== idx);
    setTasksState(updated);
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Predefined Tasks</CardTitle>
        <Button size="sm" onClick={addTask}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks_state.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No tasks defined yet</p>
        ) : (
          tasks_state.map((task, idx) => (
            <div key={idx} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Task title"
                    value={task.title}
                    onChange={(e) => updateTask(idx, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Task description"
                    value={task.description}
                    onChange={(e) => updateTask(idx, 'description', e.target.value)}
                    rows={2}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={task.priority} onValueChange={(v) => updateTask(idx, 'priority', v)}>
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
                    <Input
                      type="number"
                      placeholder="Est. hours"
                      value={task.estimated_hours}
                      onChange={(e) => updateTask(idx, 'estimated_hours', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeTask(idx)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}