import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Stepper } from "@/components/ui/stepper";
import { Loader2, Zap, Droplets, Wifi, Tv, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Validation schemas
const personalDetailsSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationalInsurance: z.string().optional(),
});

const addressSchema = z.object({
  propertyId: z.string().min(1, 'Property selection is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
});

const utilityProviderSchema = z.object({
  electricityProvider: z.string().min(1, 'Electricity provider is required'),
  gasProvider: z.string().min(1, 'Gas provider is required'),
  waterProvider: z.string().min(1, 'Water provider is required'),
  broadbandProvider: z.string().min(1, 'Broadband provider is required'),
  preferredContactMethod: z.enum(['email', 'phone', 'post']),
});

type PersonalDetails = z.infer<typeof personalDetailsSchema>;
type Address = z.infer<typeof addressSchema>;
type UtilityProvider = z.infer<typeof utilityProviderSchema>;

interface UtilityProviderOption {
  id: number;
  name: string;
  utilityType: string;
}

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  postcode: string;
}

export default function UtilitySetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [addressDetails, setAddressDetails] = useState<Address | null>(null);
  const { toast } = useToast();

  // Forms for each step
  const personalForm = useForm<PersonalDetails>({
    resolver: zodResolver(personalDetailsSchema),
  });

  const addressForm = useForm<Address>({
    resolver: zodResolver(addressSchema),
  });

  const providerForm = useForm<UtilityProvider>({
    resolver: zodResolver(utilityProviderSchema),
  });

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Fetch utility providers
  const { data: providers = [] } = useQuery<UtilityProviderOption[]>({
    queryKey: ['/api/utilities/providers-public'],
  });

  // Setup mutation
  const setupMutation = useMutation({
    mutationFn: async (data: PersonalDetails & Address & UtilityProvider) => {
      return apiRequest('/api/utilities/setup-complete', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Utilities Setup Complete",
        description: "Your utility accounts have been successfully registered.",
      });
      setCurrentStep(3); // Final step
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup utilities. Please try again.",
        variant: "destructive",
      });
    },
  });

  const steps = [
    { title: 'Personal Details', icon: CheckCircle },
    { title: 'Property Address', icon: CheckCircle },
    { title: 'Utility Providers', icon: CheckCircle },
    { title: 'Complete', icon: CheckCircle },
  ];

  const handlePersonalSubmit = (data: PersonalDetails) => {
    setPersonalDetails(data);
    setCurrentStep(1);
  };

  const handleAddressSubmit = (data: Address) => {
    setAddressDetails(data);
    setCurrentStep(2);
  };

  const handleProviderSubmit = (data: UtilityProvider) => {
    if (personalDetails && addressDetails) {
      setupMutation.mutate({
        ...personalDetails,
        ...addressDetails,
        ...data,
      });
    }
  };

  const getProvidersByType = (type: string) => {
    return providers.filter(p => p.utilityType === type);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Utility Setup Wizard</h1>
          <p className="mt-2 text-gray-600">
            Complete your utility registration with detailed personal information
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <Stepper currentStep={currentStep} steps={steps} />
        </div>

        {/* Step 1: Personal Details */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Enter your personal details for utility account registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={personalForm.handleSubmit(handlePersonalSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName"
                      {...personalForm.register('firstName')}
                      placeholder="Enter your first name"
                    />
                    {personalForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600">{personalForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName"
                      {...personalForm.register('lastName')}
                      placeholder="Enter your last name"
                    />
                    {personalForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600">{personalForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email"
                    type="email"
                    {...personalForm.register('email')}
                    placeholder="your.email@example.com"
                  />
                  {personalForm.formState.errors.email && (
                    <p className="text-sm text-red-600">{personalForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone"
                      {...personalForm.register('phone')}
                      placeholder="07123 456789"
                    />
                    {personalForm.formState.errors.phone && (
                      <p className="text-sm text-red-600">{personalForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input 
                      id="dateOfBirth"
                      type="date"
                      {...personalForm.register('dateOfBirth')}
                    />
                    {personalForm.formState.errors.dateOfBirth && (
                      <p className="text-sm text-red-600">{personalForm.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="nationalInsurance">National Insurance Number (Optional)</Label>
                  <Input 
                    id="nationalInsurance"
                    {...personalForm.register('nationalInsurance')}
                    placeholder="AB 12 34 56 C"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="flex items-center gap-2">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Address Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Property Address
              </CardTitle>
              <CardDescription>
                Select your property and confirm address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">Select Property *</Label>
                  <Select onValueChange={(value) => addressForm.setValue('propertyId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.title} - {property.address}, {property.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {addressForm.formState.errors.propertyId && (
                    <p className="text-sm text-red-600">{addressForm.formState.errors.propertyId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input 
                    id="addressLine1"
                    {...addressForm.register('addressLine1')}
                    placeholder="House number and street name"
                  />
                  {addressForm.formState.errors.addressLine1 && (
                    <p className="text-sm text-red-600">{addressForm.formState.errors.addressLine1.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="addressLine2"
                    {...addressForm.register('addressLine2')}
                    placeholder="Apartment, flat, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city"
                      {...addressForm.register('city')}
                      placeholder="City"
                    />
                    {addressForm.formState.errors.city && (
                      <p className="text-sm text-red-600">{addressForm.formState.errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input 
                      id="postcode"
                      {...addressForm.register('postcode')}
                      placeholder="SW1A 1AA"
                    />
                    {addressForm.formState.errors.postcode && (
                      <p className="text-sm text-red-600">{addressForm.formState.errors.postcode.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="moveInDate">Move-in Date *</Label>
                  <Input 
                    id="moveInDate"
                    type="date"
                    {...addressForm.register('moveInDate')}
                  />
                  {addressForm.formState.errors.moveInDate && (
                    <p className="text-sm text-red-600">{addressForm.formState.errors.moveInDate.message}</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(0)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Utility Provider Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Utility Provider Selection
              </CardTitle>
              <CardDescription>
                Choose your preferred utility providers for each service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={providerForm.handleSubmit(handleProviderSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <Label className="text-base font-medium">Energy Providers</Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="electricityProvider">Electricity Provider *</Label>
                      <Select onValueChange={(value) => providerForm.setValue('electricityProvider', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose electricity provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvidersByType('electricity').map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gasProvider">Gas Provider *</Label>
                      <Select onValueChange={(value) => providerForm.setValue('gasProvider', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose gas provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvidersByType('gas').map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <Label className="text-base font-medium">Other Services</Label>
                    </div>

                    <div>
                      <Label htmlFor="waterProvider">Water Provider *</Label>
                      <Select onValueChange={(value) => providerForm.setValue('waterProvider', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose water provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvidersByType('water').map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="broadbandProvider">Broadband Provider *</Label>
                      <Select onValueChange={(value) => providerForm.setValue('broadbandProvider', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose broadband provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvidersByType('broadband').map((provider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferredContactMethod">Preferred Contact Method *</Label>
                  <Select onValueChange={(value) => providerForm.setValue('preferredContactMethod', value as 'email' | 'phone' | 'post')}>
                    <SelectTrigger>
                      <SelectValue placeholder="How would you like providers to contact you?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="post">Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={setupMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {setupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Complete Setup'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Completion */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your utility accounts have been successfully registered. You'll receive confirmation emails from each provider within 24-48 hours.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Energy</p>
                </div>
                <div className="text-center">
                  <Droplets className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Water</p>
                </div>
                <div className="text-center">
                  <Wifi className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Broadband</p>
                </div>
                <div className="text-center">
                  <Tv className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">TV License</p>
                </div>
              </div>
              <Button className="mt-6" onClick={() => window.location.href = '/tenant/utilities'}>
                View Utility Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}