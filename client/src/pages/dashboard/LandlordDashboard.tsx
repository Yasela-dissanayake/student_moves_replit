import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Building2, Users, FileText, CreditCard, Plus, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch landlord's properties
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/landlord/properties'],
    enabled: !!user,
  });
  
  // Fetch applications to landlord's properties
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/landlord/applications'],
    enabled: !!user,
  });
  
  // Fetch tenancies for landlord's properties
  const { data: tenancies, isLoading: tenanciesLoading } = useQuery({
    queryKey: ['/api/landlord/tenancies'],
    enabled: !!user,
  });
  
  // Fetch upcoming payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/landlord/payments'],
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your properties and tenants
            </p>
          </div>
          <Link href="/dashboard/add-property">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </Link>
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
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Tenants
                  </p>
                  <h3 className="text-2xl font-bold">
                    {tenanciesLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(tenancies) ? tenancies.filter(t => t.active).length : 0
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
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Applications
                  </p>
                  <h3 className="text-2xl font-bold">
                    {applicationsLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(applications) ? applications.filter(a => a.status === 'pending').length : 0
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
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Upcoming Payments
                  </p>
                  <h3 className="text-2xl font-bold">
                    {paymentsLoading ? (
                      <span className="text-muted-foreground animate-pulse">Loading...</span>
                    ) : (
                      Array.isArray(payments) ? payments.filter(p => p.status === 'pending').length : 0
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
                <CardTitle>Your Properties</CardTitle>
                <CardDescription>Manage your student accommodations</CardDescription>
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
                  <p className="text-muted-foreground text-center mb-4">You don't have any properties yet</p>
                  <Link href="/dashboard/add-property">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties?.slice(0, 3).map((property) => (
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
                          <Link href={`/dashboard/property/${property.id}/edit`}>
                            <Button variant="outline" size="sm" className="w-full md:w-auto">Edit</Button>
                          </Link>
                          <Link href={`/dashboard/property/${property.id}/applications`}>
                            <Button size="sm" className="w-full md:w-auto">Applications</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {properties && Array.isArray(properties) && properties.length > 3 && (
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

          {/* Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Manage student applications</CardDescription>
              </div>
              <Link href="/dashboard/applications">
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">View all</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading applications...</p>
                  </div>
                </div>
              ) : !applications || !Array.isArray(applications) || applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-center">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications?.slice(0, 4).map(application => (
                    <Link key={application.id} href={`/dashboard/application/${application.id}`}>
                      <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {application.tenant?.name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {application.property?.title || 'Unknown Property'}
                            </p>
                          </div>
                          <Badge
                            className={
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                              application.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                              'bg-red-100 text-red-800 hover:bg-red-100'
                            }
                          >
                            {application.status === 'pending' ? 'Pending' :
                             application.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(application.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {applications && Array.isArray(applications) && applications.length > 4 && (
                    <Link href="/dashboard/applications">
                      <Button variant="link" className="w-full">
                        View All Applications ({applications.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legal Documents Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>Generate and manage legal documents for your properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}