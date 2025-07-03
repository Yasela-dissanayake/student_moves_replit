import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CircleSlash, Coffee, Landmark, School, ShoppingBag, Train, Utensils, Bus, Dumbbell, Beer, Heart, Leaf } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: number; // in meters
  walkTime?: number; // in minutes
  rating?: number;
}

interface NearbyAmenitiesProps {
  latitude?: number;
  longitude?: number;
  address: string;
  isLoading?: boolean;
}

export default function NearbyAmenities({ latitude, longitude, address, isLoading = false }: NearbyAmenitiesProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Function to fetch nearby places (would use OpenStreetMap Nominatim or Overpass API in production)
  useEffect(() => {
    if (isLoading) return;
    
    const fetchNearbyPlaces = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would make an API call to OpenStreetMap's Overpass API
        // For demonstration purposes, we'll use sample data
        if (latitude && longitude) {
          // Here we would fetch data from an API using the coordinates
          console.log(`Fetching nearby places for coordinates: ${latitude}, ${longitude}`);
        } else if (address) {
          // Or geocode the address first, then fetch
          console.log(`Fetching nearby places for address: ${address}`);
        }
        
        // Simulating API response delay
        setTimeout(() => {
          // Sample data representing what would come from API
          const samplePlaces: NearbyPlace[] = [
            { id: '1', name: 'Local University', type: 'education', distance: 450, walkTime: 6, rating: 4.8 },
            { id: '2', name: 'Central Library', type: 'education', distance: 750, walkTime: 10 },
            { id: '3', name: 'Green Park', type: 'park', distance: 350, walkTime: 5 },
            { id: '4', name: 'City Hospital', type: 'healthcare', distance: 1500, walkTime: 20 },
            { id: '5', name: 'Student Union Bar', type: 'nightlife', distance: 550, walkTime: 7, rating: 4.2 },
            { id: '6', name: 'Campus Coffee', type: 'restaurant', distance: 200, walkTime: 3, rating: 4.5 },
            { id: '7', name: 'Metro Station', type: 'transport', distance: 600, walkTime: 8 },
            { id: '8', name: 'University Gym', type: 'fitness', distance: 500, walkTime: 7, rating: 4.0 },
            { id: '9', name: 'Supermarket', type: 'shopping', distance: 350, walkTime: 5, rating: 4.3 },
            { id: '10', name: 'Study Café', type: 'restaurant', distance: 280, walkTime: 4, rating: 4.6 },
            { id: '11', name: 'Student Bookshop', type: 'shopping', distance: 400, walkTime: 5 },
            { id: '12', name: 'Bus Station', type: 'transport', distance: 450, walkTime: 6 },
          ];
          
          setPlaces(samplePlaces);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching nearby places:', error);
        setLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, [latitude, longitude, address, isLoading]);

  // Get icon based on place type
  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'education':
        return <School className="h-4 w-4 mr-2" />;
      case 'restaurant':
        return <Utensils className="h-4 w-4 mr-2" />;
      case 'transport':
        return <Train className="h-4 w-4 mr-2" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4 mr-2" />;
      case 'nightlife':
        return <Beer className="h-4 w-4 mr-2" />;
      case 'healthcare':
        return <Heart className="h-4 w-4 mr-2" />;
      case 'fitness':
        return <Dumbbell className="h-4 w-4 mr-2" />;
      case 'park':
        return <Leaf className="h-4 w-4 mr-2" />;
      default:
        return <Landmark className="h-4 w-4 mr-2" />;
    }
  };

  // Filter places based on active tab
  const filteredPlaces = places.filter(place => {
    if (activeTab === 'all') return true;
    return place.type === activeTab;
  });

  // Sort places by distance
  const sortedPlaces = [...filteredPlaces].sort((a, b) => a.distance - b.distance);

  // Format distance display
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-52" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Landmark className="h-5 w-5" />
          Nearby Amenities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full overflow-auto flex flex-nowrap justify-start h-auto">
            <TabsTrigger value="all" className="px-3">All</TabsTrigger>
            <TabsTrigger value="education" className="px-3 flex items-center">
              <School className="h-3.5 w-3.5 mr-1" /> Education
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="px-3 flex items-center">
              <Coffee className="h-3.5 w-3.5 mr-1" /> Food & Drink
            </TabsTrigger>
            <TabsTrigger value="transport" className="px-3 flex items-center">
              <Bus className="h-3.5 w-3.5 mr-1" /> Transport
            </TabsTrigger>
            <TabsTrigger value="shopping" className="px-3 flex items-center">
              <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Shopping
            </TabsTrigger>
          </TabsList>

          <div className="space-y-3">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start justify-between p-3 border rounded-lg animate-pulse">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </>
            ) : sortedPlaces.length > 0 ? (
              // Actual places
              sortedPlaces.map((place) => (
                <div key={place.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {getPlaceIcon(place.type)}
                      <span className="font-medium">{place.name}</span>
                      {place.rating && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          ★ {place.rating}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {place.walkTime ? `${place.walkTime} min walk` : formatDistance(place.distance)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatDistance(place.distance)}
                  </Badge>
                </div>
              ))
            ) : (
              // No places found
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CircleSlash className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No amenities found in this area</p>
              </div>
            )}
          </div>

          {places.length > 0 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" className="w-full">
                View All Nearby Places
              </Button>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}