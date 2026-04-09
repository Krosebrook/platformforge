import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Download, Eye, FileText, File, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_ICONS = {
  pdf: FileText,
  invoice: FileText,
  quote: File,
  proposal: File,
  contract: File,
  report: FileText,
  other: File,
};

export default function DocumentDownloader({ document, relatedJob }) {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const DocumentIcon = DOCUMENT_ICONS[document.type?.toLowerCase()] || File;

  const handleDownload = async () => {
    if (!document.file_url) {
      toast.error('No file available for download');
      return;
    }

    try {
      setDownloading(true);
      
      // If it's a private file, create a signed URL
      if (document.is_private) {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: document.file_url,
          expires_in: 3600 // 1 hour
        });
        window.open(signed_url, '_blank');
      } else {
        // Direct download for public files
        window.open(document.file_url, '_blank');
      }
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!document.file_url) {
      toast.error('No file available for preview');
      return;
    }
    window.open(document.file_url, '_blank');
  };

  const fileSize = document.file_size 
    ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB`
    : null;

  const getDocumentTypeColor = (type) => {
    const colors = {
      invoice: 'bg-blue-100 text-blue-800',
      quote: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      contract: 'bg-red-100 text-red-800',
      report: 'bg-orange-100 text-orange-800',
      pdf: 'bg-gray-100 text-gray-800',
    };
    return colors[type?.toLowerCase()] || colors.pdf;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1 p-2 bg-gray-100 rounded-lg">
              <DocumentIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{document.name}</CardTitle>
                {document.type && (
                  <Badge className={getDocumentTypeColor(document.type)}>
                    {document.type.toUpperCase()}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {relatedJob && <span>For project: <strong>{relatedJob.title}</strong> • </span>}
                Uploaded {format(new Date(document.created_date), 'MMM d, yyyy')}
                {fileSize && <span> • {fileSize}</span>}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={downloading || !document.file_url}
            className="gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </Button>

          {document.file_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}
        </div>

        {document.description && (
          <p className="text-sm text-gray-600 mt-3">{document.description}</p>
        )}

        {document.expiration_date && new Date(document.expiration_date) < new Date() && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              This document has expired and is no longer available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}