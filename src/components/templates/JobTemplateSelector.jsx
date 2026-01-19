import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Wrench, Code, Briefcase, PenTool, TrendingUp, Scale, DollarSign, Factory, Heart, CheckCircle, Shield, Loader2 } from 'lucide-react';
import TemplatePreview from './TemplatePreview';
import { toast } from 'sonner';

const CATEGORY_ICONS = {
  construction: Wrench,
  consulting: Briefcase,
  design: PenTool,
  maintenance: Wrench,
  software: Code,
  marketing: TrendingUp,
  legal: Scale,
  finance: DollarSign,
  manufacturing: Factory,
  healthcare: Heart
};

export default function JobTemplateSelector({ open, onClose, onSelect, organizationId }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['jobTemplates', organizationId],
    queryFn: async () => {
      return await base44.entities.JobTemplate.filter({ 
        organization_id: organizationId,
        is_active: true 
      });
    },
    enabled: !!organizationId && open
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async (jobId) => {
      const { data } = await base44.functions.invoke('applyJobTemplate', {
        jobId,
        templateId: selectedTemplate.id,
        organizationId
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Template applied and tasks created');
      onSelect(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate.predefined_tasks?.length || selectedTemplate.approval_workflow?.enabled) {
      // Show as just selected - actual task creation happens on job creation
      onSelect(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
    } else {
      onSelect(selectedTemplate);
      onClose();
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Job Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex gap-4">
          <ScrollArea className="flex-1">
            <div className="pr-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map(template => {
                    const Icon = CATEGORY_ICONS[template.category] || FileText;
                    return (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition ${
                          selectedTemplate?.id === template.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {template.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {template.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {template.predefined_tasks?.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {template.predefined_tasks.length} tasks
                                  </Badge>
                                )}
                                {template.approval_workflow?.enabled && (
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Approvals
                                  </Badge>
                                )}
                                {template.estimated_hours && (
                                  <Badge variant="outline" className="text-xs">
                                    {template.estimated_hours}h
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {selectedTemplate && (
            <div className="w-80 border-l pl-4 flex flex-col">
              <TemplatePreview template={selectedTemplate} />
              <div className="flex gap-2 mt-auto pt-4">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUseTemplate}
                  className="flex-1"
                >
                  Use Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}