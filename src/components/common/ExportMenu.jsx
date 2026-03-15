import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown, FileText, FileSpreadsheet, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

/**
 * ExportMenu – reusable export button for CSV / Excel / PDF
 *
 * Props:
 *   data     - array of plain objects to export
 *   columns  - [{ key, label }] defining which fields to export and their headers
 *   filename - base filename (without extension)
 *   title    - title shown in the PDF header
 */
export default function ExportMenu({ data = [], columns = [], filename = 'export', title = 'Report' }) {
  const [loading, setLoading] = useState(null);

  const headers = columns.map(c => c.label);
  const keys = columns.map(c => c.key);

  const toRows = () => data.map(row => keys.map(k => {
    const val = row[k];
    if (val === null || val === undefined) return '';
    return String(val);
  }));

  // ── CSV ──────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    setLoading('csv');
    const rows = toRows();
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${filename}.csv`);
    setLoading(null);
    toast.success('CSV exported');
  };

  // ── Excel (TSV via data URI) ──────────────────────────────────────────────
  const exportExcel = () => {
    setLoading('excel');
    const rows = toRows();
    const tsvContent = [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    triggerDownload(blob, `${filename}.xls`);
    setLoading(null);
    toast.success('Excel file exported');
  };

  // ── PDF ──────────────────────────────────────────────────────────────────
  const exportPDF = () => {
    setLoading('pdf');
    const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    const usableW = pageW - margin * 2;
    const colW = usableW / columns.length;
    let y = margin;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 20;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Exported ${new Date().toLocaleDateString()}  •  ${data.length} records`, margin, y);
    y += 20;
    doc.setTextColor(0);

    // Header row
    doc.setFillColor(17, 24, 39);
    doc.rect(margin, y, usableW, 18, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    headers.forEach((h, i) => doc.text(h, margin + i * colW + 4, y + 12));
    y += 18;

    // Data rows
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    const rows = toRows();
    rows.forEach((row, ri) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      if (ri % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, usableW, 16, 'F');
      }
      row.forEach((cell, ci) => {
        const maxLen = Math.floor(colW / 5.5);
        const txt = cell.length > maxLen ? cell.substring(0, maxLen) + '…' : cell;
        doc.text(txt, margin + ci * colW + 4, y + 11);
      });
      y += 16;
    });

    doc.save(`${filename}.pdf`);
    setLoading(null);
    toast.success('PDF exported');
  };

  const triggerDownload = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportCSV} disabled={!!loading}>
          <Table2 className="w-4 h-4 mr-2 text-green-600" />
          CSV {loading === 'csv' && '…'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel} disabled={!!loading}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
          Excel (.xls) {loading === 'excel' && '…'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={!!loading}>
          <FileText className="w-4 h-4 mr-2 text-red-500" />
          PDF {loading === 'pdf' && '…'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}