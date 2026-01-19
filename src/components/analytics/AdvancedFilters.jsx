import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, X, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedFilters({ filters, onFilterChange, onExport }) {
  const { currentOrgId } = useTenant();

  const { data: members = [] } = useQuery({
    queryKey: ['members', currentOrgId],
    queryFn: async () => {
      const memberships = await base44.entities.Membership.filter({
        organization_id: currentOrgId,
        status: 'active'
      });
      return memberships;
    },
    enabled: !!currentOrgId
  });

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      customer_tier: 'all',
      assigned_to: 'all',
      date_from: '',
      date_to: ''
    });
  };

  const hasActiveFilters = filters.status !== 'all' || 
    filters.customer_tier !== 'all' || 
    filters.assigned_to !== 'all' ||
    filters.date_from || 
    filters.date_to;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Filters</span>
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Date From</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Date To</Label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Customer Tier</Label>
              <Select
                value={filters.customer_tier || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, customer_tier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Assigned To</Label>
              <Select
                value={filters.assigned_to || 'all'}
                onValueChange={(value) => onFilterChange({ ...filters, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.user_email} value={member.user_email}>
                      {member.user_email.split('@')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}