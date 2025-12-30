import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Mail, Phone, Building2, MapPin, 
  Edit, Save, Briefcase, DollarSign, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CustomerDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, user, role } = useTenant();
  
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('id');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const customers = await base44.entities.Customer.filter({ id: customerId });
      return customers[0];
    },
    enabled: !!customerId,
    onSuccess: (data) => {
      setFormData(data || {});
    }
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['customerJobs', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      return await base44.entities.Job.filter({ customer_id: customerId });
    },
    enabled: !!customerId
  });

  React.useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Customer.update(customerId, data);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'update',
        resource_type: 'customer',
        resource_id: customerId,
        resource_name: data.name,
        changes: {
          before: customer,
          after: data
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customer', customerId]);
      setIsEditing(false);
      toast.success('Customer updated');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Link to={createPageUrl('Customers')}>
          <Button className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const totalValue = jobs.reduce((sum, job) => sum + (job.value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500">Customer since {format(new Date(customer.created_date), 'MMMM yyyy')}</p>
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => {
            if (isEditing) {
              updateMutation.mutate(formData);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                    {customer.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {isEditing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-semibold"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold">{customer.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={customer.status} size="sm" />
                    <Badge variant="outline" className="capitalize">{customer.tier}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {customer.email || '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {customer.phone || '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Company</Label>
                  {isEditing ? (
                    <Input
                      value={formData.company || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    />
                  ) : (
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {customer.company || '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status || 'active'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="churned">Churned</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={customer.status} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jobs ({jobs.length})</CardTitle>
                <Link to={createPageUrl('Jobs') + `?action=new&customer=${customerId}`}>
                  <Button size="sm">Create Job</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No jobs for this customer</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map(job => (
                    <Link 
                      key={job.id}
                      to={createPageUrl('JobDetail') + `?id=${job.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-gray-500">{job.reference_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={job.status} size="sm" />
                        {job.value && (
                          <span className="font-medium">${job.value.toLocaleString()}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Jobs</span>
                <span className="font-bold">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total Value</span>
                <span className="font-bold">${totalValue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Active Jobs</span>
                <span className="font-bold">
                  {jobs.filter(j => ['pending', 'in_progress'].includes(j.status)).length}
                </span>
              </div>
            </CardContent>
          </Card>

          <ActivityFeed 
            resourceType="customer" 
            resourceId={customerId} 
            limit={10}
            maxHeight="300px"
          />
        </div>
      </div>
    </div>
  );
}