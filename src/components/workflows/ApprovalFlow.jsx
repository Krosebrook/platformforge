import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ApprovalFlow({ jobId, organizationId }) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState({});

  const { data: approvals = [] } = useQuery({
    queryKey: ['workflowApprovals', jobId],
    queryFn: async () => {
      return await base44.entities.WorkflowApproval.filter({
        job_id: jobId,
        status: 'pending'
      });
    },
    enabled: !!jobId
  });

  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, approverEmail, decision, approverComments }) => {
      const approvals = await base44.entities.WorkflowApproval.filter({ id: approvalId });
      const approval = approvals[0];
      
      const updatedApprovers = approval.approvers.map(a => 
        a.email === approverEmail 
          ? { ...a, status: decision, decided_at: new Date().toISOString(), comments: approverComments }
          : a
      );

      // Check if approval is complete
      let newStatus = 'pending';
      if (approval.approval_type === 'any' && decision === 'approved') {
        newStatus = 'approved';
      } else if (approval.approval_type === 'any' && decision === 'rejected') {
        newStatus = 'rejected';
      } else if (approval.approval_type === 'all') {
        const allApproved = updatedApprovers.every(a => a.status === 'approved');
        const anyRejected = updatedApprovers.some(a => a.status === 'rejected');
        if (allApproved) newStatus = 'approved';
        if (anyRejected) newStatus = 'rejected';
      }

      await base44.entities.WorkflowApproval.update(approvalId, {
        approvers: updatedApprovers,
        status: newStatus,
        completed_at: newStatus !== 'pending' ? new Date().toISOString() : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflowApprovals']);
      toast.success('Approval recorded');
      setComments({});
    }
  });

  if (approvals.length === 0) return null;

  return (
    <div className="space-y-4">
      {approvals.map(approval => (
        <Card key={approval.id} className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Approval Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{approval.reason}</p>

            <div className="space-y-3">
              <p className="text-sm font-medium">Approvers:</p>
              {approval.approvers.map((approver, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{approver.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {approver.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {approver.status === 'approved' && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      {approver.status === 'rejected' && (
                        <Badge className="text-xs bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                      {approver.decided_at && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(approver.decided_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    {approver.comments && (
                      <p className="text-xs text-gray-600 mt-1">{approver.comments}</p>
                    )}

                    {approver.status === 'pending' && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Comments (optional)"
                          value={comments[approver.email] || ''}
                          onChange={(e) => setComments({ ...comments, [approver.email]: e.target.value })}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({
                              approvalId: approval.id,
                              approverEmail: approver.email,
                              decision: 'approved',
                              approverComments: comments[approver.email]
                            })}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => approveMutation.mutate({
                              approvalId: approval.id,
                              approverEmail: approver.email,
                              decision: 'rejected',
                              approverComments: comments[approver.email]
                            })}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {approval.auto_approve_at && (
              <p className="text-xs text-gray-500">
                Auto-approves on {format(new Date(approval.auto_approve_at), 'PPP')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}