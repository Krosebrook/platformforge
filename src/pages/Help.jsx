import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, MessageCircle, Book, Mail, Search,
  ChevronRight, ExternalLink, Video, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FAQ_ITEMS = [
  {
    question: 'How do I invite team members?',
    answer: 'Go to Team in the sidebar, click "Invite Member", enter their email address and select their role. They will receive an email invitation to join your organization.'
  },
  {
    question: 'What are the different user roles?',
    answer: 'Owner: Full access including billing and deletion. Admin: Manage members and settings. Editor: Create and edit content. Viewer: Read-only access. You can change roles from the Team page.'
  },
  {
    question: 'How do I upgrade my plan?',
    answer: 'Navigate to Settings > Billing to view your current plan and available upgrades. Click "Upgrade" to access higher tier features like integrations, approvals, and advanced audit logs.'
  },
  {
    question: 'How do I set up integrations?',
    answer: 'Go to Integrations in the admin menu, click "Add Integration", and select the service you want to connect. Follow the OAuth flow or enter API credentials as required. Integrations require the Team plan or higher.'
  },
  {
    question: 'What is the approval workflow?',
    answer: 'Approvals add a review step for sensitive actions like deletions or high-value jobs. When enabled, these actions create an approval request that must be approved by an admin before execution.'
  },
  {
    question: 'How long is data retained?',
    answer: 'Audit logs are retained according to your organization settings (default 90 days). Deleted records have a 30-day soft delete period. Background job history is kept for 7-30 days depending on status.'
  },
  {
    question: 'How do I export my data?',
    answer: 'You can export audit logs as CSV from the Audit Log page. For full data export, go to Settings > Danger Zone and click "Export All Data". Enterprise plans have scheduled export capabilities.'
  },
  {
    question: 'What happens if I delete my organization?',
    answer: 'Deleting an organization permanently removes all data including members, workspaces, customers, jobs, products, and audit logs. This action requires typing the organization name to confirm and cannot be undone.'
  }
];

const RESOURCES = [
  {
    title: 'Documentation',
    description: 'Complete platform guides and API reference',
    icon: Book,
    link: 'Docs',
    internal: true
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs',
    icon: Video,
    link: 'https://youtube.com',
    internal: false
  },
  {
    title: 'API Reference',
    description: 'Technical API documentation',
    icon: FileText,
    link: 'Docs',
    internal: true
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Support request submitted. We\'ll get back to you within 24 hours.');
    setContactForm({ subject: '', message: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-1">
          Find answers and get help with the platform
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 py-6 text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RESOURCES.map((resource) => {
          const Icon = resource.icon;
          const content = (
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      {resource.title}
                      {!resource.internal && <ExternalLink className="w-4 h-4 text-gray-400" />}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );

          return resource.internal ? (
            <Link key={resource.title} to={createPageUrl(resource.link)}>
              {content}
            </Link>
          ) : (
            <a key={resource.title} href={resource.link} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFAQ.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No matching questions found</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQ.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? Send us a message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={contactForm.subject}
                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                rows={5}
                required
              />
            </div>
            <Button type="submit">
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}