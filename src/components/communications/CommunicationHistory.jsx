import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Phone, MessageSquare, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS = {
  email: Mail,
  call: Phone,
  note: MessageSquare,
  meeting: Calendar
};

export default function CommunicationHistory({ customerId, jobId }) {
  const { currentOrgId } = useTenant();

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['communications', customerId, jobId],
    queryFn: async () => {
      const filter = { organization_id: currentOrgId, customer_id: customerId };
      if (jobId) filter.job_id = jobId;
      return await base44.entities.Communication.filter(filter, '-created_date', 50);
    },
    enabled: !!currentOrgId && !!customerId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication History</CardTitle>
      </CardHeader>
      <CardContent>
        {communications.length === 0 ? (
          <p className="text-sm text-gray-500">No communications yet</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {communications.map((comm) => {
                const Icon = TYPE_ICONS[comm.type] || Mail;
                return (
                  <div key={comm.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{comm.subject || comm.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          comm.status === 'sent' ? 'bg-green-50 text-green-700' :
                          comm.status === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-700'
                        }>
                          {comm.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comm.created_date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {comm.direction === 'outbound' ? 'To' : 'From'}: {comm.recipient_email || comm.sender_email}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comm.body?.substring(0, 200)}
                      {comm.body?.length > 200 && '...'}
                    </div>
                    {comm.attachments?.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {comm.attachments.length} attachment(s)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}