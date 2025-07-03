import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  MapPin,
  Search,
  Filter,
  X,
  ChevronDown,
  ShoppingBag,
  ImageIcon,
  Shield,
  CheckCircle2,
  Truck,
} from 'lucide-react';

// Define types
type FilterOptions = {
  category?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  maxDistance?: string; // Maximum distance in miles
  sortBy?: 'latest' | 'price_low' | 'price_high' | 'popular';
};

type MarketplaceItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: string[];
  location: string;
  createdAt: string;
  userId: number;
  sellerName: string;
  aiVerified: boolean;
  meetInPerson: boolean;
  canDeliver: boolean;
  tags: string[];
  listingStatus: string;
  viewCount: number;
  savedCount: number;
  distance?: number;
};

export function MarketplaceGrid() {
  // State for filters
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'latest',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setLocation] = useLocation();
  
  // Categories and conditions from the API or hardcoded
  const categories = [
    'textbooks',
    'electronics',
    'furniture',
    'clothing',
    'kitchen',
    'sports',
    'tickets',
    'services',
    'other'
  ];
  
  const conditions = [
    'new',
    'like_new',
    'good',
    'fair',
    'poor'
  ];

  // Fetch items from API
  const {
    data: apiResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/marketplace/items', filters, currentPage, searchQuery],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.condition) queryParams.append('condition', filters.condition);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.maxDistance) queryParams.append('maxDistance', filters.maxDistance);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (searchQuery) queryParams.append('search', searchQuery);
      queryParams.append('page', currentPage.toString());
      
      const response = await fetch(`/api/marketplace/items?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch marketplace items');
      }
      return response.json();
    },
  });
  
  // Update URL when filters change
  useEffect(() => {
    refetch();
  }, [filters, currentPage, searchQuery, refetch]);
  
  // Handle filter change
  const handleFilterChange = (key: keyof FilterOptions, value: string | undefined) => {
    const updatedFilters: FilterOptions = {
      ...filters,
      [key]: value,
    };
    
    // Reset to first page when filters change
    setCurrentPage(1);
    setFilters(updatedFilters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({ sortBy: 'latest' });
    setSearchQuery('');
    setCurrentPage(1);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  // Format price
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(parseFloat(price));
  };
  
  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else {
      return `${distance.toFixed(1)} km away`;
    }
  };
  
  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // difference in seconds
    
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    }
  };
  
  // Extract data from API response
  const items: MarketplaceItem[] = apiResponse?.items || [];
  const totalItems = apiResponse?.totalItems || 0;
  const totalPages = apiResponse?.totalPages || 1;
  const itemsPerPage = apiResponse?.itemsPerPage || 12;
  
  // Get visible page numbers for pagination
  const getVisiblePageNumbers = () => {
    const pages = [];
    
    // Always show the first page
    pages.push(1);
    
    // Add current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (pages.indexOf(i) === -1) pages.push(i);
    }
    
    // Always show the last page if there is more than one page
    if (totalPages > 1) pages.push(totalPages);
    
    // Add ellipses where needed
    const result = [];
    let prev = 0;
    
    for (const page of pages) {
      if (page - prev > 1) {
        result.push(-1); // Use -1 to represent ellipsis
      }
      result.push(page);
      prev = page;
    }
    
    return result;
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Filters - Mobile Toggle */}
        <div className="w-full md:hidden mb-4">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter & Sort
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {/* Filters - Sidebar */}
        <div className={`${isFilterOpen ? 'block' : 'hidden'} md:block w-full md:w-64 md:flex-shrink-0 space-y-6`}>
          {/* Search */}
          <div>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                placeholder="Search marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button 
                size="sm" 
                variant="ghost" 
                className="absolute right-0 top-0 h-full px-3"
                type="submit"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* Filters Accordion */}
          <Accordion type="multiple" defaultValue={['category', 'price', 'condition']}>
            {/* Category */}
            <AccordionItem value="category">
              <AccordionTrigger>Category</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Button
                    variant={!filters.category ? "default" : "outline"}
                    size="sm"
                    className="mr-2 mb-2"
                    onClick={() => handleFilterChange('category', undefined)}
                  >
                    All
                  </Button>
                  
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={filters.category === category ? "default" : "outline"}
                      size="sm"
                      className="mr-2 mb-2"
                      onClick={() => handleFilterChange('category', category)}
                    >
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Price */}
            <AccordionItem value="price">
              <AccordionTrigger>Price</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="minPrice">Min Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                      <Input
                        id="minPrice"
                        type="number"
                        placeholder="0"
                        className="pl-7"
                        value={filters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value || undefined)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="maxPrice">Max Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                      <Input
                        id="maxPrice"
                        type="number"
                        placeholder="1000"
                        className="pl-7"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value || undefined)}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Condition */}
            <AccordionItem value="condition">
              <AccordionTrigger>Condition</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <Button
                    variant={!filters.condition ? "default" : "outline"}
                    size="sm"
                    className="mr-2 mb-2"
                    onClick={() => handleFilterChange('condition', undefined)}
                  >
                    All
                  </Button>
                  
                  {conditions.map((condition) => (
                    <Button
                      key={condition}
                      variant={filters.condition === condition ? "default" : "outline"}
                      size="sm"
                      className="mr-2 mb-2"
                      onClick={() => handleFilterChange('condition', condition)}
                    >
                      {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {/* Location */}
            <AccordionItem value="location">
              <AccordionTrigger>Location</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">City/Area</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Leeds, Manchester"
                      value={filters.location || ''}
                      onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
                    />
                  </div>
                  
                  {filters.location && (
                    <div>
                      <Label htmlFor="maxDistance">Distance</Label>
                      <Select
                        value={filters.maxDistance}
                        onValueChange={(value) => handleFilterChange('maxDistance', value)}
                      >
                        <SelectTrigger id="maxDistance">
                          <SelectValue placeholder="Any distance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">Within 10 miles</SelectItem>
                          <SelectItem value="20">Within 20 miles</SelectItem>
                          <SelectItem value="30">Within 30 miles</SelectItem>
                          <SelectItem value="50">Within 50 miles</SelectItem>
                          <SelectItem value="100">Within 100 miles</SelectItem>
                          <SelectItem value="nationwide">Nationwide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Sort dropdown */}
          <div>
            <Label htmlFor="sort">Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: 'latest' | 'price_low' | 'price_high' | 'popular') => 
                handleFilterChange('sortBy', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters button */}
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
          
          {/* Mobile: Close Filters */}
          <div className="md:hidden">
            <Button
              variant="default"
              onClick={() => setIsFilterOpen(false)}
              className="w-full"
            >
              Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full">
          {/* Active filters */}
          {(
            filters.category || 
            filters.condition || 
            filters.minPrice || 
            filters.maxPrice || 
            filters.location ||
            filters.maxDistance ||
            searchQuery
          ) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center">
                  Search: {searchQuery}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.category && (
                <Badge variant="secondary" className="flex items-center">
                  Category: {filters.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleFilterChange('category', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.condition && (
                <Badge variant="secondary" className="flex items-center">
                  Condition: {filters.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleFilterChange('condition', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.location && (
                <Badge variant="secondary" className="flex items-center">
                  Location: {filters.location}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleFilterChange('location', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.maxDistance && filters.location && (
                <Badge variant="secondary" className="flex items-center">
                  Distance: {filters.maxDistance === 'nationwide' ? 'Nationwide' : `Within ${filters.maxDistance} miles`}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleFilterChange('maxDistance', undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="flex items-center">
                  Price: {filters.minPrice ? `£${filters.minPrice}` : '£0'} - {filters.maxPrice ? `£${filters.maxPrice}` : 'Any'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      handleFilterChange('minPrice', undefined);
                      handleFilterChange('maxPrice', undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              

              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            </div>
          )}
          
          {/* Results count */}
          <div className="mb-4 text-sm text-gray-500">
            {isLoading ? (
              'Loading results...'
            ) : isError ? (
              'Error loading results'
            ) : (
              <>
                Showing {items.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
              </>
            )}
          </div>
          
          {/* New Listing Button */}
          <div className="mb-6">
            <Button 
              onClick={() => setLocation('/marketplace/new')}
              className="w-full sm:w-auto"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Sell an Item
            </Button>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Error state */}
          {!isLoading && isError && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">Failed to load marketplace items</h3>
              <p className="text-gray-500 mb-4">There was an error loading the items. Please try again.</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !isError && items.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <div className="text-gray-400 mb-4">
                <ShoppingBag className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium mb-2">No items found</h3>
              <p className="text-gray-500 mb-4">
                {Object.keys(filters).length > 1 || searchQuery
                  ? 'Try adjusting your filters or search query'
                  : 'There are no items in the marketplace yet'}
              </p>
              
              {Object.keys(filters).length > 1 || searchQuery ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setLocation('/marketplace/new')}>
                  Sell an Item
                </Button>
              )}
            </div>
          )}
          
          {/* Grid of items */}
          {!isLoading && !isError && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card 
                  key={item.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/marketplace/${item.id}`)}
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.aiVerified && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      
                      {item.listingStatus !== 'active' && (
                        <Badge variant="destructive">
                          Sold
                        </Badge>
                      )}
                    </div>
                    
                    {/* Delivery badge */}
                    {item.canDeliver && (
                      <Badge variant="outline" className="absolute bottom-2 left-2 bg-green-50 text-green-700 border-green-300">
                        <Truck className="h-3 w-3 mr-1" />
                        Delivery
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                        <span className="font-semibold whitespace-nowrap text-primary">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-500 line-clamp-1 capitalize">
                        {item.condition.replace('_', ' ')} • {item.category.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                      {item.distance && (
                        <span className="whitespace-nowrap">• {formatDistance(item.distance)}</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                      
                      {item.meetInPerson && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          In-person
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {getVisiblePageNumbers().map((pageNum, i) => 
                  pageNum === -1 ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}