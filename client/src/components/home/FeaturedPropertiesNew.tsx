import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useEffect, useState, useCallback } from 'react';
import { Bed, Heart, MapPin, Home, Star, Bath, Bolt, Droplet, Flame, Wifi, Package, ChevronLeft, ChevronRight, Search, School, MapPin as LocationPin } from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { getProperties } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// UK major cities
const majorCities = [
  "London", "Manchester", "Birmingham", "Liverpool", 
  "Leeds", "Sheffield", "Bristol", "Newcastle", 
  "Leicester", "Nottingham", "Cardiff", "Edinburgh", 
  "Glasgow", "Belfast", "Oxford", "Cambridge"
];

// Map of universities by city
const universitiesByCity: Record<string, string[]> = {
  "London": ["UCL", "Imperial College", "King's College", "LSE", "SOAS", "Queen Mary", "City University", "Brunel", "Goldsmiths", "Westminster"],
  "Manchester": ["University of Manchester", "Manchester Metropolitan", "UMIST", "Royal Northern College of Music"],
  "Birmingham": ["University of Birmingham", "Birmingham City University", "Aston University", "Newman University"],
  "Liverpool": ["University of Liverpool", "Liverpool John Moores", "Liverpool Hope", "LIPA"],
  "Leeds": ["University of Leeds", "Leeds Beckett", "Leeds Trinity", "Leeds Arts University"],
  "Sheffield": ["University of Sheffield", "Sheffield Hallam", "Sheffield Hallam City"],
  "Bristol": ["University of Bristol", "UWE Bristol", "Bristol Old Vic Theatre School"],
  "Newcastle": ["Newcastle University", "Northumbria University", "Newcastle College"],
  "Leicester": ["University of Leicester", "De Montfort University"],
  "Nottingham": ["University of Nottingham", "Nottingham Trent University"],
  "Cardiff": ["Cardiff University", "Cardiff Metropolitan", "University of South Wales"],
  "Edinburgh": ["University of Edinburgh", "Edinburgh Napier", "Heriot-Watt University"],
  "Glasgow": ["University of Glasgow", "Glasgow Caledonian", "University of Strathclyde"],
  "Belfast": ["Queen's University Belfast", "Ulster University", "Stranmillis University College"],
  "Oxford": ["University of Oxford", "Oxford Brookes", "Ruskin College"],
  "Cambridge": ["University of Cambridge", "Anglia Ruskin University"]
};

