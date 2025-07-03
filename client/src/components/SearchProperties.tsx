import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Mic } from 'lucide-react';
import VoiceSearchDialog from '@/components/search/VoiceSearchDialog';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Main cities data - focused on popular student cities
const popularCities = [
  "All Cities",
  "Leeds",
  "Manchester",
  "Birmingham",
  "London",
  "Sheffield",
  "York"
];

// All cities data for the dropdown
const allCities = [
  "Bath", "Birmingham", "Brighton", "Bristol", "Cambridge", "Canterbury",
  "Cardiff", "Chester", "Coventry", "Durham", "Edinburgh", "Exeter",
  "Glasgow", "Lancaster", "Leeds", "Leicester", "Liverpool", "London",
  "Manchester", "Newcastle", "Nottingham", "Oxford", "Portsmouth", "Reading",
  "Sheffield", "Southampton", "York"
];

// Cached student areas fetched from API to avoid repeated API calls
const cityAreasCache: Record<string, string[]> = {};

// Default areas for cities not explicitly defined
const defaultAreas = [
  "All Areas",
  "City Centre", 
  "University Area", 
  "Student Quarter",
  "North", 
  "South", 
  "East", 
  "West"
];

// Bedroom counts for selection
const bedroomOptions = ["Any", "1", "2", "3", "4", "5", "6+"];

// Price ranges
const priceOptions = [
  "Any",
  "£500",
  "£750",
  "£1,000",
  "£1,500",
  "£2,000",
  "£3,000+"
];

