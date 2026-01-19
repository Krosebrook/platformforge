import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Briefcase, MoreVertical, Edit, Trash, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { PriorityBadge } from '../ui/StatusBadge';

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700'
};

export default function TaskCard({ task, job, onEdit, onUpdate, onDelete }) {
  const toggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onUpdate({
      id: task.id,
      data: {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }
    });
  };

  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'completed'}
            onCheckedChange={toggleComplete}
            className="mt-1"
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_COLORS[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              <PriorityBadge priority={task.priority} />
              
              {job && (
                <Badge variant="outline" className="text-xs">
                  <Briefcase className="w-3 h-3 mr-1" />
                  {job.title}
                </Badge>
              )}
              
              {task.due_date && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(task.due_date), 'MMM d')}
                </Badge>
              )}
              
              {task.estimated_hours > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.estimated_hours}h
                </Badge>
              )}

              {task.assigned_to && (
                <span className="text-xs text-gray-500">
                  Assigned to {task.assigned_to.split('@')[0]}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}