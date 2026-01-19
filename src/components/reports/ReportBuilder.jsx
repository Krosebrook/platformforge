/**
 * Report Builder Component
 * Configure custom reports with metrics, filters, and visualizations
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'scatter', label: 'Scatter Plot', icon: '⚫' },
  { value: 'heatmap', label: 'Heat Map', icon: '🔥' },
  { value: 'area', label: 'Area Chart', icon: '📉' }
];

const AVAILABLE_METRICS = [
  'total_jobs',
  'completed_jobs',
  'in_progress_jobs',
  'overdue_jobs',
  'total_value',
  'completed_value',
  'avg_completion_time',
  'on_time_rate',
  'customer_count',
  'revenue_by_month'
];

export default function ReportBuilder({ open, onClose, report, organizationId, workspaceId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: report?.name || '',
    description: report?.description || '',
    chart_type: report?.chart_type || 'bar',
    metrics: report?.metrics || [],
    filters: report?.filters || {},
    schedule: report?.schedule || { enabled: false, frequency: 'weekly', recipients: [] }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (report) {
        return await base44.entities.SavedReport.update(report.id, data);
      } else {
        return await base44.entities.SavedReport.create({
          organization_id: organizationId,
          workspace_id: workspaceId,
          ...data
        });
      }
    },
    onSuccess: () => {
      toast.success(report ? 'Report updated' : 'Report created');
      onSuccess();
    }
  });

  const toggleMetric = (metric) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{report ? 'Edit Report' : 'Create Custom Report'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                placeholder="e.g., Monthly Performance Report"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this report show?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {CHART_TYPES.map(type => (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, chart_type: type.value })}
                    className={`p-4 border rounded-lg cursor-pointer text-center transition ${
                      formData.chart_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <p className="text-sm font-medium">{type.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {AVAILABLE_METRICS.map(metric => (
                  <div key={metric} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.metrics.includes(metric)}
                      onCheckedChange={() => toggleMetric(metric)}
                    />
                    <Label className="capitalize cursor-pointer" onClick={() => toggleMetric(metric)}>
                      {metric.replace(/_/g, ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Schedule Email Delivery</CardTitle>
                <Switch
                  checked={formData.schedule.enabled}
                  onCheckedChange={(enabled) => setFormData({
                    ...formData,
                    schedule: { ...formData.schedule, enabled }
                  })}
                />
              </div>
            </CardHeader>
            {formData.schedule.enabled && (
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.schedule.frequency}
                    onValueChange={(frequency) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, frequency }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Recipients (comma-separated emails)</Label>
                  <Input
                    placeholder="email1@example.com, email2@example.com"
                    value={formData.schedule.recipients?.join(', ') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: {
                        ...formData.schedule,
                        recipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }
                    })}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => saveMutation.mutate(formData)}
            disabled={!formData.name || formData.metrics.length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : report ? 'Update' : 'Create'} Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}