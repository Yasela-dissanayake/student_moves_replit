import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, AlertCircle, Bolt, Flame, Droplet, Wifi, Tv, Building, LockIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { useSession } from '@/lib/auth';

// Define the property utility type
type PropertyUtility = {
  id: number;
  propertyId: number;
  utilityType: 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
  providerId: number | null;
  planId: number | null;
  accountNumber: string | null;
  meterNumber: string | null;
  startDate: string | null;
  endDate: string | null;
  currentReading: number | null;
  lastReadingDate: string | null;
  billedDirectlyToTenant: boolean;
  includedInRent: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  provider?: {
    id: number;
    name: string;
    displayName: string;
  };
  plan?: {
    id: number;
    name: string;
    displayName: string;
  };
};

// Define the provider type
type UtilityProvider = {
  id: number;
  name: string;
  displayName: string;
  utilityType: 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
};

// Define the plan type
type UtilityPlan = {
  id: number;
  providerId: number;
  name: string;
  displayName: string;
};

// Define the utility type info
type UtilityTypeInfo = {
  type: string;
  displayName: string;
  icon: string;
  description: string;
};

// Form schema for adding/editing a property utility
const propertyUtilitySchema = z.object({
  utilityType: z.enum(['electricity', 'gas', 'water', 'internet', 'tv_license', 'council_tax'], {
    required_error: 'Please select a utility type',
  }),
  providerId: z.number().nullable(),
  planId: z.number().nullable(),
  accountNumber: z.string().max(50).nullable(),
  meterNumber: z.string().max(50).nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable().optional(),
  currentReading: z.number().nullable().optional(),
  lastReadingDate: z.date().nullable().optional(),
  billedDirectlyToTenant: z.boolean().default(false),
  includedInRent: z.boolean().default(false),
  notes: z.string().max(500).nullable().optional(),
});

type PropertyUtilityFormValues = z.infer<typeof propertyUtilitySchema>;

interface PropertyUtilitiesManagerProps {
  propertyId: number;
}

