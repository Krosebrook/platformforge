import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Multi-axis line chart showing job creation, completion, and value trends over time
 * Displays up to 12 months of historical data
 */
export default function MonthlyTrendChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Job Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
            <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
            <Line yAxisId="right" type="monotone" dataKey="value" stroke="#f59e0b" name="Value ($)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}