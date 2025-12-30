import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { useTenantBoundary } from '../components/common/TenantBoundary';
import { logAuditEvent } from '../components/common/AuditLogger';
import { RequireEditor } from '../components/common/PermissionGate';
import { DataTable } from '../components/ui/DataTable';
import { CustomersEmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Users, Mail, Phone, Building2, MapPin, 
  Tag, DollarSign, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Customers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  const { enforce, buildFilter } = useTenantBoundary();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    tier: 'standard',
    tags: []
  });

  const urlParams = new URLSearchParams(window.location.search);
  const showNewForm = urlParams.get('action') === 'new';

  React.useEffect(() => {
    if (showNewForm) {
      setShowCreateDialog(true);
    }
  }, [showNewForm]);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = buildFilter({});
      return await base44.entities.Customer.filter(filter, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const customerData = enforce(data);
      const customer = await base44.entities.Customer.create(customerData);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        actor_role: role,
        action: 'create',
        resource_type: 'customer',
        resource_id: customer.id,
        resource_name: customer.name
      });

      return customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowCreateDialog(false);
      setFormData({ name: '', email: '', phone: '', company: '', status: 'active', tier: 'standard', tags: [] });
      toast.success('Customer created successfully');
      if (showNewForm) {
        navigate(createPageUrl('Customers'));
      }
    },
    onError: (error) => {
      toast.error('Failed to create customer: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Customer.delete(id);
        await logAuditEvent({
          organization_id: currentOrgId,
          workspace_id: currentWorkspaceId,
          actor_email: user.email,
          actor_role: role,
          action: 'delete',
          resource_type: 'customer',
          resource_id: id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setSelectedRows([]);
      toast.success('Customers deleted');
    }
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-blue-700 font-semibold">
              {row.original.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.company && (
              <p className="text-sm text-gray-500">{row.original.company}</p>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          {row.original.email || '-'}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.tier || 'Standard'}
        </Badge>
      )
    },
    {
      accessorKey: 'lifetime_value',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-medium">
          ${(row.original.lifetime_value || 0).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'created_date',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-gray-500 text-sm">
          {format(new Date(row.original.created_date), 'MMM d, yyyy')}
        </span>
      )
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">
            Manage your customer relationships
          </p>
        </div>
        <RequireEditor>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </RequireEditor>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={customers}
            isLoading={isLoading}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            onRowClick={(row) => navigate(createPageUrl('CustomerDetail') + `?id=${row.id}`)}
            onDelete={(ids) => deleteMutation.mutate(ids)}
            emptyState={<CustomersEmptyState onAdd={() => setShowCreateDialog(true)} />}
            searchPlaceholder="Search customers..."
          />
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open && showNewForm) {
          navigate(createPageUrl('Customers'));
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Acme Inc."
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}