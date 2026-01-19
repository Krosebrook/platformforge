import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, FileText } from 'lucide-react';
import TemplateTaskBuilder from '../components/templates/TemplateTaskBuilder';
import TemplateApprovalBuilder from '../components/templates/TemplateApprovalBuilder';
import { toast } from 'sonner';

export default function TemplateManager() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useTenant();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'construction',
    default_title: '',
    default_priority: 'medium',
    predefined_tasks: [],
    approval_workflow: { enabled: false }
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', currentOrgId],
    queryFn: async () => {
      return await base44.entities.JobTemplate.filter({
        organization_id: currentOrgId,
        is_active: true
      });
    },
    enabled: !!currentOrgId
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        return await base44.entities.JobTemplate.update(editingTemplate.id, data);
      } else {
        return await base44.entities.JobTemplate.create({
          organization_id: currentOrgId,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.JobTemplate.update(id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('Template deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'construction',
      default_title: '',
      default_priority: 'medium',
      predefined_tasks: [],
      approval_workflow: { enabled: false }
    });
    setEditingTemplate(null);
    setShowDialog(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      default_title: template.default_title,
      default_priority: template.default_priority,
      predefined_tasks: template.predefined_tasks || [],
      approval_workflow: template.approval_workflow || { enabled: false }
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Templates</h1>
          <p className="text-gray-500 mt-1">Manage templates with predefined tasks and approval workflows</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowDialog(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                </div>
                <Badge variant="outline" className="capitalize ml-2">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                {template.predefined_tasks?.length > 0 && (
                  <p className="text-gray-600">📋 {template.predefined_tasks.length} predefined tasks</p>
                )}
                {template.approval_workflow?.enabled && (
                  <p className="text-gray-600">✓ Approval workflow enabled</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteMutation.mutate(template.id)}
                  className="text-red-600"
                >
                  <Trash className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <Input
                placeholder="Template name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <TemplateTaskBuilder
              tasks={formData.predefined_tasks}
              onChange={(tasks) => setFormData({ ...formData, predefined_tasks: tasks })}
            />

            <TemplateApprovalBuilder
              workflow={formData.approval_workflow}
              onChange={(workflow) => setFormData({ ...formData, approval_workflow: workflow })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}