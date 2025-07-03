import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PropertyUpdateNotifier } from "@/components/properties/PropertyUpdateNotifier";
import { 
  ChevronLeft, 
  Home, 
  Users, 
  ClipboardList, 
  CalendarRange, 
  Settings, 
  Bell, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Key,
  MessageSquare
} from "lucide-react";
import { Property } from "@shared/schema";

export default function PropertyAdminView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch property data
  const { 
    data: property, 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/properties">
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/properties">
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load property details"}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Format price for display
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(property.price));

  // Check available features
  const hasImages = property.images && property.images.length > 0;
  const hasAddress = property.address && property.city && property.postcode;
  const hasFeatures = property.features && property.features.length > 0;

  // Handle notifications sent
  const handleNotificationSent = () => {
    toast({
      title: "Notifications sent",
      description: "Property update notifications have been sent successfully",
      variant: "default",
    });
  };

  return (
    <div className="container px-4 py-8">
      {/* Header with breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/properties">
                <ChevronLeft className="h-4 w-4" />
                <span>Properties</span>
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-muted-foreground">
              Property #{property.id}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
          {hasAddress && (
            <p className="text-muted-foreground">
              {property.address}, {property.city}, {property.postcode}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/properties/edit/${property.id}`}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Property
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link href={`/properties/${property.id}`}>
              <Home className="h-4 w-4 mr-2" />
              View Public Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tenants">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Tenants</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Keys</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-xl font-semibold text-primary">{formattedPrice}</p>
                    <p className="text-xs text-muted-foreground">per week</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{property.bedrooms}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{property.bathrooms}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div>
                      {property.available ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="font-medium">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="font-medium">Occupied</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Furnished</p>
                    <p className="font-medium">{property.furnished ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
                  </div>

                  {hasFeatures && (
                    <div>
                      <h3 className="font-medium mb-2">Features</h3>
                      <ul className="grid grid-cols-2 gap-1">
                        {property.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasImages ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Images ({property.images.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {property.images.slice(0, 4).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Property image ${index + 1}`}
                          className="aspect-video object-cover rounded-md"
                        />
                      ))}
                      {property.images.length > 4 && (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                          <span className="text-muted-foreground">+{property.images.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">No images available</div>
                )}

                {property.videos && property.videos.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Videos ({property.videos.length})</h3>
                    <div className="space-y-2">
                      {property.videos.slice(0, 2).map((video, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">{index + 1}</span>
                          </div>
                          <a
                            href={video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {video.split('/').pop() || `Video ${index + 1}`}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {property.virtualTourUrl && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Virtual Tour</h3>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={property.virtualTourUrl} target="_blank" rel="noopener noreferrer">
                        Open Virtual Tour
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Tenants</CardTitle>
              <CardDescription>
                Manage tenants for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-6">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>Tenant management feature will be implemented soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Documents</CardTitle>
              <CardDescription>
                Manage documents for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-6">
                <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>Document management feature will be implemented soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Keys</CardTitle>
              <CardDescription>
                Manage keys for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-6">
                <Key className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>Key management feature will be implemented soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PropertyUpdateNotifier 
              property={property} 
              onNotificationSent={handleNotificationSent}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  Recent notifications sent for this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-6">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Notification history will be implemented soon</p>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Notifications are sent via WhatsApp to tenants and applicants
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}