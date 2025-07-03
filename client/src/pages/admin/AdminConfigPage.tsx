import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Phone, MapPin, Globe, Palette, CreditCard } from 'lucide-react';

interface AdminConfiguration {
  id?: number;
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  vatNumber?: string;
  companyRegistration?: string;
  websiteUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<AdminConfiguration>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Use the working admin configuration endpoint
      const response = await fetch('/api/admin/config');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setConfig({
            companyName: result.data.company_name || '',
            contactEmail: result.data.contact_email || '',
            contactPhone: result.data.contact_phone || '',
            addressLine1: result.data.address_line1 || '',
            addressLine2: result.data.address_line2 || '',
            city: result.data.city || '',
            postcode: result.data.postcode || '',
            country: result.data.country || 'United Kingdom',
            vatNumber: result.data.vat_number || '',
            companyRegistration: result.data.company_registration || '',
            websiteUrl: result.data.website_url || '',
            logoUrl: result.data.logo_url || '',
            primaryColor: result.data.primary_color || '#22c55e',
            secondaryColor: result.data.secondary_color || '#10b981'
          });
        } else {
          // Set default values if no configuration exists
          setConfig({
            companyName: 'StudentMoves Ltd',
            contactEmail: 'admin@studentmoves.com',
            contactPhone: '020 1234 5678',
            addressLine1: '123 University Avenue',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
            vatNumber: 'GB123456789',
            companyRegistration: '12345678',
            websiteUrl: 'https://studentmoves.com',
            primaryColor: '#22c55e',
            secondaryColor: '#10b981'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load admin configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: config.companyName,
          contact_email: config.contactEmail,
          contact_phone: config.contactPhone,
          address_line1: config.addressLine1,
          address_line2: config.addressLine2,
          city: config.city,
          postcode: config.postcode,
          country: config.country,
          vat_number: config.vatNumber,
          company_registration: config.companyRegistration,
          website_url: config.websiteUrl,
          logo_url: config.logoUrl,
          primary_color: config.primaryColor,
          secondary_color: config.secondaryColor,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin configuration saved successfully",
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save admin configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (field: keyof AdminConfiguration, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Configuration</h1>
        <p className="text-muted-foreground">
          Configure your business details for utility registrations and system settings
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details used for utility registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.companyName || ''}
                    onChange={(e) => updateConfig('companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    value={config.websiteUrl || ''}
                    onChange={(e) => updateConfig('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={config.addressLine1 || ''}
                  onChange={(e) => updateConfig('addressLine1', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input
                  id="addressLine2"
                  value={config.addressLine2 || ''}
                  onChange={(e) => updateConfig('addressLine2', e.target.value)}
                  placeholder="Apartment, suite, etc."
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={config.city || ''}
                    onChange={(e) => updateConfig('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    value={config.postcode || ''}
                    onChange={(e) => updateConfig('postcode', e.target.value)}
                    placeholder="Postcode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={config.country || ''}
                    onChange={(e) => updateConfig('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Contact details for customer communications and support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={config.contactEmail || ''}
                    onChange={(e) => updateConfig('contactEmail', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={config.contactPhone || ''}
                    onChange={(e) => updateConfig('contactPhone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Customization
              </CardTitle>
              <CardDescription>
                Customize the appearance and branding of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={config.logoUrl || ''}
                  onChange={(e) => updateConfig('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primaryColor || '#22c55e'}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.primaryColor || '#22c55e'}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      placeholder="#22c55e"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.secondaryColor || '#10b981'}
                      onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.secondaryColor || '#10b981'}
                      onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Legal & Registration
              </CardTitle>
              <CardDescription>
                Legal information required for business operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={config.vatNumber || ''}
                    onChange={(e) => updateConfig('vatNumber', e.target.value)}
                    placeholder="GB123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyRegistration">Company Registration</Label>
                  <Input
                    id="companyRegistration"
                    value={config.companyRegistration || ''}
                    onChange={(e) => updateConfig('companyRegistration', e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6">
        <Button variant="outline" onClick={loadConfiguration} disabled={loading}>
          Reset
        </Button>
        <Button onClick={saveConfiguration} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}