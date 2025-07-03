import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Building2, Users, FileText, CreditCard, Briefcase, ChevronRight, Plus, ShieldCheck, Shield, Sparkles, UserCheck, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IDDocumentVerification from '@/components/dashboard/IDDocumentVerification';

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch agent's properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent'),
    enabled: !!user,
  });
  
  // Fetch agent's landlords
  const { data: landlords, isLoading: landlordsLoading } = useQuery({
    queryKey: ['/api/landlords/agent'],
    queryFn: () => apiRequest('GET', '/api/landlords/agent'),
    enabled: !!user,
  });
  
  // Fetch applications to agent's properties
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/applications/agent'],
    queryFn: () => apiRequest('GET', '/api/applications/agent'),
    enabled: !!user,
  });
  
  // Fetch tenancies for agent's properties
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({
    queryKey: ['/api/tenancies/agent'],
    queryFn: () => apiRequest('GET', '/api/tenancies/agent'),
    enabled: !!user,
  });

  return (
    <DashboardLayout dashboardType="agent">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">
              Manage your agency's student properties
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/add-property">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Property
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Properties
                  </p>
                  <h3 className="text-2xl font-bold">
                    {propertiesLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(properties) ? properties.length : '0'
                    )}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Briefcase className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Landlords
                  </p>
                  <h3 className="text-2xl font-bold">
                    {landlordsLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(landlords) ? landlords.length : '0'
                    )}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tenancies
                  </p>
                  <h3 className="text-2xl font-bold">
                    {tenanciesLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(tenancies) 
                        ? tenancies.filter((t: { active: boolean }) => t.active).length 
                        : '0'
                    )}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    New Applications
                  </p>
                  <h3 className="text-2xl font-bold">
                    {applicationsLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(applications) 
                        ? applications.filter((a: { status: string }) => a.status === 'pending').length 
                        : '0'
                    )}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Properties */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Managed Properties</CardTitle>
                <CardDescription>Student accommodations under your management</CardDescription>
              </div>
              <Link href="/dashboard/properties">
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading property information...</p>
                  </div>
                </div>
              ) : !properties || !Array.isArray(properties) || properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center mb-4">No properties under management</p>
                  <Link href="/dashboard/add-property">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(properties) && properties.slice(0, 3).map((property: any) => (
                    <div key={property.id} className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg">
                      <div className="bg-gray-200 rounded-md w-full md:w-32 h-20 flex-shrink-0">
                        {property.images && Array.isArray(property.images) && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Building2 className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <p className="text-sm text-muted-foreground">{property.address}, {property.city}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Landlord: {property.owner?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                              £{property.price} PCM
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{property.propertyType}</Badge>
                          <Badge variant="secondary">{property.bedrooms} Bed</Badge>
                          {property.allBillsIncluded && (
                            <Badge variant="secondary">All Bills Inc.</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col md:flex-row gap-2 mt-3">
                          <Link href={`/dashboard/property/${property.id}`}>
                            <Button variant="outline" size="sm" className="w-full md:w-auto">View Details</Button>
                          </Link>
                          <Link href={`/dashboard/property/${property.id}/applications`}>
                            <Button size="sm" className="w-full md:w-auto">Manage</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {Array.isArray(properties) && properties.length > 3 && (
                    <Link href="/dashboard/properties">
                      <Button variant="link" className="w-full">
                        View All Properties ({properties.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Landlords */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Landlords</CardTitle>
                <CardDescription>Manage your clients</CardDescription>
              </div>
              <Link href="/dashboard/landlords">
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {landlordsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading landlord information...</p>
                  </div>
                </div>
              ) : !landlords || !Array.isArray(landlords) || landlords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center mb-4">No landlords yet</p>
                  <Link href="/dashboard/landlords/add">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Landlord
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(landlords) && landlords.slice(0, 4).map((landlord: any) => (
                    <Link key={landlord.id} href={`/dashboard/landlord/${landlord.id}`}>
                      <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{landlord.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(landlord.properties) ? landlord.properties.length : 0} Properties
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                          >
                            Client
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {landlord.email}
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {Array.isArray(landlords) && landlords.length > 4 && (
                    <Link href="/dashboard/landlords">
                      <Button variant="link" className="w-full">
                        View All Landlords ({landlords.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Identity Verification Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Identity Verification</CardTitle>
              <CardDescription>Verify your identity to comply with UK regulations and build trust with landlords and tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="verification">
                <TabsList className="mb-4">
                  <TabsTrigger value="verification">Identity Verification</TabsTrigger>
                  <TabsTrigger value="info">Why Verify?</TabsTrigger>
                </TabsList>
                
                <TabsContent value="verification">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Verification</CardTitle>
                      <CardDescription>
                        We use secure face recognition to verify that you are the person in your ID documents.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Use same ID verification component with verificationType="agent" */}
                      <IDDocumentVerification verificationType="agent" />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Why verify your identity?</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                        <Shield className="h-12 w-12 text-primary mb-4"/>
                        <h3 className="text-lg font-medium mb-2">Enhanced Trust</h3>
                        <p className="text-gray-500">
                          Build confidence with landlords and tenants by confirming your identity.
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                        <UserCheck className="h-12 w-12 text-primary mb-4"/>
                        <h3 className="text-lg font-medium mb-2">Regulatory Compliance</h3>
                        <p className="text-gray-500">
                          Meet UK housing regulations requiring agent identity verification.
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                        <Clock className="h-12 w-12 text-primary mb-4"/>
                        <h3 className="text-lg font-medium mb-2">Faster Transactions</h3>
                        <p className="text-gray-500">
                          Speed up the rental process with pre-verified identity credentials.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Legal Documents Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>Generate and manage legal documents for landlords and tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/dashboard/documents/rental-agreement">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Rental Agreement</h3>
                    <p className="text-sm text-muted-foreground mt-1">Generate standard rental agreements</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/documents/hmo-license">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <FileText className="h-8 w-8 text-amber-600 mb-2" />
                    <h3 className="font-medium">HMO License</h3>
                    <p className="text-sm text-muted-foreground mt-1">Generate HMO license documentation</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/documents/deposit-protection">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <FileText className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-medium">Deposit Protection</h3>
                    <p className="text-sm text-muted-foreground mt-1">Generate deposit protection certificates</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/documents/right-to-rent">
                  <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <FileText className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-medium">Right to Rent</h3>
                    <p className="text-sm text-muted-foreground mt-1">Right to Rent compliance documents</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}