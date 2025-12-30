import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Users, Package, Briefcase, FileText, Settings, 
  Bell, Search, Filter, PlusCircle, ArrowRight
} from 'lucide-react';

const ILLUSTRATIONS = {
  customers: Users,
  products: Package,
  jobs: Briefcase,
  documents: FileText,
  settings: Settings,
  notifications: Bell,
  search: Search,
  filter: Filter,
  default: PlusCircle
};

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tips = [],
  icon: CustomIcon
}) {
  const Icon = CustomIcon || ILLUSTRATIONS[type] || ILLUSTRATIONS.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || 'Nothing here yet'}
      </h3>
      
      <p className="text-gray-500 max-w-md mb-6">
        {description || 'Get started by creating your first item.'}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {actionLabel && (
            <Button onClick={onAction} className="gap-2">
              <PlusCircle className="w-4 h-4" />
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="outline" onClick={onSecondaryAction} className="gap-2">
              {secondaryActionLabel}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {tips.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 max-w-md w-full">
          <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">
            💡 Quick tips
          </h4>
          <ul className="space-y-2 text-left">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SearchEmptyState({ query, onClearFilters }) {
  return (
    <EmptyState
      type="search"
      title={`No results for "${query}"`}
      description="Try adjusting your search or filter criteria"
      actionLabel="Clear filters"
      onAction={onClearFilters}
      tips={[
        'Check your spelling',
        'Try more general terms',
        'Remove some filters'
      ]}
    />
  );
}

export function FilterEmptyState({ onClearFilters }) {
  return (
    <EmptyState
      type="filter"
      title="No matching items"
      description="Your current filters don't match any items. Try adjusting your criteria."
      actionLabel="Clear all filters"
      onAction={onClearFilters}
    />
  );
}

export function CustomersEmptyState({ onAdd }) {
  return (
    <EmptyState
      type="customers"
      title="No customers yet"
      description="Start building your customer base by adding your first customer."
      actionLabel="Add Customer"
      onAction={onAdd}
      tips={[
        'Import customers from a CSV file',
        'Add customers manually one by one',
        'Sync from your existing CRM'
      ]}
    />
  );
}

export function JobsEmptyState({ onAdd }) {
  return (
    <EmptyState
      type="jobs"
      title="No jobs yet"
      description="Create your first job to start tracking work and managing orders."
      actionLabel="Create Job"
      onAction={onAdd}
      tips={[
        'Jobs can be linked to customers',
        'Track status through customizable workflows',
        'Set due dates and priorities'
      ]}
    />
  );
}

export function ProductsEmptyState({ onAdd }) {
  return (
    <EmptyState
      type="products"
      title="No products yet"
      description="Add products to your catalog to include them in jobs and orders."
      actionLabel="Add Product"
      onAction={onAdd}
      tips={[
        'Import products from a spreadsheet',
        'Set up inventory tracking',
        'Organize with categories and tags'
      ]}
    />
  );
}