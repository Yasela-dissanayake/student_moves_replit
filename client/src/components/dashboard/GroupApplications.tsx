import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Home, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

type GroupMember = {
  id: number;
  name: string;
  email: string;
  userId: number | null;
  status: string;
  invitedAt: string;
  respondedAt: string | null;
};

type GroupApplicationItem = {
  application: {
    id: number;
    propertyId: number;
    tenantId: number;
    status: string;
    createdAt: string;
    groupId: string;
    groupLeadId: number;
    numBedroomsRequested: number;
    moveInDate: string | null;
  };
  property: {
    id: number;
    title: string;
    address: string;
    city: string;
    price: string;
    bedrooms: number;
    images: string[];
  };
  members: GroupMember[];
  role: "lead" | "member";
  status?: string;
};

interface GroupApplicationsProps {
  user: {
    id: number;
    name: string;
    email: string;
    userType: string;
  };
  properties: any[];
}

export default function GroupApplications({ user, properties }: GroupApplicationsProps) {
  const { toast } = useToast();
  const [groupApplications, setGroupApplications] = useState<GroupApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  const fetchGroupApplications = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/tenant/group-applications");
      const data = await response.json();
      setGroupApplications(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching group applications:", error);
      toast({
        title: "Error",
        description: "Failed to load group applications",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupApplications();
  }, []);

  const refreshApplications = async () => {
    setRefreshing(true);
    await fetchGroupApplications();
    setRefreshing(false);
  };

  const handleAcceptInvitation = async (groupId: string) => {
    try {
      setProcessingActionId(`accept-${groupId}`);
      
      const response = await apiRequest("POST", `/api/group-applications/${groupId}/accept`);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "You have accepted the group application invitation",
        });
        await refreshApplications();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleDeclineInvitation = async (groupId: string) => {
    try {
      setProcessingActionId(`decline-${groupId}`);
      
      const response = await apiRequest("POST", `/api/group-applications/${groupId}/decline`);
      
      if (response.ok) {
        toast({
          title: "Declined",
          description: "You have declined the group application invitation",
        });
        await refreshApplications();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setProcessingActionId(null);
    }
  };

  // Filter applications where user is lead tenant
  const leadApplications = groupApplications.filter(app => app.role === "lead");
  
  // Filter applications where user is a member (invited)
  const memberApplications = groupApplications.filter(app => app.role === "member");

  // Filter member applications by status
  const pendingInvitations = memberApplications.filter(app => app.status === "invited");
  const acceptedInvitations = memberApplications.filter(app => app.status === "accepted");
  const declinedInvitations = memberApplications.filter(app => app.status === "declined");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm mt-2">Loading group applications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Group Applications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshApplications}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations">
            Invitations
            {pendingInvitations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="your-groups">Your Groups</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4 mt-4">
          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You have no pending group invitations
              </CardContent>
            </Card>
          ) : (
            pendingInvitations.map((app) => (
              <Card key={`${app.application.groupId}-invite`} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{app.property.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {app.property.address}, {app.property.city}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">£{app.property.price}/week</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {app.members.length} total members in this group
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {app.property.bedrooms} bedroom property
                      </span>
                    </div>
                    {app.application.moveInDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Move-in: {new Date(app.application.moveInDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="font-medium">Group members:</p>
                    <ul className="mt-1 space-y-1">
                      {app.members.map((member) => (
                        <li key={member.id} className="flex justify-between items-center">
                          <span>
                            {member.name} {member.userId === app.application.groupLeadId && "(Lead)"}
                          </span>
                          {member.status !== "invited" && (
                            <Badge variant={member.status === "accepted" ? "success" : "destructive"}>
                              {member.status}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 pt-4">
                  <div className="flex justify-between w-full">
                    <p className="text-sm text-muted-foreground">
                      Invited {formatDistanceToNow(new Date(app.members.find(m => m.status === "invited")?.invitedAt || ''), { addSuffix: true })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeclineInvitation(app.application.groupId)}
                        disabled={!!processingActionId}
                      >
                        {processingActionId === `decline-${app.application.groupId}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Decline
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAcceptInvitation(app.application.groupId)}
                        disabled={!!processingActionId}
                      >
                        {processingActionId === `accept-${app.application.groupId}` ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* Your Groups Tab */}
        <TabsContent value="your-groups" className="space-y-4 mt-4">
          {leadApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You haven't created any group applications yet
              </CardContent>
            </Card>
          ) : (
            leadApplications.map((app) => (
              <Card key={`${app.application.groupId}-lead`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{app.property.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {app.property.address}, {app.property.city}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={
                        app.application.status === "approved" 
                          ? "success" 
                          : app.application.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {app.application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {app.members.length} total members in this group
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {app.property.bedrooms} bedroom property
                      </span>
                    </div>
                    {app.application.moveInDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Move-in: {new Date(app.application.moveInDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="font-medium">Group members:</p>
                    <ul className="mt-1 space-y-1">
                      {app.members.map((member) => (
                        <li key={member.id} className="flex justify-between items-center">
                          <span>
                            {member.name} {member.userId === app.application.groupLeadId && "(You - Lead)"}
                          </span>
                          <Badge variant={
                            member.status === "accepted" 
                              ? "success" 
                              : member.status === "declined"
                              ? "destructive"
                              : "outline"
                          }>
                            {member.status === "invited" ? "pending" : member.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 pt-4">
                  <div className="flex justify-between w-full">
                    <p className="text-sm text-muted-foreground">
                      Applied {formatDistanceToNow(new Date(app.application.createdAt), { addSuffix: true })}
                    </p>
                    <Link href={`/properties/${app.property.id}`}>
                      <Button variant="outline" size="sm">
                        View Property
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          {acceptedInvitations.length === 0 && declinedInvitations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You don't have any historical group invitations
              </CardContent>
            </Card>
          ) : (
            <>
              {acceptedInvitations.map((app) => (
                <Card key={`${app.application.groupId}-accepted`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.property.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {app.property.address}, {app.property.city}
                        </CardDescription>
                      </div>
                      <Badge variant="default">Accepted</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {app.members.length} total members in this group
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {app.application.moveInDate 
                            ? `Move-in: ${new Date(app.application.moveInDate).toLocaleDateString()}`
                            : "No move-in date specified"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 pt-4">
                    <div className="flex justify-between w-full">
                      <p className="text-sm text-muted-foreground">
                        Application status: {app.application.status}
                      </p>
                      <Link href={`/properties/${app.property.id}`}>
                        <Button variant="outline" size="sm">
                          View Property
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {declinedInvitations.map((app) => (
                <Card key={`${app.application.groupId}-declined`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{app.property.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {app.property.address}, {app.property.city}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Declined</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Group with {app.members.length} members
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/20 pt-4">
                    <div className="flex justify-end w-full">
                      <Link href={`/properties/${app.property.id}`}>
                        <Button variant="outline" size="sm">
                          View Property
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}