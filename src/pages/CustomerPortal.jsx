import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import JobProgressCard from "@/components/customer/JobProgressCard";
import DocumentDownloader from "@/components/customer/DocumentDownloader";
import { Search, LogOut, User } from 'lucide-react';

export default function CustomerPortal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['currentCustomer'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      
      // Fetch customer record by email
      const customers = await base44.entities.Customer.filter({ email: user.email });
      return customers[0] || null;
    },
    retry: false,
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['customerJobs', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      return await base44.entities.Job.filter({
        customer_id: customer.id
      }, '-created_date', 50);
    },
    enabled: !!customer?.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['customerDocuments', customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      return await base44.entities.Document.filter({
        customer_id: customer.id
      }, '-created_date', 50);
    },
    enabled: !!customer?.id,
  });

  // Subscribe to job updates for real-time progress
  useEffect(() => {
    if (!customer?.id) return;
    
    const unsubscribe = base44.entities.Job.subscribe((event) => {
      if (event.data?.customer_id === customer.id) {
        // Update will trigger query refetch
      }
    });

    return unsubscribe;
  }, [customer?.id]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusStats = {
    active: jobs.filter(j => ['in_progress', 'review'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
    pending: jobs.filter(j => j.status === 'pending').length,
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Error</CardTitle>
            <CardDescription>No customer account found for your email</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => base44.auth.logout()} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome, {customer.name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => base44.auth.logout()}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-gray-900">{statusStats.active}</div>
              <p className="text-sm text-gray-500 mt-2">Active Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{statusStats.completed}</div>
              <p className="text-sm text-gray-500 mt-2">Completed Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">{statusStats.pending}</div>
              <p className="text-sm text-gray-500 mt-2">Pending Projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">My Projects</TabsTrigger>
            <TabsTrigger value="documents">Documents & Invoices</TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {jobs.length > 0 && (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Search projects by name or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    prefix={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'in_progress', 'completed', 'pending'].map(status => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className="capitalize"
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {jobsLoading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid gap-4">
                {filteredJobs.map(job => (
                  <JobProgressCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState
                type="job"
                title={searchTerm ? "No projects found" : "No projects yet"}
                description={searchTerm 
                  ? "Try adjusting your search terms" 
                  : "You don't have any projects assigned yet"}
              />
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map(doc => (
                  <DocumentDownloader
                    key={doc.id}
                    document={doc}
                    relatedJob={jobs.find(j => j.id === doc.job_id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                type="customer"
                title="No documents available"
                description="Documents and invoices will appear here once your projects are complete"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}