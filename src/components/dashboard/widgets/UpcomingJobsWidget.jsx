import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function UpcomingJobsWidget({ widget }) {
  const { currentOrgId, currentWorkspaceId } = useTenant();
  const dateRange = widget?.filters?.date_range || 'week';

  const { data: jobs = [] } = useQuery({
    queryKey: ['upcomingJobs', currentOrgId, currentWorkspaceId, dateRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch(dateRange) {
        case 'today': endDate.setHours(23,59,59); break;
        case 'week': endDate.setDate(endDate.getDate() + 7); break;
        case 'month': endDate.setMonth(endDate.getMonth() + 1); break;
        default: break;
      }

      const results = await base44.entities.Job.filter({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId || undefined,
        status: { $in: ['pending', 'in_progress'] }
      }, 'due_date', widget?.filters?.limit || 10);

      return results.filter(j => j.due_date && new Date(j.due_date) <= endDate);
    },
    enabled: !!currentOrgId
  });

  const getPriorityColor = (priority) => {
    return {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }[priority];
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Upcoming Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming jobs</p>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="p-2 border rounded text-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{job.title}</p>
                    <p className="text-xs text-gray-600">{job.reference_number}</p>
                  </div>
                  <Badge className={getPriorityColor(job.priority)} variant="secondary">
                    {job.priority}
                  </Badge>
                </div>
                {job.due_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Due {formatDistanceToNow(new Date(job.due_date), { addSuffix: true })}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}