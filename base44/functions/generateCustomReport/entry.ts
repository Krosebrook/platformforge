import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return Response.json({ error: 'Missing reportId' }, { status: 400 });
    }

    // Fetch report configuration
    const reports = await base44.entities.ReportConfiguration.filter({ id: reportId });
    const report = reports[0];

    if (!report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Fetch data based on entity type
    let data = [];
    const { entity_type, selected_fields } = report.data_source;
    const query = {};

    // Apply filters
    if (report.filters?.date_range) {
      const endDate = new Date();
      const startDate = new Date();

      if (report.filters.date_range.start_date) {
        startDate = new Date(report.filters.date_range.start_date);
      }
      if (report.filters.date_range.end_date) {
        endDate = new Date(report.filters.date_range.end_date);
      }
    }

    if (report.filters?.status?.length) {
      query.status = { $in: report.filters.status };
    }
    if (report.filters?.priority?.length) {
      query.priority = { $in: report.filters.priority };
    }

    // Fetch data
    const entityData = await base44.entities[entity_type].filter(query, '-created_date', 1000);

    // Apply grouping
    if (report.grouping?.group_by_field) {
      const grouped = {};
      entityData.forEach(item => {
        const key = item[report.grouping.group_by_field] || 'Unknown';
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(item);
      });
      data = grouped;
    } else {
      data = entityData;
    }

    // Update generation count
    await base44.entities.ReportConfiguration.update(reportId, {
      generation_count: (report.generation_count || 0) + 1,
      last_generated_at: new Date().toISOString()
    });

    // Generate CSV
    const headers = selected_fields?.length > 0 ? selected_fields : Object.keys(entityData[0] || {});
    let csv = headers.join(',') + '\n';

    const rows = Array.isArray(data)
      ? data
      : Object.values(data).flat();

    rows.forEach(row => {
      const values = headers.map(h => {
        const val = row[h];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      });
      csv += values.join(',') + '\n';
    });

    // Return CSV data
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="report-${reportId}.csv"`
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});