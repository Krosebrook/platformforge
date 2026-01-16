import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { PlanBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Building2, Shield, CreditCard, Bell, Trash2, AlertTriangle, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const queryClient = useQueryClient();
  const { currentOrgId, organization, user, role, refreshOrganization } = useTenant();
  
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    billing_email: organization?.billing_email || '',
    settings: organization?.settings || {}
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  React.useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        billing_email: organization.billing_email || '',
        settings: organization.settings || {}
      });
    }
  }, [organization]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Organization.update(currentOrgId, data);

      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'settings_change',
        resource_type: 'organization',
        resource_id: currentOrgId,
        resource_name: organization.name,
        changes: {
          before: { name: organization.name, settings: organization.settings },
          after: data
        }
      });
    },
    onSuccess: () => {
      refreshOrganization();
      toast.success('Settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update settings: ' + error.message);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleSettingToggle = (key, value) => {
    const newSettings = { ...formData.settings, [key]: value };
    setFormData(prev => ({ ...prev, settings: newSettings }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your organization settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={organization?.slug || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  URL slugs cannot be changed after creation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_email">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_email: e.target.value }))}
                  placeholder="billing@company.com"
                />
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require approval for deletions</p>
                  <p className="text-sm text-gray-500">
                    Require admin approval before deleting important records
                  </p>
                </div>
                <Switch
                  checked={formData.settings.require_approval_for_deletion ?? true}
                  onCheckedChange={(checked) => handleSettingToggle('require_approval_for_deletion', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit log retention</p>
                  <p className="text-sm text-gray-500">
                    How long to keep audit logs (days)
                  </p>
                </div>
                <Input
                  type="number"
                  className="w-24"
                  value={formData.settings.audit_retention_days ?? 90}
                  onChange={(e) => handleSettingToggle('audit_retention_days', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Single Sign-On (SSO)</p>
                  <p className="text-sm text-gray-500">
                    Enable SAML-based single sign-on
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {organization?.plan === 'enterprise' ? (
                    <Switch
                      checked={formData.settings.sso_enabled ?? false}
                      onCheckedChange={(checked) => handleSettingToggle('sso_enabled', checked)}
                    />
                  ) : (
                    <PlanBadge plan="enterprise" />
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Domain Restriction</p>
                  <p className="text-sm text-gray-500">
                    Only allow users from specific email domains
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={organization?.plan !== 'enterprise'}>
                  Configure
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">
                    Require 2FA for all team members
                  </p>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white">
                <div>
                  <PlanBadge plan={organization?.plan} />
                  <h3 className="text-2xl font-bold mt-2 capitalize">{organization?.plan} Plan</h3>
                  <p className="text-gray-300 mt-1">
                    {organization?.plan === 'free' && 'Get started with the basics'}
                    {organization?.plan === 'pro' && 'For growing businesses'}
                    {organization?.plan === 'team' && 'For larger teams'}
                    {organization?.plan === 'enterprise' && 'For enterprise needs'}
                  </p>
                </div>
                <Button variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Team Members', value: '∞', icon: '👥' },
                  { label: 'Workspaces', value: '∞', icon: '📁' },
                  { label: 'Customers', value: '∞', icon: '👤' },
                  { label: 'Storage', value: '100GB', icon: '💾' }
                ].map(({ label, value, icon }) => (
                  <div key={label} className="p-4 border rounded-lg text-center">
                    <span className="text-2xl">{icon}</span>
                    <p className="font-bold mt-2">{value}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                These actions are irreversible. Please proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium">Export All Data</p>
                  <p className="text-sm text-gray-500">
                    Download all your organization data as JSON
                  </p>
                </div>
                <Button variant="outline">Export</Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-600">Delete Organization</p>
                  <p className="text-sm text-gray-500">
                    Permanently delete this organization and all its data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        organization, all workspaces, members, and data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label>Type "{organization?.name}" to confirm</Label>
                      <Input
                        className="mt-2"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={organization?.name}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteConfirm !== organization?.name}
                      >
                        Delete Organization
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}