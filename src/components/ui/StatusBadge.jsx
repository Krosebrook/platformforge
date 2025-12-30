import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  Circle, CheckCircle, XCircle, Clock, AlertTriangle, 
  Pause, Play, Archive, Zap, RotateCcw
} from 'lucide-react';

const STATUS_CONFIGS = {
  active: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { icon: Circle, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  on_hold: { icon: Pause, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  in_progress: { icon: Play, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  draft: { icon: Circle, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  review: { icon: AlertTriangle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  archived: { icon: Archive, color: 'bg-gray-100 text-gray-500 border-gray-200' },
  error: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  success: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  queued: { icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { icon: Zap, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  dead_letter: { icon: Archive, color: 'bg-red-50 text-red-600 border-red-200' },
  invited: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  suspended: { icon: Pause, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  removed: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  expired: { icon: Clock, color: 'bg-gray-100 text-gray-500 border-gray-200' },
  churned: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  prospect: { icon: Circle, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  discontinued: { icon: Archive, color: 'bg-gray-100 text-gray-500 border-gray-200' },
  healthy: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  degraded: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  down: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
  unknown: { icon: Circle, color: 'bg-gray-100 text-gray-500 border-gray-200' },
  retry: { icon: RotateCcw, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pending_auth: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
};

export function StatusBadge({ status, showIcon = true, size = 'default', className = '' }) {
  const normalizedStatus = status?.toLowerCase?.()?.replace(/\s+/g, '_') || 'unknown';
  const config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.unknown;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    default: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses[size]} font-medium capitalize ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} mr-1.5`} />}
      {status?.replace(/_/g, ' ') || 'Unknown'}
    </Badge>
  );
}

export function PriorityBadge({ priority, showIcon = true, size = 'default' }) {
  const configs = {
    low: { color: 'bg-gray-100 text-gray-600 border-gray-200' },
    medium: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
    high: { color: 'bg-orange-100 text-orange-800 border-orange-200' },
    urgent: { color: 'bg-red-100 text-red-700 border-red-200' }
  };

  const config = configs[priority?.toLowerCase()] || configs.medium;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge variant="outline" className={`${config.color} ${sizeClasses[size]} font-medium capitalize`}>
      {priority || 'Medium'}
    </Badge>
  );
}

export function RoleBadge({ role, size = 'default' }) {
  const configs = {
    owner: { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    admin: { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    editor: { color: 'bg-green-100 text-green-700 border-green-200' },
    viewer: { color: 'bg-gray-100 text-gray-600 border-gray-200' }
  };

  const config = configs[role?.toLowerCase()] || configs.viewer;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge variant="outline" className={`${config.color} ${sizeClasses[size]} font-medium capitalize`}>
      {role || 'Viewer'}
    </Badge>
  );
}

export function PlanBadge({ plan, size = 'default' }) {
  const configs = {
    free: { color: 'bg-gray-100 text-gray-600 border-gray-200' },
    pro: { color: 'bg-blue-100 text-blue-800 border-blue-200' },
    team: { color: 'bg-purple-100 text-purple-800 border-purple-200' },
    enterprise: { color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200' }
  };

  const config = configs[plan?.toLowerCase()] || configs.free;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge variant="outline" className={`${config.color} ${sizeClasses[size]} font-semibold capitalize`}>
      {plan || 'Free'}
    </Badge>
  );
}