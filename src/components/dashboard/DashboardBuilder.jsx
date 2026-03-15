import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Trash2, GripVertical, MoreVertical, Copy } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Existing widgets
import UpcomingJobsWidget from './widgets/UpcomingJobsWidget';
import PendingApprovalsWidget from './widgets/PendingApprovalsWidget';
import CustomerActivityWidget from './widgets/CustomerActivityWidget';
import TaskSummaryWidget from './widgets/TaskSummaryWidget';

// New widgets
import RevenueOverviewWidget from './widgets/RevenueOverviewWidget';
import MRRTrackerWidget from './widgets/MRRTrackerWidget';
import InvoiceStatusWidget from './widgets/InvoiceStatusWidget';
import RevenueByProductWidget from './widgets/RevenueByProductWidget';
import CustomerGrowthWidget from './widgets/CustomerGrowthWidget';
import PipelineFunnelWidget from './widgets/PipelineFunnelWidget';
import TopCustomersWidget from './widgets/TopCustomersWidget';
import ChurnRiskWidget from './widgets/ChurnRiskWidget';
import ActivityFeedWidget from './widgets/ActivityFeedWidget';
import EmailCampaignWidget from './widgets/EmailCampaignWidget';
import SupportTicketsWidget from './widgets/SupportTicketsWidget';
import SegmentDistributionWidget from './widgets/SegmentDistributionWidget';
import WorkflowCompletionWidget from './widgets/WorkflowCompletionWidget';
import GeoHeatmapWidget from './widgets/GeoHeatmapWidget';

const WIDGET_COMPONENTS = {
  upcoming_jobs: UpcomingJobsWidget,
  pending_approvals: PendingApprovalsWidget,
  customer_activity: CustomerActivityWidget,
  task_summary: TaskSummaryWidget,
  revenue_overview: RevenueOverviewWidget,
  mrr_tracker: MRRTrackerWidget,
  invoice_status: InvoiceStatusWidget,
  revenue_by_product: RevenueByProductWidget,
  customer_growth: CustomerGrowthWidget,
  pipeline_funnel: PipelineFunnelWidget,
  top_customers: TopCustomersWidget,
  churn_risk: ChurnRiskWidget,
  activity_feed: ActivityFeedWidget,
  email_campaign: EmailCampaignWidget,
  support_tickets: SupportTicketsWidget,
  segment_distribution: SegmentDistributionWidget,
  workflow_completion: WorkflowCompletionWidget,
  geo_heatmap: GeoHeatmapWidget,
};

const WIDGET_CATEGORIES = [
  {
    label: 'Revenue & Finance',
    widgets: [
      { id: 'revenue_overview', label: 'Revenue Overview', desc: 'Monthly revenue bar chart with trend' },
      { id: 'mrr_tracker', label: 'MRR Tracker', desc: 'Monthly recurring revenue vs goal' },
      { id: 'invoice_status', label: 'Invoice Status', desc: 'Donut chart: paid, pending, overdue' },
      { id: 'revenue_by_product', label: 'Revenue by Product', desc: 'Top 5 products by revenue' },
    ],
  },
  {
    label: 'Customers & Pipeline',
    widgets: [
      { id: 'customer_growth', label: 'Customer Growth', desc: 'New customers & cumulative total' },
      { id: 'pipeline_funnel', label: 'Pipeline Funnel', desc: 'Lead → Closed stage visualization' },
      { id: 'top_customers', label: 'Top Customers', desc: 'Top 10 customers by lifetime value' },
      { id: 'churn_risk', label: 'Churn Risk Radar', desc: 'Risk score gauge & at-risk accounts' },
    ],
  },
  {
    label: 'Activity & Engagement',
    widgets: [
      { id: 'activity_feed', label: 'Activity Feed', desc: 'Live feed of recent actions' },
      { id: 'task_summary', label: 'Task Summary', desc: 'Overdue, today, upcoming, completed' },
      { id: 'email_campaign', label: 'Email Campaign Performance', desc: 'Open, click, bounce metrics' },
    ],
  },
  {
    label: 'Operations & Analytics',
    widgets: [
      { id: 'support_tickets', label: 'Support Tickets', desc: 'Stacked bar: open/progress/resolved' },
      { id: 'segment_distribution', label: 'Segment Distribution', desc: 'Customer split by segment' },
      { id: 'workflow_completion', label: 'Workflow Completion', desc: 'Progress bars for active workflows' },
      { id: 'geo_heatmap', label: 'Geo Heatmap', desc: 'Customer concentration by region' },
    ],
  },
  {
    label: 'Jobs & Operations',
    widgets: [
      { id: 'upcoming_jobs', label: 'Upcoming Jobs', desc: 'Jobs due soon' },
      { id: 'pending_approvals', label: 'Pending Approvals', desc: 'Approval requests' },
      { id: 'customer_activity', label: 'Recent Customer Activity', desc: 'Latest customer interactions' },
    ],
  },
];

