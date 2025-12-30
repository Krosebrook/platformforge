import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { RoleBadge } from '../components/ui/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, Mail, Shield, Bell, Key, LogOut, 
  Camera, Save, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Profile() {
  const queryClient = useQueryClient();
  const { user, organization, role, currentOrgId } = useTenant();
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    preferences: user?.preferences || {}
  });

  const [notifications, setNotifications] = useState({
    email_digest: true,
    approval_requests: true,
    job_updates: true,
    weekly_summary: false
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'update',
        resource_type: 'user',
        resource_id: user.id,
        resource_name: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      full_name: profileData.full_name,
      preferences: {
        ...profileData.preferences,
        notifications
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gray-900 text-white text-2xl">
                  {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user?.full_name || 'User'}</h3>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge role={role} />
                <span className="text-sm text-gray-500">
                  at {organization?.name}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Email Digest</p>
              <p className="text-sm text-gray-500">
                Receive a daily summary of activity
              </p>
            </div>
            <Switch
              checked={notifications.email_digest}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email_digest: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Approval Requests</p>
              <p className="text-sm text-gray-500">
                Get notified about pending approvals
              </p>
            </div>
            <Switch
              checked={notifications.approval_requests}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, approval_requests: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Job Updates</p>
              <p className="text-sm text-gray-500">
                Notifications for assigned job changes
              </p>
            </div>
            <Switch
              checked={notifications.job_updates}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, job_updates: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-gray-500">
                Weekly performance and activity report
              </p>
            </div>
            <Switch
              checked={notifications.weekly_summary}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, weekly_summary: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-500">Last changed: Never</p>
              </div>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Not enabled</p>
              </div>
            </div>
            <Button variant="outline">Enable 2FA</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Current Session</p>
              <p className="text-sm text-gray-500">
                Started {format(new Date(), 'PPp')}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="text-red-600"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}