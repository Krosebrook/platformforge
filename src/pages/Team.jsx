import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge, StatusBadge } from '../components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, MoreHorizontal, Shield, 
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Team() {
  const queryClient = useQueryClient();
  const { currentOrgId, user, role, isOwner, isAdmin, organization, planLimits } = useTenant();
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteData, setInviteData] = useState({ email: '', role: 'viewer', custom_role_id: '' });
  const [newRole, setNewRole] = useState('viewer');

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      return await base44.entities.Membership.filter({
        organization_id: currentOrgId
      }, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const { data: customRoles = [] } = useQuery({
    queryKey: ['roles', currentOrgId],
    queryFn: async () => {
      return await base44.entities.Role.filter({
        organization_id: currentOrgId,
        is_active: true
      });
    },
    enabled: !!currentOrgId
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role, custom_role_id }) => {
      const existing = memberships.find(m => m.user_email === email);
      if (existing) {
        throw new Error('This user is already a member');
      }

      const membership = await base44.entities.Membership.create({
        organization_id: currentOrgId,
        user_email: email,
        role,
        custom_role_id: custom_role_id || null,
        status: 'invited',
        invited_by: user.email,
        invited_at: new Date().toISOString()
      });

      await base44.users.inviteUser(email, 'user');

      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'invite',
        resource_type: 'membership',
        resource_id: membership.id,
        resource_name: email,
        metadata: { invited_role: role }
      });

      return membership;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships']);
      setShowInviteDialog(false);
      setInviteData({ email: '', role: 'viewer', custom_role_id: '' });
      toast.success('Invitation sent successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ membershipId, newRole }) => {
      const membership = memberships.find(m => m.id === membershipId);
      
      await base44.entities.Membership.update(membershipId, { role: newRole });

      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'role_change',
        resource_type: 'membership',
        resource_id: membershipId,
        resource_name: membership.user_email,
        changes: {
          before: { role: membership.role },
          after: { role: newRole }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships']);
      setShowRoleDialog(false);
      setSelectedMember(null);
      toast.success('Role updated successfully');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId) => {
      const membership = memberships.find(m => m.id === membershipId);
      
      await base44.entities.Membership.update(membershipId, { status: 'removed' });

      await logAuditEvent({
        organization_id: currentOrgId,
        actor_email: user.email,
        actor_role: role,
        action: 'delete',
        resource_type: 'membership',
        resource_id: membershipId,
        resource_name: membership.user_email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships']);
      toast.success('Member removed');
    }
  });

  const activeMemberships = memberships.filter(m => m.status !== 'removed');
  const canInvite = planLimits.max_members === -1 || activeMemberships.length < planLimits.max_members;

  const handleInvite = (e) => {
    e.preventDefault();
    inviteMutation.mutate(inviteData);
  };

  const handleRoleChange = () => {
    changeRoleMutation.mutate({ membershipId: selectedMember.id, newRole });
  };

  const canManageMember = (member) => {
    if (!isAdmin) return false;
    if (member.user_email === user.email) return false;
    if (member.role === 'owner' && !isOwner) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 mt-1">
            Manage your organization members and roles
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowInviteDialog(true)}
            disabled={!canInvite}
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {!canInvite && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Member limit reached</p>
              <p className="text-sm text-amber-700">
                Your {organization?.plan} plan allows up to {planLimits.max_members} members. 
                Upgrade to add more team members.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({activeMemberships.length})</CardTitle>
          <CardDescription>
            People with access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {activeMemberships.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-900 text-white">
                        {member.user_email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user_email}
                        {member.user_email === user.email && (
                          <span className="text-gray-500 text-sm ml-2">(you)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <RoleBadge role={member.role} size="sm" />
                        {member.custom_role_id && customRoles.find(r => r.id === member.custom_role_id) && (
                          <Badge variant="outline" className="text-xs">
                            {customRoles.find(r => r.id === member.custom_role_id).name}
                          </Badge>
                        )}
                        {member.status === 'invited' && (
                          <StatusBadge status="invited" size="sm" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {member.last_active_at && (
                      <span className="text-sm text-gray-500 hidden sm:inline">
                        Active {formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })}
                      </span>
                    )}
                    {canManageMember(member) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedMember(member);
                            setNewRole(member.role);
                            setShowRoleDialog(true);
                          }}>
                            <Shield className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => removeMemberMutation.mutate(member.id)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'owner', perms: ['Full access', 'Billing management', 'Delete organization', 'Transfer ownership'] },
              { role: 'admin', perms: ['Manage members', 'Manage settings', 'View audit logs', 'Approve requests'] },
              { role: 'editor', perms: ['Create/edit content', 'Export data', 'Use integrations'] },
              { role: 'viewer', perms: ['View content', 'Read-only access'] }
            ].map(({ role, perms }) => (
              <div key={role} className="p-4 border rounded-lg">
                <RoleBadge role={role} />
                <ul className="mt-3 space-y-1">
                  {perms.map((perm, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {organization?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    {isOwner && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {customRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Custom Role (Optional)</Label>
                  <Select
                    value={inviteData.custom_role_id || ''}
                    onValueChange={(value) => setInviteData(prev => ({ ...prev, custom_role_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {customRoles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.user_email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {isOwner && <SelectItem value="owner">Owner</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={changeRoleMutation.isPending}>
              {changeRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}