import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Button } from "@/components/ui/button";
import { Edit, Save, Plus, X } from 'lucide-react';
import DashboardBuilder from '../components/dashboard/DashboardBuilder';
import { toast } from 'sonner';

const DEFAULT_WIDGETS = [
  { widget_type: 'revenue_overview', title: 'Revenue Overview', size: 'large' },
  { widget_type: 'mrr_tracker', title: 'MRR Tracker', size: 'medium' },
  { widget_type: 'customer_growth', title: 'Customer Growth', size: 'medium' },
  { widget_type: 'activity_feed', title: 'Activity Feed', size: 'medium' },
  { widget_type: 'task_summary', title: 'Task Summary', size: 'medium' },
  { widget_type: 'pipeline_funnel', title: 'Pipeline Funnel', size: 'medium' },
  { widget_type: 'churn_risk', title: 'Churn Risk Radar', size: 'medium' },
  { widget_type: 'invoice_status', title: 'Invoice Status', size: 'medium' },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { currentOrgId, user } = useTenant();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState([]);
  const [seeded, setSeeded] = useState(false);

  const { data: dashboardWidgets = [], isSuccess } = useQuery({
    queryKey: ['dashboardWidgets', currentOrgId, user?.email],
    queryFn: async () => {
      return await base44.entities.DashboardWidget.filter({
        organization_id: currentOrgId,
        user_email: user?.email,
        is_active: true,
      }, 'position');
    },
    enabled: !!currentOrgId && !!user?.email,
  });

  useEffect(() => {
    if (isSuccess && !seeded) {
      if (dashboardWidgets.length > 0) {
        setWidgets(dashboardWidgets);
      } else {
        // Seed default widgets locally
        setWidgets(DEFAULT_WIDGETS.map((w, i) => ({
          id: `widget_${i}_${Date.now()}`,
          ...w,
          filters: { date_range: 'month', limit: 10 },
          settings: {},
          position: { row: Math.floor(i / 2), column: i % 2 },
        })));
      }
      setSeeded(true);
    }
  }, [isSuccess, dashboardWidgets, seeded]);

  const saveMutation = useMutation({
    mutationFn: async (widgetUpdates) => {
      for (const widget of widgetUpdates) {
        if (widget.id?.startsWith('widget_')) {
          await base44.entities.DashboardWidget.create({
            organization_id: currentOrgId,
            user_email: user?.email,
            title: widget.title,
            widget_type: widget.widget_type,
            size: widget.size,
            position: widget.position,
            filters: widget.filters,
            settings: widget.settings,
            is_active: true,
          });
        } else {
          await base44.entities.DashboardWidget.update(widget.id, {
            position: widget.position,
            filters: widget.filters,
            title: widget.title,
            size: widget.size,
          });
        }
      }
      const newIds = widgetUpdates.map(w => w.id);
      for (const old of dashboardWidgets) {
        if (!newIds.includes(old.id)) {
          await base44.entities.DashboardWidget.update(old.id, { is_active: false });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboardWidgets']);
      setEditMode(false);
      setSeeded(false);
      toast.success('Dashboard saved');
    },
  });

  const handleCancel = () => {
    setWidgets(dashboardWidgets.length > 0 ? dashboardWidgets : widgets);
    setEditMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your personalized business overview</p>
        </div>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => saveMutation.mutate(widgets)} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Layout'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Customize
            </Button>
          )}
        </div>
      </div>

      <DashboardBuilder
        widgets={widgets}
        onWidgetsChange={setWidgets}
        editMode={editMode}
      />
    </div>
  );
}