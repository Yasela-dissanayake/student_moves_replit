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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenancyType, ApplicationType, PaymentType, PropertyType, UserType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { MapPin, Calendar, AlertCircle, CheckCircle, Clock, XCircle, Users, Zap } from "lucide-react";
import GroupApplications from "./GroupApplications";
import VirtualAssistant from "@/components/assistant/VirtualAssistant";
import TenantUtilityManagement from "@/components/utility/TenantUtilityManagement";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Get tenant applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<ApplicationType[]>({
    queryKey: ['/api/applications'],
  });

  // Get tenant tenancies
  const { data: tenancies, isLoading: isLoadingTenancies } = useQuery<TenancyType[]>({
    queryKey: ['/api/tenancies'],
  });

  // Get all properties for reference
  const { data: properties } = useQuery<PropertyType[]>({
    queryKey: ['/api/properties'],
  });

  // Get tenant payments if they have a tenancy
  const { data: payments, isLoading: isLoadingPayments } = useQuery<PaymentType[]>({
    queryKey: ['/api/payments'],
    enabled: !!tenancies && tenancies.length > 0,
    queryFn: async () => {
      if (tenancies && tenancies.length > 0) {
        const res = await fetch(`/api/payments?tenancyId=${tenancies[0].id}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch payments');
        return res.json();
      }
      return [];
    },
  });

  // Get verification status
  const { data: verification, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['/api/verifications/me'],
    enabled: !!user,
    retry: false,
    onError: () => {
      // Verification not found, but we don't need to show an error
    }
  });

  // Helper function to find property by ID
  const getPropertyById = (id: number) => {
    return properties?.find(property => property.id === id);
  };

  // Count upcoming/overdue payments
  const upcomingPayments = payments?.filter(payment => 
    payment.status === 'pending' && new Date(payment.dueDate!) > new Date()
  ) || [];
  
  const overduePayments = payments?.filter(payment => 
    payment.status === 'pending' && new Date(payment.dueDate!) < new Date()
  ) || [];

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Find the property ID from the active tenancy if any
  const activePropertyId = tenancies?.find(t => t.active)?.propertyId;

  return (
    <div className="space-y-6">
      {/* Virtual Assistant */}
      <VirtualAssistant propertyId={activePropertyId} />
      
      {/* Welcome & Overview */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>Your student accommodation dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {!user?.verified && !verification && (
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
            
            {verification && (
              <div className={`flex items-start space-x-2 mb-4 p-3 rounded-md ${
                verification.status === 'approved' 
                  ? 'bg-green-50 text-green-700' 
                  : verification.status === 'pending' 
                  ? 'bg-amber-50 text-amber-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {verification.status === 'approved' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : verification.status === 'pending' ? (
                  <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {verification.status === 'approved' 
                      ? 'Identity Verified' 
                      : verification.status === 'pending' 
                      ? 'Verification Pending' 
                      : 'Verification Failed'}
                  </p>
                  <p className="text-sm">
                    {verification.status === 'approved' 
                      ? 'You can now apply for properties' 
                      : verification.status === 'pending' 
                      ? 'Your verification is being processed' 
                      : 'Please try again with clearer images'}
                  </p>
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
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="group-applications">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Group Applications</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="tenancies">Tenancies</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-4">
          <h2 className="text-xl font-semibold">Your Applications</h2>
          
          {isLoadingApplications ? (
            <div className="text-center py-8">Loading applications...</div>
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
                              ? 'success' 
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
        
        <TabsContent value="group-applications" className="space-y-4">
          <h2 className="text-xl font-semibold">Group Applications</h2>
          <p className="text-gray-500 mb-4">
            Apply for properties with your roommates and manage your group applications here.
          </p>
          
          <GroupApplications user={user!} properties={properties || []} />
        </TabsContent>
        
        <TabsContent value="tenancies" className="space-y-4">
          <h2 className="text-xl font-semibold">Your Tenancies</h2>
          
          {isLoadingTenancies ? (
            <div className="text-center py-8">Loading tenancies...</div>
          ) : tenancies && tenancies.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tenancies.map(tenancy => {
                const property = getPropertyById(tenancy.propertyId);
                return (
                  <Card key={tenancy.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>{property?.title || 'Property'}</CardTitle>
                        <Badge variant={tenancy.active ? 'success' : 'secondary'}>
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
                    <CardFooter className="flex justify-between">
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
                <p>You don't have any tenancies yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <h2 className="text-xl font-semibold">Your Payments</h2>
          
          {isLoadingPayments ? (
            <div className="text-center py-8">Loading payments...</div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-6">
              {overduePayments.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3 text-red-600">Overdue Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overduePayments.map(payment => (
                      <Card key={payment.id} className="border-red-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                            <Badge variant="destructive">Overdue</Badge>
                          </div>
                          <CardDescription>
                            Due on {formatDate(payment.dueDate!)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">£{Number(payment.amount).toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">Make Payment</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {upcomingPayments.length > 0 && (
                <div>
                  <h3 className="text-md font-medium mb-3">Upcoming Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingPayments.map(payment => (
                      <Card key={payment.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <CardDescription>
                            Due on {formatDate(payment.dueDate!)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">£{Number(payment.amount).toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">Make Payment</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-md font-medium mb-3">Payment History</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4">Payment Type</th>
                            <th className="text-left p-4">Date</th>
                            <th className="text-left p-4">Amount</th>
                            <th className="text-left p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments
                            .filter(payment => payment.status !== 'pending')
                            .map(payment => (
                              <tr key={payment.id} className="border-b">
                                <td className="p-4">{payment.paymentType}</td>
                                <td className="p-4">{formatDate(payment.paidDate || payment.createdAt)}</td>
                                <td className="p-4">£{Number(payment.amount).toFixed(2)}</td>
                                <td className="p-4">
                                  <Badge variant={payment.status === 'completed' ? 'success' : 'destructive'}>
                                    {payment.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          {payments.filter(payment => payment.status !== 'pending').length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-500">
                                No payment history yet
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
                <p>You don't have any payments yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        

      </Tabs>
    </div>
  );
}
