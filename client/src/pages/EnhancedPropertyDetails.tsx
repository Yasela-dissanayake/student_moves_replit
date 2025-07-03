import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { 
  ArrowLeft, 
  Heart, 
  Share, 
  Home, 
  MapPin, 
  Calendar, 
  Wallet, 
  Bed, 
  Bath, 
  Ruler, 
  Shield, 
  Package, 
  CircleAlert, 
  Check, 
  X, 
  Users,
  PanelLeftOpen,
  Loader2,
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import NearbyAmenities from '@/components/properties/NearbyAmenities';
import EnhancedVirtualTour from '@/components/properties/EnhancedVirtualTour';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

export default function EnhancedPropertyDetails() {
  const { id } = useParams();
  const propertyId = id ? parseInt(id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [isSaved, setIsSaved] = useState(false);
  const [isCompareAdded, setIsCompareAdded] = useState(false);
  
  // Define property type
  interface PropertyType {
    id: number;
    title: string;
    description: string;
    address: string;
    city: string;
    postcode: string;
    price: number;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    available: boolean;
    images?: string[];
    videos?: string[];
    virtualTourUrl?: string;
    features?: string[];
    furnished: boolean;
    billsIncluded: boolean;
    includedBills?: string[];
    availableDate?: string;
    depositAmount?: number;
    university?: string;
    distanceToUniversity?: number;
    area?: number;
    epcRating?: string;
    epcExpiryDate?: string;
    gasChecked?: boolean;
    gasCheckExpiryDate?: string;
    electricalChecked?: boolean;
    electricalCheckExpiryDate?: string;
    hmoLicensed?: boolean;
    hmoLicenseNumber?: string;
    hmoLicenseExpiryDate?: string;
    landlord?: {
      name: string;
      email: string;
      phone: string;
      type?: string;
    };
  }
  
  // Fetch property details
  const { data: property, isLoading, error } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }
      return response.json();
    },
    enabled: !!propertyId,
  });
  
  // Function to toggle saved property
  const toggleSaved = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? 'Property removed from saved properties' : 'Property saved to your account',
      description: isSaved ? 'You can add it back anytime.' : 'You can view all saved properties in your dashboard.',
    });
  };
  
  // Function to add to comparison
  const addToComparison = () => {
    setIsCompareAdded(true);
    toast({
      title: 'Property added to comparison',
      description: 'You can compare multiple properties from the comparison page.',
    });
    
    // In a real implementation, this would store the property in a comparison list
    // For example:
    // const compareList = JSON.parse(localStorage.getItem('propertyCompare') || '[]');
    // if (!compareList.includes(propertyId)) {
    //   compareList.push(propertyId);
    //   localStorage.setItem('propertyCompare', JSON.stringify(compareList));
    // }
  };
  
  // Function to share property
  const shareProperty = () => {
    // In a real implementation, this would open a share dialog or copy the link
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: 'Link copied to clipboard',
      description: 'You can now share this property with others.',
    });
  };
  
  // Function to request viewing
  const requestViewing = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in or register to request a viewing.',
        variant: 'destructive',
      });
      return;
    }
    
    navigate(`/properties/${propertyId}/request-viewing`);
  };
  
  // Function to apply for property
  const applyForProperty = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in or register to apply for this property.',
        variant: 'destructive',
      });
      return;
    }
    
    navigate(`/properties/${propertyId}/apply`);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={() => navigate('/properties')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-6">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <CircleAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="mb-6 text-gray-600">
              The property you're looking for might have been removed or is no longer available.
            </p>
            <Button
              onClick={() => navigate('/properties')}
              className="mx-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Use default values for potentially undefined properties
  const propertyData: PropertyType = {
    id: property.id || 0,
    title: property.title || '',
    description: property.description || '',
    address: property.address || '',
    city: property.city || '',
    postcode: property.postcode || '',
    price: property.price || 0,
    propertyType: property.propertyType || '',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    available: property.available || false,
    images: property.images || [],
    videos: property.videos || [],
    virtualTourUrl: property.virtualTourUrl,
    features: property.features || [],
    furnished: property.furnished || false,
    billsIncluded: property.billsIncluded || false,
    includedBills: property.includedBills || [],
    availableDate: property.availableDate,
    depositAmount: property.depositAmount,
    university: property.university,
    distanceToUniversity: property.distanceToUniversity,
    area: property.area,
    epcRating: property.epcRating,
    epcExpiryDate: property.epcExpiryDate,
    gasChecked: property.gasChecked,
    gasCheckExpiryDate: property.gasCheckExpiryDate,
    electricalChecked: property.electricalChecked,
    electricalCheckExpiryDate: property.electricalCheckExpiryDate,
    hmoLicensed: property.hmoLicensed,
    hmoLicenseNumber: property.hmoLicenseNumber,
    hmoLicenseExpiryDate: property.hmoLicenseExpiryDate,
    landlord: property.landlord
  };
  
  const {
    title,
    description,
    address,
    city,
    postcode,
    price,
    propertyType,
    bedrooms,
    bathrooms,
    available,
    images = [],
    videos = [],
    virtualTourUrl,
    features = [],
    furnished,
    billsIncluded,
    includedBills = [],
    availableDate,
    depositAmount,
    university,
    distanceToUniversity,
    area,
    epcRating,
    epcExpiryDate,
    gasChecked,
    gasCheckExpiryDate,
    electricalChecked,
    electricalCheckExpiryDate,
    hmoLicensed,
    hmoLicenseNumber,
    hmoLicenseExpiryDate,
    landlord
  } = propertyData;
  
  // Format date for display
  const formattedAvailableDate = availableDate 
    ? new Date(availableDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Immediate';
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => navigate('/properties')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={isSaved ? "default" : "outline"} 
            size="sm"
            onClick={toggleSaved}
          >
            <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-white" : ""}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button 
            variant={isCompareAdded ? "default" : "outline"} 
            size="sm"
            onClick={addToComparison}
            disabled={isCompareAdded}
          >
            <PanelLeftOpen className="mr-2 h-4 w-4" />
            {isCompareAdded ? 'Added to Compare' : 'Compare'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={shareProperty}
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Property Address */}
      <div className="flex items-center text-gray-600 mb-6">
        <MapPin className="h-5 w-5 mr-2 text-primary" />
        <span className="text-lg">
          {address}, {city}, {postcode}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Images and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Gallery */}
          <Card>
            <CardContent className="p-4">
              {images && images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((image: string, index: number) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video w-full overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`${title} - Image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
                  <Home className="h-20 w-20 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Virtual Tour (if available) */}
          {(virtualTourUrl || (videos && videos.length > 0)) && (
            <EnhancedVirtualTour
              propertyId={propertyId}
              propertyName={title}
              tourUrl={virtualTourUrl}
              tourImages={videos || []}
            />
          )}
          
          {/* Tabs for Property Details */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Property Type</span>
                      <span className="font-medium flex items-center">
                        <Home className="h-4 w-4 mr-1 text-primary" />
                        {propertyType}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Bedrooms</span>
                      <span className="font-medium flex items-center">
                        <Bed className="h-4 w-4 mr-1 text-primary" />
                        {bedrooms}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Bathrooms</span>
                      <span className="font-medium flex items-center">
                        <Bath className="h-4 w-4 mr-1 text-primary" />
                        {bathrooms}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Available From</span>
                      <span className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-primary" />
                        {formattedAvailableDate}
                      </span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Furnished</span>
                      <span className="font-medium flex items-center">
                        {furnished ? (
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 mr-1 text-red-500" />
                        )}
                        {furnished ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    {university && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Nearest University</span>
                        <span className="font-medium">{university}</span>
                      </div>
                    )}
                    
                    {distanceToUniversity && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Distance to University</span>
                        <span className="font-medium">{distanceToUniversity} miles</span>
                      </div>
                    )}
                    
                    {area && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Property Size</span>
                        <span className="font-medium flex items-center">
                          <Ruler className="h-4 w-4 mr-1 text-primary" />
                          {area} sq ft
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Financial Details */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Financial Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Weekly Rent</span>
                        <span className="font-medium flex items-center">
                          <Wallet className="h-4 w-4 mr-1 text-primary" />
                          £{price}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Monthly Equivalent</span>
                        <span className="font-medium">£{Math.round(price * 52 / 12)}</span>
                      </div>
                      
                      {depositAmount && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">Deposit</span>
                          <span className="font-medium">£{depositAmount}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Bills Included</span>
                        <span className="font-medium flex items-center">
                          {billsIncluded ? (
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 mr-1 text-red-500" />
                          )}
                          {billsIncluded ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    
                    {billsIncluded && includedBills.length > 0 && (
                      <div className="mt-4 bg-green-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          Bills included in rent:
                        </h4>
                        <ul className="text-sm text-green-700 pl-6 list-disc">
                          {includedBills.includes('electricity') && <li>Electricity</li>}
                          {includedBills.includes('gas') && <li>Gas</li>}
                          {includedBills.includes('water') && <li>Water</li>}
                          {includedBills.includes('internet') && <li>Internet</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Features Tab */}
            <TabsContent value="features" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Features</CardTitle>
                </CardHeader>
                <CardContent>
                  {features && features.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center p-2 rounded-md border">
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          <span>{feature.replace(/_/g, ' ')
                            .split(' ')
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                          </span>
                        </div>
                      ))}
                      
                      {/* Add standard features */}
                      {furnished && (
                        <div className="flex items-center p-2 rounded-md border">
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          <span>Furnished</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific features listed for this property.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Property safety and compliance */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Safety & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="epc">
                      <AccordionTrigger>Energy Performance Certificate (EPC)</AccordionTrigger>
                      <AccordionContent>
                        {property.epcRating ? (
                          <div className="space-y-2">
                            <p>This property has an EPC rating of {property.epcRating}.</p>
                            {property.epcExpiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Valid until: {new Date(property.epcExpiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">EPC information not available.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="gas">
                      <AccordionTrigger>Gas Safety Certificate</AccordionTrigger>
                      <AccordionContent>
                        {property.gasChecked ? (
                          <div className="space-y-2">
                            <p>This property has a valid Gas Safety Certificate.</p>
                            {property.gasCheckExpiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Valid until: {new Date(property.gasCheckExpiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Gas safety information not available or not applicable.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="electrical">
                      <AccordionTrigger>Electrical Safety</AccordionTrigger>
                      <AccordionContent>
                        {property.electricalChecked ? (
                          <div className="space-y-2">
                            <p>This property has a valid Electrical Installation Condition Report (EICR).</p>
                            {property.electricalCheckExpiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Valid until: {new Date(property.electricalCheckExpiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Electrical safety information not available.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="hmo">
                      <AccordionTrigger>HMO License</AccordionTrigger>
                      <AccordionContent>
                        {property.hmoLicensed ? (
                          <div className="space-y-2">
                            <p>This property has a valid HMO License.</p>
                            {property.hmoLicenseNumber && (
                              <p className="text-sm">License Number: {property.hmoLicenseNumber}</p>
                            )}
                            {property.hmoLicenseExpiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Valid until: {new Date(property.hmoLicenseExpiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">HMO license information not available or not applicable.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Location Tab */}
            <TabsContent value="location" className="pt-4">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
                    {/* Placeholder for map - in a real app, this would be an actual map component */}
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                        <p className="text-lg font-medium">Property Location</p>
                        <p className="text-gray-600">{address}, {city}, {postcode}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Nearby amenities */}
              <NearbyAmenities address={`${address}, ${city}, ${postcode}`} />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column - Quick Information and Actions */}
        <div className="space-y-6">
          {/* Quick Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-lg font-semibold">£{price}</span>
                </div>
                <span className="text-sm text-gray-500">per week</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-2 text-primary" />
                  <span>{bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                </div>
                
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-2 text-primary" />
                  <span>{bathrooms} {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                </div>
                
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-primary" />
                  <span>{propertyType}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <span>Available {formattedAvailableDate}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Badge className={available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {available ? 'Available Now' : 'Currently Unavailable'}
                </Badge>
                
                {billsIncluded && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    Bills Included
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <Button 
                  className="w-full" 
                  disabled={!available}
                  onClick={requestViewing}
                >
                  Request Viewing
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!available}
                  onClick={applyForProperty}
                >
                  Apply for This Property
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Landlord/Agent Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Listed By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                  {property.landlord?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="font-medium">{property.landlord?.name || 'Property Manager'}</p>
                  <p className="text-sm text-gray-500">{property.landlord?.type || 'Agent'}</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Contact Agent
              </Button>
            </CardContent>
          </Card>
          
          {/* Similar Properties Teaser */}
          <Card>
            <CardHeader>
              <CardTitle>Similar Properties</CardTitle>
              <CardDescription>Properties you might also like</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* This would be populated with actual similar properties in a real app */}
                <Button variant="link" className="w-full py-4 h-auto">
                  View Similar Properties
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}