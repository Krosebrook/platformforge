import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Edit, Trash2, Eye, Download, Upload, LogIn, LogOut, 
  UserPlus, Shield, Check, X, Settings, Link2, Key, User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
  import: Upload,
  login: LogIn,
  logout: LogOut,
  invite: UserPlus,
  role_change: Shield,
  approve: Check,
  reject: X,
  status_change: Edit,
  assignment_change: User,
  settings_change: Settings,
  integration_connect: Link2,
  integration_disconnect: Link2,
  api_key_create: Key,
  api_key_revoke: Key,
  impersonate: User
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-700',
  export: 'bg-purple-100 text-purple-700',
  import: 'bg-purple-100 text-purple-700',
  login: 'bg-green-100 text-green-700',
  logout: 'bg-gray-100 text-gray-700',
  invite: 'bg-blue-100 text-blue-700',
  role_change: 'bg-yellow-100 text-yellow-700',
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  status_change: 'bg-blue-100 text-blue-700',
  assignment_change: 'bg-blue-100 text-blue-700',
  settings_change: 'bg-yellow-100 text-yellow-700',
  integration_connect: 'bg-purple-100 text-purple-700',
  integration_disconnect: 'bg-orange-100 text-orange-700',
  api_key_create: 'bg-green-100 text-green-700',
  api_key_revoke: 'bg-red-100 text-red-700',
  impersonate: 'bg-yellow-100 text-yellow-700'
};

export function ActivityFeed({ 
  limit = 20, 
  resourceType, 
  resourceId,
  showHeader = true,
  maxHeight = '400px'
}) {
  const { currentOrgId, currentWorkspaceId } = useTenant();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', currentOrgId, currentWorkspaceId, resourceType, resourceId, limit],
    queryFn: async () => {
      if (!currentOrgId) return [];
      
      const filter = { organization_id: currentOrgId };
      if (currentWorkspaceId) filter.workspace_id = currentWorkspaceId;
      if (resourceType) filter.resource_type = resourceType;
      if (resourceId) filter.resource_id = resourceId;

      return await base44.entities.Activity.filter(filter, '-created_date', limit);
    },
    enabled: !!currentOrgId,
    refetchInterval: 30000
  });

  const ActivityItem = ({ activity }) => {
    const Icon = ACTION_ICONS[activity.action] || Edit;
    const colorClass = ACTION_COLORS[activity.action] || 'bg-gray-100 text-gray-700';

    return (
      <div className="flex gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full h-fit ${colorClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            <span className="font-medium">{activity.actor_name || activity.actor_email?.split('@')[0]}</span>
            {' '}
            <span className="text-gray-600">{activity.description}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
            </span>
            {activity.resource_type && (
              <Badge variant="outline" className="text-xs capitalize">
                {activity.resource_type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export function MiniActivityFeed({ limit = 5 }) {
  const { currentOrgId } = useTenant();

  const { data: activities = [] } = useQuery({
    queryKey: ['miniActivities', currentOrgId, limit],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.Activity.filter(
        { organization_id: currentOrgId },
        '-created_date',
        limit
      );
    },
    enabled: !!currentOrgId,
    refetchInterval: 30000
  });

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const Icon = ACTION_ICONS[activity.action] || Edit;
        return (
          <div key={activity.id} className="flex items-center gap-2 text-sm">
            <Icon className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600 truncate flex-1">{activity.description}</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}