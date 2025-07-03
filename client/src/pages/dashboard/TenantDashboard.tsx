import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, FileText, CreditCard, Calendar, CheckCircle, AlertCircle, MapPin, Clock, XCircle, 
  Wrench, ArrowUpCircle, ShieldAlert, Info, Settings, MessageCircle, CheckCircle2, ClipboardList, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import TenantUtilityManagement from '@/components/utility/TenantUtilityManagement';


// Types for our data
interface PropertyType {
  id: number;
  title: string;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  images: string[];
  ownerId: number;
  createdAt: string;
}

interface MaintenanceRequestType {
  id: number;
  propertyId: number;
  tenantId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  assignedTo?: number;
  notes?: string;
}

interface TenancyType {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  active: boolean;
  signedByTenant: boolean;
  signedByOwner: boolean;
  depositProtectionScheme?: string;
  depositProtectionId?: string;
  property?: PropertyType;
  createdAt: string;
}

interface ApplicationType {
  id: number;
  propertyId: number;
  tenantId: number;
  status: string;
  moveInDate?: string;
  notes?: string;
  createdAt: string;
}

interface PaymentType {
  id: number;
  tenancyId: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  paymentType: string;
  stripePaymentId?: string;
  createdAt: string;
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestCategory, setRequestCategory] = useState("");
  const [requestPriority, setRequestPriority] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Function to handle maintenance request submission
  const handleSubmitMaintenanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }
    
    if (!requestTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your request",
        variant: "destructive",
      });
      return;
    }
    
    if (!requestCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }
    
    if (!requestPriority) {
      toast({
        title: "Error",
        description: "Please select a priority level",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit the maintenance request
      await createMaintenanceRequestMutation.mutateAsync({
        propertyId: parseInt(selectedPropertyId),
        title: requestTitle,
        category: requestCategory,
        priority: requestPriority,
        description: requestDescription,
      });
    } catch (error) {
      // Error is handled in the mutation's onError
      console.error("Error submitting maintenance request:", error);
    }
  };
  
  // Mutation for creating a maintenance request
  const createMaintenanceRequestMutation = useMutation({
    mutationFn: async (requestData: {
      propertyId: number;
      title: string;
      category: string;
      priority: string;
      description: string;
    }) => {
      const response = await fetch('/api/tenant/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create maintenance request');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Reset form fields
      setSelectedPropertyId("");
      setRequestTitle("");
      setRequestCategory("");
      setRequestPriority("");
      setRequestDescription("");
      
      // Close dialog
      setDialogOpen(false);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Your maintenance request has been submitted.",
        variant: "default",
      });
      
      // Invalidate query to refresh maintenance requests list
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/maintenance'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit maintenance request. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Fetch tenant's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationType[]>({
    queryKey: ['/api/tenant/applications'],
    enabled: !!user,
  });
  
  // Fetch tenant's active tenancies
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery<TenancyType[]>({
    queryKey: ['/api/tenant/tenancies'],
    enabled: !!user,
  });
  
  // Fetch tenant's upcoming payments
  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentType[]>({
    queryKey: ['/api/tenant/payments'],
    enabled: !!user,
  });
  
  // Fetch tenant's maintenance requests
  const { data: maintenanceRequests, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/tenant/maintenance'],
    enabled: !!user,
  });

  // Fetch all properties for reference
  const { data: properties } = useQuery<PropertyType[]>({
    queryKey: ['/api/properties'],
  });

  // Helper function to find property by ID
  const getPropertyById = (id: number) => {
    return properties?.find(property => property.id === id);
  };

  // Count upcoming/overdue payments
  const upcomingPayments = payments?.filter(payment => 
    payment.status === 'pending' && new Date(payment.dueDate) > new Date()
  ) || [];
  
  const overduePayments = payments?.filter(payment => 
    payment.status === 'pending' && new Date(payment.dueDate) < new Date()
  ) || [];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // State for maintenance request details dialog
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequestType | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Function to open maintenance request details
  const openRequestDetails = (request: MaintenanceRequestType) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  return (
    <DashboardLayout dashboardType="tenant">
      <div className="space-y-6 p-6">
        {/* Welcome & Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Welcome back, {user?.name}</CardTitle>
              <CardDescription>Your student accommodation dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {!user?.verified && (
                <div className="flex items-start space-x-2 mb-4 p-3 bg-amber-50 text-amber-700 rounded-md">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Your identity is not verified</p>
                    <p className="text-sm">Complete verification to apply for properties</p>
                    <Link href="/verification">
                      <Button variant="outline" size="sm" className="mt-2">
                        Verify Identity
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Applications</h3>
                  <p className="text-2xl font-bold">{applications?.length || 0}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Active Tenancies</h3>
                  <p className="text-2xl font-bold">{tenancies?.filter(t => t.active).length || 0}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Upcoming Payments</h3>
                  <p className="text-2xl font-bold">{upcomingPayments.length}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Overdue Payments</h3>
                  <p className="text-2xl font-bold text-red-600">{overduePayments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {tenancies && tenancies.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Current Tenancy</CardTitle>
                <CardDescription>Your active rental property</CardDescription>
              </CardHeader>
              <CardContent>
                {tenancies
                  .filter(tenancy => tenancy.active)
                  .map(tenancy => {
                    const property = getPropertyById(tenancy.propertyId);
                    return property ? (
                      <div key={tenancy.id} className="space-y-4">
                        <div className="font-semibold text-lg">{property.title}</div>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.address}, {property.city}
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(tenancy.startDate)} - {formatDate(tenancy.endDate)}
                        </div>
                        <div className="mt-2">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline" size="sm">View Property</Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div key={tenancy.id} className="text-gray-500">
                        Loading property details...
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}
          
          {/* Video Widget for Student Social Platform */}
          <div className="lg:col-span-1">

          </div>
        </div>
        
        {/* Tabs for different sections */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="tenancies">Tenancies</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
          </TabsList>
          
          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <h2 className="text-xl font-semibold">Your Applications</h2>
            
            {applicationsLoading ? (
              <div className="text-center py-8 animate-pulse">
                <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications.map(application => {
                  const property = getPropertyById(application.propertyId);
                  return (
                    <Card key={application.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{property?.title || 'Property'}</CardTitle>
                          <Badge
                            variant={
                              application.status === 'approved' 
                                ? 'default'
                                : application.status === 'pending' 
                                ? 'outline' 
                                : 'destructive'
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {property ? `${property.address}, ${property.city}` : 'Loading details...'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500">Applied:</span>
                            <span>{formatDate(application.createdAt)}</span>
                          </div>
                          {application.moveInDate && (
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-500">Move-in Date:</span>
                              <span>{formatDate(application.moveInDate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Price:</span>
                            <span>£{property?.price || '---'} per week</span>
                          </div>
                        </div>
                      </CardContent>
                      {property && (
                        <CardFooter className="pt-0">
                          <Link href={`/properties/${property.id}`} className="w-full">
                            <Button variant="outline" className="w-full">View Property</Button>
                          </Link>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="mb-4">You haven't applied for any properties yet.</p>
                  <Link href="/properties">
                    <Button>Browse Properties</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tenancies Tab */}
          <TabsContent value="tenancies" className="space-y-4">
            <h2 className="text-xl font-semibold">Your Tenancies</h2>
            
            {tenanciesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading tenancies...</p>
              </div>
            ) : tenancies && tenancies.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tenancies.map(tenancy => {
                  const property = getPropertyById(tenancy.propertyId);
                  return (
                    <Card key={tenancy.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{property?.title || 'Property'}</CardTitle>
                          <Badge variant={tenancy.active ? 'default' : 'secondary'}>
                            {tenancy.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription>
                          {property ? `${property.address}, ${property.city}` : 'Loading details...'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-gray-500">Start Date:</span>
                            <span>{formatDate(tenancy.startDate)}</span>
                            
                            <span className="text-gray-500">End Date:</span>
                            <span>{formatDate(tenancy.endDate)}</span>
                            
                            <span className="text-gray-500">Rent Amount:</span>
                            <span>£{Number(tenancy.rentAmount).toFixed(2)} per month</span>
                            
                            <span className="text-gray-500">Deposit:</span>
                            <span>£{Number(tenancy.depositAmount).toFixed(2)}</span>
                            
                            <span className="text-gray-500">Deposit Protection:</span>
                            <span>{tenancy.depositProtectionScheme || 'Not registered yet'}</span>
                          </div>
                          
                          <div className="pt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Agreement Signed:</span>
                              <div className="flex space-x-4">
                                <div className="flex items-center">
                                  <span className="text-sm mr-1">You:</span>
                                  {tenancy.signedByTenant ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-sm mr-1">Landlord:</span>
                                  {tenancy.signedByOwner ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        {property && (
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline" size="sm">View Property</Button>
                          </Link>
                        )}
                        {!tenancy.signedByTenant && (
                          <Button variant="default" size="sm">Sign Agreement</Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="mb-4">You don't have any tenancies yet.</p>
                  <Link href="/properties">
                    <Button>Browse Properties</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <h2 className="text-xl font-semibold">Your Payments</h2>
            
            {paymentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading payments...</p>
              </div>
            ) : !payments || payments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="mb-4">You don't have any payments yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {overduePayments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-red-600 mb-2">Overdue Payments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overduePayments.map(payment => (
                        <Card key={payment.id} className="border-red-200">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                              <Badge variant="destructive">Overdue</Badge>
                            </div>
                            <CardDescription>
                              Due: {formatDate(payment.dueDate)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">£{Number(payment.amount).toFixed(2)}</div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full">Pay Now</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
  
                {upcomingPayments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Upcoming Payments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {upcomingPayments.map(payment => (
                        <Card key={payment.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                              <Badge variant="outline">Pending</Badge>
                            </div>
                            <CardDescription>
                              Due: {formatDate(payment.dueDate)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">£{Number(payment.amount).toFixed(2)}</div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" className="w-full">Pay Now</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
  
                {payments.filter(p => p.status === 'paid').length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Payment History</h3>
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Due Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Paid Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {payments
                                .filter(p => p.status === 'paid')
                                .map(payment => (
                                  <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{payment.paymentType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">£{Number(payment.amount).toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{formatDate(payment.dueDate)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{payment.paidDate ? formatDate(payment.paidDate) : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant="default" className="bg-green-500">Paid</Badge>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Maintenance Requests</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Wrench className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleSubmitMaintenanceRequest}>
                    <DialogHeader>
                      <DialogTitle>Submit a Maintenance Request</DialogTitle>
                      <DialogDescription>
                        Report any issues with your property that need to be addressed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="property">Property</Label>
                        <Select
                          value={selectedPropertyId}
                          onValueChange={setSelectedPropertyId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            {tenancies?.filter(t => t.active).map(tenancy => {
                              const property = getPropertyById(tenancy.propertyId);
                              return property ? (
                                <SelectItem key={property.id} value={property.id.toString()}>
                                  {property.title}, {property.address}
                                </SelectItem>
                              ) : null;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Issue Title</Label>
                        <Input 
                          id="title" 
                          placeholder="e.g. Leaking faucet in kitchen" 
                          value={requestTitle}
                          onChange={e => setRequestTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={requestCategory}
                          onValueChange={setRequestCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="heating">Heating/Cooling</SelectItem>
                            <SelectItem value="appliance">Appliance</SelectItem>
                            <SelectItem value="structural">Structural</SelectItem>
                            <SelectItem value="pest">Pest Control</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={requestPriority}
                          onValueChange={setRequestPriority}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - Not urgent</SelectItem>
                            <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                            <SelectItem value="high">High - Requires prompt attention</SelectItem>
                            <SelectItem value="emergency">Emergency - Immediate attention needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Please provide details about the issue. Include when it started, what you've tried to fix it, and any other relevant information."
                          rows={5}
                          value={requestDescription}
                          onChange={e => setRequestDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Submitting...
                          </>
                        ) : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceRequests.map(request => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <Badge
                          variant={
                            request.status === 'completed' 
                              ? 'default'
                              : request.status === 'in_progress'
                              ? 'secondary'
                              : request.status === 'urgent'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {request.category} • {formatDate(request.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      {request.scheduledDate && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Scheduled: {formatDate(request.scheduledDate)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Maintenance Requests</h3>
                <p className="text-gray-600">You haven't submitted any maintenance requests yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Utility Status</h2>
              <Link href="/tenant/utilities">
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>

            <TenantUtilityManagement />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Maintenance Request Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <DialogTitle>{selectedRequest.title}</DialogTitle>
                  <Badge
                    variant={
                      selectedRequest.priority === 'emergency' 
                        ? 'destructive'
                        : selectedRequest.priority === 'high' 
                        ? 'default' 
                        : 'outline'
                    }
                  >
                    {selectedRequest.priority.charAt(0).toUpperCase() + selectedRequest.priority.slice(1)}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedRequest.category} • {formatDate(selectedRequest.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="flex items-center mt-1">
                      {selectedRequest.status === 'scheduled' ? (
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      ) : selectedRequest.status === 'in_progress' ? (
                        <ArrowUpCircle className="h-4 w-4 mr-2 text-orange-500" />
                      ) : (
                        <Info className="h-4 w-4 mr-2 text-gray-500" />
                      )}
                      <span className="capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {selectedRequest.scheduledDate && (
                    <div>
                      <span className="font-medium">Scheduled Date:</span>
                      <p>{formatDate(selectedRequest.scheduledDate)}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.description}</p>
                  </div>
                )}
                {selectedRequest.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}