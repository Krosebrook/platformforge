import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { useTenantBoundary } from '../components/common/TenantBoundary';
import { logAuditEvent } from '../components/common/AuditLogger';
import { RequireEditor } from '../components/common/PermissionGate';
import { DataTable } from '../components/ui/DataTable';
import { ProductsEmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


import { 
  Plus, Package, Boxes, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  const { enforce, buildFilter } = useTenantBoundary();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    status: 'active',
    price: '',
    cost: '',
    inventory_count: '',
    low_stock_threshold: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const showNewForm = urlParams.get('action') === 'new';

  React.useEffect(() => {
    if (showNewForm) {
      setShowCreateDialog(true);
    }
  }, [showNewForm]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', currentOrgId, currentWorkspaceId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const filter = buildFilter({});
      return await base44.entities.Product.filter(filter, '-created_date');
    },
    enabled: !!currentOrgId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const productData = enforce({
        ...data,
        price: data.price ? parseFloat(data.price) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
        inventory_count: data.inventory_count ? parseInt(data.inventory_count) : null,
        low_stock_threshold: data.low_stock_threshold ? parseInt(data.low_stock_threshold) : null
      });
      const product = await base44.entities.Product.create(productData);
      
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        actor_role: role,
        action: 'create',
        resource_type: 'product',
        resource_id: product.id,
        resource_name: product.name
      });

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setShowCreateDialog(false);
      setFormData({ name: '', sku: '', description: '', category: '', status: 'active', price: '', cost: '', inventory_count: '', low_stock_threshold: '' });
      toast.success('Product created successfully');
      if (showNewForm) {
        navigate(createPageUrl('Products'));
      }
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.Product.delete(id);
        await logAuditEvent({
          organization_id: currentOrgId,
          workspace_id: currentWorkspaceId,
          actor_email: user.email,
          actor_role: role,
          action: 'delete',
          resource_type: 'product',
          resource_id: id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setSelectedRows([]);
      toast.success('Products deleted');
    }
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
            {row.original.image_url ? (
              <img src={row.original.image_url} alt={row.original.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.sku && (
              <p className="text-sm text-gray-500">SKU: {row.original.sku}</p>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        row.original.category ? (
          <Badge variant="outline" className="capitalize">
            {row.original.category}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-medium">
          ${(row.original.price || 0).toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: 'inventory_count',
      header: 'Stock',
      cell: ({ row }) => {
        const count = row.original.inventory_count;
        const threshold = row.original.low_stock_threshold;
        const isLowStock = count != null && threshold != null && count <= threshold;
        
        return count != null ? (
          <div className={`flex items-center gap-1 ${isLowStock ? 'text-red-600' : ''}`}>
            {isLowStock && <AlertTriangle className="w-4 h-4" />}
            {count}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      }
    },
    {
      accessorKey: 'created_date',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-gray-500 text-sm">
          {format(new Date(row.original.created_date), 'MMM d, yyyy')}
        </span>
      )
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => 
      p.inventory_count != null && 
      p.low_stock_threshold != null && 
      p.inventory_count <= p.low_stock_threshold
    ).length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your product catalog
          </p>
        </div>
        <RequireEditor>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </RequireEditor>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Boxes className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            onRowClick={(row) => navigate(createPageUrl('ProductDetail') + `?id=${row.id}`)}
            onDelete={(ids) => deleteMutation.mutate(ids)}
            emptyState={<ProductsEmptyState onAdd={() => setShowCreateDialog(true)} />}
            searchPlaceholder="Search products..."
          />
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open && showNewForm) {
          navigate(createPageUrl('Products'));
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the product details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Product name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="SKU-001"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Product description..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input
                    id="inventory"
                    type="number"
                    placeholder="0"
                    value={formData.inventory_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_count: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Stock Alert</Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="10"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}