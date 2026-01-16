import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Download, Upload, Tag, FolderOpen, Clock, User, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import DocumentUploader from './DocumentUploader';

const CATEGORIES = [
  { value: 'contract', label: 'Contract', color: 'bg-blue-100 text-blue-800' },
  { value: 'invoice', label: 'Invoice', color: 'bg-green-100 text-green-800' },
  { value: 'proposal', label: 'Proposal', color: 'bg-purple-100 text-purple-800' },
  { value: 'specification', label: 'Specification', color: 'bg-orange-100 text-orange-800' },
  { value: 'photo', label: 'Photo', color: 'bg-pink-100 text-pink-800' },
  { value: 'report', label: 'Report', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
];

export default function DocumentManager({ jobId, customerId, organizationId, workspaceId }) {
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editForm, setEditForm] = useState({ category: '', tags: '', description: '' });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', jobId, customerId],
    queryFn: async () => {
      const filter = { 
        organization_id: organizationId,
        status: 'active'
      };
      if (jobId) filter.job_id = jobId;
      if (customerId) filter.customer_id = customerId;
      
      return await base44.entities.Document.filter(filter, '-created_date');
    },
    enabled: !!organizationId
  });

  const updateMutation = useMutation({
    mutationFn: async ({ docId, updates }) => {
      return await base44.entities.Document.update(docId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated');
      setEditingDoc(null);
    },
    onError: (error) => {
      toast.error('Update failed: ' + error.message);
    }
  });

  const uploadNewVersionMutation = useMutation({
    mutationFn: async ({ file, parentDoc }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const user = await base44.auth.me();

      // Mark old version as not latest
      await base44.entities.Document.update(parentDoc.id, { is_latest_version: false });

      // Create new version
      return await base44.entities.Document.create({
        organization_id: parentDoc.organization_id,
        workspace_id: parentDoc.workspace_id,
        job_id: parentDoc.job_id,
        customer_id: parentDoc.customer_id,
        file_name: file.name,
        file_url,
        file_size: file.size,
        file_type: file.type,
        version: parentDoc.version + 1,
        is_latest_version: true,
        parent_document_id: parentDoc.parent_document_id || parentDoc.id,
        uploaded_by: user.email,
        uploaded_by_role: 'team_member',
        category: parentDoc.category,
        tags: parentDoc.tags,
        description: parentDoc.description,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('New version uploaded');
    },
    onError: (error) => {
      toast.error('Upload failed: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId) => {
      return await base44.entities.Document.update(docId, { status: 'deleted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    }
  });

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setEditForm({
      category: doc.category || 'other',
      tags: (doc.tags || []).join(', '),
      description: doc.description || ''
    });
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      docId: editingDoc.id,
      updates: {
        category: editForm.category,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t),
        description: editForm.description
      }
    });
  };

  const handleNewVersion = (doc) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadNewVersionMutation.mutate({ file, parentDoc: doc });
      }
    };
    input.click();
  };

  const latestDocs = documents.filter(d => d.is_latest_version);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button onClick={() => setShowUploader(true)} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {latestDocs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {latestDocs.map(doc => {
              const categoryInfo = CATEGORIES.find(c => c.value === doc.category) || CATEGORIES[6];
              const versions = documents.filter(d => 
                d.parent_document_id === doc.id || d.id === doc.id
              );

              return (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{doc.file_name}</h4>
                          <Badge className={categoryInfo.color} variant="outline">
                            {categoryInfo.label}
                          </Badge>
                          {versions.length > 1 && (
                            <Badge variant="outline">v{doc.version}</Badge>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {doc.uploaded_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(doc.created_date), 'MMM d, yyyy')}
                          </span>
                          <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                        {doc.tags?.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNewVersion(doc)}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <DocumentUploader
        jobId={jobId}
        customerId={customerId}
        organizationId={organizationId}
        workspaceId={workspaceId}
        uploadedByRole="team_member"
        open={showUploader}
        onOpenChange={setShowUploader}
      />

      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="w-full border rounded-md p-2"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="urgent, customer-facing, final"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Document description or notes"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}