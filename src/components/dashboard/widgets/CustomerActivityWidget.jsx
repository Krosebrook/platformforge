import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CustomerActivityWidget({ widget }) {
  const { currentOrgId, currentWorkspaceId } = useTenant();

  const { data: activities = [] } = useQuery({
    queryKey: ['recentActivity', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      return await base44.entities.CustomerInteraction.filter({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId || undefined
      }, '-interaction_date', widget?.filters?.limit || 10);
    },
    enabled: !!currentOrgId
  });

  const getTypeIcon = (type) => {
    return { call: '☎️', email: '📧', meeting: '🤝', note: '📝', demo: '🎯', support: '🆘' }[type] || '•';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Recent Customer Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activities</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="p-2 border rounded text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{activity.subject}</p>
                    <p className="text-xs text-gray-600 capitalize">{activity.type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.interaction_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}