const PropertyUtilitiesManager = ({ propertyId }: PropertyUtilitiesManagerProps) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<PropertyUtility | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const isAdmin = session?.user?.userType === 'admin';

  // Initialize the form
  const form = useForm<PropertyUtilityFormValues>({
    resolver: zodResolver(propertyUtilitySchema),
    defaultValues: {
      utilityType: 'electricity',
      providerId: null,
      planId: null,
      accountNumber: null,
      meterNumber: null,
      startDate: null,
      endDate: null,
      currentReading: null,
      lastReadingDate: null,
      billedDirectlyToTenant: true,
      includedInRent: false,
      notes: null,
    },
  });

  // Get selected utility type
  const selectedUtilityType = form.watch('utilityType');
  const selectedProviderId = form.watch('providerId');

  // Fetch utility types
  const { 
    data: utilityTypesData
  } = useQuery({
    queryKey: ['/api/utility-types'],
    retry: 1,
  });

  // Fetch all utility providers
  const { 
    data: providersData
  } = useQuery({
    queryKey: ['/api/utilities/providers'],
    retry: 1,
  });

  // Fetch utility plans based on selected provider
  const { 
    data: plansData 
  } = useQuery({
    queryKey: ['/api/utilities/plans/provider', selectedProviderId],
    enabled: !!selectedProviderId,
    retry: 1,
  });

  // Fetch property utilities
  const { 
    data: utilitiesData, 
    isLoading: utilitiesLoading, 
    error: utilitiesError
  } = useQuery({
    queryKey: ['/api/utilities/property', propertyId],
    retry: 1,
  });

  // Filter utilities based on active tab
  const filteredUtilities = activeTab === 'all' 
    ? utilitiesData?.utilities 
    : utilitiesData?.utilities?.filter(
        (utility: PropertyUtility) => utility.utilityType === activeTab
      );

  // Create property utility mutation
  const createUtilityMutation = useMutation({
    mutationFn: (utilityData: any) => 
      apiRequest(`/api/utilities/property/${propertyId}`, 'POST', utilityData),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Utility added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/property', propertyId] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error adding utility:', error);
      toast({
        title: 'Error',
        description: 'Failed to add utility. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update property utility mutation
  const updateUtilityMutation = useMutation({
    mutationFn: (data: { id: number, utilityData: any }) => 
      apiRequest(`/api/utilities/property/utility/${data.id}`, 'PUT', data.utilityData),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Utility updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/property', propertyId] });
      setIsEditDialogOpen(false);
      setSelectedUtility(null);
    },
    onError: (error) => {
      console.error('Error updating utility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update utility. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Delete property utility mutation
  const deleteUtilityMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/utilities/property/utility/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Utility deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/property', propertyId] });
      setIsDeleteDialogOpen(false);
      setSelectedUtility(null);
    },
    onError: (error) => {
      console.error('Error deleting utility:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete utility. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Submit handler for adding a new utility
  const onAddSubmit = (values: PropertyUtilityFormValues) => {
    // Format dates for API
    const formattedData = {
      ...values,
      startDate: values.startDate ? format(values.startDate, 'yyyy-MM-dd') : null,
      endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
      lastReadingDate: values.lastReadingDate ? format(values.lastReadingDate, 'yyyy-MM-dd') : null,
    };
    
    createUtilityMutation.mutate(formattedData);
  };

  // Submit handler for updating a utility
  const onEditSubmit = (values: PropertyUtilityFormValues) => {
    if (!selectedUtility) return;
    
    // Format dates for API
    const formattedData = {
      ...values,
      startDate: values.startDate ? format(values.startDate, 'yyyy-MM-dd') : null,
      endDate: values.endDate ? format(values.endDate, 'yyyy-MM-dd') : null,
      lastReadingDate: values.lastReadingDate ? format(values.lastReadingDate, 'yyyy-MM-dd') : null,
    };
    
    updateUtilityMutation.mutate({ id: selectedUtility.id, utilityData: formattedData });
  };

  // Handle edit utility
  const handleEditUtility = (utility: PropertyUtility) => {
    setSelectedUtility(utility);
    
    // Parse dates from strings to Date objects
    const formValues = {
      ...utility,
      startDate: utility.startDate ? new Date(utility.startDate) : null,
      endDate: utility.endDate ? new Date(utility.endDate) : null,
      lastReadingDate: utility.lastReadingDate ? new Date(utility.lastReadingDate) : null,
    };
    
    form.reset(formValues);
    setIsEditDialogOpen(true);
  };

  // Handle delete utility
  const handleDeleteUtility = (utility: PropertyUtility) => {
    setSelectedUtility(utility);
    setIsDeleteDialogOpen(true);
  };

  // Get utility icon
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity':
        return <Bolt className="h-5 w-5" />;
      case 'gas':
        return <Flame className="h-5 w-5" />;
      case 'water':
        return <Droplet className="h-5 w-5" />;
      case 'internet':
        return <Wifi className="h-5 w-5" />;
      case 'tv_license':
        return <Tv className="h-5 w-5" />;
      case 'council_tax':
        return <Building className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LockIcon className="h-5 w-5 mr-2 text-amber-500" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              Only administrators can manage property utilities. Please contact an administrator for assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Property utilities can only be managed by system administrators to ensure consistent and accurate billing information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Property Utilities</h2>
              <Button onClick={() => {
                form.reset();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Utility
              </Button>
            </div>
            <p className="text-muted-foreground">
              Manage utilities for this property.
            </p>
          </div>

      {/* Tabs for filtering by utility type */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          
          {utilityTypesData?.utilityTypes?.map((type: UtilityTypeInfo) => (
            <TabsTrigger key={type.type} value={type.type}>
              <span className="mr-1.5 flex items-center">
                {getUtilityIcon(type.type)}
              </span>
              {type.displayName}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {utilitiesLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : utilitiesError ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Error Loading Utilities</CardTitle>
                <CardDescription>
                  There was an error loading the property utilities. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </CardContent>
            </Card>
          ) : filteredUtilities?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUtilities.map((utility: PropertyUtility) => (
                <Card key={utility.id} className="overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center">
                      <div className="rounded-full p-2 bg-primary/10 mr-3">
                        {getUtilityIcon(utility.utilityType)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {utilityTypesData?.utilityTypes?.find(
                            (t: UtilityTypeInfo) => t.type === utility.utilityType
                          )?.displayName || utility.utilityType}
                        </CardTitle>
                        <CardDescription>
                          {utility.provider?.displayName || 'No provider set'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUtility(utility)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUtility(utility)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {utility.plan && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium">{utility.plan.displayName}</span>
                        </div>
                      )}
                      {utility.accountNumber && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Account Number:</span>
                          <span className="font-medium">{utility.accountNumber}</span>
                        </div>
                      )}
                      {utility.meterNumber && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Meter Number:</span>
                          <span className="font-medium">{utility.meterNumber}</span>
                        </div>
                      )}
                      {utility.startDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="font-medium">{new Date(utility.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {utility.currentReading && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Reading:</span>
                          <span className="font-medium">{utility.currentReading}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Billed to Tenant:</span>
                        <span className="font-medium">{utility.billedDirectlyToTenant ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Included in Rent:</span>
                        <span className="font-medium">{utility.includedInRent ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    {utility.notes && (
                      <>
                        <Separator className="my-3" />
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="text-muted-foreground mt-1">{utility.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Utilities Found</CardTitle>
                <CardDescription>
                  No utilities have been added to this property yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => {
                  form.reset();
                  setIsAddDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Utility
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Utility Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Property Utility</DialogTitle>
            <DialogDescription>
              Add a new utility service for this property.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select utility type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypesData?.utilityTypes?.map((type: UtilityTypeInfo) => (
                          <SelectItem key={type.type} value={type.type}>
                            <div className="flex items-center">
                              <span className="mr-2">{getUtilityIcon(type.type)}</span>
                              {type.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of utility service.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {providersData?.providers
                          ?.filter((provider: UtilityProvider) => 
                            provider.utilityType === selectedUtilityType)
                          .map((provider: UtilityProvider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.displayName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the utility provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProviderId && (
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {plansData?.plans?.map((plan: UtilityPlan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the utility plan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Account number (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meterNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Meter number (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Reading</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="Current reading (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="billedDirectlyToTenant">Billed Directly to Tenant</Label>
                  <FormField
                    control={form.control}
                    name="billedDirectlyToTenant"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="billedDirectlyToTenant"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="includedInRent">Included in Rent</Label>
                  <FormField
                    control={form.control}
                    name="includedInRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="includedInRent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Additional notes about this utility (optional)"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUtilityMutation.isPending}
                >
                  {createUtilityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Utility
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Utility Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Property Utility</DialogTitle>
            <DialogDescription>
              Update the utility service details.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Same form fields as add dialog */}
              <FormField
                control={form.control}
                name="utilityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select utility type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {utilityTypesData?.utilityTypes?.map((type: UtilityTypeInfo) => (
                          <SelectItem key={type.type} value={type.type}>
                            <div className="flex items-center">
                              <span className="mr-2">{getUtilityIcon(type.type)}</span>
                              {type.displayName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {providersData?.providers
                          ?.filter((provider: UtilityProvider) => 
                            provider.utilityType === selectedUtilityType)
                          .map((provider: UtilityProvider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.displayName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProviderId && (
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {plansData?.plans?.map((plan: UtilityPlan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Account number (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meterNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Meter number (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Reading</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="Current reading (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="edit-billedDirectlyToTenant">Billed Directly to Tenant</Label>
                  <FormField
                    control={form.control}
                    name="billedDirectlyToTenant"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="edit-billedDirectlyToTenant"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="edit-includedInRent">Included in Rent</Label>
                  <FormField
                    control={form.control}
                    name="includedInRent"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="edit-includedInRent"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Additional notes about this utility (optional)"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateUtilityMutation.isPending}
                >
                  {updateUtilityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Utility
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Utility Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Utility</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this utility? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUtility && (
              <div className="flex items-center">
                <div className="rounded-full p-2 bg-primary/10 mr-3">
                  {getUtilityIcon(selectedUtility.utilityType)}
                </div>
                <div>
                  <p className="font-medium">
                    {utilityTypesData?.utilityTypes?.find(
                      (t: UtilityTypeInfo) => t.type === selectedUtility.utilityType
                    )?.displayName || selectedUtility.utilityType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUtility.provider?.displayName || 'No provider set'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={deleteUtilityMutation.isPending}
              onClick={() => {
                if (selectedUtility) {
                  deleteUtilityMutation.mutate(selectedUtility.id);
                }
              }}
            >
              {deleteUtilityMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
};

export default PropertyUtilitiesManager;