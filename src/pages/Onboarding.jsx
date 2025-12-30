import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '../components/common/AuditLogger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Building2, Zap, CheckCircle, ArrowRight, Users, 
  Briefcase, Package, Shield, BarChart3, Globe
} from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: ['Up to 3 team members', '1 workspace', '100 customers', 'Basic jobs'],
    recommended: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'For growing businesses',
    features: ['Up to 10 team members', '3 workspaces', '1,000 customers', 'Exports & API access'],
    recommended: true
  },
  {
    id: 'team',
    name: 'Team',
    price: '$79',
    description: 'For larger teams',
    features: ['Up to 50 team members', '10 workspaces', '10,000 customers', 'Integrations & approvals'],
    recommended: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For enterprise needs',
    features: ['Unlimited members', 'Unlimited workspaces', 'SSO & audit logs', 'Dedicated support'],
    recommended: false
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    plan: 'free'
  });
  const [workspaceData, setWorkspaceData] = useState({
    name: 'Default Workspace'
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      const org = await base44.entities.Organization.create({
        name: orgData.name,
        slug: orgData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        plan: orgData.plan,
        status: 'active',
        settings: {
          require_approval_for_deletion: true,
          audit_retention_days: 90
        }
      });

      await base44.entities.Membership.create({
        organization_id: org.id,
        user_email: user.email,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      });

      const workspace = await base44.entities.Workspace.create({
        organization_id: org.id,
        name: workspaceData.name,
        slug: workspaceData.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        status: 'active'
      });

      await logAuditEvent({
        organization_id: org.id,
        workspace_id: workspace.id,
        actor_email: user.email,
        actor_role: 'owner',
        action: 'create',
        resource_type: 'organization',
        resource_id: org.id,
        resource_name: org.name
      });

      return { org, workspace };
    },
    onSuccess: ({ org }) => {
      localStorage.setItem('currentOrgId', org.id);
      queryClient.invalidateQueries(['userOrganizations']);
      toast.success('Organization created successfully!');
      navigate(createPageUrl('Dashboard'));
    },
    onError: (error) => {
      toast.error('Failed to create organization: ' + error.message);
    }
  });

  const handleSlugGenerate = (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setOrgData(prev => ({ ...prev, name, slug }));
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
            s === step ? 'bg-gray-900 text-white' : 
            s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {s < step ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-16 h-1 mx-2 rounded ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to the Platform</h1>
          <p className="text-gray-500 mt-2">Let's set up your organization in just a few steps</p>
        </div>

        <StepIndicator />

        {step === 1 && (
          <Card className="animate-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Tell us about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Inc."
                  value={orgData.name}
                  onChange={(e) => handleSlugGenerate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">platform.com/</span>
                  <Input
                    id="slug"
                    placeholder="acme-inc"
                    value={orgData.slug}
                    onChange={(e) => setOrgData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!orgData.name || !orgData.slug}
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Choose Your Plan
              </CardTitle>
              <CardDescription>
                Select the plan that best fits your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={orgData.plan}
                onValueChange={(value) => setOrgData(prev => ({ ...prev, plan: value }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {PLANS.map((plan) => (
                  <Label
                    key={plan.id}
                    htmlFor={plan.id}
                    className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all hover:shadow-md ${
                      orgData.plan === plan.id 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                    {plan.recommended && (
                      <Badge className="absolute -top-3 left-4 bg-gray-900">
                        Recommended
                      </Badge>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {plan.price}
                        {plan.price !== 'Custom' && <span className="text-sm font-normal text-gray-500">/mo</span>}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="animate-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Create Your First Workspace
              </CardTitle>
              <CardDescription>
                Workspaces help you organize your work into separate projects or teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace Name</Label>
                <Input
                  id="workspace"
                  placeholder="Default Workspace"
                  value={workspaceData.name}
                  onChange={(e) => setWorkspaceData({ name: e.target.value })}
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium mb-4">Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Organization</span>
                    <span className="font-medium">{orgData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium capitalize">{orgData.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Workspace</span>
                    <span className="font-medium">{workspaceData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Owner</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={() => createOrgMutation.mutate()}
                  disabled={!workspaceData.name || createOrgMutation.isPending}
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}