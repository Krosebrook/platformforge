import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from 'lucide-react';

export default function SegmentAnalytics({ customers, jobs }) {
  const totalValue = customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
  const avgValue = customers.length > 0 ? totalValue / customers.length : 0;
  
  const customerTypeBreakdown = customers.reduce((acc, c) => {
    acc[c.customer_type] = (acc[c.customer_type] || 0) + 1;
    return acc;
  }, {});

  const tierBreakdown = customers.reduce((acc, c) => {
    acc[c.tier] = (acc[c.tier] || 0) + 1;
    return acc;
  }, {});

  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const activeJobs = jobs.filter(j => ['pending', 'in_progress', 'review'].includes(j.status)).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Segment Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Lifetime Value</p>
              <p className="text-2xl font-bold">${avgValue.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{activeJobs}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(customerTypeBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tierBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{tier}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}