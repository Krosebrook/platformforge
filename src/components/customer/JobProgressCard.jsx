import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { format } from 'date-fns';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Start',
  in_progress: 'In Progress',
  review: 'Under Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export default function JobProgressCard({ job }) {
  const isOverdue = job.due_date && new Date(job.due_date) < new Date() && !['completed', 'cancelled'].includes(job.status);
  const isCompleted = job.status === 'completed';
  const isActive = ['in_progress', 'review'].includes(job.status);

  // Calculate progress based on status
  const statusProgress = {
    draft: 10,
    pending: 20,
    in_progress: 60,
    review: 85,
    completed: 100,
    cancelled: 0,
    on_hold: 30,
  };

  const progress = statusProgress[job.status] || 0;
  const daysRemaining = job.due_date 
    ? Math.ceil((new Date(job.due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className={`transition-all ${isActive ? 'border-blue-200 bg-blue-50/30' : ''} ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              {job.reference_number && (
                <Badge variant="outline" className="text-xs">
                  {job.reference_number}
                </Badge>
              )}
            </div>
            <CardDescription>{job.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[job.status]}>
              {STATUS_LABELS[job.status]}
            </Badge>
            {isOverdue && (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progress</span>
            <span className="text-gray-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Timeline Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {job.started_at && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Started</p>
              <p className="font-medium text-gray-900">
                {format(new Date(job.started_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}
          
          {job.due_date && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Due Date</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {format(new Date(job.due_date), 'MMM d, yyyy')}
                </p>
              </div>
              {daysRemaining !== null && (
                <p className={`text-xs mt-1 ${daysRemaining <= 0 ? 'text-red-600' : daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {daysRemaining <= 0 
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0 
                    ? 'Due today'
                    : `${daysRemaining} days left`}
                </p>
              )}
            </div>
          )}

          {job.completed_at && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Completed</p>
              <p className="font-medium text-green-600">
                {format(new Date(job.completed_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {job.value && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Value</p>
              <p className="font-medium text-gray-900">
                {job.currency === 'USD' ? '$' : ''}{job.value.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Priority Badge */}
        {job.priority && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            <StatusBadge type="priority" value={job.priority} />
          </div>
        )}

        {/* Additional Details */}
        {job.estimated_hours && (
          <div className="text-sm">
            <p className="text-gray-500">
              Estimated Time: <span className="font-medium text-gray-900">{job.estimated_hours} hours</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}