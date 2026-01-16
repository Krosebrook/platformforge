import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CreditCard, Database, MessageSquare, Kanban, BarChart3, Cloud, Mail, Users, ExternalLink } from 'lucide-react';

const CATEGORY_ICONS = {
  crm: Users,
  accounting: CreditCard,
  communication: MessageSquare,
  project_management: Kanban,
  payments: CreditCard,
  analytics: BarChart3,
  storage: Cloud,
  marketing: Mail,
  hr: Users,
  other: Database
};

const SAMPLE_INTEGRATIONS = [
  { name: 'Stripe', provider: 'stripe', category: 'payments', description: 'Accept payments online', features: ['Credit cards', 'Subscriptions', 'Invoicing'], pricing: '2.9% + 30¢' },
  { name: 'QuickBooks', provider: 'quickbooks', category: 'accounting', description: 'Accounting and bookkeeping', features: ['Invoicing', 'Expense tracking', 'Reports'], pricing: '$15/mo' },
  { name: 'Mailchimp', provider: 'mailchimp', category: 'marketing', description: 'Email marketing platform', features: ['Email campaigns', 'Automation', 'Analytics'], pricing: 'Free - $350/mo' },
  { name: 'Twilio', provider: 'twilio', category: 'communication', description: 'SMS and voice APIs', features: ['SMS', 'Voice calls', 'Video'], pricing: 'Pay as you go' },
  { name: 'Dropbox', provider: 'dropbox', category: 'storage', description: 'Cloud storage and file sharing', features: ['File storage', 'Sharing', 'Collaboration'], pricing: '$12/mo' },
  { name: 'Trello', provider: 'trello', category: 'project_management', description: 'Visual project management', features: ['Boards', 'Cards', 'Collaboration'], pricing: 'Free - $17/mo' },
  { name: 'Google Analytics', provider: 'google_analytics', category: 'analytics', description: 'Website analytics', features: ['Traffic analysis', 'User behavior', 'Reports'], pricing: 'Free' },
  { name: 'Zapier', provider: 'zapier', category: 'other', description: 'Automation platform', features: ['1000+ integrations', 'Workflows', 'Automation'], pricing: 'Free - $599/mo' },
  { name: 'BambooHR', provider: 'bamboohr', category: 'hr', description: 'HR management software', features: ['Employee records', 'Time off', 'Performance'], pricing: 'Custom' },
  { name: 'Xero', provider: 'xero', category: 'accounting', description: 'Cloud accounting software', features: ['Invoicing', 'Bank reconciliation', 'Reports'], pricing: '$13/mo' }
];

export default function IntegrationCatalog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const integrations = SAMPLE_INTEGRATIONS;
  const categories = [...new Set(integrations.map(i => i.category))];

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                         i.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Catalog</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="capitalize">
                  {cat.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((integration) => {
                  const Icon = CATEGORY_ICONS[integration.category] || Database;
                  return (
                    <Card key={integration.provider} className="hover:shadow-lg transition">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{integration.name}</h4>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {integration.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {integration.description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {integration.features.slice(0, 3).map(feature => (
                                  <Badge key={feature} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{integration.pricing}</span>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Connect
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}