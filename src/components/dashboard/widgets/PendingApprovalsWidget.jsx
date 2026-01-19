import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from 'lucide-react';

export default function PendingApprovalsWidget({ widget }) {
  const { currentOrgId, isAdmin } = useTenant();

  const { data: approvals = [] } = useQuery({
    queryKey: ['pendingApprovals', currentOrgId],
    queryFn: async () => {
      if (!isAdmin) return [];
      return await base44.entities.WorkflowApproval.filter({
        organization_id: currentOrgId,
        status: 'pending'
      }, '-created_date', widget?.filters?.limit || 10);
    },
    enabled: !!currentOrgId && isAdmin
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Pending Approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {approvals.length === 0 ? (
            <p className="text-sm text-gray-500">No pending approvals</p>
          ) : (
            approvals.map(approval => (
              <div key={approval.id} className="p-2 border rounded text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize">
                    {approval.workflow_id}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {approval.approvers?.filter(a => a.status === 'pending').length} pending
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}