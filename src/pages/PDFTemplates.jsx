import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, FileText, Star, Trash2, Edit, Palette } from 'lucide-react';
import { toast } from 'sonner';
import PDFTemplateEditor from '../components/pdf/PDFTemplateEditor';

export default function PDFTemplates() {
  const { currentOrgId } = useTenant();
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['pdfTemplates', currentOrgId],
    queryFn: () => base44.entities.PDFTemplate.filter({ organization_id: currentOrgId }, '-created_date'),
    enabled: !!currentOrgId,
  });

  const handleDelete = async () => {
    try {
      await base44.entities.PDFTemplate.delete(deletingId);
      queryClient.invalidateQueries(['pdfTemplates']);
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    queryClient.invalidateQueries(['pdfTemplates']);
    setShowEditor(false);
    setEditingTemplate(null);
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setShowEditor(true);
  };

  const openEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setShowEditor(true);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PDF Templates</h1>
          <p className="text-gray-500 mt-1">
            Create branded document templates for jobs and reports
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Empty state */}
      {!isLoading && templates.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Palette className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">No templates yet</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">
                Create your first PDF template to start exporting branded documents with your logo, colors, and contact info.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {templates.map(tmpl => {
          const primary = tmpl.branding?.primary_color || '#111827';
          const secondary = tmpl.branding?.secondary_color || '#6B7280';
          return (
            <Card key={tmpl.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Preview strip */}
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)` }} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{tmpl.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {tmpl.header?.company_name || 'No company name set'}
                    </CardDescription>
                  </div>
                  {tmpl.is_default && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-2 flex-shrink-0">
                      <Star className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {/* Mini preview */}
                <div className="rounded-lg border bg-gray-50 p-3 space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: primary }}>
                      {(tmpl.header?.company_name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate" style={{ color: primary }}>
                        {tmpl.header?.company_name || 'Company Name'}
                      </div>
                      {tmpl.header?.tagline && (
                        <div className="text-gray-400 truncate text-xs">{tmpl.header.tagline}</div>
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    {tmpl.header?.email && <div className="text-gray-400 truncate">{tmpl.header.email}</div>}
                    {tmpl.header?.phone && <div className="text-gray-400">{tmpl.header.phone}</div>}
                  </div>
                </div>

                {/* Metadata chips */}
                <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                    {tmpl.layout?.page_size || 'letter'}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                    {tmpl.layout?.orientation || 'portrait'}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                    {tmpl.branding?.font || 'helvetica'}
                  </span>
                  {tmpl.layout?.show_watermark && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">watermark</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(tmpl)}>
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:border-red-300"
                    onClick={() => setDeletingId(tmpl.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor dialog */}
      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) { setShowEditor(false); setEditingTemplate(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editingTemplate ? 'Edit Template' : 'New PDF Template'}
            </DialogTitle>
          </DialogHeader>
          <PDFTemplateEditor
            template={editingTemplate}
            onSaved={handleSaved}
            onCancel={() => { setShowEditor(false); setEditingTemplate(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template. Any exports using it will fall back to the default template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}