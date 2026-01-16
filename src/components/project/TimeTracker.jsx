import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Play, Square, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInSeconds } from 'date-fns';

export default function TimeTracker({ jobId, organizationId, workspaceId, userEmail }) {
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    hours: '',
    is_billable: true
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['timeEntries', jobId],
    queryFn: async () => {
      return await base44.entities.TimeEntry.filter({ job_id: jobId }, '-start_time');
    },
    enabled: !!jobId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TimeEntry.create({
        organization_id: organizationId,
        workspace_id: workspaceId,
        job_id: jobId,
        user_email: userEmail,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries', jobId]);
      setFormData({ description: '', hours: '', is_billable: true });
      setShowAddDialog(false);
      toast.success('Time logged');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.TimeEntry.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries', jobId]);
      toast.success('Entry deleted');
    }
  });

  React.useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(differenceInSeconds(new Date(), startTime));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const handleStartStop = () => {
    if (isTracking) {
      const hours = elapsedSeconds / 3600;
      setFormData({ ...formData, hours: hours.toFixed(2) });
      setShowAddDialog(true);
      setIsTracking(false);
      setElapsedSeconds(0);
      setStartTime(null);
    } else {
      setIsTracking(true);
      setStartTime(new Date());
      setElapsedSeconds(0);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Tracking
            </CardTitle>
            <Badge variant="secondary">{totalHours.toFixed(1)}h logged</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Timer</p>
              <p className="text-3xl font-mono font-bold">
                {formatTime(elapsedSeconds)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="lg"
                variant={isTracking ? 'destructive' : 'default'}
                onClick={handleStartStop}
              >
                {isTracking ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Entries</p>
            {timeEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group">
                <div className="flex-1">
                  <p className="text-sm">{entry.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {format(new Date(entry.start_time || entry.created_date), 'MMM d, h:mm a')}
                    </span>
                    {entry.is_billable && (
                      <Badge variant="outline" className="text-xs">Billable</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">{entry.hours.toFixed(2)}h</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => deleteMutation.mutate(entry.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What did you work on?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                step="0.25"
                placeholder="0.00"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={formData.is_billable}
                onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="billable">Billable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({
                ...formData,
                hours: parseFloat(formData.hours),
                start_time: new Date().toISOString()
              })}
              disabled={!formData.hours}
            >
              Log Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}