import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from 'lucide-react';

export default function ConditionalBuilder({ conditions, onConditionsChange }) {
  const addCondition = () => {
    onConditionsChange([
      ...(conditions || []),
      { field: 'value', operator: 'greater_than', value: '' }
    ]);
  };

  const updateCondition = (index, updates) => {
    const newConditions = [...(conditions || [])];
    newConditions[index] = { ...newConditions[index], ...updates };
    onConditionsChange(newConditions);
  };

  const removeCondition = (index) => {
    onConditionsChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conditional Logic</CardTitle>
          <Button size="sm" variant="outline" onClick={addCondition}>
            <Plus className="w-4 h-4 mr-1" />
            Add Condition
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(!conditions || conditions.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-4">
            No conditions set. Actions will always execute.
          </p>
        )}
        {conditions?.map((condition, index) => (
          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
            <Select
              value={condition.field}
              onValueChange={(value) => updateCondition(index, { field: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Job Value</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="customer_tier">Customer Tier</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={condition.operator}
              onValueChange={(value) => updateCondition(index, { operator: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Value"
              value={condition.value}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              className="flex-1"
            />

            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeCondition(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}