import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Settings, Trash } from 'lucide-react';
import ReportBuilder from '../components/reports/ReportBuilder';
import { toast } from 'sonner';

export default function CustomReports() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useTenant();
  const [showDialog, setShowDialog] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [reportConfig, setReportConfig] = useState({});

  const { data: reports = [] } = useQuery({
    queryKey: ['reports', currentOrgId],
    queryFn: async () => {
      return await base44.entities.ReportConfiguration.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const saveReportMutation = useMutation({
    mutationFn: async (config) => {
      if (editingReport) {
        return await base44.entities.ReportConfiguration.update(editingReport.id, config);
      } else {
        return await base44.entities.ReportConfiguration.create({
          organization_id: currentOrgId,
          ...config
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success(editingReport ? 'Report updated' : 'Report created');
      resetForm();
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ReportConfiguration.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reports']);
      toast.success('Report deleted');
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportId) => {
      const { data } = await base44.functions.invoke('generateCustomReport', { reportId });
      return data;
    },
    onSuccess: (data) => {
      toast.success('Report generated');
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    }
  });

  const resetForm = () => {
    setReportConfig({});
    setEditingReport(null);
    setShowDialog(false);
  };

  const handleSave = () => {
    if (!reportConfig.name || !reportConfig.data_source?.entity_type) {
      toast.error('Name and entity type are required');
      return;
    }
    saveReportMutation.mutate(reportConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
          <p className="text-gray-500 mt-1">Create and schedule custom data reports</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setShowDialog(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      <Tabs defaultValue="saved" className="w-full">
        <TabsList>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="favorite">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="space-y-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No reports yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            reports.map(report => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      {report.description && (
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="capitalize">{report.report_type}</Badge>
                      <Badge variant="secondary">{report.data_source?.entity_type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Generated {report.generation_count} times
                      {report.last_generated_at && ` • Last: ${new Date(report.last_generated_at).toLocaleDateString()}`}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => generateReportMutation.mutate(report.id)}
                        disabled={generateReportMutation.isPending}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingReport(report);
                          setReportConfig(report);
                          setShowDialog(true);
                        }}
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteReportMutation.mutate(report.id)}
                      >
                        <Trash className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Report' : 'Create Report'}</DialogTitle>
          </DialogHeader>

          <ReportBuilder config={reportConfig} onChange={setReportConfig} />

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveReportMutation.isPending}>
              {saveReportMutation.isPending ? 'Saving...' : 'Save Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}