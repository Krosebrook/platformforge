/**
 * Custom Reports Page
 * Create, save, and schedule custom reports with various visualizations
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ReportBuilder from '../components/reports/ReportBuilder';
import ReportViewer from '../components/reports/ReportViewer';

export default function Reports() {
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId } = useTenant();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);

  const { data: reports = [] } = useQuery({
    queryKey: ['savedReports', currentOrgId],
    queryFn: async () => {
      return await base44.entities.SavedReport.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, is_favorite }) => {
      await base44.entities.SavedReport.update(id, { is_favorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedReports']);
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.SavedReport.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['savedReports']);
      toast.success('Report deleted');
    }
  });

  const favoriteReports = reports.filter(r => r.is_favorite);
  const scheduledReports = reports.filter(r => r.schedule?.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
          <p className="text-gray-500 mt-1">
            Create, save, and schedule custom reports with advanced visualizations
          </p>
        </div>
        <Button onClick={() => {
          setEditingReport(null);
          setShowBuilder(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold">{reports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Favorites</p>
            <p className="text-2xl font-bold">{favoriteReports.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold">{scheduledReports.length}</p>
          </CardContent>
        </Card>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first custom report with advanced visualizations
              </p>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => (
            <Card key={report.id} className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => setViewingReport(report)}>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate({ 
                        id: report.id, 
                        is_favorite: !report.is_favorite 
                      });
                    }}
                  >
                    <Star className={`w-4 h-4 ${report.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent onClick={() => setViewingReport(report)}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="capitalize">
                    {report.chart_type}
                  </Badge>
                  {report.schedule?.enabled && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {report.schedule.frequency}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingReport(report);
                      setShowBuilder(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteReportMutation.mutate(report.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReportBuilder
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        report={editingReport}
        organizationId={currentOrgId}
        workspaceId={currentWorkspaceId}
        onSuccess={() => {
          queryClient.invalidateQueries(['savedReports']);
          setShowBuilder(false);
        }}
      />

      {viewingReport && (
        <ReportViewer
          open={!!viewingReport}
          onClose={() => setViewingReport(null)}
          report={viewingReport}
        />
      )}
    </div>
  );
}