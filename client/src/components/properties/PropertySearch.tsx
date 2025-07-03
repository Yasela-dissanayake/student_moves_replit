import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Filter, MapPin, School, Home, Bed, Coins, Calendar, Wifi, Search, Flame, Droplet, Bolt } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface PropertySearchProps {
  onSearch: (filters: any) => void;
  initialFilters?: any;
}

export default function PropertySearch({ onSearch, initialFilters = {} }: PropertySearchProps) {
  const [searchMode, setSearchMode] = useState<'basic' | 'advanced'>('basic');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [location, setLocation] = useState(initialFilters.city || '');
  const [university, setUniversity] = useState(initialFilters.university || '');
  const [propertyType, setPropertyType] = useState(initialFilters.propertyType || '');
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms || '');
  const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms || '');
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters.maxPrice ? Number(initialFilters.maxPrice) : 500);
  const [minPrice, setMinPrice] = useState<number>(initialFilters.minPrice ? Number(initialFilters.minPrice) : 50);
  const [distanceToUniversity, setDistanceToUniversity] = useState<number>(initialFilters.distanceToUniversity ? Number(initialFilters.distanceToUniversity) : 5);
  const [moveInDate, setMoveInDate] = useState(initialFilters.moveInDate || '');
  const [includeUnavailable, setIncludeUnavailable] = useState(initialFilters.includeUnavailable || false);
  const [allBillsIncluded, setAllBillsIncluded] = useState(initialFilters.allBillsIncluded || false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState({
    electricity: initialFilters.includedBills?.includes('electricity') || false,
    gas: initialFilters.includedBills?.includes('gas') || false,
    water: initialFilters.includedBills?.includes('water') || false,
    internet: initialFilters.includedBills?.includes('internet') || false,
  });
  const [hasVirtualTour, setHasVirtualTour] = useState(initialFilters.hasVirtualTour || false);
  const [features, setFeatures] = useState({
    parking: initialFilters.features?.includes('parking') || false,
    garden: initialFilters.features?.includes('garden') || false,
    petsAllowed: initialFilters.features?.includes('pets_allowed') || false,
    furnished: initialFilters.features?.includes('furnished') || initialFilters.furnished || false,
    washingMachine: initialFilters.features?.includes('washing_machine') || false,
    dishwasher: initialFilters.features?.includes('dishwasher') || false,
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (location) count++;
    if (university && university !== 'any') count++;
    if (propertyType && propertyType !== 'any_type') count++;
    if (bedrooms && bedrooms !== 'any_bedrooms') count++;
    if (bathrooms && bathrooms !== 'any_bathrooms') count++;
    if (maxPrice && maxPrice !== 500) count++;
    if (minPrice && minPrice !== 50) count++;
    if (moveInDate) count++;
    if (includeUnavailable) count++;
    if (allBillsIncluded) count++;
    if (hasVirtualTour) count++;
    if (distanceToUniversity !== 5) count++;
    
    // Count utilities
    Object.values(utilitiesIncluded).forEach(val => { if (val) count++; });
    
    // Count features
    Object.values(features).forEach(val => { if (val) count++; });
    
    setActiveFiltersCount(count);
  }, [
    location, university, propertyType, bedrooms, bathrooms, maxPrice, minPrice,
    moveInDate, includeUnavailable, allBillsIncluded, hasVirtualTour, utilitiesIncluded,
    features, distanceToUniversity
  ]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Collect included utilities
    const includedBills = [];
    if (utilitiesIncluded.electricity) includedBills.push('electricity');
    if (utilitiesIncluded.gas) includedBills.push('gas');
    if (utilitiesIncluded.water) includedBills.push('water');
    if (utilitiesIncluded.internet) includedBills.push('internet');
    
    // Collect selected features
    const selectedFeatures = [];
    if (features.parking) selectedFeatures.push('parking');
    if (features.garden) selectedFeatures.push('garden');
    if (features.petsAllowed) selectedFeatures.push('pets_allowed');
    if (features.washingMachine) selectedFeatures.push('washing_machine');
    if (features.dishwasher) selectedFeatures.push('dishwasher');
    
    const filters = {
      ...(location && { city: location }),
      ...(university && university !== 'any' && { university }),
      ...(propertyType && propertyType !== 'any_type' && { propertyType }),
      ...(bedrooms && bedrooms !== 'any_bedrooms' && { bedrooms: Number(bedrooms) }),
      ...(bathrooms && bathrooms !== 'any_bathrooms' && { bathrooms: Number(bathrooms) }),
      ...(maxPrice && maxPrice !== 500 && { maxPrice }),
      ...(minPrice && minPrice !== 50 && { minPrice }),
      ...(moveInDate && { moveInDate }),
      ...(includeUnavailable && { includeUnavailable: true }),
      ...(allBillsIncluded && { allBillsIncluded: true }),
      ...(hasVirtualTour && { hasVirtualTour: true }),
      ...(distanceToUniversity !== 5 && { distanceToUniversity }),
      ...(includedBills.length > 0 && { includedBills }),
      ...(selectedFeatures.length > 0 && { features: selectedFeatures }),
      ...(features.furnished && { furnished: true }),
    };
    
    console.log('Sending search filters:', filters);
    onSearch(filters);
  };

  const resetFilters = () => {
    setLocation('');
    setUniversity('');
    setPropertyType('');
    setBedrooms('');
    setBathrooms('');
    setMaxPrice(500);
    setMinPrice(50);
    setDistanceToUniversity(5);
    setMoveInDate('');
    setIncludeUnavailable(false);
    setAllBillsIncluded(false);
    setHasVirtualTour(false);
    setUtilitiesIncluded({
      electricity: false,
      gas: false,
      water: false,
      internet: false,
    });
    setFeatures({
      parking: false,
      garden: false,
      petsAllowed: false,
      furnished: false,
      washingMachine: false,
      dishwasher: false,
    });
  };

  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      handleSearch();
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-orange-500">Find Your Perfect Student Home</CardTitle>
          <div>
            <div className="flex">
              <Button 
                variant={searchMode === 'basic' ? 'default' : 'outline'} 
                className="rounded-l-md rounded-r-none"
                onClick={() => setSearchMode('basic')}
              >
                Basic
              </Button>
              <Button 
                variant={searchMode === 'advanced' ? 'default' : 'outline'} 
                className="rounded-l-none rounded-r-md"
                onClick={() => setSearchMode('advanced')}
              >
                Advanced
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSearch}>
          {/* Basic Search Mode */}
          {searchMode === 'basic' && (
            <div className="space-y-4 mt-0">
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="location-basic" 
                  placeholder="Enter city or postcode..." 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="property-type-basic" className="h-10">
                      <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_type">Any type</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="house">Shared House</SelectItem>
                      <SelectItem value="flat">Flat/Apartment</SelectItem>
                      <SelectItem value="ensuite">En-suite Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger id="bedrooms-basic" className="h-10">
                      <Bed className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_bedrooms">Any bedrooms</SelectItem>
                      <SelectItem value="1">1 bedroom</SelectItem>
                      <SelectItem value="2">2 bedrooms</SelectItem>
                      <SelectItem value="3">3 bedrooms</SelectItem>
                      <SelectItem value="4">4 bedrooms</SelectItem>
                      <SelectItem value="5">5+ bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Coins className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="max-price-basic" 
                      type="number"
                      placeholder="Max price (per week)" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button type="submit" className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={resetFilters} type="button">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Advanced Search Mode */}
          {searchMode === 'advanced' && (
            <div className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> City/Postcode
                  </Label>
                  <Input 
                    id="location" 
                    placeholder="e.g. Manchester, M1 1AA" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="university" className="flex items-center gap-1">
                    <School className="h-4 w-4" /> University
                  </Label>
                  <Select value={university} onValueChange={setUniversity}>
                    <SelectTrigger id="university">
                      <SelectValue placeholder="Any university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any university</SelectItem>
                      <SelectItem value="University of Manchester">University of Manchester</SelectItem>
                      <SelectItem value="University of Leeds">University of Leeds</SelectItem>
                      <SelectItem value="University of Birmingham">University of Birmingham</SelectItem>
                      <SelectItem value="University of Liverpool">University of Liverpool</SelectItem>
                      <SelectItem value="University of Nottingham">University of Nottingham</SelectItem>
                      <SelectItem value="University of Oxford">University of Oxford</SelectItem>
                      <SelectItem value="University of Cambridge">University of Cambridge</SelectItem>
                      <SelectItem value="Imperial College London">Imperial College London</SelectItem>
                      <SelectItem value="University College London">University College London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property-type" className="flex items-center gap-1">
                    <Home className="h-4 w-4" /> Property Type
                  </Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger id="property-type">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_type">Any type</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="house">Shared House</SelectItem>
                      <SelectItem value="flat">Flat/Apartment</SelectItem>
                      <SelectItem value="ensuite">En-suite Room</SelectItem>
                      <SelectItem value="student_hall">Student Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="flex items-center gap-1">
                    <Bed className="h-4 w-4" /> Bedrooms
                  </Label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger id="bedrooms">
                      <SelectValue placeholder="Any bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_bedrooms">Any bedrooms</SelectItem>
                      <SelectItem value="1">1 bedroom</SelectItem>
                      <SelectItem value="2">2 bedrooms</SelectItem>
                      <SelectItem value="3">3 bedrooms</SelectItem>
                      <SelectItem value="4">4 bedrooms</SelectItem>
                      <SelectItem value="5">5+ bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="flex items-center gap-1">
                    <Bed className="h-4 w-4" /> Bathrooms
                  </Label>
                  <Select value={bathrooms} onValueChange={setBathrooms}>
                    <SelectTrigger id="bathrooms">
                      <SelectValue placeholder="Any bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_bathrooms">Any bathrooms</SelectItem>
                      <SelectItem value="1">1 bathroom</SelectItem>
                      <SelectItem value="2">2 bathrooms</SelectItem>
                      <SelectItem value="3">3+ bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="price-range" className="flex items-center gap-1">
                    <Coins className="h-4 w-4" /> Price Range (per week)
                  </Label>
                  <span className="text-primary font-medium">£{minPrice} - £{maxPrice}</span>
                </div>
                <div className="pt-6 px-2">
                  <Slider
                    id="price-range"
                    min={50}
                    max={500}
                    step={10}
                    value={[minPrice, maxPrice]}
                    onValueChange={(values) => {
                      setMinPrice(values[0]);
                      setMaxPrice(values[1]);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="move-in-date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Available From
                </Label>
                <Input
                  id="move-in-date"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distance-to-university" className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <School className="h-4 w-4" /> Max Distance to University
                  </span>
                  <span className="text-primary font-medium">{distanceToUniversity} miles</span>
                </Label>
                <Slider
                  id="distance-to-university"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={[distanceToUniversity]}
                  onValueChange={(values) => setDistanceToUniversity(values[0])}
                />
              </div>
              
              <Collapsible open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button" className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
                    )}
                    {isMoreFiltersOpen ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Bills & Utilities</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="all-bills-included" className="cursor-pointer">All bills included</Label>
                          <Switch
                            id="all-bills-included"
                            checked={allBillsIncluded}
                            onCheckedChange={setAllBillsIncluded}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="electricity-included" className="flex items-center cursor-pointer gap-1">
                            <Bolt className="h-4 w-4 text-yellow-500" /> Electricity
                          </Label>
                          <Switch
                            id="electricity-included"
                            checked={utilitiesIncluded.electricity}
                            onCheckedChange={(checked) => 
                              setUtilitiesIncluded({...utilitiesIncluded, electricity: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="gas-included" className="flex items-center cursor-pointer gap-1">
                            <Flame className="h-4 w-4 text-orange-500" /> Gas
                          </Label>
                          <Switch
                            id="gas-included"
                            checked={utilitiesIncluded.gas}
                            onCheckedChange={(checked) => 
                              setUtilitiesIncluded({...utilitiesIncluded, gas: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="water-included" className="flex items-center cursor-pointer gap-1">
                            <Droplet className="h-4 w-4 text-blue-500" /> Water
                          </Label>
                          <Switch
                            id="water-included"
                            checked={utilitiesIncluded.water}
                            onCheckedChange={(checked) => 
                              setUtilitiesIncluded({...utilitiesIncluded, water: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="internet-included" className="flex items-center cursor-pointer gap-1">
                            <Wifi className="h-4 w-4 text-purple-500" /> Internet
                          </Label>
                          <Switch
                            id="internet-included"
                            checked={utilitiesIncluded.internet}
                            onCheckedChange={(checked) => 
                              setUtilitiesIncluded({...utilitiesIncluded, internet: checked})
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Property Features</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="furnished" className="cursor-pointer">Furnished</Label>
                          <Switch
                            id="furnished"
                            checked={features.furnished}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, furnished: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="parking" className="cursor-pointer">Parking Available</Label>
                          <Switch
                            id="parking"
                            checked={features.parking}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, parking: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="garden" className="cursor-pointer">Garden/Outdoor Space</Label>
                          <Switch
                            id="garden"
                            checked={features.garden}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, garden: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pets-allowed" className="cursor-pointer">Pets Allowed</Label>
                          <Switch
                            id="pets-allowed"
                            checked={features.petsAllowed}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, petsAllowed: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="washing-machine" className="cursor-pointer">Washing Machine</Label>
                          <Switch
                            id="washing-machine"
                            checked={features.washingMachine}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, washingMachine: checked})
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="dishwasher" className="cursor-pointer">Dishwasher</Label>
                          <Switch
                            id="dishwasher"
                            checked={features.dishwasher}
                            onCheckedChange={(checked) => 
                              setFeatures({...features, dishwasher: checked})
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-unavailable" 
                      checked={includeUnavailable}
                      onCheckedChange={(checked) => setIncludeUnavailable(checked as boolean)}
                    />
                    <Label htmlFor="include-unavailable" className="cursor-pointer">Include unavailable properties</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="has-virtual-tour" 
                      checked={hasVirtualTour}
                      onCheckedChange={(checked) => setHasVirtualTour(checked as boolean)}
                    />
                    <Label htmlFor="has-virtual-tour" className="cursor-pointer">Only show properties with virtual tours</Label>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <div className="flex items-center gap-4">
                <Button type="submit" className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Search Properties
                </Button>
                
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={resetFilters} type="button">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}