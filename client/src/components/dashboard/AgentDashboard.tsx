import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyType, TenancyType, ApplicationType, UserType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  Users, 
  FileText, 
  Briefcase,
  DollarSign, 
  PlusCircle, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  Database,
  UserCheck,
  BarChart,
  Key
} from "lucide-react";
import TenantRiskAssessment from "../shared/TenantRiskAssessment";
import PropertyKeyManagementSection from "./PropertyKeyManagementSection";

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get agent properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<PropertyType[]>({
    queryKey: ['/api/properties'],
  });

  // Get applications for agent properties
  const { data: applications, isLoading: isLoadingApplications } = useQuery<ApplicationType[]>({
    queryKey: ['/api/applications'],
  });

  // Get tenancies for agent properties
  const { data: tenancies, isLoading: isLoadingTenancies } = useQuery<TenancyType[]>({
    queryKey: ['/api/tenancies'],
  });
  
  // Stats for the dashboard
  const totalProperties = properties?.length || 0;
  const availableProperties = properties?.filter(p => p.available).length || 0;
  const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0;
  const activeTenancies = tenancies?.filter(t => t.active).length || 0;

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate description with AI
  const handleGenerateDescription = async (propertyId: number) => {
    try {
      toast({
        title: "Generating description",
        description: "Please wait while we generate a description for your property",
      });
      
      // In a real implementation, this would call the API
      setTimeout(() => {
        toast({
          title: "Description generated",
          description: "The property description has been updated successfully"
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Properties</p>
                <h3 className="text-2xl font-bold">{totalProperties}</h3>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Home className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Tenancies</p>
                <h3 className="text-2xl font-bold">{activeTenancies}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                <h3 className="text-2xl font-bold">{pendingApplications}</h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">HMO Properties</p>
                <h3 className="text-2xl font-bold">{properties?.filter(p => p.bedrooms >= 3).length || 0}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/add-property">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Property
          </Button>
        </Link>
        
        <Link href="/dashboard/applications">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Manage Applications
          </Button>
        </Link>
        
        <Link href="/dashboard/hmo-compliance">
          <Button variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            HMO Compliance
          </Button>
        </Link>
        
        <Link href="/dashboard/landlords">
          <Button variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            Manage Landlords
          </Button>
        </Link>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <div className="mb-6 overflow-x-auto">
          <TabsList className="flex w-max md:w-full md:grid md:grid-cols-6">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="landlords">Landlords</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Managed Properties</h2>
            <Link href="/dashboard/add-property">
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </Link>
          </div>
          
          {isLoadingProperties ? (
            <div className="text-center py-8">Loading properties...</div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(property => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="relative pb-[60%]">
                    <img 
                      src={property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80'} 
                      alt={property.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg font-medium">
                      £{Number(property.price).toFixed(0)} pw
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <Badge variant={property.available ? "outline" : "secondary"}>
                        {property.available ? "Available" : "Rented"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {property.address}, {property.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-sm capitalize">
                        {property.propertyType}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {applications && (
                        <p>{applications.filter(a => a.propertyId === property.id && a.status === 'pending').length} pending applications</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <div className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleGenerateDescription(property.id)}
                      >
                        AI Description
                      </Button>
                    </div>
                    <Link href={`/dashboard/properties/${property.id}/edit`} className="flex-1">
                      <Button variant="default" className="w-full">Manage</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="mb-4">You haven't added any properties yet.</p>
                <Link href="/dashboard/add-property">
                  <Button>Add Your First Property</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="applications" className="space-y-4">
          <h2 className="text-xl font-semibold">Property Applications</h2>
          
          {isLoadingApplications ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : applications && applications.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium mb-3">Pending Applications</h3>
                {applications.filter(a => a.status === 'pending').length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {applications
                      .filter(a => a.status === 'pending')
                      .map(application => {
                        const property = properties?.find(p => p.id === application.propertyId);
                        return (
                          <Card key={application.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{property?.title || 'Property'}</CardTitle>
                                <Badge variant="outline">Pending</Badge>
                              </div>
                              <CardDescription>
                                {property ? `${property.address}, ${property.city}` : 'Loading details...'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div>
                                  <p className="font-medium">Tenant ID: {application.tenantId}</p>
                                  <p className="text-sm text-gray-500">Applied on {formatDate(application.createdAt)}</p>
                                </div>
                                
                                {application.message && (
                                  <div>
                                    <p className="text-sm font-medium">Message:</p>
                                    <p className="text-sm italic">"{application.message}"</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                              <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                              <Button variant="destructive" className="flex-1">Reject</Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-gray-500">No pending applications</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3">Past Applications</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4">Property</th>
                            <th className="text-left p-4">Tenant ID</th>
                            <th className="text-left p-4">Applied</th>
                            <th className="text-left p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications
                            .filter(a => a.status !== 'pending')
                            .map(application => {
                              const property = properties?.find(p => p.id === application.propertyId);
                              return (
                                <tr key={application.id} className="border-b">
                                  <td className="p-4">{property?.title || 'Property'}</td>
                                  <td className="p-4">{application.tenantId}</td>
                                  <td className="p-4">{formatDate(application.createdAt)}</td>
                                  <td className="p-4">
                                    <Badge variant={application.status === 'approved' ? 'outline' : 'destructive'} className={application.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                                      {application.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          {applications.filter(a => a.status !== 'pending').length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-500">
                                No past applications
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>You don't have any applications yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="tenants" className="space-y-4">
          <h2 className="text-xl font-semibold">Tenant Management</h2>
          
          {isLoadingTenancies ? (
            <div className="text-center py-8">Loading tenant information...</div>
          ) : tenancies && tenancies.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium mb-3">Current Tenancies</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {tenancies
                    .filter(t => t.active)
                    .map(tenancy => {
                      const property = properties?.find(p => p.id === tenancy.propertyId);
                      return (
                        <Card key={tenancy.id}>
                          <CardHeader>
                            <CardTitle className="text-lg">{property?.title || 'Property'}</CardTitle>
                            <CardDescription>
                              {property ? `${property.address}, ${property.city}` : 'Loading details...'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <p className="font-medium">Tenant ID: {tenancy.tenantId}</p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(tenancy.startDate)} - {formatDate(tenancy.endDate)}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-gray-500">Rent:</span>
                                <span>£{Number(tenancy.rentAmount).toFixed(2)} per month</span>
                                
                                <span className="text-gray-500">Deposit:</span>
                                <span>£{Number(tenancy.depositAmount).toFixed(2)}</span>
                                
                                <span className="text-gray-500">Protection Scheme:</span>
                                <span>{tenancy.depositProtectionScheme || 'Not registered'}</span>
                              </div>
                              
                              <div className="pt-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Agreement Status:</span>
                                  <div className="flex space-x-4">
                                    <div className="flex items-center">
                                      <span className="text-sm mr-1">Tenant:</span>
                                      {tenancy.signedByTenant ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-sm mr-1">Owner:</span>
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
                            <Link href={`/dashboard/tenancies/${tenancy.id}/deposit`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                Deposit Protection
                              </Button>
                            </Link>
                            <Link href={`/dashboard/tenancies/${tenancy.id}`} className="flex-1">
                              <Button variant="default" className="w-full">
                                Manage Tenancy
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>You don't have any tenants yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="landlords" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Landlord Management</h2>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Landlord
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Landlord Portfolio</CardTitle>
              <CardDescription>Manage landlords and their properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Database className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                <p className="mb-2">You don't have any landlords in your portfolio yet.</p>
                <p className="text-sm text-gray-500 mb-4">Add landlords to start managing their properties.</p>
                <Button>Add Your First Landlord</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>HMO Compliance Checker</CardTitle>
              <CardDescription>Monitor HMO compliance status across your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">All properties are compliant</span>
                </div>
                <p className="text-sm text-gray-500">
                  Use our HMO compliance checker to ensure all properties meet current regulations.
                </p>
              </div>
              <Button variant="outline">Run Compliance Check</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Marketing Tools</CardTitle>
              <CardDescription>AI-powered tools to optimize your listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md bg-gray-50">
                  <div className="flex items-start mb-2">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <BarChart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">AI Description Generator</h3>
                      <p className="text-sm text-gray-500">
                        Create compelling property descriptions automatically
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    Generate Descriptions
                  </Button>
                </div>
                
                <div className="p-4 border rounded-md bg-gray-50">
                  <div className="flex items-start mb-2">
                    <div className="mr-3 bg-primary/10 p-2 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Social Media Campaigns</h3>
                      <p className="text-sm text-gray-500">
                        Automated marketing for your portfolio
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    Create Campaign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="keys" className="space-y-4">
          <h2 className="text-xl font-semibold">Property Key Management</h2>
          <p className="text-gray-600 mb-4">Track and manage keys for all your managed properties.</p>
          
          <PropertyKeyManagementSection />
        </TabsContent>
        
        <TabsContent value="risk" className="space-y-4">
          <h2 className="text-xl font-semibold">Tenant Risk Assessment</h2>
          <p className="text-gray-600 mb-4">Use AI-powered risk assessment to evaluate tenant applications and make data-driven decisions.</p>
          
          <TenantRiskAssessment />
        </TabsContent>
      </Tabs>
    </div>
  );
}
