/**
 * Customer Interaction Tracker
 * Log and manage customer interactions (calls, emails, meetings)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Phone, Mail, Users, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const INTERACTION_ICONS = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText
};

export default function InteractionTracker({ customerId }) {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    notes: '',
    outcome: 'neutral',
    duration_minutes: 0,
    interaction_date: new Date().toISOString().slice(0, 16)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['customerInteractions', customerId],
    queryFn: async () => {
      return await base44.entities.CustomerInteraction.filter({
        customer_id: customerId
      }, '-interaction_date');
    },
    enabled: !!customerId
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.CustomerInteraction.create({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        customer_id: customerId,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customerInteractions']);
      setShowDialog(false);
      setFormData({
        type: 'call',
        subject: '',
        notes: '',
        outcome: 'neutral',
        duration_minutes: 0,
        interaction_date: new Date().toISOString().slice(0, 16)
      });
      toast.success('Interaction logged');
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Interaction History</CardTitle>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Log Interaction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No interactions logged yet</p>
        ) : (
          <div className="space-y-3">
            {interactions.map(interaction => {
              const Icon = INTERACTION_ICONS[interaction.type] || FileText;
              return (
                <div key={interaction.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{interaction.subject}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {interaction.outcome}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{interaction.notes}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(interaction.interaction_date), 'MMM d, yyyy h:mm a')}
                      {interaction.duration_minutes > 0 && ` • ${interaction.duration_minutes} min`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Customer Interaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(type) => setFormData({ ...formData, type })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Brief summary"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Detailed notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select value={formData.outcome} onValueChange={(outcome) => setFormData({ ...formData, outcome })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="follow_up_needed">Follow-up Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.type === 'call' || formData.type === 'meeting') && (
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={formData.interaction_date}
                onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => addInteractionMutation.mutate(formData)} disabled={!formData.subject || addInteractionMutation.isPending}>
              {addInteractionMutation.isPending ? 'Saving...' : 'Log Interaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}