export default function FeaturedPropertiesNew() {
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [autoLocationDetected, setAutoLocationDetected] = useState<boolean>(false);
  
  // Initialize with default city
  useEffect(() => {
    // Set a default city immediately to avoid empty Select error
    setSelectedCity("London");
    
    const detectLocation = async () => {
      // Skip geolocation if already detected or not available
      if (!navigator.geolocation || autoLocationDetected) {
        return;
      }
      
      try {
        // Wrap geolocation in a promise with timeout to prevent hanging
        const getPosition = () => {
          return new Promise((resolve, reject) => {
            // Set timeout of 5 seconds for geolocation
            const timeoutId = setTimeout(() => {
              reject(new Error("Geolocation request timed out"));
            }, 5000);
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                clearTimeout(timeoutId);
                resolve(position);
              },
              (error) => {
                clearTimeout(timeoutId);
                reject(error);
              },
              { 
                enableHighAccuracy: false, 
                timeout: 4000,
                maximumAge: 60000 // Cache result for 1 minute
              }
            );
          });
        };

        // Try to get position with timeout
        const position = await getPosition() as GeolocationPosition;
        const { latitude, longitude } = position.coords;
        
        // Get city from coordinates using reverse geocoding API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
        );
        
        if (response.ok) {
          const data = await response.json();
          let detectedCity = "";
          
          // Try to extract city name
          if (data.address) {
            detectedCity = data.address.city || data.address.town || data.address.village || "";
          }
          
          // Check if detected city is in our list
          const matchedCity = majorCities.find(city => 
            city.toLowerCase() === detectedCity.toLowerCase() ||
            detectedCity.toLowerCase().includes(city.toLowerCase())
          );
          
          if (matchedCity) {
            setSelectedCity(matchedCity);
            setAutoLocationDetected(true);
          }
        }
      } catch (error) {
        // Silently fail and use default city
        // This prevents console errors that scare users
      }
    };
    
    // Run location detection after setting default
    detectLocation();
  }, [autoLocationDetected]);
  
  // Query for properties with city filter
  const { data, isLoading } = useQuery({
    queryKey: ['/api/properties', selectedCity, selectedUniversity],
    queryFn: async () => {
      try {
        let queryParams: any = {};
        
        if (selectedCity) {
          queryParams.city = selectedCity;
        }
        
        if (selectedUniversity) {
          queryParams.university = selectedUniversity;
        }
        
        const result = await getProperties(queryParams);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Failed to fetch properties:", error);
        return [];
      }
    },
    enabled: !!selectedCity // Only run query when city is selected
  });
  
  // Ensure properties is an array
  const properties = Array.isArray(data) ? data : [];
  
  // Filter universities for the selected city
  const cityUniversities = selectedCity ? universitiesByCity[selectedCity] || [] : [];
  
  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedUniversity(""); // Reset university when city changes
  };
  
  // Handle university change
  const handleUniversityChange = (university: string) => {
    // Set to empty string if "all" is selected to maintain compatibility with existing code
    setSelectedUniversity(university === "all" ? "" : university);
  };
  
  // Handle "View All Properties" button click
  const handleViewAllClick = useCallback(() => {
    let queryParams = new URLSearchParams();
    
    if (selectedCity) {
      queryParams.set('city', selectedCity);
    }
    
    if (selectedUniversity) {
      queryParams.set('university', selectedUniversity);
    }
    
    const queryString = queryParams.toString();
    navigate(`/properties${queryString ? `?${queryString}` : ''}`);
  }, [navigate, selectedCity, selectedUniversity]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Location and filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
            <div className="w-full md:w-48 animate-pulse">
              <div className="h-10 bg-gray-300 rounded-md"></div>
            </div>
            <div className="w-full md:w-64 animate-pulse">
              <div className="h-10 bg-gray-300 rounded-md"></div>
            </div>
          </div>
        </div>
        
        {/* Property skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse border-t-4 border-t-primary">
              <div className="h-48 bg-gray-300"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>
                <div className="flex justify-between mt-4">
                  <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No properties state
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-6">
        {/* Location and filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
            <div className="w-full md:w-48">
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City">
                    <div className="flex items-center">
                      <LocationPin className="mr-2 h-4 w-4" />
                      {selectedCity || "Select City"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {majorCities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <Select 
                value={selectedUniversity} 
                onValueChange={handleUniversityChange}
                disabled={!selectedCity || cityUniversities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Universities">
                    <div className="flex items-center">
                      <School className="mr-2 h-4 w-4" />
                      {selectedUniversity || "All Universities"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Universities</SelectItem>
                  {cityUniversities.map((university) => (
                    <SelectItem key={university} value={university}>{university}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* University carousel */}
        {selectedCity && cityUniversities.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Universities in {selectedCity}</h3>
            <Carousel className="w-full">
              <CarouselContent>
                {cityUniversities.map((university) => (
                  <CarouselItem key={university} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                    <Button 
                      variant={selectedUniversity === university ? "default" : "outline"} 
                      className="w-full h-full text-xs md:text-sm whitespace-normal px-2 py-4" 
                      onClick={() => handleUniversityChange(university)}
                    >
                      {university}
                    </Button>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
        
        {/* No properties message */}
        <div className="text-center py-12">
          <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600">
            There are currently no properties available in {selectedCity}{selectedUniversity ? ` near ${selectedUniversity}` : ""}.
          </p>
          <p className="text-gray-600 mt-2">
            Try selecting a different city or university.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location and filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
          <div className="w-full md:w-48">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select City">
                  <div className="flex items-center">
                    <LocationPin className="mr-2 h-4 w-4" />
                    {selectedCity || "Select City"}
                    {autoLocationDetected && selectedCity && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">Auto</span>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {majorCities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-64">
            <Select 
              value={selectedUniversity} 
              onValueChange={handleUniversityChange}
              disabled={!selectedCity || cityUniversities.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Universities">
                  <div className="flex items-center">
                    <School className="mr-2 h-4 w-4" />
                    {selectedUniversity || "All Universities"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {cityUniversities.map((university) => (
                  <SelectItem key={university} value={university}>{university}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* University carousel */}
      {selectedCity && cityUniversities.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Universities in {selectedCity}</h3>
          <Carousel className="w-full">
            <CarouselContent>
              <CarouselItem className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                <Button 
                  variant={selectedUniversity === "all" ? "default" : "outline"} 
                  className="w-full h-full" 
                  onClick={() => handleUniversityChange("all")}
                >
                  All
                </Button>
              </CarouselItem>
              {cityUniversities.map((university) => (
                <CarouselItem key={university} className="basis-1/4 md:basis-1/5 lg:basis-1/6">
                  <Button 
                    variant={selectedUniversity === university ? "default" : "outline"} 
                    className="w-full h-full text-xs md:text-sm whitespace-normal px-2 py-4" 
                    onClick={() => handleUniversityChange(university)}
                  >
                    {university}
                  </Button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}
      
      {/* Properties grid - show up to 30 properties in 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.slice(0, 30).map((property) => {
          // Use the price directly as it already includes utilities
          const totalPrice = Number(property.price);

          return (
            <div 
              key={property.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 cursor-pointer transition-all hover:shadow-lg border-t-4 border-t-primary"
              onClick={() => window.location.href = `/properties/${property.id}`}
            >
              <div className="relative">
                {/* Main Property Image */}
                <div className="h-48 overflow-hidden">
                  <img 
                    src={(() => {
                      if (!property.images?.[0] || property.images[0].includes('placehold.co')) {
                        const lowerType = property.propertyType.toLowerCase();
                        if (lowerType.includes('house')) return '/images/house-placeholder.svg';
                        if (lowerType.includes('apartment')) return '/images/apartment-placeholder.svg';
                        if (lowerType.includes('studio')) return '/images/studio-placeholder.svg';
                        return '/images/property-placeholder.svg';
                      }
                      return property.images[0];
                    })()} 
                    alt={property.title} 
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Property Gallery - Small Images - Only show on tablet and larger */}
                <div className="hidden md:flex absolute top-0 right-0 flex-col gap-1 p-1">
                  {Array(4).fill(0).map((_, idx) => {
                    // Get placeholder or actual image
                    const thumbnailImage = () => {
                      const img = property.images?.[idx + 1];
                      if (!img || img.includes('placehold.co')) {
                        const lowerType = property.propertyType.toLowerCase();
                        if (lowerType.includes('house')) return '/images/house-placeholder.svg';
                        if (lowerType.includes('apartment')) return '/images/apartment-placeholder.svg';
                        if (lowerType.includes('studio')) return '/images/studio-placeholder.svg';
                        return '/images/property-placeholder.svg';
                      }
                      return img;
                    };
                    
                    return (
                      <div key={idx} className="w-16 h-16 overflow-hidden rounded-md">
                        <img 
                          src={thumbnailImage()}
                          alt={`${property.title} - Image ${idx + 2}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Price Tag - Positioned differently on mobile vs desktop */}
                <div className="absolute top-0 right-0 md:right-[68px] bg-primary text-white px-3 py-1 rounded-bl-lg font-medium z-10">
                  £{Number(totalPrice).toFixed(0)} pw
                </div>

                {/* All-Inclusive Tag */}
                {property.billsIncluded && (
                  <div className="absolute left-0 bottom-0 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-tr-lg font-medium z-10">
                    All-Inclusive
                  </div>
                )}

                {/* Available Tag */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                    {property.available ? 
                      `Available ${property.availableDate || '1st July 25'}` : 
                      'Now Let'}
                  </div>
                </div>

                {/* Heart Icon - Positioned differently on mobile vs desktop */}
                <div className="absolute top-2 right-2 md:right-[68px] bg-white p-1 rounded-full shadow-md z-10">
                  <Heart className="h-5 w-5 text-gray-400 cursor-pointer hover:text-red-500 transition-colors" />
                </div>
                
                {/* University badge if property has a university */}
                {property.university && (
                  <div className="absolute left-2 bottom-2 z-10">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold">
                      {property.university}
                    </div>
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="p-4">
                {/* Property Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>

                {/* Room Count and Bathroom Badges */}
                <div className="flex gap-2 mb-3">
                  <div className="bg-primary/10 flex items-center px-2 py-1 rounded-full">
                    <Bed className="h-4 w-4 mr-1 text-primary" />
                    <span className="text-xs font-medium">{property.bedrooms}</span>
                  </div>
                  <div className="bg-primary/10 flex items-center px-2 py-1 rounded-full">
                    <Bath className="h-4 w-4 mr-1 text-primary" />
                    <span className="text-xs font-medium">{property.bathrooms}</span>
                  </div>
                </div>

                {/* All-inclusive utilities section */}
                {property.billsIncluded && (
                  <div className="mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                    <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      All bills included
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Gas, electricity, water, broadband included
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {property.includedBills && (property.includedBills.includes('electricity') || property.includedBills.includes('Electricity')) && (
                        <span className="text-xs flex items-center text-gray-700">
                          <Bolt className="h-3 w-3 mr-1 text-yellow-500" /> Electricity
                        </span>
                      )}
                      {property.includedBills && (property.includedBills.includes('gas') || property.includedBills.includes('Gas')) && (
                        <span className="text-xs flex items-center text-gray-700">
                          <Flame className="h-3 w-3 mr-1 text-orange-500" /> Gas
                        </span>
                      )}
                      {property.includedBills && (property.includedBills.includes('water') || property.includedBills.includes('Water')) && (
                        <span className="text-xs flex items-center text-gray-700">
                          <Droplet className="h-3 w-3 mr-1 text-blue-500" /> Water
                        </span>
                      )}
                      {property.includedBills && (property.includedBills.includes('broadband') || property.includedBills.includes('Internet') || property.includedBills.includes('Broadband')) && (
                        <span className="text-xs flex items-center text-gray-700">
                          <Wifi className="h-3 w-3 mr-1 text-purple-500" /> Broadband
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Area */}
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-sm">{property.area || 'City Center'}</span>
                </div>

                {/* Address */}
                <p className="text-gray-700 text-sm mb-2">
                  {property.address}, {property.city}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Button 
          onClick={handleViewAllClick}
          className="px-6 py-2"
        >
          View All Properties
        </Button>
      </div>
    </div>
  );
}