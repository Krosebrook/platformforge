/**
 * AI Job Assistant
 * Generate, rephrase, and enhance job descriptions using AI
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIJobAssistant({ onApply }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [existingDescription, setExistingDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!keywords) {
      toast.error('Please enter keywords');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateJobDescription', {
        action: 'generate',
        input: { keywords }
      });
      setResult(data.result);
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRephrase = async () => {
    if (!existingDescription) {
      toast.error('Please enter a description to rephrase');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateJobDescription', {
        action: 'rephrase',
        input: { description: existingDescription, tone }
      });
      setResult(data.result);
    } catch (error) {
      toast.error('Failed to rephrase description');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestSkills = async () => {
    if (!existingDescription) {
      toast.error('Please enter a job description');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('generateJobDescription', {
        action: 'suggest_skills',
        input: { description: existingDescription }
      });
      setResult(data.result);
    } catch (error) {
      toast.error('Failed to suggest skills');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI Job Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="rephrase">Rephrase</TabsTrigger>
            <TabsTrigger value="skills">Suggest Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-2">
              <Label>Enter Keywords</Label>
              <Input
                placeholder="e.g., senior software engineer, React, remote"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Job Description
            </Button>

            {result && typeof result === 'object' && (
              <div className="space-y-3 mt-4">
                <div>
                  <Label className="text-sm font-semibold">Title</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="flex-1 p-2 bg-gray-50 rounded">{result.title}</p>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.title)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Overview</Label>
                  <div className="flex items-start gap-2 mt-1">
                    <p className="flex-1 p-2 bg-gray-50 rounded text-sm">{result.overview}</p>
                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.overview)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Responsibilities</Label>
                  <ul className="list-disc list-inside space-y-1 mt-1 text-sm">
                    {result.responsibilities?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <Button onClick={() => onApply?.(result)} variant="outline" className="w-full">
                  Apply to Job
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rephrase" className="space-y-4">
            <div className="space-y-2">
              <Label>Current Description</Label>
              <Textarea
                placeholder="Paste your existing job description..."
                value={existingDescription}
                onChange={(e) => setExistingDescription(e.target.value)}
                rows={6}
              />
            </div>
            <Button onClick={handleRephrase} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Rephrase Description
            </Button>

            {result && typeof result === 'string' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Rephrased Version</Label>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result)}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                  {result}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea
                placeholder="Paste the job description..."
                value={existingDescription}
                onChange={(e) => setExistingDescription(e.target.value)}
                rows={6}
              />
            </div>
            <Button onClick={handleSuggestSkills} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Suggest Skills
            </Button>

            {result && typeof result === 'object' && (
              <div className="space-y-3 mt-4">
                {result.technical_skills && (
                  <div>
                    <Label className="text-sm font-semibold">Technical Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.technical_skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.soft_skills && (
                  <div>
                    <Label className="text-sm font-semibold">Soft Skills</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.soft_skills.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.certifications && (
                  <div>
                    <Label className="text-sm font-semibold">Certifications</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.certifications.map((cert, i) => (
                        <Badge key={i} className="bg-purple-100 text-purple-800">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}