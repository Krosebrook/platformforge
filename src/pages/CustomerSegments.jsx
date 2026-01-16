import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Filter, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SegmentBuilder from '../components/segments/SegmentBuilder';
import SegmentAnalytics from '../components/segments/SegmentAnalytics';
import BulkActionsDialog from '../components/segments/BulkActionsDialog';

export default function CustomerSegments() {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);

  const { data: segments = [] } = useQuery({
    queryKey: ['segments', currentOrgId],
    queryFn: async () => {
      return await base44.entities.CustomerSegment.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Customer.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Job.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CustomerSegment.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['segments']);
      toast.success('Segment deleted');
    }
  });

  const getSegmentCustomers = (segment) => {
    if (!segment?.filters) return [];
    
    return customers.filter(customer => {
      const filters = segment.filters;
      
      if (filters.customer_type?.length > 0 && !filters.customer_type.includes(customer.customer_type)) {
        return false;
      }
      
      if (filters.tier?.length > 0 && !filters.tier.includes(customer.tier)) {
        return false;
      }
      
      if (filters.status?.length > 0 && !filters.status.includes(customer.status)) {
        return false;
      }
      
      if (filters.tags?.length > 0) {
        const customerTags = customer.tags || [];
        if (!filters.tags.some(tag => customerTags.includes(tag))) {
          return false;
        }
      }
      
      if (filters.min_lifetime_value && (customer.lifetime_value || 0) < filters.min_lifetime_value) {
        return false;
      }
      
      if (filters.max_lifetime_value && (customer.lifetime_value || 0) > filters.max_lifetime_value) {
        return false;
      }
      
      if (filters.has_jobs !== undefined) {
        const hasJobs = jobs.some(j => j.customer_id === customer.id);
        if (filters.has_jobs !== hasJobs) {
          return false;
        }
      }
      
      return true;
    });
  };

  const segmentedCustomers = useMemo(() => {
    if (!selectedSegment) return [];
    return getSegmentCustomers(selectedSegment);
  }, [selectedSegment, customers, jobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Segments</h1>
          <p className="text-gray-500 mt-1">
            Create and manage targeted customer groups
          </p>
        </div>
        <Button onClick={() => {
          setEditingSegment(null);
          setShowBuilder(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Segments</p>
            <p className="text-2xl font-bold">{segments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Selected Segment</p>
            <p className="text-2xl font-bold">{segmentedCustomers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Avg Lifetime Value</p>
            <p className="text-2xl font-bold">
              ${(segmentedCustomers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / (segmentedCustomers.length || 1)).toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {segments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No segments yet</p>
                </div>
              ) : (
                segments.map(segment => {
                  const count = getSegmentCustomers(segment).length;
                  return (
                    <div
                      key={segment.id}
                      className={`p-3 border rounded-lg cursor-pointer transition ${
                        selectedSegment?.id === segment.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSegment(segment)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{segment.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(segment.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{segment.description}</p>
                      <Badge variant="secondary">{count} customers</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedSegment ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedSegment.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{selectedSegment.description}</p>
                    </div>
                    <Button onClick={() => setShowBulkActions(true)}>
                      <Mail className="w-4 h-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {segmentedCustomers.slice(0, 10).map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">
                              {customer.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {customer.customer_type}
                          </Badge>
                          <Badge className="capitalize">{customer.tier}</Badge>
                        </div>
                      </div>
                    ))}
                    {segmentedCustomers.length > 10 && (
                      <p className="text-center text-sm text-gray-500 pt-2">
                        And {segmentedCustomers.length - 10} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <SegmentAnalytics 
                customers={segmentedCustomers} 
                jobs={jobs.filter(j => segmentedCustomers.some(c => c.id === j.customer_id))}
              />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a segment to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SegmentBuilder
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        segment={editingSegment}
        organizationId={currentOrgId}
        workspaceId={currentWorkspaceId}
        customers={customers}
        onSuccess={() => {
          queryClient.invalidateQueries(['segments']);
          setShowBuilder(false);
        }}
      />

      {selectedSegment && (
        <BulkActionsDialog
          open={showBulkActions}
          onClose={() => setShowBulkActions(false)}
          segment={selectedSegment}
          customers={segmentedCustomers}
          organizationId={currentOrgId}
          workspaceId={currentWorkspaceId}
        />
      )}
    </div>
  );
}