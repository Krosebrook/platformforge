import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { ApprovalRequestCard, processApprovalDecision } from '../components/common/ApprovalFlow';
import { RequireFeature } from '../components/common/PermissionGate';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function Approvals() {
  const queryClient = useQueryClient();
  const { currentOrgId, user, isAdmin, hasFeature } = useTenant();
  const [activeTab, setActiveTab] = useState('pending');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.ApprovalRequest.filter(
        { organization_id: currentOrgId },
        '-created_date'
      );
    },
    enabled: !!currentOrgId && hasFeature('approvals')
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ requestId, decision, reason }) => {
      return await processApprovalDecision(requestId, decision, reason, user.email);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['approvals']);
      toast.success(`Request ${result.status}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'approved') return a.status === 'approved';
    if (activeTab === 'rejected') return a.status === 'rejected';
    return true;
  });

  const stats = {
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    expired: approvals.filter(a => a.status === 'expired').length
  };

  const canApprove = (request) => {
    if (!isAdmin) return false;
    if (request.requester_email === user.email) return false;
    return request.approvers?.includes(user.email) || isAdmin;
  };

  const handleDecision = async (requestId, decision, reason) => {
    await decisionMutation.mutateAsync({ requestId, decision, reason });
  };

  return (
    <RequireFeature feature="approvals" showMessage>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
            <p className="text-gray-500 mt-1">
              Review and approve pending requests
            </p>
          </div>
          {stats.pending > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pending} pending
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab('pending')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab('approved')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveTab('rejected')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expired</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No requests</h3>
                <p className="text-gray-500 mt-1">
                  {activeTab === 'pending' 
                    ? 'There are no pending approval requests'
                    : `No ${activeTab} requests found`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApprovals.map(request => (
                  <ApprovalRequestCard
                    key={request.id}
                    request={request}
                    onDecision={handleDecision}
                    canApprove={canApprove(request)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireFeature>
  );
}