import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ReportBuilder({ config = {}, onChange }) {
  const [config_state, setConfig] = useState({
    name: config.name || '',
    report_type: config.report_type || 'summary',
    data_source: config.data_source || { entity_type: 'Job', selected_fields: [] },
    filters: config.filters || {},
    grouping: config.grouping || {},
    visualization: config.visualization || { chart_type: 'table', show_totals: true },
    ...config
  });

  const ENTITY_FIELDS = {
    Job: ['title', 'status', 'priority', 'due_date', 'value', 'assigned_to', 'customer_id', 'completion_rate'],
    Customer: ['name', 'email', 'status', 'tier', 'lifetime_value', 'assigned_to', 'company'],
    Task: ['title', 'status', 'priority', 'estimated_hours', 'assigned_to', 'due_date', 'job_id'],
    TimeEntry: ['hours', 'is_billable', 'user_email', 'job_id', 'task_id', 'hourly_rate'],
    CustomerInteraction: ['type', 'outcome', 'duration_minutes', 'customer_id', 'interaction_date']
  };

  const updateConfig = (path, value) => {
    const newConfig = { ...config_state };
    const keys = path.split('.');
    let obj = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] = obj[keys[i]] || {};
    }
    obj[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    onChange(newConfig);
  };

  const toggleField = (field) => {
    const fields = config_state.data_source.selected_fields || [];
    const updated = fields.includes(field)
      ? fields.filter(f => f !== field)
      : [...fields, field];
    updateConfig('data_source.selected_fields', updated);
  };

  return (
    <Tabs defaultValue="data" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="data">Data Source</TabsTrigger>
        <TabsTrigger value="filters">Filters</TabsTrigger>
        <TabsTrigger value="grouping">Grouping</TabsTrigger>
        <TabsTrigger value="viz">Visualization</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="space-y-4">
        <div className="space-y-2">
          <Label>Report Name</Label>
          <Input
            value={config_state.name}
            onChange={(e) => updateConfig('name', e.target.value)}
            placeholder="e.g., Monthly Job Performance"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <Select value={config_state.data_source.entity_type} onValueChange={(v) => updateConfig('data_source.entity_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ENTITY_FIELDS).map(entity => (
                  <SelectItem key={entity} value={entity}>{entity}s</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={config_state.report_type} onValueChange={(v) => updateConfig('report_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="comparative">Comparative</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Select Fields to Display</Label>
          <div className="grid grid-cols-2 gap-3">
            {ENTITY_FIELDS[config_state.data_source.entity_type]?.map(field => (
              <div key={field} className="flex items-center gap-2">
                <Checkbox
                  checked={config_state.data_source.selected_fields?.includes(field)}
                  onCheckedChange={() => toggleField(field)}
                />
                <Label className="font-normal capitalize cursor-pointer">{field.replace(/_/g, ' ')}</Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="filters" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={config_state.filters.date_range?.start_date || ''}
              onChange={(e) => updateConfig('filters.date_range.start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={config_state.filters.date_range?.end_date || ''}
              onChange={(e) => updateConfig('filters.date_range.end_date', e.target.value)}
            />
          </div>
        </div>

        {config_state.data_source.entity_type === 'Job' && (
          <>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="space-y-2">
                {['draft', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      checked={config_state.filters.status?.includes(status)}
                      onCheckedChange={(checked) => {
                        const statuses = config_state.filters.status || [];
                        updateConfig('filters.status', checked
                          ? [...statuses, status]
                          : statuses.filter(s => s !== status)
                        );
                      }}
                    />
                    <Label className="font-normal capitalize cursor-pointer">{status}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="space-y-2">
                {['low', 'medium', 'high', 'urgent'].map(priority => (
                  <div key={priority} className="flex items-center gap-2">
                    <Checkbox
                      checked={config_state.filters.priority?.includes(priority)}
                      onCheckedChange={(checked) => {
                        const priorities = config_state.filters.priority || [];
                        updateConfig('filters.priority', checked
                          ? [...priorities, priority]
                          : priorities.filter(p => p !== priority)
                        );
                      }}
                    />
                    <Label className="font-normal capitalize cursor-pointer">{priority}</Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="grouping" className="space-y-4">
        <div className="space-y-2">
          <Label>Group By</Label>
          <Select value={config_state.grouping.group_by_field || ''} onValueChange={(v) => updateConfig('grouping.group_by_field', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select grouping field" />
            </SelectTrigger>
            <SelectContent>
              {config_state.data_source.entity_type === 'Job' && (
                <>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="assigned_to">Assigned To</SelectItem>
                </>
              )}
              {config_state.data_source.entity_type === 'Customer' && (
                <>
                  <SelectItem value="tier">Tier</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aggregations</Label>
          <div className="space-y-2">
            {[
              { field: 'count', label: 'Count' },
              { field: 'value', label: 'Total Value' },
              { field: 'estimated_hours', label: 'Total Hours' }
            ].map(agg => (
              <div key={agg.field} className="flex items-center gap-2">
                <Checkbox
                  checked={config_state.grouping.aggregations?.some(a => a.field === agg.field)}
                  onCheckedChange={(checked) => {
                    const aggs = config_state.grouping.aggregations || [];
                    updateConfig('grouping.aggregations', checked
                      ? [...aggs, { field: agg.field, function: 'sum' }]
                      : aggs.filter(a => a.field !== agg.field)
                    );
                  }}
                />
                <Label className="font-normal cursor-pointer">{agg.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="viz" className="space-y-4">
        <div className="space-y-2">
          <Label>Chart Type</Label>
          <Select value={config_state.visualization.chart_type} onValueChange={(v) => updateConfig('visualization.chart_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={config_state.visualization.show_totals}
              onCheckedChange={(v) => updateConfig('visualization.show_totals', v)}
            />
            <Label className="font-normal cursor-pointer">Show Totals</Label>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}