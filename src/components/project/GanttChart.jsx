import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';

export default function GanttChart({ tasks = [], job }) {
  const timelineData = useMemo(() => {
    if (tasks.length === 0) return null;

    const allDates = tasks
      .flatMap(t => [t.start_date, t.due_date])
      .filter(Boolean)
      .map(d => new Date(d));

    if (allDates.length === 0) return null;

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    const start = startOfMonth(minDate);
    const end = endOfMonth(maxDate);
    const days = eachDayOfInterval({ start, end });

    return { start, end, days, totalDays: differenceInDays(end, start) + 1 };
  }, [tasks]);

  if (!timelineData) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Add task dates to see Gantt chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTaskPosition = (task) => {
    if (!task.start_date || !task.due_date) return null;

    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.due_date);

    const startOffset = differenceInDays(taskStart, timelineData.start);
    const duration = differenceInDays(taskEnd, taskStart) + 1;

    const leftPercent = (startOffset / timelineData.totalDays) * 100;
    const widthPercent = (duration / timelineData.totalDays) * 100;

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  const statusColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    blocked: 'bg-red-500'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Gantt Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            {/* Timeline header */}
            <div className="flex border-b mb-4">
              <div className="w-48 flex-shrink-0 font-medium text-sm text-gray-500 p-2">
                Task
              </div>
              <div className="flex-1 flex">
                {timelineData.days.filter((_, i) => i % 7 === 0).map((day, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-gray-500 p-2 border-l">
                    {format(day, 'MMM d')}
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            <div className="space-y-2">
              {tasks.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div key={task.id} className="flex items-center group">
                    <div className="w-48 flex-shrink-0 text-sm p-2">
                      <p className="truncate font-medium">{task.title}</p>
                      {task.assigned_to && (
                        <p className="text-xs text-gray-500 truncate">
                          {task.assigned_to.split('@')[0]}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 relative h-12 border-l">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {timelineData.days.filter((_, i) => i % 7 === 0).map((_, i) => (
                          <div key={i} className="flex-1 border-l border-gray-100" />
                        ))}
                      </div>
                      {/* Task bar */}
                      {position && (
                        <div
                          className={`absolute top-2 h-8 ${statusColors[task.status] || 'bg-gray-400'} rounded shadow-sm group-hover:shadow-md transition-shadow cursor-pointer`}
                          style={position}
                          title={`${task.title} (${format(new Date(task.start_date), 'MMM d')} - ${format(new Date(task.due_date), 'MMM d')})`}
                        >
                          <div className="px-2 py-1 text-white text-xs truncate">
                            {task.status === 'completed' && '✓ '}
                            {task.title}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t">
              <span className="text-sm text-gray-500">Status:</span>
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color}`} />
                  <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}