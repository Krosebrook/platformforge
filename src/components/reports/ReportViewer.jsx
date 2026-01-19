/**
 * Report Viewer Component
 * Display saved reports with selected visualization
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, LineChart, PieChart, ScatterChart, AreaChart, Bar, Line, Pie, Scatter, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportViewer({ open, onClose, report }) {
  const { currentOrgId } = useTenant();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['reportData', currentOrgId, report?.id],
    queryFn: async () => {
      return await base44.entities.Job.filter({
        organization_id: currentOrgId,
        ...(report.filters || {})
      });
    },
    enabled: !!currentOrgId && open
  });

  const processData = () => {
    const data = {};
    
    report.metrics.forEach(metric => {
      switch (metric) {
        case 'total_jobs':
          data[metric] = jobs.length;
          break;
        case 'completed_jobs':
          data[metric] = jobs.filter(j => j.status === 'completed').length;
          break;
        case 'in_progress_jobs':
          data[metric] = jobs.filter(j => j.status === 'in_progress').length;
          break;
        case 'total_value':
          data[metric] = jobs.reduce((sum, j) => sum + (j.value || 0), 0);
          break;
      }
    });

    return Object.entries(data).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  };

  const chartData = processData();

  const renderChart = () => {
    const chartProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (report.chart_type) {
      case 'bar':
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#93c5fd" />
          </AreaChart>
        );
      default:
        return <p className="text-center text-gray-500">Chart type not supported</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{report.name}</DialogTitle>
          {report.description && (
            <p className="text-sm text-gray-500">{report.description}</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                {renderChart()}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}