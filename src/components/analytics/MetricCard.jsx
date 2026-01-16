import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Reusable metric card component for displaying key performance indicators
 * @param {Object} props - Component props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Primary metric value
 * @param {string} props.subtitle - Additional context or secondary metric
 * @param {React.Component} props.icon - Icon component to display
 */
export default function MetricCard({ title, value, subtitle, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}