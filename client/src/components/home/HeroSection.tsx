import { Search, CheckCircle, Bolt, Droplet, Wifi, Package, Flame, Loader2 } from 'lucide-react';
import { SearchProperties } from '@/components/SearchProperties';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Use API endpoint that correctly serves city images
// This provides a more reliable way to access the images in both dev and production
const CITY_IMAGES: Record<string, string> = {
  // London - Big Ben and Parliament 
  'London': '/api/city-images/london',
  
  // Manchester - Manchester skyline with Beetham Tower
  'Manchester': '/api/city-images/manchester',
  
  // Birmingham - The Cube and canal area
  'Birmingham': '/api/city-images/birmingham',
  
  // Leeds - Leeds university campus
  'Leeds': '/api/city-images/leeds',
  
  // Liverpool - Three Graces waterfront buildings
  'Liverpool': '/api/city-images/liverpool'
};

// Direct access to images as backup (works in dev and production)
// All paths are now absolute from the public directory
const DIRECT_CITY_IMAGES: Record<string, string> = {
  'London': '/images/london.jpg',
  'Manchester': '/images/manchester.jpg', // Using consistent path pattern
  'Birmingham': '/images/birmingham.jpg', // Using consistent path pattern
  'Leeds': '/images/leeds.jpg',
  'Liverpool': '/images/liverpool.jpg' // Using consistent path pattern
};

// Default image - direct path for reliability
const DEFAULT_IMAGE = '/images/london.jpg';

export default function HeroSection() {
  const [selectedCity, setSelectedCity] = useState<string>('London');
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [cityImageUrl, setCityImageUrl] = useState<string>(DEFAULT_IMAGE);
  
  // Get city from URL, localStorage, or default
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    const storedCity = localStorage.getItem('selectedCity');
    
    // City priority: 1. URL parameter, 2. LocalStorage, 3. Default (London)
    if (cityParam) {
      setSelectedCity(cityParam);
    } else if (storedCity) {
      setSelectedCity(storedCity);
    } else {
      // Default to London if no city is specified
      setSelectedCity('London');
      localStorage.setItem('selectedCity', 'London');
    }
    
    // Listen for custom city change events from search components
    const handleCityChange = (event: CustomEvent) => {
      if (event.detail && event.detail.city) {
        setSelectedCity(event.detail.city);
        setIsImageLoading(true); // Trigger loading when city changes
      }
    };
    
    window.addEventListener('cityChanged', handleCityChange as EventListener);
    
    return () => {
      window.removeEventListener('cityChanged', handleCityChange as EventListener);
    };
  }, []);
  
  // Remove complex geolocation for now to fix loading issues
  // We'll just use the selected city from localStorage or default to London

  // Store city selection and update image URL when city changes
  useEffect(() => {
    if (selectedCity) {
      // Update localStorage with selected city
      localStorage.setItem('selectedCity', selectedCity);
      
      // Set image URL based on city - using type safety
      setIsImageLoading(true);
      
      // Simple direct approach for maximum reliability
      const loadDirectCityImage = () => {
        // Leeds has been problematic, so we handle it specially
        if (selectedCity === 'Leeds') {
          console.log('Setting direct Leeds image path');
          setCityImageUrl('/images/leeds.jpg');
        }
        // London is our default fallback city
        else if (selectedCity === 'London') {
          console.log('Setting direct London image path');
          setCityImageUrl('/images/london.jpg');
        }
        // For other cities, try the direct path if available, otherwise default to London
        else if (Object.keys(DIRECT_CITY_IMAGES).includes(selectedCity)) {
          const directPath = DIRECT_CITY_IMAGES[selectedCity as keyof typeof DIRECT_CITY_IMAGES];
          console.log(`Setting direct path for ${selectedCity}: ${directPath}`);
          setCityImageUrl(directPath);
        }
        // Fallback to London for any unknown city
        else {
          console.log(`Unknown city ${selectedCity}, using London as fallback`);
          setCityImageUrl('/images/london.jpg');
        }
      };
      
      // Always use the direct path approach
      loadDirectCityImage();
      setIsImageLoading(false);
    }
  }, [selectedCity]);

  return (
    <div className="relative bg-slate-50 text-black">
      {/* Hero image section */}
      <div className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] overflow-hidden">
        {/* City image - using the cityImageUrl state */}
        <img 
          src={cityImageUrl}
          alt={`${selectedCity} student accommodation`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: isImageLoading ? 0 : 1 }}
          onLoad={() => {
            console.log(`Successfully loaded image for ${selectedCity}: ${cityImageUrl}`);
            setIsImageLoading(false);
          }}
          onError={(e) => {
            // If image fails to load, use a simple local path approach
            console.error(`Failed to load image for ${selectedCity}, using static image`, e);
            
            // For Leeds specifically, hardcode the static path 
            if (selectedCity === 'Leeds') {
              console.log(`Using direct static path for Leeds`);
              setCityImageUrl('/images/leeds.jpg');
            } else if (selectedCity === 'London') {
              console.log(`Using direct static path for London`);
              setCityImageUrl('/images/london.jpg');
            } else {
              // Fall back to London as default
              console.log(`Falling back to London static image`);
              setCityImageUrl('/images/london.jpg');
            }
            
            setIsImageLoading(false);
          }}
        />
        
        {/* Loading indicator */}
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          </div>
        )}
        
        {/* City name overlay */}
        <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full font-medium shadow-md">
          {selectedCity}
        </div>
        
        {/* Overlay with gradient for better text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        
        {/* Content container with better layout for mobile and desktop */}
        <div className="absolute inset-0 flex flex-col justify-center items-start px-4 sm:px-8 lg:px-16">
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            {/* Updated typography style matching SimpleStudentLiving with orange accent */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-500 mb-3 sm:mb-4 leading-tight">
              Find Your Perfect <span className="text-white">Student Home</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
              <span className="font-bold text-orange-300">ALL BILLS INCLUDED</span> - Gas, electricity, water, broadband, and maintenance in one simple package
            </p>
            
            {/* Search Box Container */}
            <div className="w-full max-w-3xl z-10 bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg border border-gray-100">
              <SearchProperties />
            </div>
          </div>
        </div>
      </div>
      
      {/* All-inclusive package banner - ENHANCED (White version) */}
      <div className="bg-white border-t border-b border-gray-200">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3 flex-shrink-0" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">ALL BILLS INCLUDED</h2>
              </div>
            </div>
            
            <p className="text-gray-700 text-center mt-4 max-w-4xl mx-auto text-lg">
              Every property comes with all utilities included. Gas, electricity, water, broadband, 
              property management, and maintenance services for completely hassle-free student living.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 transition-all">
                <Bolt className="h-10 w-10 mb-2 text-yellow-500" />
                <span className="font-medium text-lg">Electricity</span>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 transition-all">
                <Flame className="h-10 w-10 mb-2 text-orange-500" />
                <span className="font-medium text-lg">Gas</span>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 transition-all">
                <Droplet className="h-10 w-10 mb-2 text-blue-500" />
                <span className="font-medium text-lg">Water</span>
              </div>
              <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 transition-all">
                <Wifi className="h-10 w-10 mb-2 text-indigo-500" />
                <span className="font-medium text-lg">Broadband</span>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button className="bg-green-600 text-white hover:bg-green-700 font-bold py-3 px-8 rounded-full shadow-lg transition-all">
                View All-Inclusive Properties
              </button>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
}
