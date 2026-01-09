import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../common/TenantContext';
import { logAuditEvent } from '../common/AuditLogger';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Send, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function SendEmailDialog({ open, onClose, customer, job }) {
  const { currentOrgId, currentWorkspaceId, user } = useTenant();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({
        to: data.recipient_email,
        subject: data.subject,
        body: data.body,
        from_name: user.full_name
      });

      const comm = await base44.entities.Communication.create({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        customer_id: data.customer_id,
        job_id: data.job_id,
        type: 'email',
        direction: 'outbound',
        subject: data.subject,
        body: data.body,
        recipient_email: data.recipient_email,
        sender_email: user.email,
        status: 'sent',
        attachments: data.attachments
      });

      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        action: 'create',
        resource_type: 'communication',
        resource_id: comm.id,
        resource_name: `Email to ${data.recipient_email}`
      });

      return comm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Email sent successfully');
      onClose();
      setSubject('');
      setBody('');
      setAttachments([]);
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            name: file.name,
            url: file_url,
            size: file.size
          };
        })
      );
      setAttachments([...attachments, ...uploaded]);
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = () => {
    if (!customer?.email) {
      toast.error('Customer email not available');
      return;
    }
    if (!subject || !body) {
      toast.error('Subject and body are required');
      return;
    }

    sendEmailMutation.mutate({
      customer_id: customer.id,
      job_id: job?.id,
      recipient_email: customer.email,
      subject,
      body,
      attachments
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {customer?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>To</Label>
            <Input value={customer?.email || ''} disabled className="bg-gray-50" />
          </div>

          <div>
            <Label>Subject</Label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
            />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 text-sm">{att.name}</span>
                    <span className="text-xs text-gray-500">
                      {(att.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSend}
            disabled={sendEmailMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}