import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import Marketing from './agent/Marketing';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity,
  AlertTriangle,
  BarChart4,
  Building,
  Calendar,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessagesSquare,
  PlusCircle,
  Settings,
  Shield,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wrench
} from "lucide-react";

// Import new components
import PropertyComplianceTracker from '@/components/agent/PropertyComplianceTracker';
import LandlordManagement from '@/components/agent/LandlordManagement';
import MaintenanceManager from '@/components/agent/MaintenanceManager';



export default function EnhancedAgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Determine the correct back navigation path based on current context
  const getBackPath = () => {
    // If we're in a demo context, go back to home
    if (location.includes('demo') || !user) {
      return '/';
    }
    // Otherwise go to main agent dashboard
    return '/dashboard/agent';
  };
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'social_media',
    budget: '',
    targetAudience: '',
    description: ''
  });
  const [accountSettings, setAccountSettings] = useState({
    email: '',
    emailPassword: '',
    instagramHandle: '',
    instagramToken: '',
    facebookPageId: '',
    facebookToken: '',
    twitterHandle: '',
    twitterToken: '',
    linkedinHandle: '',
    linkedinToken: ''
  });
  
  // Fetch properties managed by the agent
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent').then(res => res.json()),
  });
  
  // Fetch tenancies managed by the agent
  const { data: tenancies = [], isLoading: isLoadingTenancies } = useQuery({
    queryKey: ['/api/tenancies/agent'],
    queryFn: () => apiRequest('GET', '/api/tenancies/agent').then(res => res.json()),
  });
  
  // Fetch applications managed by the agent
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/applications/agent'],
    queryFn: () => apiRequest('GET', '/api/applications/agent').then(res => res.json()),
  });
  
  // Fetch landlords managed by the agent
  const { data: landlords = [], isLoading: isLoadingLandlords } = useQuery({
    queryKey: ['/api/landlords/agent'],
    queryFn: () => apiRequest('GET', '/api/landlords/agent').then(res => res.json()),
  });
  
  // Fetch contractors
  const { data: contractors = [], isLoading: isLoadingContractors } = useQuery({
    queryKey: ['/api/contractors/agent'],
    queryFn: () => apiRequest('GET', '/api/contractors/agent').then(res => res.json()),
  });
  
  // Fetch maintenance requests
  const { data: maintenanceRequests = [], isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['/api/maintenance-requests/agent'],
    queryFn: () => apiRequest('GET', '/api/maintenance-requests/agent').then(res => {
      console.log('Maintenance request response:', res);
      return res.json();
    }),
  });
  
  // Property compliance update mutation
  const updatePropertyComplianceMutation = useMutation({
    mutationFn: ({ propertyId, complianceType, data }: { propertyId: number, complianceType: string, data: any }) => {
      return apiRequest('PATCH', `/api/properties/agent/${propertyId}/compliance/${complianceType}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      toast({
        title: "Property compliance updated",
        description: "The property compliance information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update property compliance. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Landlord management mutations
  const addLandlordMutation = useMutation({
    mutationFn: (landlordData: any) => {
      return apiRequest('POST', '/api/landlords/agent', landlordData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/landlords/agent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add landlord",
        description: error.message || "There was an error adding the landlord. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const updateLandlordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => {
      return apiRequest('PATCH', `/api/landlords/agent/${id}`, data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/landlords/agent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update landlord",
        description: error.message || "There was an error updating the landlord. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Maintenance management mutations
  const createMaintenanceRequestMutation = useMutation({
    mutationFn: (requestData: any) => {
      return apiRequest('POST', '/api/maintenance-requests/agent', requestData).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/agent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create maintenance request",
        description: error.message || "There was an error creating the maintenance request. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const updateMaintenanceRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => {
      return apiRequest('PATCH', `/api/maintenance-requests/agent/${id}`, data).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/agent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update maintenance request",
        description: error.message || "There was an error updating the maintenance request. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const assignContractorMutation = useMutation({
    mutationFn: ({ requestId, contractorId }: { requestId: number, contractorId: number }) => {
      return apiRequest('POST', `/api/maintenance-requests/agent/${requestId}/assign`, { contractorId }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests/agent'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign contractor",
        description: error.message || "There was an error assigning the contractor. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Campaign creation handlers
  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
  };

  const handleCampaignSubmit = async () => {
    if (!campaignForm.name || !campaignForm.budget || !campaignForm.targetAudience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create real campaign via API
      const response = await apiRequest('POST', '/api/marketing/campaigns/create', {
        name: campaignForm.name,
        type: campaignForm.type,
        budget: parseFloat(campaignForm.budget),
        targetAudience: campaignForm.targetAudience,
        description: campaignForm.description,
        properties: properties.map((p: any) => p.id) // Include all agent properties
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Real Campaign Created",
          description: `${campaignForm.name} is now live and posting to connected accounts`,
        });
        
        // Refresh campaign data
        queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error: any) {
      toast({
        title: "Campaign Creation Failed",
        description: error.message || "Please connect your social media accounts first",
        variant: "destructive",
      });
    }

    // Reset form and close dialog
    setCampaignForm({
      name: '',
      type: 'social_media',
      budget: '',
      targetAudience: '',
      description: ''
    });
    setShowCreateCampaign(false);
  };

  const handleAccountSettings = () => {
    setShowAccountSettings(true);
  };

  const handleSaveAccountSettings = async () => {
    try {
      const response = await apiRequest('POST', '/api/marketing/accounts/save', accountSettings);
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Accounts Connected Successfully",
          description: `${result.totalConnected} accounts connected and ready for campaigns`,
        });
        
        console.log('Account settings saved:', result);
      } else {
        throw new Error('Failed to save account settings');
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to save account settings. Please try again.",
        variant: "destructive",
      });
    }
    
    setShowAccountSettings(false);
  };
  
  // Calculate dashboard statistics
  const propertiesArray = Array.isArray(properties) ? properties : [];
  const totalProperties = propertiesArray.length;
  const occupiedProperties = propertiesArray.filter((p: any) => !p.available).length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;
  
  const contractorsArray = Array.isArray(contractors) ? contractors : [];
  const landlordsArray = Array.isArray(landlords) ? landlords : [];
  
  const applicationsArray = Array.isArray(applications) ? applications : [];
  const currentApplications = applicationsArray.filter((a: any) => a.status === 'pending').length;
  const upcomingInspections = 3; // This would be fetched from a real API
  
  const tenanciesArray = Array.isArray(tenancies) ? tenancies : [];
  const totalRentDue = tenanciesArray.reduce((total: number, tenancy: any) => {
    return total + (parseFloat(tenancy.rentAmount) || 0);
  }, 0);
  
  const complianceIssues = propertiesArray.filter((p: any) => {
    // Check for expired certificates
    const hasExpiredEPC = p.epcExpiryDate && new Date(p.epcExpiryDate) < new Date();
    const hasExpiredGas = p.gasCheckExpiryDate && new Date(p.gasCheckExpiryDate) < new Date();
    const hasExpiredElectrical = p.electricalCheckExpiryDate && new Date(p.electricalCheckExpiryDate) < new Date();
    const hasExpiredHMO = p.hmoLicenseExpiryDate && new Date(p.hmoLicenseExpiryDate) < new Date();
    
    return hasExpiredEPC || hasExpiredGas || hasExpiredElectrical || hasExpiredHMO;
  }).length;
  
  const maintenanceRequestsArray = Array.isArray(maintenanceRequests) ? maintenanceRequests : [];
  const maintenanceIssues = maintenanceRequestsArray.filter((m: any) => m.status !== 'completed' && m.status !== 'cancelled').length;
  
  // Event handlers
  const handleUpdatePropertyCompliance = (propertyId: number, complianceType: string, data: any) => {
    updatePropertyComplianceMutation.mutate({ propertyId, complianceType, data });
  };
  
  const handleAddLandlord = (landlordData: any) => {
    addLandlordMutation.mutate(landlordData);
  };
  
  const handleUpdateLandlord = (id: number, landlordData: any) => {
    updateLandlordMutation.mutate({ id, data: landlordData });
  };
  
  const handleCreateMaintenanceRequest = (requestData: any) => {
    createMaintenanceRequestMutation.mutate(requestData);
  };
  
  const handleUpdateMaintenanceRequest = (id: number, requestData: any) => {
    updateMaintenanceRequestMutation.mutate({ id, data: requestData });
  };
  
  const handleAssignContractor = (requestId: number, contractorId: number) => {
    assignContractorMutation.mutate({ requestId, contractorId });
  };
  
  if (isLoadingProperties || isLoadingTenancies || isLoadingApplications || isLoadingLandlords) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-center h-[600px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  const selectedPropertyData = propertiesArray.find((p: any) => p.id === selectedProperty);
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-muted-foreground">Complete property management with advanced tools and zero-cost AI marketing</p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 w-full h-auto">
          <TabsTrigger value="overview" className="text-xs">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="text-xs">
            <Building className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Properties</span>
          </TabsTrigger>
          <TabsTrigger value="landlords" className="text-xs">
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Landlords</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs">
            <ClipboardList className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="tenants" className="text-xs">
            <UserCheck className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Tenants</span>
          </TabsTrigger>
          <TabsTrigger value="tenancies" className="text-xs">
            <FileText className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Tenancies</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs">
            <Wrench className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="text-xs">
            <Megaphone className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline-block">Compliance</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  Property Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">{totalProperties} Properties</div>
                <div className="text-xs text-muted-foreground">
                  {occupiedProperties} occupied ({occupancyRate}% occupancy rate)
                </div>
                <div className="mt-4 text-xs flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>{propertiesArray.filter((p: any) => p.available).length} available for let</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-2xl font-bold">£{totalRentDue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Monthly rental income
                </div>
                <div className="mt-4 text-xs flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  <span>2 rent payments due this week</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <MessagesSquare className="h-3 w-3 mr-2 text-blue-500" />
                      <span>Applications to Review</span>
                    </div>
                    <Badge variant="outline">{currentApplications}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-2 text-red-500" />
                      <span>Compliance Issues</span>
                    </div>
                    <Badge variant="outline">{complianceIssues}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Wrench className="h-3 w-3 mr-2 text-amber-500" />
                      <span>Maintenance Issues</span>
                    </div>
                    <Badge variant="outline">{maintenanceIssues}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <CalendarClock className="h-3 w-3 mr-2 text-indigo-500" />
                      <span>Upcoming Inspections</span>
                    </div>
                    <Badge variant="outline">{upcomingInspections}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest property applications</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsArray.slice(0, 5).map((application: any) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.property?.address || 'Unknown'}</TableCell>
                        <TableCell>{application.tenant?.name || 'Unknown'}</TableCell>
                        <TableCell>{application.createdAt ? format(new Date(application.createdAt), 'dd/MM/yyyy') : 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={application.status === 'approved' ? 'default' : 
                              application.status === 'rejected' ? 'destructive' : 'outline'}
                          >
                            {application.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {applicationsArray.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No applications found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => setActiveTab('applications')}>
                  View All Applications
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Tasks that need your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Property Inspection</div>
                          <div className="text-sm text-muted-foreground">15 Oak Road - Quarterly Check</div>
                        </div>
                      </div>
                      <Badge>Tomorrow</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        <div>
                          <div className="font-medium">Gas Safety Certificate Renewal</div>
                          <div className="text-sm text-muted-foreground">42 Student Avenue - Expires in 8 days</div>
                        </div>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                        <div>
                          <div className="font-medium">Boiler Maintenance</div>
                          <div className="text-sm text-muted-foreground">18 University Road - Scheduled</div>
                        </div>
                      </div>
                      <Badge>Next Week</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <div>
                          <div className="font-medium">Tenant Check-in</div>
                          <div className="text-sm text-muted-foreground">28 Park Place - New Tenancy</div>
                        </div>
                      </div>
                      <Badge>Next Week</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto">
                  View All Tasks
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Property Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage your property portfolio with comprehensive tools
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('overview')}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search properties..."
              className="max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">All Properties</Button>
              <Button variant="outline" size="sm">Available</Button>
              <Button variant="outline" size="sm">Occupied</Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="ml-2">Filters</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {propertiesArray.map((property: any) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {property.images && property.images[0] ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Home className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={property.available ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {property.available ? 'Available' : 'Occupied'}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span className="line-clamp-1">{property.address}</span>
                  </div>
                  
                  <div className="flex gap-2 text-sm mb-3">
                    <div className="bg-muted rounded-md px-2 py-1">
                      {property.bedrooms} bed
                    </div>
                    <div className="bg-muted rounded-md px-2 py-1">
                      {property.bathrooms} bath
                    </div>
                    <div className="bg-muted rounded-md px-2 py-1">
                      £{property.price}/mo
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {property.billsIncluded && (
                      <Badge variant="outline" className="text-xs">Bills Inc.</Badge>
                    )}
                    {property.furnished && (
                      <Badge variant="outline" className="text-xs">Furnished</Badge>
                    )}
                    {property.hmoLicensed && (
                      <Badge variant="outline" className="text-xs">HMO</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedProperty(property.id);
                        setActiveTab('compliance');
                      }}
                    >
                      Compliance
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Property Details",
                          description: `Viewing details for ${property.title}`,
                        });
                      }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {propertiesArray.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Building className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No properties found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add your first property to get started
                </p>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Landlords Tab */}
        <TabsContent value="landlords">
          <LandlordManagement 
            landlords={landlordsArray}
            onAddLandlord={handleAddLandlord}
            onUpdateLandlord={handleUpdateLandlord}
          />
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Property Applications</h2>
              <p className="text-sm text-muted-foreground">
                Manage and process tenant applications
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search applications..."
              className="max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="outline" size="sm">Pending</Button>
              <Button variant="outline" size="sm">Approved</Button>
              <Button variant="outline" size="sm">Rejected</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {applicationsArray.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No applications found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  When tenants apply for your properties, they'll appear here
                </p>
              </div>
            ) : (
              applicationsArray.map((application: any) => (
                <Card key={application.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">Application for {application.property?.address || 'Unknown property'}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{application.tenant?.name || 'Unknown tenant'}</span>
                          </div>
                        </div>
                        <Badge
                          variant={application.status === 'approved' ? 'default' : 
                            application.status === 'rejected' ? 'destructive' : 'outline'}
                        >
                          {application.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 text-xs text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Applied: {application.createdAt ? format(new Date(application.createdAt), 'dd MMM yyyy') : 'Unknown'}</span>
                        </div>
                        {application.moveInDate && (
                          <div className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            <span>Move in: {format(new Date(application.moveInDate), 'dd MMM yyyy')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          <span>{application.property?.bedrooms || '?'} bed, £{application.property?.price || '?'}/mo</span>
                        </div>
                      </div>
                      
                      {application.message && (
                        <div className="mt-3 text-sm bg-muted/30 p-2 rounded">
                          <div className="font-medium text-xs mb-1">Message from applicant:</div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{application.message}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted/30 p-4 flex flex-row md:flex-col items-center justify-end gap-2 md:w-[140px]">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Application Details",
                            description: `Viewing details for ${application.tenant?.name || 'applicant'}`,
                          });
                        }}
                      >
                        View Details
                      </Button>
                      
                      {application.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              toast({
                                title: "Application Approved",
                                description: `${application.tenant?.name || 'Applicant'}'s application has been approved`,
                              });
                            }}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              toast({
                                title: "Application Rejected",
                                description: `${application.tenant?.name || 'Applicant'}'s application has been rejected`,
                              });
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Tenant Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage tenants for your properties
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          
          <div className="space-y-4">
            {tenanciesArray.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tenants found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any active tenants at the moment
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenanciesArray.map((tenancy: any) => (
                  <Card key={tenancy.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{tenancy.tenant?.name || 'Unknown Tenant'}</h4>
                          <p className="text-xs text-muted-foreground">{tenancy.tenant?.email || 'No email'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Property:</span>
                          <span className="font-medium">{tenancy.property?.title || 'Property'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rent:</span>
                          <span className="font-medium">£{tenancy.rentAmount || 0}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={tenancy.active ? "default" : "secondary"}>
                            {tenancy.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            toast({
                              title: "Tenant Details",
                              description: `Viewing details for ${tenancy.tenant?.name || 'tenant'}`,
                            });
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Contact Tenant",
                              description: `Contacting ${tenancy.tenant?.name || 'tenant'}`,
                            });
                          }}
                        >
                          <MessagesSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Tenancies Tab */}
        <TabsContent value="tenancies" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Tenancy Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage tenancies for your properties
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          
          <div className="space-y-4">
            {tenanciesArray.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tenancies found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any tenancy agreements at the moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenanciesArray.map((tenancy: any) => (
                  <Card key={tenancy.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{tenancy.property?.title || 'Property'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Tenant: {tenancy.tenant?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={tenancy.active ? "default" : "secondary"}>
                          {tenancy.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Start Date</span>
                          <span className="font-medium">
                            {tenancy.startDate ? format(new Date(tenancy.startDate), 'dd MMM yyyy') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">End Date</span>
                          <span className="font-medium">
                            {tenancy.endDate ? format(new Date(tenancy.endDate), 'dd MMM yyyy') : 'Ongoing'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Rent Amount</span>
                          <span className="font-medium">£{tenancy.rentAmount || 0}/mo</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Deposit</span>
                          <span className="font-medium">£{tenancy.depositAmount || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Tenancy Details",
                              description: `Viewing details for ${tenancy.property?.title || 'tenancy'}`,
                            });
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Documents",
                              description: `Opening documents for ${tenancy.property?.title || 'tenancy'}`,
                            });
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Documents
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <MaintenanceManager 
            maintenanceRequests={maintenanceRequestsArray}
            properties={propertiesArray}
            contractors={contractorsArray}
            onCreateMaintenanceRequest={handleCreateMaintenanceRequest}
            onUpdateMaintenanceRequest={handleUpdateMaintenanceRequest}
            onAssignContractor={handleAssignContractor}
          />
        </TabsContent>
        
        {/* Marketing Tab - Full Featured with AI Generator */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Marketing</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered marketing campaigns with zero-cost generation
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          
          {/* AI-Powered Marketing Dashboard with Zero-Cost Generator */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI Marketing Generator Loaded</h3>
              </div>
              <p className="text-sm text-blue-700">
                Zero-cost AI marketing tools now active. Saves £33,600-99,600 annually vs traditional agencies.
              </p>
            </div>
            <Marketing key={`marketing-${Date.now()}`} />
          </div>
        </TabsContent>
        
        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Property Compliance</h2>
              <p className="text-sm text-muted-foreground">
                Ensure your properties meet all legal requirements
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </div>
          
          {selectedPropertyData ? (
            <PropertyComplianceTracker 
              property={selectedPropertyData}
              onUpdateCompliance={handleUpdatePropertyCompliance}
            />
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-medium">Select a property to view compliance details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {propertiesArray.map((property: any) => (
                  <Card 
                    key={property.id} 
                    className={`cursor-pointer transition-colors ${selectedProperty === property.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedProperty(property.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-muted rounded-full p-2">
                        <Home className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{property.address}</h4>
                        <p className="text-xs text-muted-foreground">{property.bedrooms} bed, {property.bathrooms} bath</p>
                      </div>
                      <div>
                        {(property.epcExpiryDate && new Date(property.epcExpiryDate) < new Date()) ||
                         (property.gasCheckExpiryDate && new Date(property.gasCheckExpiryDate) < new Date()) ||
                         (property.electricalCheckExpiryDate && new Date(property.electricalCheckExpiryDate) < new Date()) ? (
                          <Badge variant="destructive">Issues</Badge>
                        ) : (
                          <Badge variant="outline">Select</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Creation Dialog */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new marketing campaign for your properties
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter campaign name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Campaign Type</Label>
              <Select
                value={campaignForm.type}
                onValueChange={(value) => setCampaignForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="property_listing">Property Listing</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget (£)</Label>
              <Input
                id="budget"
                type="number"
                value={campaignForm.budget}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="Enter budget amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={campaignForm.targetAudience}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="e.g., University students, Young professionals"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={campaignForm.description}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your campaign goals and content"
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateCampaign(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCampaignSubmit}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Settings Dialog */}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect Your Accounts</DialogTitle>
            <DialogDescription>
              Connect your email and social media accounts to enable campaign distribution
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Email Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MessagesSquare className="h-4 w-4 text-blue-600" />
                </div>
                Email Marketing
              </h4>
              <div className="bg-blue-50 p-3 rounded-lg mb-3">
                <p className="text-sm text-blue-700">
                  <strong>How to get credentials:</strong> Use your existing email account. For Gmail, create an App Password in your Google Account settings under Security.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountSettings.email}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.business@gmail.com"
                  />
                  <p className="text-xs text-gray-500">Use your business email for professional campaigns</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailPassword">App Password</Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={accountSettings.emailPassword}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, emailPassword: e.target.value }))}
                    placeholder="16-character app password"
                  />
                  <p className="text-xs text-gray-500">Generated from your email provider's security settings</p>
                </div>
              </div>
            </div>

            {/* Instagram Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <div className="bg-pink-100 p-2 rounded-full">
                  <div className="h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm"></div>
                </div>
                Instagram Business Account
              </h4>
              <div className="bg-pink-50 p-3 rounded-lg mb-3">
                <p className="text-sm text-pink-700">
                  <strong>How to get credentials:</strong> Convert your Instagram to a Business account, then go to Facebook Developers to create an app and get access tokens for the Instagram Basic Display API.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagramHandle">Business Username</Label>
                  <Input
                    id="instagramHandle"
                    value={accountSettings.instagramHandle}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, instagramHandle: e.target.value }))}
                    placeholder="@your_property_business"
                  />
                  <p className="text-xs text-gray-500">Your Instagram business account handle</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramToken">Access Token</Label>
                  <Input
                    id="instagramToken"
                    type="password"
                    value={accountSettings.instagramToken}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, instagramToken: e.target.value }))}
                    placeholder="Access token from Facebook Developers"
                  />
                  <p className="text-xs text-gray-500">Get this from your Facebook Developer app</p>
                </div>
              </div>
            </div>

            {/* Facebook Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <div className="h-4 w-4 bg-blue-600 rounded-sm"></div>
                </div>
                Facebook
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebookPageId">Page ID</Label>
                  <Input
                    id="facebookPageId"
                    value={accountSettings.facebookPageId}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, facebookPageId: e.target.value }))}
                    placeholder="Your Facebook Page ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookToken">Page Access Token</Label>
                  <Input
                    id="facebookToken"
                    type="password"
                    value={accountSettings.facebookToken}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, facebookToken: e.target.value }))}
                    placeholder="Page access token"
                  />
                </div>
              </div>
            </div>

            {/* Twitter Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <div className="bg-sky-100 p-2 rounded-full">
                  <div className="h-4 w-4 bg-sky-500 rounded-sm"></div>
                </div>
                Twitter/X
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterHandle">Username</Label>
                  <Input
                    id="twitterHandle"
                    value={accountSettings.twitterHandle}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, twitterHandle: e.target.value }))}
                    placeholder="@yourusername"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterToken">API Bearer Token</Label>
                  <Input
                    id="twitterToken"
                    type="password"
                    value={accountSettings.twitterToken}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, twitterToken: e.target.value }))}
                    placeholder="Bearer token from Twitter API"
                  />
                </div>
              </div>
            </div>

            {/* LinkedIn Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <div className="h-4 w-4 bg-blue-700 rounded-sm"></div>
                </div>
                LinkedIn
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinHandle">Company Page</Label>
                  <Input
                    id="linkedinHandle"
                    value={accountSettings.linkedinHandle}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, linkedinHandle: e.target.value }))}
                    placeholder="Your company page URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinToken">Access Token</Label>
                  <Input
                    id="linkedinToken"
                    type="password"
                    value={accountSettings.linkedinToken}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, linkedinToken: e.target.value }))}
                    placeholder="LinkedIn API access token"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Your account credentials are stored securely and encrypted. 
                These connections enable automatic posting when you create campaigns. 
                You can disconnect accounts anytime.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAccountSettings(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAccountSettings}>
              Save & Connect Accounts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}