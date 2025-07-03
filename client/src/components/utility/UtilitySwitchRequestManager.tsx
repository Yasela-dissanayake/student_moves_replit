import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from '@/components/ui/timeline';
import { Loader2, CheckCircle, Clock, AlertCircle, Bolt, Flame, Droplet, Wifi, Tv, Building, Calendar, Phone, Mail, X, LockIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';

// Define the utility switch request type
type UtilitySwitchRequest = {
  id: number;
  userId: number;
  propertyId: number;
  utilityType: 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
  currentProviderId: number | null;
  newProviderId: number;
  newPlanId: number | null;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  requestDate: string;
  completionDate: string | null;
  notes: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  preferredContactMethod: 'email' | 'phone' | 'either';
  preferredContactTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
  createdAt: string;
  updatedAt: string | null;
  currentProvider?: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  newProvider: {
    id: number;
    name: string;
    displayName: string;
  };
  newPlan?: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  property: {
    id: number;
    address: string;
    city: string;
    postcode: string;
  };
};

// Define utility provider type
type UtilityProvider = {
  id: number;
  name: string;
  displayName: string;
  utilityType: 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
};

// Define utility plan type
type UtilityPlan = {
  id: number;
  providerId: number;
  name: string;
  displayName: string;
};

// Define property type
type Property = {
  id: number;
  address: string;
  city: string;
  postcode: string;
};

// Form schema for creating a switch request
const switchRequestSchema = z.object({
  propertyId: z.number({
    required_error: 'Please select a property',
  }),
  utilityType: z.enum(['electricity', 'gas', 'water', 'internet', 'tv_license', 'council_tax'], {
    required_error: 'Please select a utility type',
  }),
  currentProviderId: z.number().nullable(),
  newProviderId: z.number({
    required_error: 'Please select a new provider',
  }),
  newPlanId: z.number().nullable(),
  notes: z.string().max(500).nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'either'], {
    required_error: 'Please select your preferred contact method',
  }),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening', 'anytime'], {
    required_error: 'Please select your preferred contact time',
  }),
});

type SwitchRequestFormValues = z.infer<typeof switchRequestSchema>;

interface UtilitySwitchRequestManagerProps {
  userProperties?: Property[];
}

