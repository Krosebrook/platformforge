import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../components/common/TenantContext';
import { logAuditEvent } from '../components/common/AuditLogger';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActivityFeed } from '../components/ui/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, Edit, Save, Package, DollarSign, 
  Boxes, AlertTriangle, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProductDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrgId, currentWorkspaceId, user, role } = useTenant();
  
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId
  });

  React.useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Product.update(productId, {
        ...data,
        price: data.price ? parseFloat(data.price) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
        inventory_count: data.inventory_count ? parseInt(data.inventory_count) : null,
        low_stock_threshold: data.low_stock_threshold ? parseInt(data.low_stock_threshold) : null
      });
      
      await logAuditEvent({
        organization_id: currentOrgId,
        workspace_id: currentWorkspaceId,
        actor_email: user.email,
        actor_role: role,
        action: 'update',
        resource_type: 'product',
        resource_id: productId,
        resource_name: product.name,
        changes: {
          before: product,
          after: data
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product', productId]);
      setIsEditing(false);
      toast.success('Product updated');
    }
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Product not found</p>
        <Link to={createPageUrl('Products')}>
          <Button className="mt-4">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const isLowStock = product.inventory_count != null && 
    product.low_stock_threshold != null && 
    product.inventory_count <= product.low_stock_threshold;

  const margin = product.price && product.cost 
    ? ((product.price - product.cost) / product.price * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          {product.sku && <p className="text-gray-500">SKU: {product.sku}</p>}
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          onClick={() => {
            if (isEditing) {
              updateMutation.mutate(formData);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      {isLowStock && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Low Stock Alert</p>
              <p className="text-sm text-red-600">
                Current inventory ({product.inventory_count}) is below threshold ({product.low_stock_threshold})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-xl font-semibold mb-2"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  )}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={product.status} size="sm" />
                    {product.category && (
                      <Badge variant="outline" className="capitalize">{product.category}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{product.description || 'No description'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">SKU</Label>
                  {isEditing ? (
                    <Input
                      value={formData.sku || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium">{product.sku || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Category</Label>
                  {isEditing ? (
                    <Input
                      value={formData.category || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  ) : (
                    <p className="font-medium capitalize">{product.category || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status || 'active'}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={product.status} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Price</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  ) : (
                    <p className="text-2xl font-bold">${(product.price || 0).toFixed(2)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Cost</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-600">${(product.cost || 0).toFixed(2)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Inventory Count</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.inventory_count || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, inventory_count: e.target.value }))}
                    />
                  ) : (
                    <p className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                      {product.inventory_count ?? '-'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Low Stock Threshold</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.low_stock_threshold || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-600">
                      {product.low_stock_threshold ?? '-'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-bold">${(product.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Cost</span>
                <span className="font-medium">${(product.cost || 0).toFixed(2)}</span>
              </div>
              {margin && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Margin</span>
                  <span className="font-medium text-green-600">{margin}%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">In Stock</span>
                <span className={`font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                  {product.inventory_count ?? 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Added</span>
                <span className="font-medium">
                  {format(new Date(product.created_date), 'PP')}
                </span>
              </div>
            </CardContent>
          </Card>

          <ActivityFeed 
            resourceType="product" 
            resourceId={productId} 
            limit={10}
            maxHeight="300px"
          />
        </div>
      </div>
    </div>
  );
}