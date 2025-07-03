import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, CheckCircle, XCircle, Eye, FileText, UserCheck, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const UserVerification = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

  // Sample data for verification requests
  const verificationRequests = [
    {
      id: 1,
      user: {
        id: 101,
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+44 7700 900123",
        userType: "landlord",
        createdAt: "2025-03-15"
      },
      status: "pending",
      documents: [
        { id: 1, type: "ID Card", filename: "id_card.jpg", verified: false },
        { id: 2, type: "Proof of Address", filename: "utility_bill.pdf", verified: false }
      ],
      propertyCount: 3,
      aiVerified: "Pending",
      adminVerified: false,
      submittedAt: "2025-03-20"
    },
    {
      id: 2,
      user: {
        id: 102,
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "+44 7700 900456",
        userType: "agent",
        createdAt: "2025-03-10"
      },
      status: "pending",
      documents: [
        { id: 3, type: "Passport", filename: "passport.jpg", verified: false },
        { id: 4, type: "Business License", filename: "business_license.pdf", verified: false }
      ],
      propertyCount: 8,
      aiVerified: "Passed",
      adminVerified: false,
      submittedAt: "2025-03-19"
    },
    {
      id: 3,
      user: {
        id: 103,
        name: "David Williams",
        email: "david.w@example.com",
        phone: "+44 7700 900789",
        userType: "landlord",
        createdAt: "2025-02-28"
      },
      status: "approved",
      documents: [
        { id: 5, type: "ID Card", filename: "id_card.jpg", verified: true },
        { id: 6, type: "Proof of Address", filename: "bank_statement.pdf", verified: true }
      ],
      propertyCount: 5,
      aiVerified: "Passed",
      adminVerified: true,
      submittedAt: "2025-03-05",
      verifiedAt: "2025-03-07"
    },
    {
      id: 4,
      user: {
        id: 104,
        name: "Emma Brown",
        email: "emma.b@example.com",
        phone: "+44 7700 900012",
        userType: "agent",
        createdAt: "2025-03-01"
      },
      status: "rejected",
      documents: [
        { id: 7, type: "Driver's License", filename: "drivers_license.jpg", verified: false },
        { id: 8, type: "Company Registration", filename: "company_reg.pdf", verified: false }
      ],
      propertyCount: 0,
      aiVerified: "Failed",
      adminVerified: false,
      submittedAt: "2025-03-12",
      rejectedAt: "2025-03-14",
      rejectionReason: "Documents appear to be altered or inconsistent"
    }
  ];

  const handleViewVerification = (request: any) => {
    setSelectedUser(request);
    setVerificationDialogOpen(true);
  };

  const handleApprove = (requestId: number) => {
    // In a real app, this would be an API call
    console.log(`Approved verification request ID: ${requestId}`);
    setVerificationDialogOpen(false);
  };

  const handleReject = (requestId: number) => {
    // In a real app, this would be an API call
    console.log(`Rejected verification request ID: ${requestId}`);
    setVerificationDialogOpen(false);
  };

  const filterRequests = (status: string) => {
    return verificationRequests.filter(request => request.status === status);
  };

  const renderVerificationTable = (requests: any[]) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No verification requests</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There are currently no {activeTab} verification requests to review.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Check
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback>{request.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.user.name}</div>
                      <div className="text-sm text-gray-500">{request.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={request.user.userType === "landlord" ? "default" : "secondary"} className="capitalize">
                    {request.user.userType}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge 
                    variant={
                      request.aiVerified === "Passed" ? "default" : 
                      request.aiVerified === "Failed" ? "destructive" : "outline"
                    }
                    className={request.aiVerified === "Passed" ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {request.aiVerified}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{request.submittedAt}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{request.documents.length} files</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => handleViewVerification(request)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Verification</h1>
            <p className="text-muted-foreground">Approve or reject user verification requests</p>
          </div>
          <Link href="/dashboard/admin">
            <div>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <div className="w-64">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search requests..." className="pl-8" />
            </div>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Badge variant="outline" className="ml-1">{filterRequests('pending').length}</Badge>
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <Badge variant="outline" className="ml-1">{filterRequests('approved').length}</Badge>
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <Badge variant="outline" className="ml-1">{filterRequests('rejected').length}</Badge>
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {renderVerificationTable(filterRequests('pending'))}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-6">
            {renderVerificationTable(filterRequests('approved'))}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-6">
            {renderVerificationTable(filterRequests('rejected'))}
          </TabsContent>
        </Tabs>

        {/* Verification Review Dialog */}
        {selectedUser && (
          <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Verification Review</DialogTitle>
                <DialogDescription>
                  Review user documents and verification information
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">User Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarFallback>{selectedUser.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedUser.user.name}</p>
                        <Badge variant="outline" className="capitalize mt-1">
                          {selectedUser.user.userType}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Email</p>
                      <p>{selectedUser.user.email}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Phone</p>
                      <p>{selectedUser.user.phone}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Account Created</p>
                      <p>{selectedUser.user.createdAt}</p>
                    </div>
                    
                    <div className="text-sm">
                      <p className="text-muted-foreground">Properties Listed</p>
                      <p>{selectedUser.propertyCount} properties</p>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold">Verification Documents</h3>
                  
                  <div className="space-y-4">
                    {selectedUser.documents.map((doc: any) => (
                      <Card key={doc.id}>
                        <CardHeader className="py-2 px-4">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-md flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              {doc.type}
                            </CardTitle>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                          <p className="text-sm text-muted-foreground">{doc.filename}</p>
                          {doc.verified && (
                            <Badge variant="default" className="mt-1 bg-green-500 hover:bg-green-600">Verified</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">AI Verification Result</h4>
                    <Badge 
                      variant={
                        selectedUser.aiVerified === "Failed" ? "destructive" : "outline"
                      }
                      className={`text-sm ${selectedUser.aiVerified === "Passed" ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                    >
                      {selectedUser.aiVerified}
                    </Badge>
                    
                    {selectedUser.aiVerified === "Failed" && (
                      <p className="text-sm text-red-500 mt-1">
                        Document inconsistencies detected. Please review manually.
                      </p>
                    )}
                    
                    {selectedUser.aiVerified === "Passed" && (
                      <p className="text-sm text-green-600 mt-1">
                        All documents passed automated verification checks.
                      </p>
                    )}
                  </div>
                  
                  {selectedUser.status === "pending" && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button 
                        variant="destructive" 
                        onClick={() => handleReject(selectedUser.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={() => handleApprove(selectedUser.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  )}
                  
                  {selectedUser.status === "approved" && (
                    <div className="rounded-md bg-green-50 p-4 mt-4">
                      <div className="flex">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <p className="text-green-700">
                          Approved on {selectedUser.verifiedAt}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.status === "rejected" && (
                    <div className="rounded-md bg-red-50 p-4 mt-4">
                      <div className="flex">
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-red-700">
                            Rejected on {selectedUser.rejectedAt}
                          </p>
                          <p className="text-red-600 text-sm mt-1">
                            Reason: {selectedUser.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserVerification;