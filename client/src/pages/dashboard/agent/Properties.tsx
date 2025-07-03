import { useState } from "react";
import AgentPageTemplate from "./AgentPageTemplate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Home, 
  Users, 
  CheckCircle, 
  Clock, 
  Search,
  Plus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


// Define Property type
type Property = {
  id: number;
  title?: string;
  address?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  status?: string;
  rent?: number;
  tenantCount?: number;
  lastInspection?: string;
};

export default function AgentProperties() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [propertyData, setPropertyData] = useState({
    title: '',
    address: '',
    city: '',
    postcode: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    description: '',
    features: ''
  });
  
  // Fetch all properties managed by this agent
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent')
  });

  // Mutation for creating a new property
  const createPropertyMutation = useMutation({
    mutationFn: (propertyData: any) => apiRequest('POST', '/api/properties', propertyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties/agent'] });
      setIsAddDialogOpen(false);
      setPropertyData({
        title: '',
        address: '',
        city: '',
        postcode: '',
        propertyType: '',
        bedrooms: '',
        bathrooms: '',
        price: '',
        description: '',
        features: ''
      });
      toast({
        title: "Property added successfully",
        description: "The new property has been added to your portfolio.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding property",
        description: error.message || "Could not add the property. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddProperty = () => {
    setIsAddDialogOpen(true);
  };

  const handleSubmitProperty = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!propertyData.title || !propertyData.address || !propertyData.city || !propertyData.price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (title, address, city, price).",
        variant: "destructive"
      });
      return;
    }

    // Submit the property
    createPropertyMutation.mutate({
      ...propertyData,
      bedrooms: parseInt(propertyData.bedrooms) || 0,
      bathrooms: parseInt(propertyData.bathrooms) || 0,
      price: propertyData.price
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setPropertyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error) {
    toast({
      title: "Error loading properties",
      description: "Could not load your managed properties. Please try again later.",
      variant: "destructive"
    });
  }

  // Filter properties based on search query and status filter
  const filteredProperties = properties?.filter((property: Property) => {
    const matchesSearch = searchQuery === "" || 
      property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.propertyType?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === null || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AgentPageTemplate
      title="Properties"
      description="Manage all properties under your responsibility"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full md:w-auto" onClick={handleAddProperty}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            // Loading skeleton
            Array(6).fill(0).map((_, index) => (
              <Card key={index} className="h-[370px]">
                <CardHeader className="p-0">
                  <div className="h-40 rounded-t-lg bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-2/4 mb-2" />
                  <Skeleton className="h-8 w-full mt-4" />
                </CardContent>
              </Card>
            ))
          ) : filteredProperties && filteredProperties.length > 0 ? (
            filteredProperties.map((property: Property) => (
              <Card key={property.id} className="overflow-hidden">
                <CardHeader className="p-0">
                  <div className="h-40 relative">
                    {property.images && property.images[0] ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground/60" />
                      </div>
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        property.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                        property.status === "maintenance" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : 
                        ""
                      }`}
                      variant={
                        property.status === "available" ? "outline" :
                        property.status === "rented" ? "default" :
                        property.status === "maintenance" ? "outline" :
                        "secondary"
                      }
                    >
                      {property.status === "available" ? "Available" :
                       property.status === "rented" ? "Rented" :
                       property.status === "maintenance" ? "Maintenance" :
                       property.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-1">{property.title}</CardTitle>
                  <div className="flex items-center text-muted-foreground text-sm mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span>{property.address || "Address not available"}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bedrooms || "--"}</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.bathrooms || "--"}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">{property.tenantCount || 0}</span>
                    </div>
                  </div>
                  
                  <div className="text-base font-medium mt-2">
                    £{property.rent}/month
                  </div>
                  
                  {property.lastInspection && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>Last inspection: {new Date(property.lastInspection).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link href={`/dashboard/properties/${property.id}`}>
                    <Button variant="default" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-12 border rounded-lg">
              <h3 className="text-lg font-medium">No properties found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery || statusFilter ? 
                  "Try adjusting your search or filters" : 
                  "You don't have any properties assigned to you yet"}
              </p>
              <Button className="mt-4" onClick={handleAddProperty}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Property
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Property Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitProperty} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={propertyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Modern 3 Bed Student House"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={propertyData.propertyType}
                  onValueChange={(value) => handleInputChange('propertyType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Shared Room">Shared Room</SelectItem>
                    <SelectItem value="Bedsit">Bedsit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={propertyData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="e.g. 123 High Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={propertyData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g. Manchester"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={propertyData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  placeholder="e.g. M1 1AA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={propertyData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={propertyData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rent (£) *</Label>
                <Input
                  id="price"
                  value={propertyData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="1200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={propertyData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the property, its location, and key features..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features</Label>
              <Textarea
                id="features"
                value={propertyData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                placeholder="e.g. Garden, Parking, Furnished, WiFi included"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={createPropertyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPropertyMutation.isPending}
              >
                {createPropertyMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Adding Property...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AgentPageTemplate>
  );
}