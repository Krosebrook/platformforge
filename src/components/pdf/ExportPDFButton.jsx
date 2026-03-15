import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ExportPDFButton({ type, data, variant = 'outline', size = 'default', label = 'Export PDF' }) {
  const { currentOrgId } = useTenant();
  const [exporting, setExporting] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['pdfTemplates', currentOrgId],
    queryFn: () => base44.entities.PDFTemplate.filter({ organization_id: currentOrgId }),
    enabled: !!currentOrgId,
  });

  const defaultTemplate = templates.find(t => t.is_default) || templates[0];

  const handleExport = async (templateId = null) => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportPDF', {
        type,
        data,
        templateId: templateId || defaultTemplate?.id || null,
        organizationId: currentOrgId,
      });

      // The response.data is an ArrayBuffer (binary PDF)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'job'
        ? `job-${data?.job?.reference_number || 'export'}.pdf`
        : `report-${(data?.title || 'export').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (templates.length <= 1) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(defaultTemplate?.id)}
        disabled={exporting}
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Choose Template</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {templates.map(tmpl => (
          <DropdownMenuItem key={tmpl.id} onClick={() => handleExport(tmpl.id)}>
            <FileText className="w-4 h-4 mr-2" />
            {tmpl.name}
            {tmpl.is_default && (
              <span className="ml-2 text-xs text-gray-400">(default)</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('PDFTemplates')}>
            <Settings className="w-4 h-4 mr-2" />
            Manage Templates
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}