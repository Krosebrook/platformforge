import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from '../ui/StatusBadge';
import { AlertTriangle, User, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'draft',       label: 'Draft',       color: 'bg-gray-100',   headerColor: 'bg-gray-200',   textColor: 'text-gray-700'  },
  { id: 'pending',     label: 'Pending',     color: 'bg-yellow-50',  headerColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50',    headerColor: 'bg-blue-100',   textColor: 'text-blue-800'  },
  { id: 'review',      label: 'Review',      color: 'bg-purple-50',  headerColor: 'bg-purple-100', textColor: 'text-purple-800' },
  { id: 'completed',   label: 'Completed',   color: 'bg-green-50',   headerColor: 'bg-green-100',  textColor: 'text-green-800' },
  { id: 'on_hold',     label: 'On Hold',     color: 'bg-orange-50',  headerColor: 'bg-orange-100', textColor: 'text-orange-800' },
];

function JobCard({ job, index, customers }) {
  const navigate = useNavigate();
  const isOverdue = job.due_date && new Date(job.due_date) < new Date() &&
    !['completed', 'cancelled'].includes(job.status);
  const customer = customers.find(c => c.id === job.customer_id);

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => navigate(createPageUrl('JobDetail') + `?id=${job.id}`)}
          className={`bg-white rounded-xl border p-3 cursor-pointer select-none space-y-2.5
            transition-shadow hover:shadow-md
            ${snapshot.isDragging ? 'shadow-xl rotate-1 border-gray-300' : 'shadow-sm'}
          `}
        >
          {/* Title + priority */}
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
              {job.title}
            </p>
            <PriorityBadge priority={job.priority} />
          </div>

          {/* Reference */}
          {job.reference_number && (
            <p className="text-xs text-gray-400 font-mono">{job.reference_number}</p>
          )}

          {/* Customer */}
          {customer && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{customer.name}</span>
            </div>
          )}

          {/* Footer row: value + due date */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50">
            {job.value ? (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <DollarSign className="w-3 h-3" />
                <span>{Number(job.value).toLocaleString()}</span>
              </div>
            ) : <span />}

            {job.due_date && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {isOverdue && <AlertTriangle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(job.due_date), 'MMM d')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ column, jobs, customers }) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${column.headerColor}`}>
        <span className={`text-sm font-semibold ${column.textColor}`}>{column.label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${column.textColor}`}>
          {jobs.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] rounded-b-xl p-2 space-y-2 transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : column.color}
            `}
          >
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} customers={customers} />
            ))}
            {provided.placeholder}
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-20 text-xs text-gray-400 italic">
                No jobs
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function JobKanbanBoard({ jobs, customers, onJobStatusChange }) {
  // Local board state for optimistic updates
  const [boardJobs, setBoardJobs] = useState(jobs);

  useEffect(() => {
    setBoardJobs(jobs);
  }, [jobs]);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const job = boardJobs.find(j => j.id === draggableId);
    if (!job) return;

    // Optimistic update
    setBoardJobs(prev => prev.map(j => j.id === draggableId ? { ...j, status: newStatus } : j));

    try {
      await base44.entities.Job.update(draggableId, {
        status: newStatus,
        workflow_state: {
          current_stage: newStatus,
          stage_entered_at: new Date().toISOString(),
        }
      });
      onJobStatusChange?.();
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`);
    } catch (err) {
      // Revert on failure
      setBoardJobs(prev => prev.map(j => j.id === draggableId ? { ...j, status: job.status } : j));
      toast.error('Failed to update job status');
    }
  };

  const getColumnJobs = (columnId) =>
    boardJobs.filter(j => j.status === columnId);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            jobs={getColumnJobs(column.id)}
            customers={customers}
          />
        ))}
      </div>
    </DragDropContext>
  );
}