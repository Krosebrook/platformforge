import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { RequireFeature } from '../components/common/PermissionGate';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Link2, Plus, Settings, Trash2, ExternalLink,
  Webhook, Key, RefreshCw, CheckCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    icon: '💬',
    type: 'oauth',
    capabilities: ['notifications', 'commands']
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync job due dates with Google Calendar',
    icon: '📅',
    type: 'oauth',
    capabilities: ['sync', 'read', 'write']
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Send data to external endpoints',
    icon: '🔗',
    type: 'webhook_outbound',
    capabilities: ['send']
  },
  {
    id: 'api',
    name: 'API Access',
    description: 'Generate API keys for external access',
    icon: '🔑',
    type: 'api_key',
    capabilities: ['read', 'write']
  }
];

export default function Integrations() {
  const queryClient = useQueryClient();
  const { currentOrgId, user, role, hasFeature } = useTenant();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.Integration.filter({
        organization_id: currentOrgId
      });
    },
    enabled: !!currentOrgId && hasFeature('integrations')
  });

  const addIntegrationMutation = useMutation({
    mutationFn: async (data) => {
      const integration = await base44.entities.Integration.create({
        organization_id: currentOrgId,
        ...data,
        connected_by: user.email,
        connected_at: new Date().toISOString()
      });

      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'integration_connect',
        resource_type: 'integration',
        resource_id: integration.id,
        resource_name: data.name
      });

      return integration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      setShowAddDialog(false);
      setSelectedIntegration(null);
      toast.success('Integration added');
    }
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.Integration.update(id, { status });
      
      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: status === 'active' ? 'integration_connect' : 'integration_disconnect',
        resource_type: 'integration',
        resource_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      toast.success('Integration updated');
    }
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Integration.delete(id);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'integration_disconnect',
        resource_type: 'integration',
        resource_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['integrations']);
      toast.success('Integration removed');
    }
  });

  const handleAddIntegration = () => {
    if (!selectedIntegration) return;

    const config = selectedIntegration.type === 'webhook_outbound' 
      ? { webhook_url: webhookUrl }
      : {};

    addIntegrationMutation.mutate({
      name: selectedIntegration.name,
      type: selectedIntegration.type,
      provider: selectedIntegration.id,
      status: 'active',
      capabilities: selectedIntegration.capabilities,
      config
    });
  };

  const getIntegrationConfig = (provider) => {
    return AVAILABLE_INTEGRATIONS.find(i => i.id === provider);
  };

  return (
    <RequireFeature feature="integrations" showMessage>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
            <p className="text-gray-500 mt-1">
              Connect external services and automate workflows
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>

        {integrations.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Link2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No integrations yet</h3>
                <p className="text-gray-500 mt-1 mb-4">
                  Connect external services to automate your workflows
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => {
              const config = getIntegrationConfig(integration.provider);
              return (
                <Card key={integration.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{config?.icon || '🔌'}</span>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription>{config?.description}</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={integration.status === 'active'}
                        onCheckedChange={(checked) => 
                          toggleIntegrationMutation.mutate({
                            id: integration.id,
                            status: checked ? 'active' : 'inactive'
                          })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={integration.status} size="sm" />
                        <span className="text-sm text-gray-500">
                          Connected {format(new Date(integration.connected_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {integration.capabilities && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {integration.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs capitalize">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Incoming Webhooks
            </CardTitle>
            <CardDescription>
              Your unique webhook URL for receiving external events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={`https://api.platform.com/webhooks/${currentOrgId}`}
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(`https://api.platform.com/webhooks/${currentOrgId}`);
                toast.success('Copied to clipboard');
              }}>
                Copy
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Use this URL to receive webhook events from external services
            </p>
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
              <DialogDescription>
                Choose a service to connect
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {AVAILABLE_INTEGRATIONS.map((integration) => {
                const isConnected = integrations.some(i => i.provider === integration.id);
                return (
                  <div
                    key={integration.id}
                    onClick={() => !isConnected && setSelectedIntegration(integration)}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-all cursor-pointer ${
                      selectedIntegration?.id === integration.id 
                        ? 'border-gray-900 bg-gray-50' 
                        : isConnected
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{integration.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-gray-500">{integration.description}</p>
                    </div>
                    {isConnected && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {selectedIntegration?.type === 'webhook_outbound' && (
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  placeholder="https://example.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddIntegration}
                disabled={!selectedIntegration || addIntegrationMutation.isPending}
              >
                {addIntegrationMutation.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <IntegrationCatalog />
      </div>
    </RequireFeature>
  );
}