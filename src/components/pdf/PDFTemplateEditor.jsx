import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTenant } from '../common/TenantContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Upload, Palette, FileText, Layout, Type } from 'lucide-react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Midnight', primary: '#111827', secondary: '#6B7280' },
  { name: 'Navy', primary: '#1E3A5F', secondary: '#4A7FC1' },
  { name: 'Forest', primary: '#14532D', secondary: '#4B8B5E' },
  { name: 'Crimson', primary: '#7F1D1D', secondary: '#B45454' },
  { name: 'Indigo', primary: '#312E81', secondary: '#6366F1' },
  { name: 'Slate', primary: '#1E293B', secondary: '#64748B' },
];

export default function PDFTemplateEditor({ template, onSaved, onCancel }) {
  const { currentOrgId } = useTenant();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: template?.name || 'My Template',
    is_default: template?.is_default || false,
    branding: {
      logo_url: '',
      primary_color: '#111827',
      secondary_color: '#6B7280',
      font: 'helvetica',
      ...(template?.branding || {}),
    },
    header: {
      company_name: '',
      tagline: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      show_date: true,
      ...(template?.header || {}),
    },
    footer: {
      text: '',
      show_page_numbers: true,
      show_generated_by: true,
      ...(template?.footer || {}),
    },
    layout: {
      page_size: 'letter',
      orientation: 'portrait',
      show_watermark: false,
      watermark_text: '',
      ...(template?.layout || {}),
    },
  });

  const update = (section, field, value) => {
    if (section) {
      setForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('branding', 'logo_url', file_url);
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, organization_id: currentOrgId };

      // If setting as default, unset others
      if (form.is_default) {
        const existing = await base44.entities.PDFTemplate.filter({
          organization_id: currentOrgId,
          is_default: true
        });
        for (const t of existing) {
          if (t.id !== template?.id) {
            await base44.entities.PDFTemplate.update(t.id, { is_default: false });
          }
        }
      }

      let saved;
      if (template?.id) {
        saved = await base44.entities.PDFTemplate.update(template.id, payload);
      } else {
        saved = await base44.entities.PDFTemplate.create(payload);
      }
      toast.success('Template saved');
      onSaved?.(saved);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Name & default */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <Label>Template Name</Label>
          <Input
            value={form.name}
            onChange={e => update(null, 'name', e.target.value)}
            placeholder="e.g. Company Standard"
            className="mt-1"
          />
        </div>
        <div className="flex items-center gap-2 mt-5 sm:mt-0">
          <Switch
            checked={form.is_default}
            onCheckedChange={v => update(null, 'is_default', v)}
          />
          <Label>Set as default</Label>
        </div>
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-1" />Brand</TabsTrigger>
          <TabsTrigger value="header"><Type className="w-4 h-4 mr-1" />Header</TabsTrigger>
          <TabsTrigger value="footer"><FileText className="w-4 h-4 mr-1" />Footer</TabsTrigger>
          <TabsTrigger value="layout"><Layout className="w-4 h-4 mr-1" />Layout</TabsTrigger>
        </TabsList>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-5 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Logo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {form.branding.logo_url && (
                <img src={form.branding.logo_url} alt="Logo" className="h-16 object-contain border rounded p-2 bg-gray-50" />
              )}
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-500">
                    {uploading ? 'Uploading...' : 'Upload logo (PNG, JPG, SVG)'}
                  </span>
                </div>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </Label>
              {form.branding.logo_url && (
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => update('branding', 'logo_url', '')}>
                  Remove logo
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Color Presets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      update('branding', 'primary_color', preset.primary);
                      update('branding', 'secondary_color', preset.secondary);
                    }}
                    className="flex items-center gap-2 p-2 rounded-lg border hover:shadow-md transition-all text-left"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-3 rounded" style={{ backgroundColor: preset.primary }} />
                      <div className="w-6 h-3 rounded" style={{ backgroundColor: preset.secondary }} />
                    </div>
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={form.branding.primary_color}
                      onChange={e => update('branding', 'primary_color', e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer border"
                    />
                    <Input
                      value={form.branding.primary_color}
                      onChange={e => update('branding', 'primary_color', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={form.branding.secondary_color}
                      onChange={e => update('branding', 'secondary_color', e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer border"
                    />
                    <Input
                      value={form.branding.secondary_color}
                      onChange={e => update('branding', 'secondary_color', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Font</CardTitle></CardHeader>
            <CardContent>
              <Select value={form.branding.font} onValueChange={v => update('branding', 'font', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helvetica">Helvetica (Modern)</SelectItem>
                  <SelectItem value="times">Times New Roman (Classic)</SelectItem>
                  <SelectItem value="courier">Courier (Monospace)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HEADER */}
        <TabsContent value="header" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'company_name', label: 'Company Name', placeholder: 'Acme Corp' },
              { key: 'tagline', label: 'Tagline', placeholder: 'Building better solutions' },
              { key: 'address', label: 'Address', placeholder: '123 Main St, City, State' },
              { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
              { key: 'email', label: 'Email', placeholder: 'info@company.com' },
              { key: 'website', label: 'Website', placeholder: 'www.company.com' },
            ].map(field => (
              <div key={field.key} className="space-y-1">
                <Label>{field.label}</Label>
                <Input
                  value={form.header[field.key] || ''}
                  onChange={e => update('header', field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.header.show_date}
              onCheckedChange={v => update('header', 'show_date', v)}
            />
            <Label>Show generated date in header</Label>
          </div>
        </TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer" className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Footer Text</Label>
            <Textarea
              value={form.footer.text || ''}
              onChange={e => update('footer', 'text', e.target.value)}
              placeholder="e.g. Confidential — For internal use only"
              rows={2}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.footer.show_page_numbers}
                onCheckedChange={v => update('footer', 'show_page_numbers', v)}
              />
              <Label>Show page numbers</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.footer.show_generated_by}
                onCheckedChange={v => update('footer', 'show_generated_by', v)}
              />
              <Label>Show "Generated by Platform" text</Label>
            </div>
          </div>
        </TabsContent>

        {/* LAYOUT */}
        <TabsContent value="layout" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Page Size</Label>
              <Select value={form.layout.page_size} onValueChange={v => update('layout', 'page_size', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">Letter (US)</SelectItem>
                  <SelectItem value="a4">A4 (International)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Orientation</Label>
              <Select value={form.layout.orientation} onValueChange={v => update('layout', 'orientation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.layout.show_watermark}
                onCheckedChange={v => update('layout', 'show_watermark', v)}
              />
              <Label>Show watermark</Label>
            </div>
            {form.layout.show_watermark && (
              <div className="space-y-1 ml-8">
                <Label>Watermark Text</Label>
                <Input
                  value={form.layout.watermark_text || ''}
                  onChange={e => update('layout', 'watermark_text', e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Template
        </Button>
      </div>
    </div>
  );
}