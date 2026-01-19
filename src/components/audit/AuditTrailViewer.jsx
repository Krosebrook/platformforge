import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ChevronDown, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AuditTrailViewer({ organizationId, limit = 50 }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({
    action: 'all',
    resource_type: 'all',
    search: ''
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['auditLogs', organizationId, filters],
    queryFn: async () => {
      const query = { organization_id: organizationId };
      if (filters.action !== 'all') query.action = filters.action;
      if (filters.resource_type !== 'all') query.resource_type = filters.resource_type;
      
      let results = await base44.entities.AuditLog.filter(query, '-timestamp', limit);
      
      if (filters.search) {
        results = results.filter(log => 
          log.actor_email.includes(filters.search) ||
          log.resource_name?.includes(filters.search) ||
          log.action.includes(filters.search)
        );
      }
      
      return results;
    },
    enabled: !!organizationId
  });

  const getActionIcon = (action) => {
    const icons = {
      create: '✨',
      update: '📝',
      delete: '🗑️',
      view: '👁️',
      export: '📤',
      approve: '✓',
      reject: '✗'
    };
    return icons[action] || '•';
  };

  const getStatusColor = (status) => {
    return {
      success: 'text-green-600',
      failed: 'text-red-600',
      partial: 'text-yellow-600'
    }[status] || 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input
          placeholder="Search actor, resource..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="export">Export</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.resource_type} onValueChange={(v) => setFilters({ ...filters, resource_type: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="Job">Job</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Task">Task</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {logs.map(log => (
          <Card key={log.id} className="cursor-pointer hover:shadow-md transition">
            <CardContent className="p-4">
              <div
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="flex items-start justify-between"
              >
                <div className="flex-1 flex items-start gap-3">
                  <span className="text-2xl">{getActionIcon(log.action)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{log.actor_email}</span>
                      <Badge variant="outline" className="capitalize">{log.action}</Badge>
                      <Badge variant="secondary">{log.resource_type}</Badge>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.resource_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition ${expandedId === log.id ? 'rotate-180' : ''}`} />
              </div>

              {expandedId === log.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Associated Entities */}
                  {log.associated_entities?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Associated Entities
                      </h4>
                      <div className="space-y-1 text-sm">
                        {log.associated_entities.map((entity, idx) => (
                          <div key={idx} className="flex gap-2 text-gray-600">
                            <span className="text-gray-400">→</span>
                            <span>{entity.entity_type}: {entity.entity_name} ({entity.relationship})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data Changes */}
                  {log.changes?.fields_modified?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Data Changes</h4>
                      <div className="space-y-2 bg-gray-50 p-3 rounded text-sm">
                        {log.changes.fields_modified.map((field, idx) => (
                          <div key={idx} className="border-l-2 border-gray-300 pl-3">
                            <p className="font-medium text-gray-900">{field.field_name}</p>
                            <div className="flex gap-4 mt-1">
                              <div>
                                <span className="text-xs text-gray-500">Before:</span>
                                <p className="font-mono text-xs text-red-600 bg-red-50 p-1 rounded mt-0.5">
                                  {JSON.stringify(field.old_value)}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">After:</span>
                                <p className="font-mono text-xs text-green-600 bg-green-50 p-1 rounded mt-0.5">
                                  {JSON.stringify(field.new_value)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Permission Check */}
                  {log.permission_check && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Permission Check
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {log.permission_check.check_passed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={log.permission_check.check_passed ? 'text-green-600' : 'text-red-600'}>
                            {log.permission_check.check_passed ? 'Granted' : 'Denied'}
                          </span>
                        </div>
                        {log.permission_check.granted_permissions?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Granted permissions:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {log.permission_check.granted_permissions.map(p => (
                                <Badge key={p} className="bg-green-100 text-green-800 text-xs">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.permission_check.denied_permissions?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600">Denied permissions:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {log.permission_check.denied_permissions.map(p => (
                                <Badge key={p} className="bg-red-100 text-red-800 text-xs">{p}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {log.error_message && (
                    <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                      <p className="font-medium">Error:</p>
                      <p className="text-xs mt-1">{log.error_message}</p>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                    <p>Actor Role: {log.actor_role}</p>
                    {log.ip_address && <p>IP Address: {log.ip_address}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}