export function SearchProperties() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('city');
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
  const [cityAreas, setCityAreas] = useState<Record<string, string[]>>({});
  const [areaLoading, setAreaLoading] = useState<boolean>(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch city-specific student areas from the API when city changes
  useEffect(() => {
    if (selectedCity && selectedCity !== 'All Cities') {
      // Check if we already have the areas for this city in our state
      if (cityAreas[selectedCity]) {
        return; // Already have the data, no need to fetch
      }
      
      // Set loading state
      setAreaLoading(true);
      
      // Fetch areas from our API
      fetch(`/api/ai/student-areas?city=${encodeURIComponent(selectedCity)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch student areas');
          }
          return response.json();
        })
        .then(data => {
          if (data.areas && Array.isArray(data.areas)) {
            // Update our city areas state with the new data
            setCityAreas(prev => ({ ...prev, [selectedCity]: data.areas }));
          } else {
            throw new Error('Invalid response format');
          }
        })
        .catch(error => {
          console.error('Error fetching student areas:', error);
          toast({
            title: "Couldn't load areas",
            description: "Using default student areas instead.",
            variant: "destructive",
          });
          
          // Use default areas for this city if API fails
          setCityAreas(prev => ({ 
            ...prev, 
            [selectedCity]: defaultAreas 
          }));
        })
        .finally(() => {
          setAreaLoading(false);
        });
    }
  }, [selectedCity, toast]);

  const handleSearch = () => {
    // Build the query parameters from the filter values
    const params = new URLSearchParams();
    
    if (selectedCity && selectedCity !== 'All Cities') {
      params.append('city', selectedCity);
      
      // Store selected city in localStorage for hero image display
      localStorage.setItem('selectedCity', selectedCity);
      
      // Create a custom event for updating the hero image
      const cityChangeEvent = new CustomEvent('cityChanged', {
        detail: { city: selectedCity }
      });
      window.dispatchEvent(cityChangeEvent);
    }
    
    if (selectedArea && selectedArea !== 'All Areas') params.append('area', selectedArea);
    if (selectedBedrooms && selectedBedrooms !== 'Any') params.append('bedrooms', selectedBedrooms);
    if (selectedPrice && selectedPrice !== 'Any') {
      // Extract numeric value from price string (e.g., "£1,000" -> "1000")
      const priceValue = selectedPrice.replace(/[£,+]/g, '');
      params.append('maxPrice', priceValue);
    }
    
    // Navigate to the properties page with filters
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden relative">
      {/* City Dropdown Panel */}
      {showCityDropdown && (
        <div className="absolute z-50 inset-0 bg-white rounded-xl shadow-md overflow-y-auto border border-orange-200">
          <div className="p-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-orange-600 mb-1 px-1">Select City</h3>
              <button 
                onClick={() => setShowCityDropdown(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
              {allCities.map((city) => (
                <div 
                  key={city}
                  className={`cursor-pointer py-1.5 px-2 hover:bg-orange-50 rounded-md text-xs sm:text-sm text-center border ${selectedCity === city ? 'bg-orange-100 border-orange-300 text-orange-700 font-medium' : 'border-gray-100'} transition-all duration-150`}
                  onClick={() => {
                    setSelectedCity(city);
                    setShowCityDropdown(false);
                    setActiveTab('location');
                  }}
                >
                  {city}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto bg-white border-b border-t border-gray-200">
            <TabsTrigger 
              value="city" 
              className={`py-3 text-sm sm:text-base font-medium rounded-none cursor-pointer border-r border-gray-200 transition-colors ${activeTab === 'city' ? 'bg-[#f37021]/5 text-[#f37021] font-semibold' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowCityDropdown(prev => !prev);
                setActiveTab('city');
              }}
            >
              <div className="flex flex-col items-center">
                <span>{selectedCity || "City"}</span>
                {selectedCity && <span className="text-xs opacity-70 truncate max-w-[80px]">{selectedCity}</span>}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="location" 
              className={`py-3 text-sm sm:text-base font-medium rounded-none cursor-pointer border-r border-gray-200 transition-colors ${activeTab === 'location' ? 'bg-[#f37021]/5 text-[#f37021] font-semibold' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowCityDropdown(false);
                if (selectedCity) {
                  setActiveTab('location');
                } else {
                  // If no city is selected, prompt to select city first
                  setShowCityDropdown(true);
                  setActiveTab('city');
                }
              }}
            >
              <div className="flex flex-col items-center">
                <span>{selectedArea || "Location"}</span>
                {selectedArea && <span className="text-xs opacity-70 truncate max-w-[80px]">{selectedArea}</span>}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="bedrooms" 
              className={`py-3 text-sm sm:text-base font-medium rounded-none cursor-pointer border-r border-gray-200 transition-colors ${activeTab === 'bedrooms' ? 'bg-[#f37021]/5 text-[#f37021] font-semibold' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowCityDropdown(false);
                setActiveTab('bedrooms');
              }}
            >
              <div className="flex flex-col items-center">
                <span>{selectedBedrooms ? `${selectedBedrooms} Beds` : "Bedrooms"}</span>
                {selectedBedrooms && <span className="text-xs opacity-70">{selectedBedrooms === "1" ? "bedroom" : "bedrooms"}</span>}
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="price" 
              className={`py-3 text-sm sm:text-base font-medium rounded-none cursor-pointer transition-colors ${activeTab === 'price' ? 'bg-[#f37021]/5 text-[#f37021] font-semibold' : 'hover:bg-gray-100'}`}
              onClick={() => {
                setShowCityDropdown(false);
                setActiveTab('price');
              }}
            >
              <div className="flex flex-col items-center">
                <span>{selectedPrice || "Price"}</span>
                {selectedPrice && selectedPrice !== "Any" && <span className="text-xs opacity-70">max</span>}
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content - Location */}
      {activeTab === 'location' && (
        <div className="p-2">
          <h3 className="text-sm font-semibold text-[#f37021] mb-1 px-1">
            {selectedCity ? `Popular Areas in ${selectedCity}` : 'Select Area'}
          </h3>
          
          {/* Loading state */}
          {areaLoading ? (
            <div className="py-4 flex justify-center items-center">
              <div className="animate-spin h-5 w-5 border-3 border-[#f37021] border-t-transparent rounded-full"></div>
              <p className="ml-2 text-[#f37021] font-medium text-sm">Loading areas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
              {(selectedCity && cityAreas[selectedCity] 
                ? cityAreas[selectedCity] 
                : defaultAreas).map((area: string) => (
                <div 
                  key={area}
                  className={`cursor-pointer py-1.5 px-2 hover:bg-[#f37021]/5 rounded-md text-xs sm:text-sm text-center border transition-all duration-150 ${selectedArea === area ? 'bg-[#f37021]/10 border-[#f37021]/30 text-[#f37021] font-medium' : 'border-gray-100'}`}
                  onClick={() => {
                    setSelectedArea(area);
                    setActiveTab('bedrooms');
                  }}
                >
                  {area}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content - Bedrooms */}
      {activeTab === 'bedrooms' && (
        <div className="p-2">
          <h3 className="text-sm font-semibold text-[#f37021] mb-1 px-1">How Many Bedrooms?</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1">
            {bedroomOptions.map((option) => (
              <div 
                key={option}
                className={`cursor-pointer py-1.5 px-2 hover:bg-[#f37021]/5 rounded-md text-xs sm:text-sm text-center border transition-all duration-150 ${selectedBedrooms === option ? 'bg-[#f37021]/10 border-[#f37021]/30 text-[#f37021] font-medium' : 'border-gray-100'}`}
                onClick={() => {
                  setSelectedBedrooms(option);
                  setActiveTab('price');
                }}
              >
                {option === "Any" ? "Any" : option}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content - Price */}
      {activeTab === 'price' && (
        <div className="p-2">
          <h3 className="text-sm font-semibold text-[#f37021] mb-1 px-1">Maximum Monthly Budget</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1">
            {priceOptions.map((option) => (
              <div 
                key={option}
                className={`cursor-pointer py-1.5 px-2 hover:bg-[#f37021]/5 rounded-md text-xs sm:text-sm text-center border transition-all duration-150 ${selectedPrice === option ? 'bg-[#f37021]/10 border-[#f37021]/30 text-[#f37021] font-medium' : 'border-gray-100'}`}
                onClick={() => {
                  setSelectedPrice(option);
                  setActiveTab('city');
                }}
              >
                {option === "Any" ? "Any" : option}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Button */}
      <div className="p-2">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0">
                  <VoiceSearchDialog className="w-8 h-8 sm:w-10 sm:h-10 bg-[#f37021]/10 text-[#f37021] hover:bg-[#f37021]/20 transition-colors border border-[#f37021]/20 rounded-md" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="max-w-[220px]">
                <div className="text-center">
                  <p className="font-medium">Search by voice</p>
                  <p className="text-xs mt-1">Try: "3 bedroom in Leeds"</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            onClick={handleSearch}
            className="w-full py-2 sm:py-3 text-sm bg-[#f37021] hover:bg-[#e06315] focus:ring-2 focus:ring-[#f37021]/50 focus:ring-offset-2 transition-all duration-150 rounded-md shadow-md flex items-center justify-center"
          >
            <Search className="mr-2 h-4 w-4" />
            Search Properties
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simplified search form for smaller displays or inline embedding
export function SimpleSearchForm() {
  const [city, setCity] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [cityAreas, setCityAreas] = useState<Record<string, string[]>>({});
  const [areaLoading, setAreaLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch city-specific student areas when city changes
  useEffect(() => {
    if (city && city !== 'All Cities') {
      // Check if we already have the areas for this city
      if (cityAreas[city]) {
        return;
      }
      
      setAreaLoading(true);
      
      fetch(`/api/ai/student-areas?city=${encodeURIComponent(city)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch student areas');
          }
          return response.json();
        })
        .then(data => {
          if (data.areas && Array.isArray(data.areas)) {
            setCityAreas(prev => ({ ...prev, [city]: data.areas }));
          } else {
            throw new Error('Invalid response format');
          }
        })
        .catch(error => {
          console.error('Error fetching student areas:', error);
          setCityAreas(prev => ({ ...prev, [city]: defaultAreas }));
        })
        .finally(() => {
          setAreaLoading(false);
        });
    }
  }, [city, toast]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (city && city !== 'All Cities') {
      params.append('city', city);
      
      // Store selected city in localStorage for hero image display
      localStorage.setItem('selectedCity', city);
      
      // Create a custom event for updating the hero image
      const cityChangeEvent = new CustomEvent('cityChanged', {
        detail: { city: city }
      });
      window.dispatchEvent(cityChangeEvent);
    }
    
    if (area && area !== 'All Areas') params.append('area', area);
    if (bedrooms && bedrooms !== 'Any') params.append('bedrooms', bedrooms);
    if (maxPrice && maxPrice !== 'Any') {
      const priceValue = maxPrice.replace(/[£,+]/g, '');
      params.append('maxPrice', priceValue);
    }
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-end">
      <div className="w-full sm:w-1/5">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="border-[#f37021]/20 focus:ring-[#f37021]/20 hover:border-[#f37021]/30">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {popularCities.map(cityName => (
              <SelectItem key={cityName} value={cityName} className="focus:bg-[#f37021]/5 cursor-pointer">
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-1/5">
        <Select 
          value={area} 
          onValueChange={setArea}
          disabled={!city || city === 'All Cities' || areaLoading}
        >
          <SelectTrigger className="border-[#f37021]/20 focus:ring-[#f37021]/20 hover:border-[#f37021]/30">
            {areaLoading ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-[#f37021] border-t-transparent rounded-full mr-2"></div>
                <span>Loading areas...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select area" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Areas" className="focus:bg-[#f37021]/5 cursor-pointer">
              All Areas
            </SelectItem>
            {city && city !== 'All Cities' && cityAreas[city] ? (
              cityAreas[city].map(areaName => (
                <SelectItem key={areaName} value={areaName} className="focus:bg-[#f37021]/5 cursor-pointer">
                  {areaName}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                Select a city first
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-1/5">
        <Select 
          value={bedrooms} 
          onValueChange={setBedrooms}
        >
          <SelectTrigger className="border-[#f37021]/20 focus:ring-[#f37021]/20 hover:border-[#f37021]/30">
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            {bedroomOptions.map(option => (
              <SelectItem key={option} value={option} className="focus:bg-[#f37021]/5 cursor-pointer">
                {option === "Any" ? "Any bedrooms" : 
                  option === "1" ? "1 bedroom" : 
                  `${option} bedrooms`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-1/5">
        <Select 
          value={maxPrice} 
          onValueChange={setMaxPrice}
        >
          <SelectTrigger className="border-[#f37021]/20 focus:ring-[#f37021]/20 hover:border-[#f37021]/30">
            <SelectValue placeholder="Max price" />
          </SelectTrigger>
          <SelectContent>
            {priceOptions.map(option => (
              <SelectItem key={option} value={option} className="focus:bg-[#f37021]/5 cursor-pointer">
                {option === "Any" ? "Any price" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <VoiceSearchDialog className="bg-[#f37021]/10 text-[#f37021] hover:bg-[#f37021]/20 transition-colors border border-[#f37021]/20 rounded-md" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-[220px]">
              <div className="text-center">
                <p className="font-medium">Search properties by voice</p>
                <p className="text-xs mt-1">Try saying: "3 bedroom house in Leeds with bills included"</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          onClick={handleSearch} 
          className="w-full sm:w-auto bg-[#f37021] hover:bg-[#e06315] focus:ring-2 focus:ring-[#f37021]/50 focus:ring-offset-2 transition-all duration-200 shadow-md"
        >
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}