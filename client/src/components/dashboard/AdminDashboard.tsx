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
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyType, UserType, VerificationType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Home, 
  FileCheck, 
  Shield, 
  Activity, 
  TrendingUp, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Ticket,
  Server,
  Zap,
  Database,
  Edit,
  Mail
} from "lucide-react";
import TenantUtilityManagement from "@/components/utility/TenantUtilityManagement";
import VoucherPartnerOutreach from "@/pages/admin/VoucherPartnerOutreach";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  // Get all properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<PropertyType[]>({
    queryKey: ['/api/properties'],
  });
  
  // Get all verifications
  const { data: verifications, isLoading: isLoadingVerifications } = useQuery<VerificationType[]>({
    queryKey: ['/api/verifications'],
    queryFn: async () => {
      // This would be an admin-specific endpoint for all verifications
      // Mock response for now
      return [];
    },
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Approve verification
  const handleApproveVerification = (id: number) => {
    toast({
      title: "Verification approved",
      description: "The user's identity has been verified",
      variant: "default"
    });
  };
  
  // Reject verification
  const handleRejectVerification = (id: number) => {
    toast({
      title: "Verification rejected",
      description: "The user will be notified to try again",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <h3 className="text-2xl font-bold">{users?.length || 0}</h3>
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
                <p className="text-sm text-gray-500">Total Properties</p>
                <h3 className="text-2xl font-bold">{properties?.length || 0}</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Home className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verifications</p>
                <h3 className="text-2xl font-bold">
                  {verifications?.filter(v => v.status === 'pending').length || 0}
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <FileCheck className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">System Status</p>
                <h3 className="text-2xl font-bold text-green-600">Healthy</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-7 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registration</CardTitle>
                <CardDescription>New user signups in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center">
                  <BarChart3 className="h-24 w-24 text-gray-300" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Breakdown</CardTitle>
                <CardDescription>Distribution of user types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Tenants</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Landlords</span>
                      <span>24%</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Agents</span>
                      <span>10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Admins</span>
                      <span>1%</span>
                    </div>
                    <Progress value={1} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Current system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>CPU Usage</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Memory Usage</span>
                      <span>41%</span>
                    </div>
                    <Progress value={41} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Disk Usage</span>
                      <span>17%</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-medium">Response Time</span>
                      <Badge variant="outline" className="text-green-600 bg-green-50">
                        85ms (Good)
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Stats</CardTitle>
                <CardDescription>AI-powered features usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">ID Verifications</p>
                        <p className="text-sm text-gray-500">AI-powered identity checks</p>
                      </div>
                    </div>
                    <p className="font-bold">428</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Property Descriptions</p>
                        <p className="text-sm text-gray-500">AI-generated descriptions</p>
                      </div>
                    </div>
                    <p className="font-bold">159</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full mr-3">
                        <Shield className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Compliance Checks</p>
                        <p className="text-sm text-gray-500">Automated compliance verification</p>
                      </div>
                    </div>
                    <p className="font-bold">73</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">
                Add User
              </Button>
            </div>
          </div>
          
          {isLoadingUsers ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Type</th>
                        <th className="text-left p-4">Verified</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!users || users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map(user => (
                          <tr key={user.id} className="border-b">
                            <td className="p-4">{user.name}</td>
                            <td className="p-4">{user.email}</td>
                            <td className="p-4 capitalize">{user.userType}</td>
                            <td className="p-4">
                              {user.verified ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>
                              ) : (
                                <Badge variant="outline">Not Verified</Badge>
                              )}
                            </td>
                            <td className="p-4">{formatDate(user.createdAt)}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="destructive" size="sm">Deactivate</Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="verifications" className="space-y-4">
          <h2 className="text-xl font-semibold">Identity Verifications</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <h3 className="text-2xl font-bold">3</h3>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <h3 className="text-2xl font-bold">42</h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <h3 className="text-2xl font-bold">7</h3>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Review and approve user identity verification requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!verifications || verifications.filter(v => v.status === 'pending').length === 0 ? (
                  <div className="text-center py-4">
                    <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No pending verifications</p>
                  </div>
                ) : (
                  verifications
                    .filter(v => v.status === 'pending')
                    .map(verification => (
                      <Card key={verification.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">User ID: {verification.userId}</CardTitle>
                            <Badge variant="outline">Pending Review</Badge>
                          </div>
                          <CardDescription>
                            Document Type: {verification.documentType}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-2">ID Document</p>
                              <div className="bg-gray-100 rounded-md h-48 flex items-center justify-center">
                                <p className="text-gray-400">Document Image Preview</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Selfie</p>
                              <div className="bg-gray-100 rounded-md h-48 flex items-center justify-center">
                                <p className="text-gray-400">Selfie Image Preview</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-md mb-4">
                            <h4 className="font-medium flex items-center mb-2">
                              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                              AI Verification Result
                            </h4>
                            <p className="text-sm">{verification.aiVerified ? 'Match detected with high confidence' : 'AI verification pending'}</p>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button 
                              variant="default" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveVerification(verification.id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="flex-1"
                              onClick={() => handleRejectVerification(verification.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Utility Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Reports
              </Button>
              <Button size="sm">
                <Zap className="h-4 w-4 mr-1" />
                Add Utility Contract
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Contracts</p>
                    <h3 className="text-2xl font-bold">42</h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Setup</p>
                    <h3 className="text-2xl font-bold">7</h3>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg. Monthly Savings</p>
                    <h3 className="text-2xl font-bold">£83.45</h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Latest Utility Contracts</CardTitle>
              <CardDescription>
                Manage tenant utility contracts and automated registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantUtilityManagement />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utility Providers</CardTitle>
                <CardDescription>Manage available utility providers and tariffs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Utility Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>British Gas</TableCell>
                      <TableCell>Gas, Electricity, Dual Fuel</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>BT</TableCell>
                      <TableCell>Broadband, TV</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Thames Water</TableCell>
                      <TableCell>Water</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="ml-auto">
                  Add Provider
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Automated Utility Management</CardTitle>
                <CardDescription>System performance and automation statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Successful Registrations</span>
                      <span>93%</span>
                    </div>
                    <Progress value={93} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>API Availability</span>
                      <span>99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Average Setup Time</span>
                      <span>1.2 days</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  
                  <div className="pt-4 space-y-2">
                    <h4 className="text-sm font-medium">AI-Powered Utility Management</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Automatic price monitoring enabled
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Smart contract recommendations active
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        Documentation processing utilizing our custom AI
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Student Voucher Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Link to="/vouchers">View All Vouchers</Link>
              </Button>
              <Button size="sm">
                <Link to="/admin/voucher-partner-outreach">
                  <Mail className="h-4 w-4 mr-1" />
                  Partner Outreach
                </Link>
              </Button>
              <Button size="sm">
                <Ticket className="h-4 w-4 mr-1" />
                Add New Voucher
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Vouchers</p>
                    <h3 className="text-2xl font-bold">42</h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Ticket className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Redemptions Today</p>
                    <h3 className="text-2xl font-bold">17</h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Partner Companies</p>
                    <h3 className="text-2xl font-bold">24</h3>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="outreach" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="outreach">Partner Outreach</TabsTrigger>
              <TabsTrigger value="stats">Redemption Stats</TabsTrigger>
              <TabsTrigger value="companies">Partner Companies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="outreach" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Voucher Partner Outreach</CardTitle>
                    <CardDescription>
                      Discover and reach out to potential voucher partners with AI-powered assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">Use our AI-powered system to discover and contact potential voucher partners in your area.</p>
                      <Button size="lg">
                        <Mail className="h-4 w-4 mr-2" />
                        <Link to="/admin/voucher-partner-outreach">Launch Partner Outreach Tool</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Business Outreach Database</CardTitle>
                    <CardDescription>
                      Manage local business contacts and schedule outreach campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">Track, manage, and schedule outreach to local businesses for your voucher platform.</p>
                      <Button size="lg">
                        <Database className="h-4 w-4 mr-2" />
                        <Link to="/admin/business-outreach-database">Open Business Database</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle>Voucher Redemption Statistics</CardTitle>
                  <CardDescription>
                    Track voucher usage and performance across different partners
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <BarChart3 className="h-24 w-24 text-gray-300" />
                    <p className="text-gray-500 mt-4">Redemption statistics visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="companies">
              <Card>
                <CardHeader>
                  <CardTitle>Partner Companies</CardTitle>
                  <CardDescription>
                    Manage your current voucher partner relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-gray-500">Partner company management interface coming soon</p>
                    <Button className="mt-4">
                      <Link to="/admin/companies">Manage Companies</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <h2 className="text-xl font-semibold">Compliance Management</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>HMO Compliance</CardTitle>
              <CardDescription>Houses of Multiple Occupation compliance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">HMO Licensing Status</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Monitor all HMO properties across the platform for compliance with current regulations.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">12</p>
                        <p className="text-xs text-gray-500">Licensed</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">3</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">1</p>
                        <p className="text-xs text-gray-500">Non-compliant</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Right to Rent Compliance</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Track Right to Rent verifications across all tenants.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">87%</p>
                        <p className="text-xs text-gray-500">Verified</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">10%</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">3%</p>
                        <p className="text-xs text-gray-500">Failed</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Deposit Protection Compliance</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Monitor deposit protection scheme registrations.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">94%</p>
                        <p className="text-xs text-gray-500">Protected</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">6%</p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">0%</p>
                        <p className="text-xs text-gray-500">Unprotected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Generate Compliance Report</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <h2 className="text-xl font-semibold">System Management</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center bg-green-50 p-4 rounded-md mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium">All Systems Operational</h3>
                  <p className="text-sm text-gray-500">Last checked: Today at 10:23 AM</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border-b">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-gray-500 mr-3" />
                    <span>API Server</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600">Operational</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 border-b">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-gray-500 mr-3" />
                    <span>Database</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600">Operational</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 border-b">
                  <div className="flex items-center">
                    <FileCheck className="h-5 w-5 text-gray-500 mr-3" />
                    <span>AI Verification Service</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600">Operational</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 border-b">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-gray-500 mr-3" />
                    <span>Marketing Automation</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600">Operational</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-gray-500 mr-3" />
                    <span>Background Tasks</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-600">Operational</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Run System Diagnostics</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Maintenance System</CardTitle>
              <CardDescription>Automated system maintenance and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">AI Monitoring Status</h3>
                    <p className="text-sm text-gray-500">The AI monitoring system is actively checking for issues and optimizing performance.</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium mb-2">Recent Activities</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Database optimization completed (2 hours ago)</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Security scan completed - no issues found (6 hours ago)</span>
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>API performance optimization (1 day ago)</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button>
                    Run Manual Maintenance
                  </Button>
                  <Button variant="outline">
                    Configure AI Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
