import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Package, Briefcase, FileText, ArrowRight, Command } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import debounce from 'lodash/debounce';

const ENTITY_CONFIG = {
  customer: { 
    icon: Users, 
    color: 'bg-blue-100 text-blue-800',
    searchFields: ['name', 'email', 'company'],
    displayField: 'name',
    subtitleField: 'email',
    page: 'CustomerDetail'
  },
  product: { 
    icon: Package, 
    color: 'bg-green-100 text-green-800',
    searchFields: ['name', 'sku', 'description'],
    displayField: 'name',
    subtitleField: 'sku',
    page: 'ProductDetail'
  },
  job: { 
    icon: Briefcase, 
    color: 'bg-purple-100 text-purple-800',
    searchFields: ['title', 'reference_number', 'description'],
    displayField: 'title',
    subtitleField: 'reference_number',
    page: 'JobDetail'
  }
};

export function GlobalSearch({ isOpen, onClose }) {
  const { currentOrgId, currentWorkspaceId } = useTenant();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ customers: [], products: [], jobs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const allResults = [
    ...results.customers.map(r => ({ ...r, type: 'customer' })),
    ...results.products.map(r => ({ ...r, type: 'product' })),
    ...results.jobs.map(r => ({ ...r, type: 'job' }))
  ];

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !currentOrgId) {
      setResults({ customers: [], products: [], jobs: [] });
      return;
    }

    setIsSearching(true);
    
    try {
      const baseFilter = { organization_id: currentOrgId };
      if (currentWorkspaceId) {
        baseFilter.workspace_id = currentWorkspaceId;
      }

      const [customers, products, jobs] = await Promise.all([
        base44.entities.Customer.filter(baseFilter, '-created_date', 5),
        base44.entities.Product.filter(baseFilter, '-created_date', 5),
        base44.entities.Job.filter(baseFilter, '-created_date', 5)
      ]);

      const lowerQuery = searchQuery.toLowerCase();
      
      const filterByQuery = (items, config) => {
        return items.filter(item => 
          config.searchFields.some(field => 
            item[field]?.toLowerCase?.()?.includes(lowerQuery)
          )
        ).slice(0, 5);
      };

      setResults({
        customers: filterByQuery(customers, ENTITY_CONFIG.customer),
        products: filterByQuery(products, ENTITY_CONFIG.product),
        jobs: filterByQuery(jobs, ENTITY_CONFIG.job)
      });
    } finally {
      setIsSearching(false);
    }
  }, [currentOrgId, currentWorkspaceId]);

  const debouncedSearch = useCallback(
    debounce((q) => performSearch(q), 300),
    [performSearch]
  );

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setResults({ customers: [], products: [], jobs: [] });
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      const result = allResults[selectedIndex];
      const config = ENTITY_CONFIG[result.type];
      window.location.href = createPageUrl(config.page) + `?id=${result.id}`;
      onClose();
    }
  };

  const ResultItem = ({ item, type, isSelected }) => {
    const config = ENTITY_CONFIG[type];
    const Icon = config.icon;

    return (
      <Link 
        to={createPageUrl(config.page) + `?id=${item.id}`}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
          isSelected ? 'bg-gray-50' : ''
        }`}
      >
        <div className={`p-2 rounded-lg ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {item[config.displayField]}
          </p>
          {item[config.subtitleField] && (
            <p className="text-sm text-gray-500 truncate">
              {item[config.subtitleField]}
            </p>
          )}
        </div>
        <Badge variant="outline" className="capitalize text-xs">
          {type}
        </Badge>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </Link>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search customers, products, jobs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-lg py-6"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            </div>
          )}

          {!isSearching && query && allResults.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
            </div>
          )}

          {!isSearching && allResults.length > 0 && (
            <div className="divide-y">
              {allResults.map((item, index) => (
                <ResultItem 
                  key={`${item.type}-${item.id}`} 
                  item={item} 
                  type={item.type}
                  isSelected={index === selectedIndex}
                />
              ))}
            </div>
          )}

          {!query && (
            <div className="py-8 px-4 text-center text-gray-500">
              <p className="text-sm">Start typing to search across all your data</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {Object.entries(ENTITY_CONFIG).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <Badge key={type} variant="outline" className="capitalize">
                      <Icon className="w-3 h-3 mr-1" />
                      {type}s
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white rounded border">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
            to select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border">esc</kbd>
            to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  };
}