const UtilitySwitchRequestManager = ({ userProperties }: UtilitySwitchRequestManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UtilitySwitchRequest | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();
  // Temporary buttons for testing admin view vs non-admin view
  const [testIsAdmin, setTestIsAdmin] = useState(false);
  const isAdmin = testIsAdmin || userType === 'admin';

  // Initialize the form
  const form = useForm<SwitchRequestFormValues>({
    resolver: zodResolver(switchRequestSchema),
    defaultValues: {
      propertyId: userProperties?.[0]?.id,
      utilityType: 'electricity',
      currentProviderId: null,
      newProviderId: 0,
      newPlanId: null,
      notes: null,
      contactPhone: null,
      contactEmail: null,
      preferredContactMethod: 'email',
      preferredContactTime: 'anytime',
    },
  });

  // Selected form values for fetching related data
  const selectedUtilityType = form.watch('utilityType');
  const selectedNewProviderId = form.watch('newProviderId');

  // Fetch user's switch requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ['/api/utilities/switch-requests'],
    retry: 1,
  });

  // Fetch utility providers based on selected utility type
  const {
    data: providersData,
    isLoading: providersLoading
  } = useQuery({
    queryKey: ['/api/utilities/providers/type', selectedUtilityType],
    enabled: !!selectedUtilityType,
    retry: 1,
  });

  // Fetch utility plans based on selected provider
  const {
    data: plansData,
    isLoading: plansLoading
  } = useQuery({
    queryKey: ['/api/utilities/plans/provider', selectedNewProviderId],
    enabled: !!selectedNewProviderId && selectedNewProviderId > 0,
    retry: 1,
  });

  // Filter requests based on active tab
  const filteredRequests = requestsData?.switchRequests ? 
    activeTab === 'all' 
      ? requestsData.switchRequests
      : requestsData.switchRequests.filter(
          (request: UtilitySwitchRequest) => request.status === activeTab
        )
    : [];

  // Create switch request mutation
  const createSwitchRequestMutation = useMutation({
    mutationFn: (requestData: SwitchRequestFormValues) => 
      apiRequest('/api/utilities/switch-request', 'POST', requestData),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your utility switch request has been submitted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/switch-requests'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating switch request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit switch request. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Cancel switch request mutation
  const cancelSwitchRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest(`/api/utilities/switch-request/${requestId}/status`, 'PATCH', { status: 'cancelled' }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your utility switch request has been cancelled.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/switch-requests'] });
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Error cancelling switch request:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel switch request. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Submit handler for creating a new switch request
  const onSubmit = (values: SwitchRequestFormValues) => {
    createSwitchRequestMutation.mutate(values);
  };

  // Handle viewing a request's details
  const handleViewRequest = (request: UtilitySwitchRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  // Handle cancelling a request
  const handleCancelRequest = (requestId: number) => {
    if (window.confirm('Are you sure you want to cancel this switch request?')) {
      cancelSwitchRequestMutation.mutate(requestId);
    }
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Utility Switch Requests</h2>
          <p className="text-muted-foreground">
            Track and manage your utility switch requests.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Test toggle for admin view */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Test Admin View:</span>
            <Switch 
              checked={testIsAdmin}
              onCheckedChange={setTestIsAdmin}
            />
          </div>
          {isAdmin ? (
            <Button onClick={() => {
              form.reset();
              setIsCreateDialogOpen(true);
            }}>
              Request New Switch
            </Button>
          ) : null}
        </div>
      </div>

      {/* Admin-only restriction notice */}
      {!isAdmin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <LockIcon className="h-5 w-5 mr-2 text-yellow-600" />
              <CardTitle className="text-lg text-yellow-700">Admin Access Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Utility management is restricted to administrators only. This ensures all utility changes are properly reviewed and coordinated. Please contact an administrator if you need to make changes to your utilities.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Only show content to admins */}
      {isAdmin && (
        <>
          {/* Tabs for filtering by status */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {requestsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : requestsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load your switch requests. Please try again later.
              </AlertDescription>
            </Alert>
          ) : filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((request: UtilitySwitchRequest) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="rounded-full p-2 bg-primary/10 mr-3">
                          {getUtilityIcon(request.utilityType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg capitalize">
                            {request.utilityType.replace('_', ' ')} Switch
                          </CardTitle>
                          <CardDescription>
                            {request.property.address}, {request.property.postcode}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium">
                          {request.currentProvider?.displayName || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">To:</span>
                        <span className="font-medium">
                          {request.newProvider.displayName}
                          {request.newPlan && ` (${request.newPlan.displayName})`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Requested:</span>
                        <span className="font-medium">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      View Details
                    </Button>
                    {request.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Switch Requests</CardTitle>
                <CardDescription>
                  You haven't made any utility switch requests yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <Button onClick={() => {
                  form.reset();
                  setIsCreateDialogOpen(true);
                }}>
                  Request a Switch
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Switch Request Dialog - Admin Only */}
      {isAdmin && (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Request Utility Switch</DialogTitle>
            <DialogDescription>
              Submit a request to switch your utility provider.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userProperties?.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.address}, {property.postcode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the property for this utility switch.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="electricity">
                          <div className="flex items-center">
                            <Bolt className="h-4 w-4 mr-2" />
                            Electricity
                          </div>
                        </SelectItem>
                        <SelectItem value="gas">
                          <div className="flex items-center">
                            <Flame className="h-4 w-4 mr-2" />
                            Gas
                          </div>
                        </SelectItem>
                        <SelectItem value="water">
                          <div className="flex items-center">
                            <Droplet className="h-4 w-4 mr-2" />
                            Water
                          </div>
                        </SelectItem>
                        <SelectItem value="internet">
                          <div className="flex items-center">
                            <Wifi className="h-4 w-4 mr-2" />
                            Internet
                          </div>
                        </SelectItem>
                        <SelectItem value="tv_license">
                          <div className="flex items-center">
                            <Tv className="h-4 w-4 mr-2" />
                            TV License
                          </div>
                        </SelectItem>
                        <SelectItem value="council_tax">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            Council Tax
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of utility you want to switch.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentProviderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Provider (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select current provider (if known)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">I don't know / Not applicable</SelectItem>
                        {providersLoading ? (
                          <SelectItem value="" disabled>
                            Loading providers...
                          </SelectItem>
                        ) : (
                          providersData?.providers?.map((provider: UtilityProvider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select your current provider if you know it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newProviderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Provider</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providersLoading ? (
                          <SelectItem value="" disabled>
                            Loading providers...
                          </SelectItem>
                        ) : (
                          providersData?.providers?.map((provider: UtilityProvider) => (
                            <SelectItem key={provider.id} value={provider.id.toString()}>
                              {provider.displayName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the provider you want to switch to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedNewProviderId > 0 && (
                <FormField
                  control={form.control}
                  name="newPlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Plan (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select new plan (if known)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not selected</SelectItem>
                          {plansLoading ? (
                            <SelectItem value="" disabled>
                              Loading plans...
                            </SelectItem>
                          ) : (
                            plansData?.plans?.map((plan: UtilityPlan) => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.displayName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the specific plan you want (optional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Any specific requirements or information about your switch"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredContactMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Email
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="phone" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Phone
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="either" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Either
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          type="email"
                          placeholder="Your contact email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Your contact phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferredContactTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Contact Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred contact time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                        <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                        <SelectItem value="anytime">Anytime</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createSwitchRequestMutation.isPending}
                >
                  {createSwitchRequestMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog - Admin Only */}
      {isAdmin && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Switch Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about your utility switch request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full p-2 bg-primary/10 mr-3">
                    {getUtilityIcon(selectedRequest.utilityType)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold capitalize">
                      {selectedRequest.utilityType.replace('_', ' ')} Switch
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Request #{selectedRequest.id}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Property</h4>
                <p className="text-sm">
                  {selectedRequest.property.address}
                </p>
                <p className="text-sm">
                  {selectedRequest.property.city}, {selectedRequest.property.postcode}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3">Request Timeline</h4>
                <Timeline>
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineIcon>
                        <Clock className="h-4 w-4" />
                      </TimelineIcon>
                      <TimelineTitle>Request Submitted</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedRequest.requestDate).toLocaleString()}
                      </p>
                    </TimelineBody>
                  </TimelineItem>
                  {selectedRequest.status !== 'pending' && (
                    <TimelineConnector />
                  )}
                  {selectedRequest.status === 'approved' && (
                    <TimelineItem>
                      <TimelineHeader>
                        <TimelineIcon>
                          <CheckCircle className="h-4 w-4" />
                        </TimelineIcon>
                        <TimelineTitle>Request Approved</TimelineTitle>
                      </TimelineHeader>
                      <TimelineBody>
                        <p className="text-sm text-muted-foreground">
                          Your switch request has been approved and will be processed.
                        </p>
                      </TimelineBody>
                    </TimelineItem>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <>
                      <TimelineItem>
                        <TimelineHeader>
                          <TimelineIcon>
                            <CheckCircle className="h-4 w-4" />
                          </TimelineIcon>
                          <TimelineTitle>Request Approved</TimelineTitle>
                        </TimelineHeader>
                      </TimelineItem>
                      <TimelineConnector />
                      <TimelineItem>
                        <TimelineHeader>
                          <TimelineIcon>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </TimelineIcon>
                          <TimelineTitle>Switch In Progress</TimelineTitle>
                        </TimelineHeader>
                        <TimelineBody>
                          <p className="text-sm text-muted-foreground">
                            Your utility switch is being processed.
                          </p>
                        </TimelineBody>
                      </TimelineItem>
                    </>
                  )}
                  {selectedRequest.status === 'completed' && (
                    <>
                      <TimelineItem>
                        <TimelineHeader>
                          <TimelineIcon>
                            <CheckCircle className="h-4 w-4" />
                          </TimelineIcon>
                          <TimelineTitle>Request Approved</TimelineTitle>
                        </TimelineHeader>
                      </TimelineItem>
                      <TimelineConnector />
                      <TimelineItem>
                        <TimelineHeader>
                          <TimelineIcon>
                            <CheckCircle className="h-4 w-4" />
                          </TimelineIcon>
                          <TimelineTitle>Switch In Progress</TimelineTitle>
                        </TimelineHeader>
                      </TimelineItem>
                      <TimelineConnector />
                      <TimelineItem>
                        <TimelineHeader>
                          <TimelineIcon>
                            <CheckCircle className="h-4 w-4" />
                          </TimelineIcon>
                          <TimelineTitle>Switch Completed</TimelineTitle>
                        </TimelineHeader>
                        <TimelineBody>
                          <p className="text-sm text-muted-foreground">
                            {selectedRequest.completionDate
                              ? `Completed on ${new Date(selectedRequest.completionDate).toLocaleDateString()}`
                              : 'Your utility switch has been completed successfully.'}
                          </p>
                        </TimelineBody>
                      </TimelineItem>
                    </>
                  )}
                  {selectedRequest.status === 'cancelled' && (
                    <TimelineItem>
                      <TimelineHeader>
                        <TimelineIcon>
                          <X className="h-4 w-4" />
                        </TimelineIcon>
                        <TimelineTitle>Request Cancelled</TimelineTitle>
                      </TimelineHeader>
                      <TimelineBody>
                        <p className="text-sm text-muted-foreground">
                          This switch request has been cancelled.
                        </p>
                      </TimelineBody>
                    </TimelineItem>
                  )}
                  {selectedRequest.status === 'rejected' && (
                    <TimelineItem>
                      <TimelineHeader>
                        <TimelineIcon>
                          <X className="h-4 w-4" />
                        </TimelineIcon>
                        <TimelineTitle>Request Rejected</TimelineTitle>
                      </TimelineHeader>
                      <TimelineBody>
                        <p className="text-sm text-muted-foreground">
                          This switch request could not be processed.
                        </p>
                      </TimelineBody>
                    </TimelineItem>
                  )}
                </Timeline>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Current Provider</h4>
                  <p className="text-sm">
                    {selectedRequest.currentProvider?.displayName || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">New Provider</h4>
                  <p className="text-sm">
                    {selectedRequest.newProvider.displayName}
                    {selectedRequest.newPlan && (
                      <span className="block text-muted-foreground">
                        Plan: {selectedRequest.newPlan.displayName}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Preferences</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedRequest.contactEmail || 'No email provided'}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {selectedRequest.contactPhone || 'No phone provided'}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      Preferred time: <span className="capitalize ml-1">{selectedRequest.preferredContactTime}</span>
                    </div>
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                {selectedRequest.status === 'pending' && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    disabled={cancelSwitchRequestMutation.isPending}
                  >
                    {cancelSwitchRequestMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Cancel Request
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UtilitySwitchRequestManager;