import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Trash2, GripVertical } from 'lucide-react';
import UpcomingJobsWidget from './widgets/UpcomingJobsWidget';
import PendingApprovalsWidget from './widgets/PendingApprovalsWidget';
import CustomerActivityWidget from './widgets/CustomerActivityWidget';
import TaskSummaryWidget from './widgets/TaskSummaryWidget';

const WIDGET_COMPONENTS = {
  upcoming_jobs: UpcomingJobsWidget,
  pending_approvals: PendingApprovalsWidget,
  customer_activity: CustomerActivityWidget,
  task_summary: TaskSummaryWidget
};

const AVAILABLE_WIDGETS = [
  { id: 'upcoming_jobs', label: 'Upcoming Jobs' },
  { id: 'pending_approvals', label: 'Pending Approvals' },
  { id: 'customer_activity', label: 'Recent Customer Activity' },
  { id: 'task_summary', label: 'Task Summary' }
];

export default function DashboardBuilder({ widgets = [], onWidgetsChange, editMode = false }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('');
  const [editingWidget, setEditingWidget] = useState(null);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newWidgets = Array.from(widgets);
    const [removed] = newWidgets.splice(source.index, 1);
    newWidgets.splice(destination.index, 0, removed);
    
    onWidgetsChange(newWidgets.map((w, idx) => ({ ...w, position: { row: Math.floor(idx / 2), column: idx % 2 } })));
  };

  const addWidget = () => {
    if (!selectedWidgetType) return;
    const newWidget = {
      id: `widget_${Date.now()}`,
      widget_type: selectedWidgetType,
      title: AVAILABLE_WIDGETS.find(w => w.id === selectedWidgetType)?.label,
      size: 'medium',
      filters: { date_range: 'month', limit: 10 },
      settings: {}
    };
    onWidgetsChange([...widgets, newWidget]);
    setShowAddDialog(false);
    setSelectedWidgetType('');
  };

  const removeWidget = (id) => {
    onWidgetsChange(widgets.filter(w => w.id !== id));
  };

  const updateWidget = (id, updates) => {
    onWidgetsChange(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  if (!editMode) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map(widget => {
          const Component = WIDGET_COMPONENTS[widget.widget_type];
          return Component ? (
            <Component key={widget.id} widget={widget} />
          ) : null;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Dashboard Widgets</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Widget
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {widgets.map((widget, idx) => (
                <Draggable key={widget.id} draggableId={widget.id} index={idx}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            <CardTitle className="text-sm">{widget.title}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingWidget(widget)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeWidget(widget.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <Select value={selectedWidgetType} onValueChange={setSelectedWidgetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select widget" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_WIDGETS.map(widget => (
                    <SelectItem key={widget.id} value={widget.id}>
                      {widget.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={addWidget} disabled={!selectedWidgetType}>Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingWidget && (
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure {editingWidget.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={editingWidget.filters?.date_range} onValueChange={(v) => updateWidget(editingWidget.id, { filters: { ...editingWidget.filters, date_range: v } })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setEditingWidget(null)}>Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}