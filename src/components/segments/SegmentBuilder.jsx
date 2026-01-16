import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';

export default function SegmentBuilder({ open, onClose, segment, organizationId, workspaceId, customers, onSuccess }) {
  const [formData, setFormData] = useState({
    name: segment?.name || '',
    description: segment?.description || '',
    filters: segment?.filters || {
      customer_type: [],
      tier: [],
      tags: [],
      status: [],
      min_lifetime_value: '',
      max_lifetime_value: '',
      has_jobs: undefined
    }
  });

  const customerTypes = ['individual', 'small_business', 'enterprise', 'government', 'nonprofit', 'educational', 'startup', 'retail', 'wholesale', 'partner'];
  const tiers = ['standard', 'premium', 'vip'];
  const statuses = ['active', 'inactive', 'churned', 'prospect'];
  const allTags = [...new Set(customers.flatMap(c => c.tags || []))];

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (segment) {
        return await base44.entities.CustomerSegment.update(segment.id, data);
      } else {
        return await base44.entities.CustomerSegment.create({
          organization_id: organizationId,
          workspace_id: workspaceId,
          ...data
        });
      }
    },
    onSuccess: () => {
      toast.success(segment ? 'Segment updated' : 'Segment created');
      onSuccess();
    }
  });

  const toggleFilter = (filterType, value) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: prev.filters[filterType].includes(value)
          ? prev.filters[filterType].filter(v => v !== value)
          : [...prev.filters[filterType], value]
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit Segment' : 'Create New Segment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Segment Name</Label>
            <Input
              placeholder="e.g., Enterprise Customers"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe this segment..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <h3 className="font-medium">Filters</h3>

            <div className="space-y-2">
              <Label>Customer Type</Label>
              <div className="flex flex-wrap gap-2">
                {customerTypes.map(type => (
                  <Badge
                    key={type}
                    variant={formData.filters.customer_type.includes(type) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFilter('customer_type', type)}
                  >
                    {type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tier</Label>
              <div className="flex flex-wrap gap-2">
                {tiers.map(tier => (
                  <Badge
                    key={tier}
                    variant={formData.filters.tier.includes(tier) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleFilter('tier', tier)}
                  >
                    {tier}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                  <Badge
                    key={status}
                    variant={formData.filters.status.includes(status) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleFilter('status', status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFilter('tags', tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Lifetime Value ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.filters.min_lifetime_value}
                  onChange={(e) => setFormData({
                    ...formData,
                    filters: { ...formData.filters, min_lifetime_value: e.target.value ? parseFloat(e.target.value) : '' }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Lifetime Value ($)</Label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={formData.filters.max_lifetime_value}
                  onChange={(e) => setFormData({
                    ...formData,
                    filters: { ...formData.filters, max_lifetime_value: e.target.value ? parseFloat(e.target.value) : '' }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has_jobs"
                checked={formData.filters.has_jobs === true}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  filters: { ...formData.filters, has_jobs: checked ? true : undefined }
                })}
              />
              <Label htmlFor="has_jobs">Has at least one job</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => saveMutation.mutate(formData)}
            disabled={!formData.name || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : segment ? 'Update' : 'Create'} Segment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}