const ALL_WIDGETS = WIDGET_CATEGORIES.flatMap(c => c.widgets);

const SIZE_CLASSES = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-1',
  large: 'col-span-1 md:col-span-2',
};

export default function DashboardBuilder({ widgets = [], onWidgetsChange, editMode = false }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const newWidgets = Array.from(widgets);
    const [removed] = newWidgets.splice(source.index, 1);
    newWidgets.splice(destination.index, 0, removed);
    onWidgetsChange(newWidgets.map((w, idx) => ({ ...w, position: { row: Math.floor(idx / 2), column: idx % 2 } })));
  };

  const addWidget = (type) => {
    const meta = ALL_WIDGETS.find(w => w.id === type);
    const newWidget = {
      id: `widget_${Date.now()}`,
      widget_type: type,
      title: meta?.label || type,
      size: 'medium',
      filters: { date_range: 'month', limit: 10 },
      settings: {},
    };
    onWidgetsChange([...widgets, newWidget]);
    setShowAddDialog(false);
  };

  const removeWidget = (id) => onWidgetsChange(widgets.filter(w => w.id !== id));

  const duplicateWidget = (widget) => {
    const copy = { ...widget, id: `widget_${Date.now()}` };
    onWidgetsChange([...widgets, copy]);
  };

  const resizeWidget = (id, size) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, size } : w));
  };

  const updateWidget = (id, updates) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
    setEditingWidget(null);
  };

  if (!editMode) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map(widget => {
          const Component = WIDGET_COMPONENTS[widget.widget_type];
          const sizeClass = widget.size === 'large' ? 'md:col-span-2' : '';
          return Component ? (
            <Card key={widget.id} className={sizeClass}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Component widget={widget} />
              </CardContent>
            </Card>
          ) : null;
        })}
        {widgets.length === 0 && (
          <div className="md:col-span-2 text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">Your dashboard is empty</p>
            <p className="text-sm">Click <span className="font-semibold">Edit</span> then <span className="font-semibold">+ Add Widget</span> to get started.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Drag widgets to rearrange. Use the ⋯ menu to resize or remove.</p>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Widget
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {widgets.map((widget, idx) => (
                <Draggable key={widget.id} draggableId={widget.id} index={idx}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${widget.size === 'large' ? 'md:col-span-2' : ''} ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4 text-gray-300" />
                            </div>
                            <CardTitle className="text-sm">{widget.title}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingWidget(widget)}>
                                <Settings className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateWidget(widget)}>
                                <Copy className="w-4 h-4 mr-2" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => resizeWidget(widget.id, 'small')}>
                                Resize: Small
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => resizeWidget(widget.id, 'medium')}>
                                Resize: Medium
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => resizeWidget(widget.id, 'large')}>
                                Resize: Large (full width)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => removeWidget(widget.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 opacity-50 pointer-events-none">
                        {(() => {
                          const Component = WIDGET_COMPONENTS[widget.widget_type];
                          return Component ? <Component widget={widget} /> : <div className="h-16 bg-gray-50 rounded" />;
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Widget Modal */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pb-2">
            {WIDGET_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat.label}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {cat.widgets.map(w => (
                    <button key={w.id} onClick={() => addWidget(w.id)}
                      className="text-left border rounded-xl p-3 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-700">{w.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{w.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Widget Modal */}
      {editingWidget && (
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Widget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={editingWidget.filters?.date_range}
                  onValueChange={(v) => setEditingWidget({ ...editingWidget, filters: { ...editingWidget.filters, date_range: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => updateWidget(editingWidget.id, { title: editingWidget.title, filters: editingWidget.filters })}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}