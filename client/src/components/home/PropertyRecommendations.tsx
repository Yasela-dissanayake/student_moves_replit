import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Bed, Bath, MapPin, Home, Star, Heart, Loader2 } from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

// Define a more flexible property type that can handle both string and number price types
interface FlexiblePropertyType extends Omit<PropertyType, 'price' | 'images' | 'features'> {
  price: string | number;
  images?: string[] | null;
  features?: string[] | null;
}

interface PropertyRecommendationResult {
  property: FlexiblePropertyType;
  matchScore: number; // 0-100
  matchReasons: string[];
}

export default function PropertyRecommendations() {
  const [userPreferences, setUserPreferences] = useState<any>({});
  
  // Get user preferences from localStorage if available
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }, []);
  
  // Query for personalized recommendations
  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendedProperties'],
    queryFn: async () => {
      try {
        // Get recommendations from OpenAI-powered API endpoint
        const response = await fetch('/api/recommendations/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userPreferences,
            count: 4 // Request 4 recommendations
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.recommendations) {
          return data.recommendations;
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch property recommendations:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Finding the perfect properties for you...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-lg text-center">
        <h3 className="text-red-700 font-semibold mb-2">Unable to load recommendations</h3>
        <p className="text-red-600">Please try again later</p>
      </div>
    );
  }
  
  // Empty state
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg text-center">
        <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No recommendations available</h3>
        <p className="text-gray-600 mb-4">
          We're working on finding the perfect properties for you. Check back soon!
        </p>
        <Link href="/properties">
          <Button>Browse All Properties</Button>
        </Link>
      </div>
    );
  }
  
  // Recommendations found
  const recommendations = data as PropertyRecommendationResult[];
  
  // Helper function to safely get array values or return empty array if null/undefined
  const safeArray = (arr: any[] | null | undefined): any[] => {
    return Array.isArray(arr) ? arr : [];
  };
  
  // Helper function to safely get image URL 
  const getImageUrl = (property: FlexiblePropertyType): string => {
    if (property.images && property.images.length > 0 && property.images[0]) {
      return property.images[0];
    }
    // Use a reliable placeholder image service
    return `https://placehold.co/600x400?text=${encodeURIComponent(property.title || 'Property')}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Personalized Recommendations</h3>
        <Link href="/properties">
          <Button variant="outline" size="sm">View All Properties</Button>
        </Link>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent>
          {recommendations.map((recommendation) => {
            const { property, matchScore, matchReasons } = recommendation;
            
            return (
              <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full border-t-4 border-t-primary relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="bg-primary border-primary">
                      {matchScore}% Match
                    </Badge>
                  </div>
                  
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(property)}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <div className="text-lg font-bold">£{property.price}/mo</div>
                    </div>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.city}{property.area ? `, ${property.area}` : ''}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="flex space-x-4 mb-3">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm">{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm">{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                      </div>
                      {property.furnished && (
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-sm">Furnished</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-primary">Why we picked this for you:</h4>
                      <ul className="space-y-1">
                        {safeArray(matchReasons).map((reason, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="h-4 w-4 text-yellow-500 mt-0.5 mr-1 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Link href={`/properties/${property.id}`}>
                      <Button size="sm" className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}