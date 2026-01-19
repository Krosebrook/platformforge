import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIOutreachAssistant({ customerId }) {
  const [activeTab, setActiveTab] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [contactSuggestion, setContactSuggestion] = useState(null);
  const [talkingPoints, setTalkingPoints] = useState(null);

  const generateEmail = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiCustomerOutreach', {
        action: 'draft_email',
        customer_id: customerId
      });
      setEmailDraft(data.email_draft);
    } catch (error) {
      toast.error('Failed to generate email');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestContactTime = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiCustomerOutreach', {
        action: 'suggest_contact_time',
        customer_id: customerId
      });
      setContactSuggestion(data.contact_suggestion);
    } catch (error) {
      toast.error('Failed to generate suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTalkingPoints = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('aiCustomerOutreach', {
        action: 'generate_talking_points',
        customer_id: customerId
      });
      setTalkingPoints(data.talking_points);
    } catch (error) {
      toast.error('Failed to generate talking points');
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
          AI Outreach Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="timing">
              <Calendar className="w-4 h-4 mr-1" />
              Timing
            </TabsTrigger>
            <TabsTrigger value="talking">
              <Phone className="w-4 h-4 mr-1" />
              Call Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Button onClick={generateEmail} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Draft Personalized Email
            </Button>

            {emailDraft && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Subject:</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(emailDraft.subject)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm bg-gray-50 p-3 rounded">{emailDraft.subject}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Body:</span>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(emailDraft.body)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {emailDraft.body}
                  </div>
                </div>

                <Badge variant="outline" className="text-xs capitalize">
                  Tone: {emailDraft.tone}
                </Badge>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timing" className="space-y-4">
            <Button onClick={suggestContactTime} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Suggest Best Contact Time
            </Button>

            {contactSuggestion && (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Recommended Time:</p>
                  <p className="text-lg font-bold text-blue-900">
                    {contactSuggestion.best_day} at {contactSuggestion.best_time}
                  </p>
                  <Badge className="mt-2 text-xs">
                    {contactSuggestion.confidence} confidence
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Analysis:</p>
                  <p className="text-sm text-gray-600">{contactSuggestion.reasoning}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="talking" className="space-y-4">
            <Button onClick={generateTalkingPoints} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Talking Points
            </Button>

            {talkingPoints && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium">Meeting Objective:</p>
                  <p className="text-sm text-gray-700 mt-1">{talkingPoints.meeting_objective}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Key Talking Points:</p>
                  <div className="space-y-2">
                    {talkingPoints.talking_points.map((point, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {point.category}
                          </Badge>
                          <Badge className="text-xs capitalize">
                            {point.priority}
                          </Badge>
                        </div>
                        <p className="text-sm">{point.point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}