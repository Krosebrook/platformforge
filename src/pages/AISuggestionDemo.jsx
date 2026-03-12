import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Code2, Lightbulb } from 'lucide-react';
import SuggestionContainer from '../components/ai/SuggestionContainer';
import { buildAIConfig } from '../components/ai/AIFieldConfig';

// ── Field demos ────────────────────────────────────────────────────────────
function DemoField({ title, description, aiConfigKey, contextOverrides = {}, renderInput, value, onChange }) {
  const aiConfig = buildAIConfig(aiConfigKey, contextOverrides);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <CardTitle className="text-sm">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">{aiConfigKey}</Badge>
        </div>
        {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-4">
        <SuggestionContainer
          aiConfig={aiConfig}
          onAccept={onChange}
          showHistory
        >
          {renderInput(value, onChange)}
        </SuggestionContainer>
      </CardContent>
    </Card>
  );
}

export default function AISuggestionDemo() {
  const [fields, setFields] = useState({
    job_title: '',
    job_description: '',
    task_title: '',
    company: '',
    workflow_name: '',
    report_name: '',
    segment_name: '',
    email_subject: '',
  });

  const set = (key) => (val) => setFields(prev => ({ ...prev, [key]: val }));

  const demos = [
    {
      key: 'job_title',
      title: 'Job Title',
      description: 'Context-aware titles based on category + priority.',
      aiConfigKey: 'job_title',
      context: { category: 'software', priority: 'high' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Website Redesign Project" />
      ),
    },
    {
      key: 'job_description',
      title: 'Job Description',
      description: 'Auto-draft a 2-3 sentence project description.',
      aiConfigKey: 'job_description',
      context: { title: fields.job_title || 'Software Project', category: 'software' },
      input: (v, onChange) => (
        <Textarea value={v} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="Describe the job…" />
      ),
    },
    {
      key: 'task_title',
      title: 'Task Title',
      description: 'Actionable task names scoped to the parent job.',
      aiConfigKey: 'task_title',
      context: { job_title: fields.job_title || 'Software Project' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Set up CI/CD pipeline" />
      ),
    },
    {
      key: 'company',
      title: 'Company Name',
      description: 'Realistic company names for the specified industry.',
      aiConfigKey: 'customer_company',
      context: { industry: 'technology' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Acme Corp" />
      ),
    },
    {
      key: 'workflow_name',
      title: 'Workflow Name',
      description: 'Descriptive automation names based on trigger type.',
      aiConfigKey: 'workflow_name',
      context: { trigger: 'job completed' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Notify Team on Completion" />
      ),
    },
    {
      key: 'report_name',
      title: 'Report Name',
      description: 'Professional report names for data entities.',
      aiConfigKey: 'report_name',
      context: { entity_type: 'Jobs' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Monthly Job Performance" />
      ),
    },
    {
      key: 'email_subject',
      title: 'Email Subject',
      description: 'Concise email subject lines for business communication.',
      aiConfigKey: 'email_subject',
      context: { topic: 'project status update' },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Q1 Project Status Update" />
      ),
    },
    {
      key: 'segment_name',
      title: 'Customer Segment Name',
      description: 'Descriptive names based on applied filters.',
      aiConfigKey: 'segment_name',
      context: { filters: { tier: 'premium', status: 'active' } },
      input: (v, onChange) => (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder="e.g. High-Value Active Clients" />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-purple-500" />
            AI Suggestion Engine
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl">
            Click the <strong className="text-purple-600">✨</strong> icon on any field to generate AI suggestions.
            Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> to accept,{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">→</kbd> to rotate, and{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘↵</kbd> for a fresh batch.
          </p>
        </div>
      </div>

      {/* Architecture callout */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-purple-900">Client-side rotation strategy</p>
            <p className="text-purple-700">
              One server call fetches a batch of 5–8 suggestions. Clicking → rotates locally (zero latency).
              When the batch is exhausted, or you press ⌘↵, a fresh server call is triggered.
              Results are cached for 5 minutes per unique context — identical field contexts reuse cached batches.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {demos.map(demo => (
          <DemoField
            key={demo.key}
            title={demo.title}
            description={demo.description}
            aiConfigKey={demo.aiConfigKey}
            contextOverrides={demo.context}
            renderInput={demo.input}
            value={fields[demo.key]}
            onChange={set(demo.key)}
          />
        ))}
      </div>

      {/* Live state panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Accepted field values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
            {JSON.stringify(fields, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}