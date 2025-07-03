import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import PropertySearch from '@/components/properties/PropertySearch';
import PropertyCard from '@/components/properties/PropertyCard';
import { PropertyType } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';

export default function Properties() {
  const [location, params] = useLocation();
  const [filters, setFilters] = useState<any>({});
  const [isFiltering, setIsFiltering] = useState(false);

  // Extract initial filters from URL params
  useEffect(() => {
    if (params && typeof params === 'string') {
      const searchParams = new URLSearchParams(params);
      const initialFilters: Record<string, string> = {};
      
      // Use forEach instead of entries() to avoid typechecking issues
      searchParams.forEach((value, key) => {
        initialFilters[key] = value;
      });
      
      if (Object.keys(initialFilters).length > 0) {
        setFilters(initialFilters);
      }
    }
  }, [params]);

  // Query for properties with filters
  const { data: properties, isLoading, isError, error } = useQuery<PropertyType[]>({
    queryKey: ['/api/properties', filters],
    queryFn: async ({ queryKey }: { queryKey: readonly [string, Record<string, unknown>] }): Promise<PropertyType[]> => {
      const [endpoint, filterParams] = queryKey;
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filterParams && typeof filterParams === 'object') {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value && value !== '' && value !== 'Any' && value !== 'All Cities') {
            params.append(key, String(value));
          }
        });
      }
      
      // Construct URL with query params
      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching properties from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Properties fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch properties: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Properties data received:', data?.length || 0, 'properties');
      return data as PropertyType[];
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  const handleSearch = (newFilters: any) => {
    setIsFiltering(true);
    setFilters(newFilters);
    
    // Update URL with search params
    const searchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value as string);
      }
    });
    
    const newUrl = `/properties${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    window.history.pushState(null, '', newUrl);
    
    setIsFiltering(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search Sidebar */}
        <div className="lg:w-1/3 xl:w-1/4">
          <PropertySearch onSearch={handleSearch} initialFilters={filters} />
        </div>
        
        {/* Properties Grid */}
        <div className="lg:w-2/3 xl:w-3/4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Student Properties</h1>
            <p className="text-gray-600">
              Find your perfect all-inclusive student accommodation
            </p>
          </div>
          
          {isLoading || isFiltering ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg">Loading properties...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-16 bg-red-50 rounded-lg">
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error loading properties</h3>
              <p className="text-red-600">{error?.message || 'Please try again later'}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : properties && Array.isArray(properties) && properties.length > 0 ? (
            <div>
              <p className="mb-4 text-gray-600">
                Showing {properties.length} properties
                {Object.keys(filters).length > 0 && " with your filters"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property: PropertyType) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
