import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Bed,
  Bath,
  MapPin,
  CalendarDays,
  Home,
  Check,
  Bolt,
  Droplet,
  Flame,
  Wifi,
  Package,
  School,
  Building,
  ArrowLeft,
  Share,
  Heart,
  Info,
  PoundSterling,
  CheckCircle
} from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Loader2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Property rates interface
interface PropertyRates {
  property: {
    id: number;
    title: string;
    bedrooms: number;
  };
  utilities: {
    included: boolean;
    list: string[];
    weeklyFeePerPerson: number;
  };
  breakdown: {
    baseWeekly: number;
    utilitiesWeekly: number;
  };
  rates: {
    total: {
      weekly: number;
      daily: number;
      monthly: number;
      annual: number;
    };
    perPerson: {
      weekly: number;
      daily: number;
      monthly: number;
      annual: number;
    };
  };
  deposit: {
    total: number;
    perPerson: number;
  };
}

export default function PropertyDetails() {
  const { propertyId } = useParams();
  const [, setLocation] = useLocation();

  const { data: property, isLoading: isLoadingProperty, isError: isPropertyError } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }
      return response.json();
    }
  });

  // Fetch property rates from API
  const { data: propertyRates, isLoading: isLoadingRates } = useQuery<PropertyRates>({
    queryKey: [`/api/properties/${propertyId}/rates`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/rates`);
      if (!response.ok) {
        throw new Error('Failed to fetch property rates');
      }
      return response.json();
    },
    enabled: !!property // Only fetch rates if property exists
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isLoading = isLoadingProperty || isLoadingRates;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading property details...</p>
      </div>
    );
  }

  if (isPropertyError || !property) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="mb-6 text-gray-600">
              The property you're looking for might have been removed or is no longer available.
            </p>
            <Button
              onClick={() => setLocation('/properties')}
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

  // Use combined rates from API (already includes utilities)
  const weeklyRent = propertyRates?.rates.total.weekly || Number(property.price);
  const weeklyRentPerPerson = propertyRates?.rates.perPerson.weekly || (Number(property.price) / property.bedrooms);
  const monthlyRent = propertyRates?.rates.total.monthly || (Number(property.price) * 52 / 12);
  const annualRentPerPerson = propertyRates?.rates.perPerson.annual || (Number(property.price) * 52 / property.bedrooms);
  const depositPerPerson = propertyRates?.deposit.perPerson || (Number(property.price) * 5 / property.bedrooms);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button
            variant="outline"
            size="sm"
            className="mr-4"
            onClick={() => setLocation('/properties')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Heart className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Property Address */}
      <div className="flex items-center text-gray-600 mb-6">
        <MapPin className="h-5 w-5 mr-2 text-primary" />
        <span className="text-lg">
          {property.address}, {property.city}, {property.postcode}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Property Images and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Gallery */}
          <Card>
            <CardContent className="p-4">
              {property.images && property.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video w-full overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`${property.title} - Image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
                  <Home className="h-20 w-20 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Bills Included Banner */}
          <Card className="border-[#f37021]/20 bg-[#f37021]/5">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-8 w-8 text-[#f37021] mr-3 flex-shrink-0" />
                <h2 className="text-xl font-bold text-[#f37021]">ALL BILLS INCLUDED</h2>
              </div>
              <p className="text-gray-700 mb-4">
                This property comes with all utilities included in the rent. No need to worry about setting up or paying for separate utility bills.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center bg-white p-3 rounded-md border border-[#f37021]/20">
                  <Bolt className="h-6 w-6 mr-2 text-yellow-500" />
                  <span className="font-medium">Electricity</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md border border-[#f37021]/20">
                  <Flame className="h-6 w-6 mr-2 text-orange-500" />
                  <span className="font-medium">Gas</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md border border-[#f37021]/20">
                  <Droplet className="h-6 w-6 mr-2 text-blue-500" />
                  <span className="font-medium">Water</span>
                </div>
                <div className="flex items-center bg-white p-3 rounded-md border border-[#f37021]/20">
                  <Wifi className="h-6 w-6 mr-2 text-indigo-500" />
                  <span className="font-medium">Broadband</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Property Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About This Property</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {property.description}
              </p>

              {/* Key Features */}
              <h3 className="text-lg font-semibold mb-3">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                {property.features && property.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Property Details */}
              <h3 className="text-lg font-semibold mb-3">Property Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-gray-700">{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-gray-700">{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-gray-700">{property.propertyType}</span>
                </div>
                <div className="flex items-center">
                  <School className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-gray-700">{property.university || 'University nearby'}</span>
                </div>
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-gray-700">Available: {property.availableDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>

        {/* Right Column - Price and Actions */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Pricing</h3>
                <div className="bg-[#f37021]/10 text-[#f37021] px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All Bills Included
                </div>
              </div>
              
              <div className="flex flex-col space-y-4 mb-6">
                {/* Rent per person per week */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[#f37021] text-lg font-bold">£</span>
                    <span className="text-gray-700">Weekly price per person</span>
                  </div>
                  <div className="text-4xl font-bold text-[#f37021]">
                    {weeklyRentPerPerson.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Includes all utilities and bills
                  </div>
                </div>

                {/* Rent per person month */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[#f37021] text-lg font-bold">£</span>
                    <span className="text-gray-700">Monthly price per person</span>
                  </div>
                  <div className="text-4xl font-bold text-[#f37021]">
                    {(weeklyRentPerPerson * 52 / 12).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Includes all utilities and bills
                  </div>
                </div>

                {/* Rent per person year */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[#f37021] text-lg font-bold">£</span>
                    <span className="text-gray-700">Annual price per person</span>
                  </div>
                  <div className="text-4xl font-bold text-[#f37021]">
                    {annualRentPerPerson.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total annual cost including all bills
                  </div>
                </div>

                {/* Deposit per person */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[#f37021] text-lg font-bold">£</span>
                    <span className="text-gray-700">Security deposit per person</span>
                  </div>
                  <div className="text-4xl font-bold text-[#f37021]">
                    {depositPerPerson.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Fully protected through deposit protection scheme
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setLocation(`/properties/${propertyId}/apply`)}
                >
                  Apply Now
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    // Store property details for viewing request
                    localStorage.setItem('viewingProperty', JSON.stringify({
                      id: property.id,
                      title: property.title,
                      address: property.address,
                      city: property.city,
                      timestamp: new Date().toISOString(),
                    }));
                    
                    // Navigate to viewing request page
                    setLocation(`/properties/${propertyId}/request-viewing`);
                  }}
                >
                  Request Viewing
                </Button>
              </div>


            </CardContent>
          </Card>

          {/* Property Status */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Property Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available:</span>
                  <Badge variant={property.available ? "default" : "secondary"} className={property.available ? "bg-[#f37021]/10 text-[#f37021] hover:bg-[#f37021]/10" : ""}>
                    {property.available ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {property.available && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{property.availableDate}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium capitalize">{property.propertyType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Furnished:</span>
                  <Badge variant={property.furnished ? "outline" : "secondary"}>
                    {property.furnished ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Have Questions?</h3>
              <p className="text-gray-600 mb-4">
                Contact our team for more information about this property.
              </p>
              <Button variant="outline" className="w-full">
                Contact Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}