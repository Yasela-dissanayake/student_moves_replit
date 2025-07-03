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
  Percent,
  Check,
  Settings
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import UnifiedPerformanceMetrics from '@/components/dashboard/UnifiedPerformanceMetrics';
import EnhancedPropertyManager from '@/components/dashboard/EnhancedPropertyManager';

export default function ImprovedLandlordDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch all necessary data
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties/landlord'],
    staleTime: 60000,
  });

  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({
    queryKey: ['/api/tenancies/landlord'],
    staleTime: 60000,
  });

  const { data: maintenanceRequests, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/maintenance-requests/landlord'],
    staleTime: 60000,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/applications/landlord'],
    staleTime: 60000,
  });

  const { data: calendarEvents, isLoading: calendarLoading } = useQuery({
    queryKey: ['/api/calendar-events/landlord'],
    staleTime: 60000,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments/landlord'],
    staleTime: 60000,
  });

  const { data: compliance, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/compliance/landlord'],
    staleTime: 60000,
  });

  const { data: depositCredentials, isLoading: depositCredentialsLoading } = useQuery({
    queryKey: ['/api/deposit-scheme-credentials/landlord'],
    staleTime: 60000,
  });

  // Mutations for property management
  const editPropertyMutation = useMutation({
    mutationFn: (data: { id: number, property: any }) => {
      return apiRequest('PATCH', `/api/properties/${data.id}`, data.property);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/landlord'] });
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
      return apiRequest('DELETE', `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/landlord'] });
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
      return apiRequest('PATCH', `/api/properties/${data.id}/availability`, { available: data.available });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/landlord'] });
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
      return apiRequest('PATCH', `/api/properties/${data.id}/featured`, { featured: data.featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/landlord'] });
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

  // Mutations for maintenance requests
  const approveLandlordMaintenanceMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('PATCH', `/api/maintenance-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/landlord'] });
      toast({
        title: "Maintenance Request Approved",
        description: "Maintenance request has been approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve maintenance request",
        description: error.message || "An error occurred while approving the maintenance request.",
        variant: "destructive",
      });
    }
  });

  // Mutations for deposit protection
  const registerDepositMutation = useMutation({
    mutationFn: (data: { tenancyId: number, schemeId: number }) => {
      return apiRequest('POST', `/api/deposit-protection/register`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenancies/landlord'] });
      toast({
        title: "Deposit Registered",
        description: "Deposit has been successfully registered with the protection scheme.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to register deposit",
        description: error.message || "An error occurred while registering the deposit.",
        variant: "destructive",
      });
    }
  });

  // Combined loading state
  const isLoading = propertiesLoading || tenanciesLoading || maintenanceLoading || 
                   applicationsLoading || calendarLoading || paymentsLoading || 
                   complianceLoading || depositCredentialsLoading;

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

  const handleApproveMaintenanceRequest = (id: number) => {
    if (window.confirm("Are you sure you want to approve this maintenance request? This will authorize the work to be carried out.")) {
      approveLandlordMaintenanceMutation.mutate(id);
    }
  };

  const handleRegisterDeposit = (tenancyId: number, schemeId: number) => {
    if (window.confirm("Are you sure you want to register this deposit with the protection scheme?")) {
      registerDepositMutation.mutate({ tenancyId, schemeId });
    }
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
  const stats = {
    totalProperties: properties?.length || 0,
    availableProperties: properties?.filter(property => property.available).length || 0,
    pendingApplications: applications?.filter(application => application.status === 'pending').length || 0,
    activeRentals: tenancies?.filter(tenancy => tenancy.active).length || 0,
    pendingMaintenance: maintenanceRequests?.filter(request => request.status === 'pending' || request.status === 'in-progress').length || 0,
    upcomingViewings: calendarEvents?.filter(event => event.type === 'viewing' && new Date(event.startDate) > new Date()).length || 0,
    totalRentCollected: payments?.filter(p => p.status === 'paid').reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0,
    complianceScore: compliance?.overallScore || 0,
    protectedDeposits: tenancies?.filter(tenancy => tenancy.depositProtectionId).length || 0,
    unprotectedDeposits: tenancies?.filter(tenancy => tenancy.active && !tenancy.depositProtectionId).length || 0,
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Helmet>
        <title>Landlord Dashboard | UniRent</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Landlord Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your properties today.
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
          <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 w-full bg-muted rounded-md p-1">
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
            <TabsTrigger value="maintenance" className="rounded-sm">
              <Wrench className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-sm">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="rounded-sm">
              <PiggyBank className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Finances</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-sm">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Settings</span>
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
              <UnifiedPerformanceMetrics data={dashboardData} userType="landlord" />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Maintenance Requiring Approval</CardTitle>
                  <CardDescription>Maintenance requests awaiting your approval</CardDescription>
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
                      {maintenanceRequests?.filter(req => 
                        req.requiresLandlordApproval && !req.landlordApproved
                      ).length > 0 ? (
                        <div className="space-y-3">
                          {maintenanceRequests
                            ?.filter(req => req.requiresLandlordApproval && !req.landlordApproved)
                            .slice(0, 5)
                            .map(request => (
                              <div 
                                key={request.id} 
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="font-medium">{request.title}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {getPropertyAddressById(request.propertyId)} • 
                                    Est. Cost: £{request.estimatedCost}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleApproveMaintenanceRequest(request.id)}>
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
                          <Wrench className="h-10 w-10 text-muted-foreground mb-2" />
                          <h3 className="text-lg font-medium">No Pending Approvals</h3>
                          <p className="text-muted-foreground">All maintenance requests have been addressed.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 flex justify-center">
                  <Button variant="link">View All Maintenance Requests</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Deposit Protection</CardTitle>
                  <CardDescription>Unprotected tenant deposits</CardDescription>
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
                      {stats.unprotectedDeposits > 0 ? (
                        <div className="space-y-3">
                          {tenancies
                            ?.filter(tenancy => tenancy.active && !tenancy.depositProtectionId)
                            .slice(0, 3)
                            .map(tenancy => (
                              <div 
                                key={tenancy.id} 
                                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="font-medium">{getPropertyAddressById(tenancy.propertyId)}</span>
                                  </div>
                                  <div className="text-sm font-medium">£{tenancy.depositAmount}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-muted-foreground">
                                    Tenancy start: {new Date(tenancy.startDate).toLocaleDateString()}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      const defaultSchemeId = depositCredentials?.find(c => c.isDefault)?.id || 
                                                             (depositCredentials && depositCredentials.length > 0 ? 
                                                              depositCredentials[0].id : 0);
                                      if (defaultSchemeId) {
                                        handleRegisterDeposit(tenancy.id, defaultSchemeId);
                                      } else {
                                        toast({
                                          title: "No Deposit Scheme Found",
                                          description: "Please set up your deposit protection scheme credentials first.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    <Shield className="h-4 w-4 mr-1" />
                                    Register
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Shield className="h-10 w-10 text-green-500 mb-2" />
                          <h3 className="text-lg font-medium">All Deposits Protected</h3>
                          <p className="text-muted-foreground">You're in compliance with UK deposit protection laws.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 flex justify-center">
                  <Button variant="link">View All Tenancies</Button>
                </CardFooter>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickInfoCard 
                title="Tenant Applications" 
                value={stats.pendingApplications}
                icon={<FileText className="h-5 w-5" />} 
                description="Waiting your review"
                color="bg-purple-100"
                textColor="text-purple-700"
              />
              <QuickInfoCard 
                title="Active Tenancies" 
                value={stats.activeRentals} 
                icon={<Users className="h-5 w-5" />} 
                description="Currently rented properties"
                color="bg-blue-100"
                textColor="text-blue-700"
              />
              <QuickInfoCard 
                title="Compliance Score" 
                value={`${stats.complianceScore}%`} 
                icon={<Shield className="h-5 w-5" />} 
                description="Overall regulatory compliance"
                color="bg-green-100"
                textColor="text-green-700"
              />
              <QuickInfoCard 
                title="Rental Income" 
                value={`£${stats.totalRentCollected.toLocaleString()}`} 
                icon={<Percent className="h-5 w-5" />} 
                description="Total collected this month"
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
                properties={properties || []}
                onEditProperty={handleEditProperty}
                onDeleteProperty={handleDeleteProperty}
                onToggleAvailability={handleToggleAvailability}
                onToggleFeatured={handleToggleFeatured}
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
                <CardDescription>Track rents, expenses, and financial documents</CardDescription>
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Settings Tab Content</h3>
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
  function getPropertyAddressById(propertyId: number) {
    const property = properties?.find(p => p.id === propertyId);
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