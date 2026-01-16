import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AIJobAssistant({ 
  jobTitle, 
  jobDescription, 
  currentValue,
  historicalJobs = [],
  products = [],
  onValueEstimated,
  onProductsSuggested,
  onDelayPredicted
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const analyzeJob = async () => {
    if (!jobTitle && !jobDescription) {
      toast.error('Please enter a job title or description first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this job request and provide intelligent recommendations:

Job Title: ${jobTitle || 'Not provided'}
Job Description: ${jobDescription || 'Not provided'}

Available Products: ${JSON.stringify(products.map(p => ({
  name: p.name,
  sku: p.sku,
  price: p.price,
  category: p.category,
  description: p.description
})))}

Historical Job Data: ${JSON.stringify(historicalJobs.slice(0, 10).map(j => ({
  title: j.title,
  value: j.value,
  duration: j.completed_at && j.started_at ? 
    Math.floor((new Date(j.completed_at) - new Date(j.started_at)) / (1000 * 60 * 60 * 24)) : null,
  status: j.status
})))}

Based on this information, provide:
1. Suggested product line items that would be relevant for this job
2. Estimated job value based on similar historical jobs and recommended products
3. Potential delay risk assessment considering complexity and resource requirements

Be specific and provide reasoning for your recommendations.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_id: { type: "string" },
                  product_name: { type: "string" },
                  quantity: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            },
            estimated_value: {
              type: "object",
              properties: {
                amount: { type: "number" },
                confidence: { type: "string" },
                reasoning: { type: "string" }
              }
            },
            delay_prediction: {
              type: "object",
              properties: {
                risk_level: { type: "string" },
                probability: { type: "string" },
                risk_factors: {
                  type: "array",
                  items: { type: "string" }
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response);
      
      if (onValueEstimated && response.estimated_value) {
        onValueEstimated(response.estimated_value.amount);
      }
      
      if (onProductsSuggested && response.suggested_products) {
        onProductsSuggested(response.suggested_products);
      }
      
      if (onDelayPredicted && response.delay_prediction) {
        onDelayPredicted(response.delay_prediction);
      }

      toast.success('AI analysis complete');
    } catch (error) {
      toast.error('Failed to analyze job: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={analyzeJob}
        disabled={isAnalyzing}
        className="w-full border-purple-200 hover:bg-purple-50"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            Get AI Recommendations
          </>
        )}
      </Button>

      {suggestions && (
        <div className="space-y-3">
          {suggestions.suggested_products && suggestions.suggested_products.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  Suggested Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestions.suggested_products.map((product, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <Badge variant="outline" className="text-xs">
                        Qty: {product.quantity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{product.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {suggestions.estimated_value && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Value Estimate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-blue-900">
                    ${suggestions.estimated_value.amount?.toLocaleString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {suggestions.estimated_value.confidence}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{suggestions.estimated_value.reasoning}</p>
              </CardContent>
            </Card>
          )}

          {suggestions.delay_prediction && (
            <Card className={`border-${getRiskColor(suggestions.delay_prediction.risk_level)}-200 bg-${getRiskColor(suggestions.delay_prediction.risk_level)}-50/50`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 text-${getRiskColor(suggestions.delay_prediction.risk_level)}-600`} />
                  Delay Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`bg-${getRiskColor(suggestions.delay_prediction.risk_level)}-100 text-${getRiskColor(suggestions.delay_prediction.risk_level)}-800`}>
                    {suggestions.delay_prediction.risk_level} Risk
                  </Badge>
                  <span className="text-xs text-gray-600">
                    {suggestions.delay_prediction.probability}
                  </span>
                </div>
                {suggestions.delay_prediction.risk_factors?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Risk Factors:</p>
                    <ul className="space-y-1">
                      {suggestions.delay_prediction.risk_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-red-500">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.delay_prediction.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Recommendations:</p>
                    <ul className="space-y-1">
                      {suggestions.delay_prediction.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-green-500">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function getRiskColor(riskLevel) {
  const level = riskLevel?.toLowerCase() || '';
  if (level.includes('high')) return 'red';
  if (level.includes('medium')) return 'yellow';
  return 'green';
}