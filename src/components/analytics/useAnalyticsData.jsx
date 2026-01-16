import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';

/**
 * Custom hook for processing and computing analytics data
 * Centralizes all analytics calculations and transformations
 * @param {Array} jobs - Raw job data
 * @param {Object} filters - Active filter state
 * @returns {Object} Computed metrics and chart data
 */
export function useAnalyticsData(jobs = [], filters = {}) {
  // Filter jobs based on active filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filters.member !== 'all' && job.assigned_to !== filters.member) return false;
      if (filters.customer !== 'all' && job.customer_id !== filters.customer) return false;
      if (filters.status !== 'all' && job.status !== filters.status) return false;
      return true;
    });
  }, [jobs, filters]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const completed = filteredJobs.filter(j => j.status === 'completed');
    const inProgress = filteredJobs.filter(j => j.status === 'in_progress');
    const overdue = filteredJobs.filter(j => 
      j.due_date && 
      new Date(j.due_date) < new Date() && 
      j.status !== 'completed'
    );

    // Calculate average completion time for finished jobs
    const avgCompletionTime = completed.length > 0
      ? completed.reduce((sum, j) => {
          if (j.started_at && j.completed_at) {
            return sum + differenceInDays(parseISO(j.completed_at), parseISO(j.started_at));
          }
          return sum;
        }, 0) / completed.filter(j => j.started_at && j.completed_at).length
      : 0;

    const totalValue = filteredJobs.reduce((sum, j) => sum + (j.value || 0), 0);
    const completedValue = completed.reduce((sum, j) => sum + (j.value || 0), 0);

    // Calculate on-time delivery rate
    const onTimeRate = completed.length > 0
      ? (completed.filter(j => 
          !j.due_date || new Date(j.completed_at) <= new Date(j.due_date)
        ).length / completed.length) * 100
      : 0;

    return {
      totalJobs: filteredJobs.length,
      completed: completed.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      avgCompletionTime: avgCompletionTime.toFixed(1),
      totalValue,
      completedValue,
      onTimeRate: onTimeRate.toFixed(1)
    };
  }, [filteredJobs]);

  // Generate status distribution data for pie chart
  const statusDistribution = useMemo(() => {
    const statusCounts = {};
    filteredJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredJobs]);

  // Calculate team member performance metrics
  const memberPerformance = useMemo(() => {
    const memberStats = {};
    filteredJobs.forEach(job => {
      if (!job.assigned_to) return;
      if (!memberStats[job.assigned_to]) {
        memberStats[job.assigned_to] = { 
          name: job.assigned_to, 
          completed: 0, 
          total: 0, 
          value: 0 
        };
      }
      memberStats[job.assigned_to].total++;
      if (job.status === 'completed') {
        memberStats[job.assigned_to].completed++;
        memberStats[job.assigned_to].value += job.value || 0;
      }
    });
    return Object.values(memberStats)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredJobs]);

  // Generate monthly trend data
  const monthlyTrend = useMemo(() => {
    const months = {};
    filteredJobs.forEach(job => {
      const month = format(parseISO(job.created_date), 'MMM yyyy');
      if (!months[month]) {
        months[month] = { month, created: 0, completed: 0, value: 0 };
      }
      months[month].created++;
      if (job.status === 'completed') {
        months[month].completed++;
        months[month].value += job.value || 0;
      }
    });
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [filteredJobs]);

  return {
    metrics,
    statusDistribution,
    memberPerformance,
    monthlyTrend
  };
}