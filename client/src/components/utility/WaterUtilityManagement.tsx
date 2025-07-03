/**
 * Water Utility Management Component
 * Handles UK water company registration with geo-location matching
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Droplets, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Users,
  Building,
  Calendar,
  Gauge
} from "lucide-react";

interface WaterCompany {
  id: string;
  name: string;
  type: 'water_only' | 'water_and_sewerage';
  regions: string[];
  cities: string[];
  postcodeAreas: string[];
  owner: string;
  website: string;
  customerService: string;
  emergencyNumber: string;
  tariffs: {
    standingCharge: number;
    unitRate: number;
    sewerageRate?: number;
  };
  estimatedBills?: {
    monthly: number;
    annual: number;
  };
}

interface WaterRegistration {
  id: number;
  propertyId: number;
  waterCompanyId: string;
  waterCompanyName: string;
  accountNumber: string;
  customerReference: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  moveInDate: string;
  registrationStatus: string;
  monthlyDirectDebit: number;
  paperlessBilling: boolean;
  autoMeterReading: boolean;
  waterCompany?: {
    name: string;
    type: string;
    website: string;
    customerService: string;
    emergencyNumber: string;
  };
}

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  moveInDate: z.string().min(1, "Move-in date is required"),
  paperlessBilling: z.boolean().default(false),
  autoMeterReading: z.boolean().default(true),
  emergencyContact: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface WaterUtilityManagementProps {
  propertyId: number;
  tenantId?: number;
}

export function WaterUtilityManagement({ propertyId, tenantId }: WaterUtilityManagementProps) {
  const [selectedCompany, setSelectedCompany] = useState<WaterCompany | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      paperlessBilling: false,
      autoMeterReading: true,
    }
  });

  // Get water company for this property
  const { data: propertyWaterData, isLoading: loadingWaterCompany, error: waterCompanyError } = useQuery({
    queryKey: ['/api/water/company-for-property', propertyId],
    enabled: !!propertyId
  });

  // Get existing registrations
  const { data: registrationsData, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['/api/water/registrations', tenantId],
    enabled: !!tenantId
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const response = await fetch('/api/water/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          waterCompanyId: selectedCompany?.id,
          tenantDetails: data,
          moveInDate: data.moveInDate,
          accountPreferences: {
            paperlessBilling: data.paperlessBilling,
            autoMeterReading: data.autoMeterReading,
            emergencyContact: data.emergencyContact,
            emergencyContactPhone: data.emergencyContactPhone,
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Water Service Registered",
        description: `Successfully registered with ${data.registration.waterCompany.name}. Account: ${data.registration.accountNumber}`,
      });
      setIsRegistering(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/water/registrations'] });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const waterCompany = propertyWaterData?.waterCompany;
  const registrations = registrationsData?.registrations || [];

  if (loadingWaterCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Water Utility Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (waterCompanyError || !waterCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Water Utility Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Water Company Not Found</h3>
            <p className="text-gray-600 mb-4">
              {waterCompanyError ? 
                `Error: ${waterCompanyError.message}` : 
                'No water company found for this property location. This may be a system issue.'
              }
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Property ID: {propertyId} | Tenant ID: {tenantId || 'Not provided'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Water Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Water Utility Provider
          </CardTitle>
          <CardDescription>
            Water company serving this property location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{waterCompany.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={waterCompany.type === 'water_and_sewerage' ? 'default' : 'secondary'}>
                  {waterCompany.type === 'water_and_sewerage' ? 'Water & Sewerage' : 'Water Only'}
                </Badge>
                <Badge variant="outline">{waterCompany.owner}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                £{waterCompany.estimatedBills?.monthly}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Coverage</div>
                <div className="text-sm text-gray-600">
                  {waterCompany.regions.join(', ')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Customer Service</div>
                <div className="text-sm text-gray-600">
                  {waterCompany.customerService}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Website</div>
                <a 
                  href={waterCompany.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Visit Website
                </a>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tariff Details */}
          <div className="space-y-2">
            <h4 className="font-medium">Tariff Structure</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Standing Charge</div>
                <div className="text-gray-600">{waterCompany.tariffs.standingCharge}p per day</div>
              </div>
              <div>
                <div className="font-medium">Water Rate</div>
                <div className="text-gray-600">{waterCompany.tariffs.unitRate}p per m³</div>
              </div>
              {waterCompany.tariffs.sewerageRate && (
                <div>
                  <div className="font-medium">Sewerage Rate</div>
                  <div className="text-gray-600">{waterCompany.tariffs.sewerageRate}p per m³</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          {registrations.length === 0 ? (
            <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  onClick={() => setSelectedCompany(waterCompany)}
                >
                  Register Water Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register with {waterCompany.name}</DialogTitle>
                  <DialogDescription>
                    Complete your water service registration for this property
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="moveInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Move-in Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h4 className="font-medium">Account Preferences</h4>
                      
                      <FormField
                        control={form.control}
                        name="paperlessBilling"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Paperless Billing</FormLabel>
                              <FormDescription>
                                Receive bills via email instead of post
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="autoMeterReading"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div>
                              <FormLabel>Automatic Meter Reading</FormLabel>
                              <FormDescription>
                                Enable smart meter readings where available
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter emergency contact name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter emergency contact phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsRegistering(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={registerMutation.isPending}>
                        {registerMutation.isPending ? 'Registering...' : 'Register Water Service'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="w-full text-center text-green-600">
              <CheckCircle className="h-5 w-5 inline mr-2" />
              Water service already registered
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Existing Registrations */}
      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Water Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrations.map((registration: WaterRegistration) => (
                <div key={registration.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{registration.waterCompanyName}</h4>
                      <p className="text-sm text-gray-600">Account: {registration.accountNumber}</p>
                      <p className="text-sm text-gray-600">Reference: {registration.customerReference}</p>
                    </div>
                    <Badge 
                      variant={registration.registrationStatus === 'active' ? 'default' : 'secondary'}
                    >
                      {registration.registrationStatus}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Monthly Direct Debit</div>
                        <div className="text-gray-600">£{registration.monthlyDirectDebit}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Move-in Date</div>
                        <div className="text-gray-600">
                          {new Date(registration.moveInDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">Paperless Billing</div>
                        <div className="text-gray-600">
                          {registration.paperlessBilling ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {registration.waterCompany && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(registration.waterCompany!.website, '_blank')}
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Visit Website
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`tel:${registration.waterCompany!.customerService}`, '_blank')}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call Support
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}