import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function JobTemplateManager({ open, onClose, sourceJob }) {
  const queryClient = useQueryClient();
  const { currentOrgId } = useTenant();
  const [showForm, setShowForm] = useState(!!sourceJob);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState(
    sourceJob ? {
      name: `${sourceJob.title} Template`,
      description: sourceJob.description || '',
      category: 'consulting',
      default_title: sourceJob.title,
      default_description: sourceJob.description || '',
      default_priority: sourceJob.priority,
      estimated_hours: sourceJob.estimated_hours || 0,
      default_line_items: sourceJob.line_items || []
    } : {
      name: '',
      description: '',
      category: 'consulting',
      default_title: '',
      default_description: '',
      default_priority: 'medium',
      estimated_hours: 0,
      default_line_items: []
    }
  );

  const { data: templates = [] } = useQuery({
    queryKey: ['jobTemplates', currentOrgId],
    queryFn: async () => {
      return await base44.entities.JobTemplate.filter({
        organization_id: currentOrgId,
        is_active: true
      }, '-created_date');
    },
    enabled: !!currentOrgId && open
  });

  const saveTemplateMutation = useMutation({
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
      queryClient.invalidateQueries(['jobTemplates']);
      setShowForm(false);
      setEditingTemplate(null);
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
      if (sourceJob) {
        onClose();
      }
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.JobTemplate.update(id, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jobTemplates']);
      toast.success('Template deleted');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sourceJob ? 'Save as Template' : 'Manage Job Templates'}
          </DialogTitle>
        </DialogHeader>

        {!showForm && !sourceJob ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No templates yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(template);
                            setFormData(template);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Standard Consulting Project"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Template description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Priority</Label>
                <Select value={formData.default_priority} onValueChange={(value) => setFormData({ ...formData, default_priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Job Title</Label>
              <Input
                value={formData.default_title}
                onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Job Description</Label>
              <Textarea
                value={formData.default_description}
                onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {showForm && !sourceJob && (
            <Button variant="outline" onClick={() => {
              setShowForm(false);
              setEditingTemplate(null);
            }}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {showForm || sourceJob ? 'Cancel' : 'Close'}
          </Button>
          {(showForm || sourceJob) && (
            <Button onClick={() => saveTemplateMutation.mutate(formData)} disabled={!formData.name || saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? 'Saving...' : editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}