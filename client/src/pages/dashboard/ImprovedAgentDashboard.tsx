import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  LayoutDashboard, 
  Users, 
  Home, 
  FileText, 
  CalendarDays, 
  Bell, 
  MessageSquare,
  FileBarChart2,
  PiggyBank,
  Wrench,
  Building2,
  Shield,
  Briefcase,
  PieChart,
  Percent,
  Check,
  Settings
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedPerformanceMetrics from '@/components/dashboard/UnifiedPerformanceMetrics';
import EnhancedPropertyManager from '@/components/dashboard/EnhancedPropertyManager';

export default function ImprovedAgentDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Define types for the data we expect
  interface Property {
    id: number;
    title: string;
    address: string;
    city: string;
    postcode: string;
    price: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    available: boolean;
    featured?: boolean;
    images?: string[];
    availableDate?: string;
    [key: string]: any;
  }

  interface Tenancy {
    id: number;
    active: boolean;
    propertyId: number;
    startDate: string;
    endDate: string;
    tenantIds: number[];
    [key: string]: any;
  }

  interface MaintenanceRequest {
    id: number;
    propertyId: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    [key: string]: any;
  }

  interface Application {
    id: number;
    propertyId: number;
    status: string;
    applicantId: number;
    moveInDate: string;
    [key: string]: any;
  }

  interface CalendarEvent {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    [key: string]: any;
  }

  interface Payment {
    id: number;
    amount: string;
    status: string;
    [key: string]: any;
  }

  interface Compliance {
    id: number;
    overallScore: number;
    [key: string]: any;
  }

  interface Contractor {
    id: number;
    name: string;
    [key: string]: any;
  }

  // Fetch all necessary data
  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties/agent'],
    staleTime: 60000,
  });

  const { data: tenancies, isLoading: tenanciesLoading } = useQuery<Tenancy[]>({
    queryKey: ['/api/tenancies/agent'],
    staleTime: 60000,
  });

  const { data: maintenanceRequests, isLoading: maintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['/api/maintenance-requests/agent'],
    staleTime: 60000,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications/agent'],
    staleTime: 60000,
  });

  const { data: calendarEvents, isLoading: calendarLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar-events/agent'],
    staleTime: 60000,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments/agent'],
    staleTime: 60000,
  });

  const { data: compliance, isLoading: complianceLoading } = useQuery<Compliance>({
    queryKey: ['/api/compliance/agent'],
    staleTime: 60000,
  });

  const { data: contractors, isLoading: contractorsLoading } = useQuery<Contractor[]>({
    queryKey: ['/api/contractors'],
    staleTime: 60000,
  });

  // Mutations for property management
  const editPropertyMutation = useMutation({
    mutationFn: (data: { id: number, property: any }) => {
      return apiRequest('PATCH', `/api/properties/agent/${data.id}`, data.property);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      toast({
        title: "Property updated",
        description: "Property has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update property",
        description: error.message || "An error occurred while updating the property.",
        variant: "destructive",
      });
    }
  });

  const deletePropertyMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/properties/agent/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      toast({
        title: "Property deleted",
        description: "Property has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete property",
        description: error.message || "An error occurred while deleting the property.",
        variant: "destructive",
      });
    }
  });

  const togglePropertyAvailabilityMutation = useMutation({
    mutationFn: (data: { id: number, available: boolean }) => {
      return apiRequest('PATCH', `/api/properties/agent/${data.id}/availability`, { available: data.available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      toast({
        title: "Property updated",
        description: "Property availability status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update property",
        description: error.message || "An error occurred while updating the property.",
        variant: "destructive",
      });
    }
  });

  const togglePropertyFeaturedMutation = useMutation({
    mutationFn: (data: { id: number, featured: boolean }) => {
      return apiRequest('PATCH', `/api/properties/agent/${data.id}/featured`, { featured: data.featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      toast({
        title: "Property updated",
        description: "Property featured status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update property",
        description: error.message || "An error occurred while updating the property.",
        variant: "destructive",
      });
    }
  });

  // Mutations for applications
  const approveApplicationMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('PATCH', `/api/applications/agent/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications/agent'] });
      toast({
        title: "Application Approved",
        description: "The tenant application has been approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve application",
        description: error.message || "An error occurred while approving the application.",
        variant: "destructive",
      });
    }
  });

  // Mutations for maintenance requests
  const assignContractorMutation = useMutation({
    mutationFn: (data: { requestId: number, contractorId: number }) => {
      return apiRequest('PATCH', `/api/maintenance-requests/agent/${data.requestId}/assign`, { contractorId: data.contractorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/agent'] });
      toast({
        title: "Contractor Assigned",
        description: "A contractor has been assigned to the maintenance request.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign contractor",
        description: error.message || "An error occurred while assigning the contractor.",
        variant: "destructive",
      });
    }
  });

  // Combined loading state
  const isLoading = propertiesLoading || tenanciesLoading || maintenanceLoading || 
                   applicationsLoading || calendarLoading || paymentsLoading || 
                   complianceLoading || contractorsLoading;

  // Handle property actions
  const handleEditProperty = (id: number) => {
    // This would typically open a modal or navigate to an edit page
    toast({
      title: "Edit Property",
      description: `Opening editor for property ID: ${id}`,
    });
  };

  const handleDeleteProperty = (id: number) => {
    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      deletePropertyMutation.mutate(id);
    }
  };

  const handleToggleAvailability = (id: number, available: boolean) => {
    togglePropertyAvailabilityMutation.mutate({ id, available });
  };

  const handleToggleFeatured = (id: number, featured: boolean) => {
    togglePropertyFeaturedMutation.mutate({ id, featured });
  };

  const handleApproveApplication = (id: number) => {
    if (window.confirm("Are you sure you want to approve this application? This will start the tenancy creation process.")) {
      approveApplicationMutation.mutate(id);
    }
  };

  const handleAssignContractor = (requestId: number, contractorId: number) => {
    assignContractorMutation.mutate({ requestId, contractorId });
  };

  // Data for the dashboard
  const dashboardData = {
    properties: properties || [],
    tenancies: tenancies || [],
    applications: applications || [],
    maintenanceRequests: maintenanceRequests || [],
    payments: payments || [],
    calendarEvents: calendarEvents || [],
  };

  // Stats for quick info cards
  const totalProperties = properties?.length || 0;
  const availableProperties = properties?.filter(property => property.available).length || 0;
  
  const stats = {
    totalProperties,
    availableProperties,
    pendingApplications: applications?.filter(application => application.status === 'pending').length || 0,
    activeRentals: tenancies?.filter(tenancy => tenancy.active).length || 0,
    pendingMaintenance: maintenanceRequests?.filter(request => request.status === 'pending' || request.status === 'in-progress').length || 0,
    upcomingViewings: calendarEvents?.filter(event => event.type === 'viewing' && new Date(event.startDate) > new Date()).length || 0,
    totalCommission: payments?.filter(p => p.status === 'paid').reduce((sum, payment) => sum + (parseFloat(payment.amount) * 0.1), 0) || 0,
    complianceScore: compliance?.overallScore || 0,
    propertyOccupancyRate: totalProperties > 0 ? ((totalProperties - availableProperties) / totalProperties) * 100 : 0,
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Helmet>
        <title>Agent Dashboard | UniRent</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your entire property portfolio efficiently from one place.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-9 w-full bg-muted rounded-md p-1">
            <TabsTrigger value="overview" className="rounded-sm">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="rounded-sm">
              <Home className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="tenants" className="rounded-sm">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-sm">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="rounded-sm">
              <Wrench className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-sm">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="contractors" className="rounded-sm">
              <Briefcase className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Contractors</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="rounded-sm">
              <PiggyBank className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Finances</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[180px]" />
                ))}
              </div>
            ) : (
              <UnifiedPerformanceMetrics data={dashboardData} userType="agent" />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Pending Applications</CardTitle>
                  <CardDescription>Applications awaiting your review</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {(applications ?? []).filter(app => app.status === 'pending').length > 0 ? (
                        <div className="space-y-3">
                          {(applications ?? [])
                            .filter(app => app.status === 'pending')
                            .slice(0, 5)
                            .map(application => (
                              <div 
                                key={application.id} 
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="font-medium">Application #{application.id}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {getPropertyAddressById(application.propertyId)} • 
                                    Move-in: {new Date(application.moveInDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleApproveApplication(application.id)}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline">View Details</Button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No Pending Applications</h3>
                          <p className="text-muted-foreground">All applications have been processed.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 flex justify-center">
                  <Button variant="link">View All Applications</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Issues</CardTitle>
                  <CardDescription>Recent maintenance requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {(maintenanceRequests ?? []).filter(req => req.status === 'pending').length > 0 ? (
                        <div className="space-y-3">
                          {(maintenanceRequests ?? [])
                            .filter(req => req.status === 'pending')
                            .slice(0, 3)
                            .map(request => (
                              <div 
                                key={request.id} 
                                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="font-medium">{request.title}</span>
                                  </div>
                                  <div className="text-sm font-medium">{request.priority}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-muted-foreground">
                                    {getPropertyAddressById(request.propertyId)}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      // This would typically open a modal for contractor selection
                                      const contractorId = contractors && contractors.length > 0 ? contractors[0].id : null;
                                      if (contractorId) {
                                        handleAssignContractor(request.id, contractorId);
                                      } else {
                                        toast({
                                          title: "No Contractors Available",
                                          description: "Please add contractors before assigning maintenance tasks.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    Assign Contractor
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Wrench className="h-10 w-10 text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No Pending Issues</h3>
                          <p className="text-muted-foreground">All maintenance issues have been addressed.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 flex justify-center">
                  <Button variant="link">View All Maintenance</Button>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickInfoCard 
                title="Property Occupancy" 
                value={`${stats.propertyOccupancyRate.toFixed(0)}%`}
                icon={<PieChart className="h-5 w-5" />} 
                description="Properties under management"
                color="bg-blue-100"
                textColor="text-blue-700"
              />
              <QuickInfoCard 
                title="Upcoming Viewings" 
                value={stats.upcomingViewings} 
                icon={<CalendarDays className="h-5 w-5" />} 
                description="Scheduled in the next week"
                color="bg-purple-100"
                textColor="text-purple-700"
              />
              <QuickInfoCard 
                title="Commission" 
                value={`£${stats.totalCommission.toLocaleString()}`} 
                icon={<Percent className="h-5 w-5" />} 
                description="Earnings this month"
                color="bg-green-100"
                textColor="text-green-700"
              />
              <QuickInfoCard 
                title="Compliance Score" 
                value={`${stats.complianceScore}%`} 
                icon={<Shield className="h-5 w-5" />} 
                description="Overall regulatory compliance"
                color="bg-amber-100"
                textColor="text-amber-700"
              />
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            {isLoading ? (
              <Skeleton className="h-[500px] w-full" />
            ) : (
              <EnhancedPropertyManager
                properties={(properties || []) as any}
                onViewProperty={(id) => console.log('View property', id)}
                onEditProperty={handleEditProperty}
                onCreateProperty={() => console.log('Create property')}
              />
            )}
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
                <CardDescription>View and manage your tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Tenants Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Application Management</CardTitle>
                <CardDescription>Manage tenant applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Applications Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Management</CardTitle>
                <CardDescription>Manage maintenance requests and property repairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Maintenance Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Dashboard</CardTitle>
                <CardDescription>Track and manage your regulatory compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Compliance Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contractors">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Management</CardTitle>
                <CardDescription>Manage your contractor network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Contractors Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar & Appointments</CardTitle>
                <CardDescription>Schedule and manage property viewings and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Calendar Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances">
            <Card>
              <CardHeader>
                <CardTitle>Financial Management</CardTitle>
                <CardDescription>Track rents, commissions, and financial documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Finances Tab Content</h3>
                  <p className="text-muted-foreground mt-2">This tab is under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
  
  // Helper function to get property address by ID
  function getPropertyAddressById(propertyId: number): string {
    if (!properties) return 'Unknown property';
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.address : 'Unknown property';
  }
}

interface QuickInfoCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color: string;
  textColor: string;
}

function QuickInfoCard({ title, value, icon, description, color, textColor }: QuickInfoCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`${color} ${textColor} p-3 rounded-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}