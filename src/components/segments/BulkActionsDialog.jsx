import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkActionsDialog({ open, onClose, segment, customers, organizationId, workspaceId }) {
  const [activeTab, setActiveTab] = useState('email');
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const sendBulkEmailMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const results = [];
      
      for (const customer of customers) {
        if (!customer.email) continue;
        
        try {
          await base44.integrations.Core.SendEmail({
            to: customer.email,
            subject: emailData.subject,
            body: emailData.body.replace('{{name}}', customer.name)
          });
          
          await base44.entities.Communication.create({
            organization_id: organizationId,
            workspace_id: workspaceId,
            customer_id: customer.id,
            type: 'email',
            direction: 'outbound',
            subject: emailData.subject,
            body: emailData.body,
            status: 'sent'
          });
          
          results.push({ customer: customer.name, success: true });
        } catch (error) {
          results.push({ customer: customer.name, success: false, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`Sent ${successCount} emails successfully`);
      setIsProcessing(false);
      onClose();
    },
    onError: () => {
      setIsProcessing(false);
      toast.error('Failed to send emails');
    }
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      const template = templates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error('Template not found');
      
      const results = [];
      
      for (const customer of customers) {
        try {
          await base44.entities.Job.create({
            organization_id: organizationId,
            workspace_id: workspaceId,
            customer_id: customer.id,
            title: template.default_title,
            description: template.default_description,
            priority: template.default_priority,
            status: 'draft',
            estimated_hours: template.estimated_hours,
            reference_number: `JOB-${Date.now().toString(36).toUpperCase()}`
          });
          
          results.push({ customer: customer.name, success: true });
        } catch (error) {
          results.push({ customer: customer.name, success: false, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`Created ${successCount} jobs from template`);
      setIsProcessing(false);
      onClose();
    },
    onError: () => {
      setIsProcessing(false);
      toast.error('Failed to create jobs');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Actions - {segment?.name}</DialogTitle>
          <p className="text-sm text-gray-500">{customers.length} customers selected</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email Campaign
            </TabsTrigger>
            <TabsTrigger value="template">
              <FileText className="w-4 h-4 mr-2" />
              Assign Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject..."
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Use {{name}} to personalize with customer name..."
                value={emailData.body}
                onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                rows={6}
              />
              <p className="text-xs text-gray-500">
                Tip: Use {`{{name}}`} to insert customer name
              </p>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Job Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                This will create a new job for each customer in the segment
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          {activeTab === 'email' ? (
            <Button
              onClick={() => sendBulkEmailMutation.mutate()}
              disabled={!emailData.subject || !emailData.body || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Send to {customers.length} Customers</>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => assignTemplateMutation.mutate()}
              disabled={!selectedTemplate || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create {customers.length} Jobs</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}