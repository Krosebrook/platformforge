import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from './TenantContext';
import { logAuditEvent } from './AuditLogger';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export async function createApprovalRequest({
  organization_id,
  workspace_id,
  request_type,
  requester_email,
  resource_type,
  resource_id,
  resource_snapshot,
  requested_changes,
  reason,
  approvers,
  expires_in_hours = 72
}) {
  const idempotency_key = `${request_type}-${resource_type}-${resource_id}-${Date.now()}`;
  
  const existing = await base44.entities.ApprovalRequest.filter({
    organization_id,
    resource_type,
    resource_id,
    status: 'pending'
  });

  if (existing.length > 0) {
    throw new Error('A pending approval request already exists for this resource');
  }

  const expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString();

  const request = await base44.entities.ApprovalRequest.create({
    organization_id,
    workspace_id,
    request_type,
    requester_email,
    resource_type,
    resource_id,
    resource_snapshot,
    requested_changes,
    reason,
    approvers,
    expires_at,
    idempotency_key,
    status: 'pending'
  });

  await logAuditEvent({
    organization_id,
    workspace_id,
    actor_email: requester_email,
    action: 'create',
    resource_type: 'approval_request',
    resource_id: request.id,
    resource_name: `${request_type} request`,
    metadata: { reason }
  });

  return request;
}

export async function processApprovalDecision(requestId, decision, decisionReason, approverEmail) {
  const requests = await base44.entities.ApprovalRequest.filter({ id: requestId });
  const request = requests[0];
  
  if (!request) {
    throw new Error('Approval request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('This request has already been processed');
  }

  if (new Date(request.expires_at) < new Date()) {
    await base44.entities.ApprovalRequest.update(requestId, { status: 'expired' });
    throw new Error('This request has expired');
  }

  if (!request.approvers.includes(approverEmail)) {
    throw new Error('You are not authorized to approve this request');
  }

  const updateData = {
    status: decision,
    decision_reason: decisionReason,
    ...(decision === 'approved' 
      ? { approved_by: approverEmail, approved_at: new Date().toISOString() }
      : { rejected_by: approverEmail, rejected_at: new Date().toISOString() }
    )
  };

  await base44.entities.ApprovalRequest.update(requestId, updateData);

  await logAuditEvent({
    organization_id: request.organization_id,
    workspace_id: request.workspace_id,
    actor_email: approverEmail,
    action: decision === 'approved' ? 'approve' : 'reject',
    resource_type: 'approval_request',
    resource_id: requestId,
    resource_name: `${request.request_type} request`,
    metadata: { 
      decision_reason: decisionReason,
      original_requester: request.requester_email
    }
  });

  return { ...request, ...updateData };
}

export function ApprovalRequestCard({ request, onDecision, canApprove }) {
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decision, setDecision] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const statusConfig = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    expired: { icon: AlertTriangle, color: 'bg-gray-100 text-gray-800', label: 'Expired' },
    cancelled: { icon: XCircle, color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
  };

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const handleDecision = async () => {
    setProcessing(true);
    try {
      await onDecision(request.id, decision, decisionReason);
      setShowDecisionDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg capitalize">
                {request.request_type.replace(/_/g, ' ')} Request
              </CardTitle>
              <CardDescription>
                Requested by {request.requester_email} on {format(new Date(request.created_date), 'PPp')}
              </CardDescription>
            </div>
            <Badge className={status.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Resource</p>
              <p className="text-sm">{request.resource_type}: {request.resource_id}</p>
            </div>
            
            {request.reason && (
              <div>
                <p className="text-sm font-medium text-gray-500">Reason</p>
                <p className="text-sm">{request.reason}</p>
              </div>
            )}

            {request.status === 'pending' && (
              <div>
                <p className="text-sm font-medium text-gray-500">Expires</p>
                <p className="text-sm">{format(new Date(request.expires_at), 'PPp')}</p>
              </div>
            )}

            {request.decision_reason && (
              <div>
                <p className="text-sm font-medium text-gray-500">Decision Reason</p>
                <p className="text-sm">{request.decision_reason}</p>
              </div>
            )}

            {request.status === 'pending' && canApprove && (
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => { setDecision('approved'); setShowDecisionDialog(true); }}
                >
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => { setDecision('rejected'); setShowDecisionDialog(true); }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'approved' ? 'Approve' : 'Reject'} Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for your decision. This will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for your decision..."
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDecision}
              disabled={!decisionReason.trim() || processing}
              className={decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? 'Processing...' : decision === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useApprovalRequired(requestType) {
  const { organization, hasFeature } = useTenant();
  
  const requiresApproval = (resource) => {
    if (!hasFeature('approvals')) return false;
    
    const settings = organization?.settings || {};
    
    switch (requestType) {
      case 'deletion':
        return settings.require_approval_for_deletion !== false;
      case 'high_value_job':
        return resource?.value > 10000;
      default:
        return false;
    }
  };

  return { requiresApproval };
}