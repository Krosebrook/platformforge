import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from '../components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Briefcase, FileText, MessageSquare, Plus, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CustomerPortal() {
  const queryClient = useQueryClient();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({ title: '', description: '', priority: 'medium' });

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await base44.auth.me()
  });

  // Find customer record for current user
  const { data: customerRecord } = useQuery({
    queryKey: ['myCustomerRecord', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const customers = await base44.entities.Customer.filter({ email: user.email });
      return customers[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch jobs for this customer
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['myJobs', customerRecord?.id],
    queryFn: async () => {
      if (!customerRecord?.id) return [];
      return await base44.entities.Job.filter({ customer_id: customerRecord.id }, '-created_date');
    },
    enabled: !!customerRecord?.id
  });

  // Fetch communications for this customer
  const { data: communications = [] } = useQuery({
    queryKey: ['myCommunications', customerRecord?.id],
    queryFn: async () => {
      if (!customerRecord?.id) return [];
      return await base44.entities.Communication.filter({ customer_id: customerRecord.id }, '-created_date');
    },
    enabled: !!customerRecord?.id
  });

  // Submit new job request
  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      const job = await base44.entities.Job.create({
        organization_id: customerRecord.organization_id,
        workspace_id: customerRecord.workspace_id,
        customer_id: customerRecord.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'pending',
        reference_number: `REQ-${Date.now().toString(36).toUpperCase()}`
      });

      // Create communication record
      await base44.entities.Communication.create({
        organization_id: customerRecord.organization_id,
        workspace_id: customerRecord.workspace_id,
        customer_id: customerRecord.id,
        job_id: job.id,
        type: 'note',
        direction: 'inbound',
        subject: `New job request: ${data.title}`,
        body: data.description,
        sender_email: user.email,
        status: 'sent'
      });

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      queryClient.invalidateQueries({ queryKey: ['myCommunications'] });
      setShowRequestDialog(false);
      setRequestForm({ title: '', description: '', priority: 'medium' });
      toast.success('Job request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + error.message);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Customer Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Please sign in to access your customer portal</p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customerRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Customer Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No customer record found for your account. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeJobs = jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {customerRecord.name}</h1>
            <p className="text-gray-500">Your customer portal</p>
          </div>
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit New Job Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="Brief description of your request"
                    value={requestForm.title}
                    onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Details *</Label>
                  <Textarea
                    placeholder="Provide more details about your request..."
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={requestForm.priority}
                    onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
                <Button 
                  onClick={() => createRequestMutation.mutate(requestForm)}
                  disabled={!requestForm.title || !requestForm.description || createRequestMutation.isPending}
                >
                  {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                  <p className="text-3xl font-bold">{activeJobs.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-3xl font-bold">{completedJobs.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Messages</p>
                  <p className="text-3xl font-bold">{communications.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No jobs yet</p>
                    <Button className="mt-4" onClick={() => setShowRequestDialog(true)}>
                      Submit Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map(job => (
                      <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{job.title}</h3>
                              <StatusBadge status={job.status} size="sm" />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{job.reference_number}</p>
                            {job.description && (
                              <p className="text-sm text-gray-600">{job.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {job.value && (
                              <p className="font-semibold text-lg">${job.value.toLocaleString()}</p>
                            )}
                            {job.due_date && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(job.due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No communications yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {communications.map(comm => (
                      <div key={comm.id} className="border-l-4 border-blue-500 pl-4 py-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{comm.subject}</h4>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comm.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{comm.body}</p>
                        {comm.attachments?.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                            <FileText className="w-4 h-4" />
                            {comm.attachments.length} attachment(s)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {communications.filter(c => c.attachments?.length > 0).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No documents available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {communications
                      .filter(c => c.attachments?.length > 0)
                      .flatMap(comm => 
                        comm.attachments.map((att, idx) => (
                          <div key={`${comm.id}-${idx}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{att.name}</p>
                                <p className="text-xs text-gray-500">
                                  From: {comm.subject} • {format(new Date(comm.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(att.url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}