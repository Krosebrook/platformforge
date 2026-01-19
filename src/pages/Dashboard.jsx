import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Button } from "@/components/ui/button";
import { Edit, Save } from 'lucide-react';
import DashboardBuilder from '../components/dashboard/DashboardBuilder';
import { toast } from 'sonner';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { currentOrgId, user } = useTenant();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState([]);

  const { data: dashboardWidgets = [] } = useQuery({
    queryKey: ['dashboardWidgets', currentOrgId, user?.email],
    queryFn: async () => {
      return await base44.entities.DashboardWidget.filter({
        organization_id: currentOrgId,
        user_email: user?.email,
        is_active: true
      }, 'position');
    },
    enabled: !!currentOrgId && !!user?.email,
    onSuccess: (data) => setWidgets(data)
  });

  const saveMutation = useMutation({
    mutationFn: async (widgetUpdates) => {
      // Update or create widgets
      for (const widget of widgetUpdates) {
        if (widget.id?.startsWith('widget_')) {
          // New widget
          await base44.entities.DashboardWidget.create({
            organization_id: currentOrgId,
            user_email: user?.email,
            title: widget.title,
            widget_type: widget.widget_type,
            size: widget.size,
            position: widget.position,
            filters: widget.filters,
            settings: widget.settings,
            is_active: true
          });
        } else {
          // Update existing
          await base44.entities.DashboardWidget.update(widget.id, {
            position: widget.position,
            filters: widget.filters,
            title: widget.title
          });
        }
      }

      // Delete removed widgets
      const newIds = widgetUpdates.map(w => w.id);
      for (const oldWidget of dashboardWidgets) {
        if (!newIds.includes(oldWidget.id)) {
          await base44.entities.DashboardWidget.update(oldWidget.id, { is_active: false });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboardWidgets']);
      setEditMode(false);
      toast.success('Dashboard saved');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {editMode ? (
          <Button onClick={() => saveMutation.mutate(widgets)} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      <DashboardBuilder
        widgets={widgets}
        onWidgetsChange={setWidgets}
        editMode={editMode}
      />
    </div>
  );
}