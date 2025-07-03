import { useState } from "react";
import AgentPageTemplate from "./AgentPageTemplate";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  User,
  CalendarDays,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function Applications() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch all applications for properties managed by this agent
  const { data: applications, isLoading, error } = useQuery({
    queryKey: ['/api/applications/agent'],
    queryFn: () => apiRequest('GET', '/api/applications/agent')
  });

  if (error) {
    toast({
      title: "Error loading applications",
      description: "Could not load applications for your properties. Please try again later.",
      variant: "destructive"
    });
  }

  // Define Application type
  type Application = {
    id: number;
    propertyId: number;
    property?: {
      title?: string;
    };
    tenant?: {
      name?: string;
      email?: string;
    };
    status: string;
    moveInDate?: string;
    createdAt: string;
    message?: string;
    isGroupApplication?: boolean;
    groupSize?: number;
    applicantId?: number;
  };

  // Filter applications based on search query and status filter
  const filteredApplications = applications?.filter((application: Application) => {
    const matchesSearch = searchQuery === "" || 
      application.property?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.tenant?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === null || application.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group applications by status for tabs
  const pendingApplications = filteredApplications?.filter((app: Application) => app.status === "pending" || app.status === "reviewing");
  const approvedApplications = filteredApplications?.filter((app: Application) => app.status === "approved");
  const rejectedApplications = filteredApplications?.filter((app: Application) => app.status === "rejected");

  // Render an application card
  const renderApplicationCard = (application: Application) => {
    const moveInDate = application.moveInDate ? new Date(application.moveInDate) : null;
    
    return (
      <Card key={application.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                {application.property?.title || "Property not found"}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <User className="h-4 w-4 mr-2" />
                {application.tenant?.name || "Tenant not found"}
              </CardDescription>
            </div>
            <Badge 
              variant={
                application.status === "pending" ? "outline" :
                application.status === "reviewing" ? "secondary" :
                application.status === "approved" ? "default" :
                application.status === "rejected" ? "destructive" : 
                "default"
              }
              className={application.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
            >
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2 text-sm">
            {moveInDate && (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span>Requested move-in: {format(moveInDate, "PPP")}</span>
              </div>
            )}
            
            {application.isGroupApplication && (
              <div className="flex items-center text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>Group application: {application.groupSize || "?"} tenants</span>
              </div>
            )}
            
            {application.message && (
              <div className="mt-3 border-l-2 pl-3 py-1 italic text-muted-foreground">
                "{application.message.length > 100 
                  ? application.message.substring(0, 100) + "..." 
                  : application.message}"
              </div>
            )}
            
            <div className="flex items-center text-muted-foreground pt-2">
              <Clock className="h-4 w-4 mr-2" />
              <span>Applied {format(new Date(application.createdAt), "PPP")}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 pt-0">
          <Link href={`/dashboard/applications/${application.id}`}>
            <Button variant="default" size="sm" className="flex-1">View Details</Button>
          </Link>
          
          {application.status === "pending" && (
            <>
              <Button variant="outline" size="sm" className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          
          {application.status === "approved" && (
            <Button variant="outline" size="sm" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Viewing
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <AgentPageTemplate
      title="Rental Applications"
      description="Manage and review applications for your properties"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applications..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select
              value={statusFilter || ""}
              onValueChange={(value) => setStatusFilter(value || null)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingApplications?.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingApplications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedApplications?.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {approvedApplications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              {rejectedApplications?.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {rejectedApplications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              // Loading skeleton for pending tab
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : pendingApplications?.length > 0 ? (
              pendingApplications.map(renderApplicationCard)
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No pending applications</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || statusFilter ? 
                    "Try adjusting your search or filters" : 
                    "All clear! You have no pending applications to review"}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            {isLoading ? (
              // Loading skeleton for approved tab
              Array(2).fill(0).map((_, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : approvedApplications?.length > 0 ? (
              approvedApplications.map(renderApplicationCard)
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No approved applications</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || statusFilter ? 
                    "Try adjusting your search or filters" : 
                    "You haven't approved any applications yet"}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4">
            {isLoading ? (
              // Loading skeleton for rejected tab
              Array(2).fill(0).map((_, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-0">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))
            ) : rejectedApplications?.length > 0 ? (
              rejectedApplications.map(renderApplicationCard)
            ) : (
              <div className="text-center p-10 border rounded-lg">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No rejected applications</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || statusFilter ? 
                    "Try adjusting your search or filters" : 
                    "You haven't rejected any applications yet"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AgentPageTemplate>
  );
}