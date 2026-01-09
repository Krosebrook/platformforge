import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TenantProvider, useTenant } from './components/common/TenantContext';
import { GlobalSearch, useGlobalSearch } from './components/ui/GlobalSearch';
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard, Users, Package, Briefcase, Settings, 
  Search, Bell, Menu, Building2, ChevronDown, LogOut,
  Shield, FileText, Activity, Zap, HelpCircle, ChevronRight,
  FolderKanban, Link2, Heart, BarChart3, Clock
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

const NAVIGATION = [
  { 
    name: 'Dashboard', 
    icon: LayoutDashboard, 
    page: 'Dashboard',
    description: 'Overview & metrics'
  },
  { 
    name: 'Analytics', 
    icon: BarChart3, 
    page: 'Analytics',
    description: 'Job performance metrics'
  },
  { 
    name: 'Customers', 
    icon: Users, 
    page: 'Customers',
    description: 'Manage your clients'
  },
  { 
    name: 'Jobs', 
    icon: Briefcase, 
    page: 'Jobs',
    description: 'Orders & tasks'
  },
  { 
    name: 'Products', 
    icon: Package, 
    page: 'Products',
    description: 'Product catalog'
  },
];

const ADMIN_NAVIGATION = [
  { 
    name: 'Team', 
    icon: Users, 
    page: 'Team',
    description: 'Members & roles',
    permission: 'manage_members'
  },
  { 
    name: 'Integrations', 
    icon: Link2, 
    page: 'Integrations',
    description: 'Connected services',
    permission: 'manage_settings'
  },
  { 
    name: 'Approvals', 
    icon: Shield, 
    page: 'Approvals',
    description: 'Pending requests',
    feature: 'approvals'
  },
  { 
    name: 'Audit Log', 
    icon: Activity, 
    page: 'AuditLog',
    description: 'Activity history',
    feature: 'audit_logs'
  },
  { 
    name: 'System Health', 
    icon: Heart, 
    page: 'SystemHealth',
    description: 'Platform status'
  },
  { 
    name: 'Settings', 
    icon: Settings, 
    page: 'Settings',
    description: 'Organization settings',
    permission: 'manage_settings'
  },
];

function MainLayout({ children, currentPageName }) {
  const tenant = useTenant();
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useGlobalSearch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pendingApprovals', tenant.currentOrgId],
    queryFn: async () => {
      if (!tenant.currentOrgId || !tenant.isAdmin) return [];
      return await base44.entities.ApprovalRequest.filter({
        organization_id: tenant.currentOrgId,
        status: 'pending'
      }, '-created_date', 10);
    },
    enabled: !!tenant.currentOrgId && tenant.isAdmin,
  });

  const NavLink = ({ item, mobile = false }) => {
    const isActive = currentPageName === item.page;
    const Icon = item.icon;
    
    if (item.permission && !tenant.hasPermission(item.permission)) return null;
    if (item.feature && !tenant.hasFeature(item.feature)) return null;

    return (
      <Link
        to={createPageUrl(item.page)}
        onClick={() => mobile && setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
          ${isActive 
            ? 'bg-gray-900 text-white shadow-lg' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className="flex-1">{item.name}</span>
        {item.page === 'Approvals' && pendingApprovals.length > 0 && (
          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] justify-center">
            {pendingApprovals.length}
          </Badge>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">
              {tenant.organization?.name || 'Platform'}
            </h1>
            <p className="text-xs text-gray-500 capitalize">
              {tenant.organization?.plan || 'Free'} Plan
            </p>
          </div>
        </div>

        {tenant.organizations.length > 1 && (
          <Select
            value={tenant.currentOrgId || ''}
            onValueChange={tenant.switchOrganization}
          >
            <SelectTrigger className="mt-3 text-sm">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {tenant.organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {org.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {NAVIGATION.map(item => (
            <NavLink key={item.page} item={item} mobile={mobile} />
          ))}
        </nav>

        {tenant.isAdmin && (
          <>
            <div className="mt-6 mb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </p>
            </div>
            <nav className="space-y-1">
              {ADMIN_NAVIGATION.map(item => (
                <NavLink key={item.page} item={item} mobile={mobile} />
              ))}
            </nav>
          </>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <Link 
          to={createPageUrl('Docs')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
        >
          <FileText className="w-5 h-5 text-gray-400" />
          <span>Documentation</span>
        </Link>
        <Link 
          to={createPageUrl('Help')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
        >
          <HelpCircle className="w-5 h-5 text-gray-400" />
          <span>Help & Support</span>
        </Link>
      </div>
    </div>
  );

  if (!tenant.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Platform</h1>
          <p className="text-gray-500 mb-6">Please sign in to continue</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!tenant.organization && !tenant.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">No Organization Found</h1>
            <p className="text-gray-500 mb-6">
              You're not a member of any organization yet. Create one to get started.
            </p>
            <Link to={createPageUrl('Onboarding')}>
              <Button className="w-full">
                Create Organization
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r">
        <SidebarContent />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-gray-900 w-64"
                onClick={openSearch}
              >
                <Search className="w-4 h-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">⌘K</kbd>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {tenant.workspaces.length > 0 && (
                <Select
                  value={tenant.currentWorkspaceId || ''}
                  onValueChange={tenant.switchWorkspace}
                >
                  <SelectTrigger className="w-40 hidden sm:flex">
                    <SelectValue placeholder="All Workspaces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Workspaces</SelectItem>
                    {tenant.workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {pendingApprovals.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {pendingApprovals.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pendingApprovals.length === 0 ? (
                    <div className="py-4 text-center text-sm text-gray-500">
                      No new notifications
                    </div>
                  ) : (
                    pendingApprovals.slice(0, 5).map(approval => (
                      <DropdownMenuItem key={approval.id} asChild>
                        <Link to={createPageUrl('Approvals')} className="cursor-pointer">
                          <div className="flex items-start gap-3">
                            <Shield className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {approval.request_type.replace(/_/g, ' ')} Request
                              </p>
                              <p className="text-xs text-gray-500">
                                From {approval.requester_email}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-900 text-white text-sm">
                        {tenant.user?.full_name?.[0] || tenant.user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">
                      {tenant.user?.full_name || tenant.user?.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{tenant.user?.full_name}</p>
                      <p className="text-xs text-gray-500">{tenant.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={closeSearch} />
      <Toaster position="top-right" />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <MainLayout currentPageName={currentPageName}>
          {children}
        </MainLayout>
      </TenantProvider>
    </QueryClientProvider>
  );
}