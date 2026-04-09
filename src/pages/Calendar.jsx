import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Clock,
  AlertTriangle,
  Briefcase
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isToday } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge';
import { JobsEmptyState } from '../components/ui/EmptyState';

const STATUS_ORDER = ['draft', 'pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold'];

export default function Calendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['jobs-calendar', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      return await base44.entities.Job.filter(filter, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const updateDueDateMutation = useMutation({
    mutationFn: async ({ jobId, newDueDate }) => {
      return await base44.entities.Job.update(jobId, { 
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs-calendar']);
      toast.success('Job due date updated');
    },
    onError: (error) => {
      toast.error('Failed to update due date: ' + error.message);
    }
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const jobId = result.draggableId;
    const newDate = result.destination.droppableId;
    
    updateDueDateMutation.mutate({
      jobId,
      newDueDate: newDate
    });
  };

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    }
  }, [currentDate, viewMode]);

  const getJobsForDate = (date) => {
    return jobs.filter(job => {
      if (!job.due_date) return false;
      return isSameDay(new Date(job.due_date), date);
    });
  };

  const navigatePeriod = (direction) => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">
            Schedule and manage jobs by due date
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="min-w-[100px]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigatePeriod('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(startOfWeek(currentDate), 'MMM d')}`
              }
            </span>
          </div>

          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Month
                </div>
              </SelectItem>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Week
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DragDropContext onDragEnd={handleDragEnd}>
            {viewMode === 'month' ? (
              <div className="border">
                {/* Week day headers */}
                <div className="grid grid-cols-7 border-b">
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 bg-gray-50 border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((date, index) => {
                    const dayJobs = getJobsForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isTodayDate = isToday(date);

                    return (
                      <Droppable 
                        key={date.toISOString()} 
                        droppableId={format(date, 'yyyy-MM-dd')}
                        type="JOB"
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[120px] p-2 border-r border-b last:border-r-0 transition-colors ${
                              !isCurrentMonth ? 'bg-gray-50' : 
                              snapshot.isDraggingOver ? 'bg-blue-50' : 
                              'bg-white'
                            }`}
                          >
                            <div className={`text-sm font-medium mb-1 ${
                              isTodayDate 
                                ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                                : !isCurrentMonth 
                                ? 'text-gray-400' 
                                : 'text-gray-700'
                            }`}>
                              {format(date, 'd')}
                            </div>
                            
                            <div className="space-y-1">
                              {dayJobs.map((job, jobIndex) => (
                                <Draggable 
                                  key={job.id} 
                                  draggableId={job.id} 
                                  index={jobIndex}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-all ${
                                        snapshot.isDragging 
                                          ? 'shadow-lg opacity-80 bg-white' 
                                          : job.status === 'completed'
                                          ? 'bg-green-100 border border-green-200'
                                          : job.priority === 'urgent'
                                          ? 'bg-red-100 border border-red-200'
                                          : job.priority === 'high'
                                          ? 'bg-orange-100 border border-orange-200'
                                          : 'bg-blue-100 border border-blue-200'
                                      }`}
                                      onClick={() => navigate(createPageUrl('JobDetail') + `?id=${job.id}`)}
                                    >
                                      <div className="font-medium truncate">{job.title}</div>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Badge variant="outline" className="text-[9px] px-0.5 py-0 h-4">
                                          {job.status.replace(/_/g, ' ')}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="border">
                {/* Week day headers with date */}
                <div className="grid grid-cols-7 border-b">
                  {calendarDays.map(date => (
                    <div 
                      key={date.toISOString()} 
                      className={`p-3 text-center border-r last:border-r-0 ${
                        isToday(date) ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-600">
                        {weekDays[date.getDay()]}
                      </div>
                      <div className={`text-2xl font-bold ${
                        isToday(date) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week view with job lists */}
                <div className="grid grid-cols-7 min-h-[600px]">
                  {calendarDays.map(date => {
                    const dayJobs = getJobsForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentDate);

                    return (
                      <Droppable 
                        key={date.toISOString()} 
                        droppableId={format(date, 'yyyy-MM-dd')}
                        type="JOB"
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-2 border-r last:border-r-0 min-h-[600px] transition-colors ${
                              !isCurrentMonth ? 'bg-gray-50' : 
                              snapshot.isDraggingOver ? 'bg-blue-50' : 
                              'bg-white'
                            }`}
                          >
                            <div className="space-y-2">
                              {dayJobs.map((job, jobIndex) => (
                                <Draggable 
                                  key={job.id} 
                                  draggableId={job.id} 
                                  index={jobIndex}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all border ${
                                        snapshot.isDragging 
                                          ? 'shadow-lg opacity-80 bg-white border-blue-300' 
                                          : job.status === 'completed'
                                          ? 'bg-green-50 border-green-200 hover:shadow-md'
                                          : job.priority === 'urgent'
                                          ? 'bg-red-50 border-red-200 hover:shadow-md'
                                          : job.priority === 'high'
                                          ? 'bg-orange-50 border-orange-200 hover:shadow-md'
                                          : 'bg-blue-50 border-blue-200 hover:shadow-md'
                                      }`}
                                      onClick={() => navigate(createPageUrl('JobDetail') + `?id=${job.id}`)}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <Briefcase className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                          job.priority === 'urgent' ? 'text-red-600' :
                                          job.priority === 'high' ? 'text-orange-600' :
                                          'text-blue-600'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">{job.title}</div>
                                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                                            <StatusBadge status={job.status} size="sm" />
                                            {job.priority && (
                                              <PriorityBadge priority={job.priority} size="sm" />
                                            )}
                                          </div>
                                          {job.assigned_to && (
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                              {job.assigned_to.split('@')[0]}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {job.value && (
                                        <div className="text-xs font-semibold text-gray-700 mt-2">
                                          ${Number(job.value).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );
                  })}
                </div>
              </div>
            )}
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="font-semibold text-gray-600">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
              <span>Normal Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Drag jobs to reschedule</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}