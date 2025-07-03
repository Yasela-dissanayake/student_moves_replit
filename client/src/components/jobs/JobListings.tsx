import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Loader2, Search, MapPin, Briefcase, Clock, Filter, X, Navigation, Laptop, Home, Building, ArrowUpDown, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useFavoriteJobs, FavoriteJob } from '@/hooks/use-favorite-jobs';
import { SaveSearchDialog } from './SaveSearchDialog';
import { SavedSearch } from '@/hooks/use-saved-searches';
import { ShareJobDialog } from './ShareJobDialog';
import { ExportJobsButton } from './ExportJobsButton';
import { JobRecommendations } from './JobRecommendations';
import { useRecentSearches } from '@/hooks/use-recent-searches';

interface JobFilters {
  search: string;
  category: string;
  location: string;
  type: string;
  workArrangement: string;
  distanceInKm?: number;
  latitude?: number;
  longitude?: number;
  salaryRange: [number, number];
}

export function JobListings() {
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    category: '',
    location: '',
    type: '',
    workArrangement: '',
    distanceInKm: 10,
    salaryRange: [0, 50],
  });
  
  // Sorting options
  type SortOption = 'date' | 'salary' | 'distance';
  const [sortBy, setSortBy] = useState<SortOption>('date');
  
  // View mode (all jobs or favorites)
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  
  // Initialize favorites hook
  const { favorites, isFavorite, toggleFavorite } = useFavoriteJobs();
  
  // Initialize recent searches hook for personalized recommendations
  const { recentSearches, addRecentSearch } = useRecentSearches();
  
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['/api/jobs', filters],
    enabled: true
  });
  
  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    
    setFilters(newFilters);
    
    // Track the search for recommendations (only when significantly changed)
    // Avoid tracking too many tiny adjustments
    if (
      (key === 'search' && value && value.length > 2) || 
      (key === 'category' && value) || 
      (key === 'location' && value) || 
      (key === 'type' && value) || 
      (key === 'workArrangement' && value)
    ) {
      addRecentSearch({
        search: newFilters.search,
        category: newFilters.category,
        location: newFilters.location,
        type: newFilters.type,
        workArrangement: newFilters.workArrangement
      });
    }
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      type: '',
      workArrangement: '',
      distanceInKm: 10,
      salaryRange: [0, 50],
    });
    setUserLocation(null);
  };
  
  // Function to apply a saved search
  const applySearchCriteria = (search: SavedSearch) => {
    setFilters(search.filters);
    setSortBy(search.sortBy as SortOption);
    
    // Update user location state if location coordinates are part of the saved search
    if (search.filters.latitude && search.filters.longitude) {
      setUserLocation({
        latitude: search.filters.latitude,
        longitude: search.filters.longitude
      });
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLoadingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        
        // Apply the location to filters
        setFilters(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location services to use this feature.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get user location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  // Placeholder jobs data for now
  const mockJobs = [
    {
      id: 1,
      title: 'Marketing Assistant',
      company: 'Bright Media',
      location: 'London',
      type: 'Part-Time',
      category: 'Marketing',
      workArrangement: 'hybrid',
      latitude: 51.509865,
      longitude: -0.118092,
      salary: 12,
      salaryPeriod: 'hourly',
      description: 'We are looking for a creative marketing assistant to join our team. Help with social media campaigns and content creation.',
      requiredSkills: ['Social Media', 'Content Writing', 'Adobe Creative Suite'],
      preferredSkills: ['Video Editing', 'Photography'],
      postedDate: '2025-04-01T12:00:00Z',
      applicationDeadline: '2025-04-30T23:59:59Z',
      status: 'active'
    },
    {
      id: 2,
      title: 'Student Ambassador',
      company: 'London University',
      location: 'London',
      type: 'Part-Time',
      category: 'Education',
      workArrangement: 'onsite',
      latitude: 51.522121,
      longitude: -0.130324,
      salary: 11.50,
      salaryPeriod: 'hourly',
      description: 'Represent the university at various events and help with campus tours.',
      requiredSkills: ['Communication', 'Public Speaking'],
      preferredSkills: ['Event Planning', 'Leadership'],
      postedDate: '2025-04-03T10:00:00Z',
      applicationDeadline: '2025-04-25T23:59:59Z',
      status: 'active'
    },
    {
      id: 3,
      title: 'Web Developer Intern',
      company: 'Tech Solutions',
      location: 'Manchester',
      type: 'Internship',
      category: 'IT & Software',
      workArrangement: 'remote',
      latitude: 53.480759,
      longitude: -2.242631,
      salary: 15,
      salaryPeriod: 'hourly',
      description: 'Join our development team to work on exciting web projects using modern technologies.',
      requiredSkills: ['HTML', 'CSS', 'JavaScript'],
      preferredSkills: ['React', 'Node.js', 'TypeScript'],
      postedDate: '2025-04-02T14:00:00Z',
      applicationDeadline: '2025-04-20T23:59:59Z',
      status: 'active'
    },
    {
      id: 4,
      title: 'Student Support Assistant',
      company: 'Student Services',
      location: 'Birmingham',
      type: 'Part-Time',
      category: 'Administration',
      workArrangement: 'onsite',
      latitude: 52.486243,
      longitude: -1.890401,
      salary: 10.50,
      salaryPeriod: 'hourly',
      description: 'Help provide support services to students including administration tasks and information assistance.',
      requiredSkills: ['Customer Service', 'Administration', 'MS Office'],
      preferredSkills: ['Problem Solving', 'Counseling'],
      postedDate: '2025-04-04T09:00:00Z',
      applicationDeadline: '2025-04-28T23:59:59Z',
      status: 'active'
    },
  ];
  
  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Define a type for our job data to ensure compatibility with FavoriteJob
  type Job = {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    category: string;
    workArrangement: 'onsite' | 'remote' | 'hybrid';
    latitude: number;
    longitude: number;
    salary: number;
    salaryPeriod: string;
    description: string;
    requiredSkills: string[];
    preferredSkills: string[];
    postedDate: string;
    applicationDeadline: string;
    status: string;
  };

  // Cast mock jobs to ensure type safety with FavoriteJob
  const typedMockJobs: Job[] = mockJobs.map(job => ({
    ...job,
    workArrangement: job.workArrangement as 'onsite' | 'remote' | 'hybrid'
  }));

  // Filter jobs based on all criteria
  const filteredJobs = useMemo(() => {
    // First filter the jobs
    const filtered = typedMockJobs.filter(job => {
      // Text search match
      const searchMatch = !filters.search || 
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search.toLowerCase());
        
      // Category, location, type, and salary matches
      const categoryMatch = !filters.category || job.category === filters.category;
      const locationMatch = !filters.location || job.location === filters.location;
      const typeMatch = !filters.type || job.type === filters.type;
      const salaryMatch = job.salary >= filters.salaryRange[0] && job.salary <= filters.salaryRange[1];
      
      // Work arrangement match
      const workArrangementMatch = !filters.workArrangement || job.workArrangement === filters.workArrangement;
      
      // Distance-based match (if user location is available)
      let distanceMatch = true;
      if (filters.latitude && filters.longitude && filters.distanceInKm) {
        const distance = calculateDistance(
          filters.latitude, 
          filters.longitude, 
          job.latitude, 
          job.longitude
        );
        distanceMatch = distance <= filters.distanceInKm;
      }
      
      return searchMatch && 
            categoryMatch && 
            locationMatch && 
            typeMatch && 
            salaryMatch && 
            workArrangementMatch &&
            distanceMatch;
    });
    
    // Then sort the filtered jobs
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      } else if (sortBy === 'salary') {
        return b.salary - a.salary;
      } else if (sortBy === 'distance' && filters.latitude && filters.longitude) {
        const distanceA = calculateDistance(
          filters.latitude,
          filters.longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          filters.latitude,
          filters.longitude,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      }
      return 0;
    });
  }, [mockJobs, filters, sortBy]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  // Convert recent searches format for recommendations
  const recentSearchesForRecommendations = useMemo(() => {
    return recentSearches.map(search => ({
      search: search.search,
      category: search.category,
      location: search.location,
      type: search.type,
      workArrangement: search.workArrangement
    }));
  }, [recentSearches]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Search and Filter Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search jobs by title, company, or keywords"
              className="pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto w-full flex items-center gap-2"
          >
            <Filter size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Category</label>
              <Select 
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="IT & Software">IT & Software</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Hospitality">Hospitality</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Select 
                value={filters.location} 
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="Manchester">Manchester</SelectItem>
                  <SelectItem value="Birmingham">Birmingham</SelectItem>
                  <SelectItem value="Leeds">Leeds</SelectItem>
                  <SelectItem value="Glasgow">Glasgow</SelectItem>
                  <SelectItem value="Edinburgh">Edinburgh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Job Type</label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Part-Time">Part-Time</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Work Arrangement</label>
              <Select 
                value={filters.workArrangement} 
                onValueChange={(value) => handleFilterChange('workArrangement', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Arrangement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Arrangement</SelectItem>
                  <SelectItem value="onsite">
                    <div className="flex items-center">
                      <Building size={16} className="mr-2" />
                      On-site
                    </div>
                  </SelectItem>
                  <SelectItem value="remote">
                    <div className="flex items-center">
                      <Home size={16} className="mr-2" />
                      Remote
                    </div>
                  </SelectItem>
                  <SelectItem value="hybrid">
                    <div className="flex items-center">
                      <Laptop size={16} className="mr-2" />
                      Hybrid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Hourly Pay (£{filters.salaryRange[0]} - £{filters.salaryRange[1]})</label>
              <Slider 
                value={filters.salaryRange}
                min={0}
                max={50}
                step={0.5}
                onValueChange={(value) => handleFilterChange('salaryRange', value)}
                className="my-4"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Distance-based Search</label>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  variant={userLocation ? "default" : "outline"} 
                  onClick={getUserLocation} 
                  disabled={isLoadingLocation}
                  className="flex items-center gap-2"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation size={16} />
                  )}
                  {userLocation ? "Location Found" : "Use My Location"}
                </Button>
                
                {userLocation && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Show jobs within</span>
                    <Select 
                      value={filters.distanceInKm?.toString()} 
                      onValueChange={(value) => handleFilterChange('distanceInKm', parseInt(value))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="10 km" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="25">25 km</SelectItem>
                        <SelectItem value="50">50 km</SelectItem>
                        <SelectItem value="100">100 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {locationError && (
                <Alert variant="destructive" className="mt-2 py-2">
                  <AlertDescription className="text-xs">{locationError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="md:col-span-4 flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X size={16} />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs: All Jobs / Favorites */}
      <Tabs 
        defaultValue="all" 
        value={viewMode} 
        onValueChange={(value) => setViewMode(value as 'all' | 'favorites')} 
        className="w-full mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Briefcase size={16} />
            All Jobs 
            <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredJobs.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart size={16} />
            Favorites
            <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {favorites.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Sort Controls and Save Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <p className="text-sm text-gray-500">
          {viewMode === 'all' 
            ? `${filteredJobs.length} ${filteredJobs.length === 1 ? 'job' : 'jobs'} found` 
            : `${favorites.length} favorite ${favorites.length === 1 ? 'job' : 'jobs'}`}
        </p>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Search Dialog */}
          {viewMode === 'all' && (
            <SaveSearchDialog 
              filters={filters} 
              sortBy={sortBy} 
              onApplySearch={applySearchCriteria} 
            />
          )}
          
          {/* Export Results Button */}
          <ExportJobsButton 
            jobs={viewMode === 'all' ? filteredJobs as FavoriteJob[] : favorites} 
            filename={`job-search-${viewMode === 'all' ? 'results' : 'favorites'}`}
          />
          
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  Newest first
                </div>
              </SelectItem>
              <SelectItem value="salary">
                <div className="flex items-center">
                  <ArrowUpDown size={16} className="mr-2" />
                  Highest salary
                </div>
              </SelectItem>
              <SelectItem value="distance" disabled={!userLocation}>
                <div className={cn("flex items-center", !userLocation && "opacity-50")}>
                  <Navigation size={16} className="mr-2" />
                  Closest first
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Job Recommendations */}
      {viewMode === 'all' && (
        <div className="mb-8">
          <JobRecommendations 
            allJobs={typedMockJobs as FavoriteJob[]}
            recentSearches={recentSearchesForRecommendations}
          />
          <Separator className="my-8" />
        </div>
      )}
      
      {/* Job Listings */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error loading jobs. Please try again later.
          </div>
        ) : viewMode === 'favorites' && favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-medium text-gray-900">No favorite jobs yet</h3>
              <p className="mt-1 text-gray-500">
                Save jobs you're interested in by clicking the heart icon on job listings.
              </p>
              <Button variant="outline" onClick={() => setViewMode('all')} className="mt-4">
                Browse All Jobs
              </Button>
            </div>
          </div>
        ) : viewMode === 'all' && filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          (viewMode === 'all' ? filteredJobs : favorites).map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">{job.title}</h3>
                      </Link>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(job as FavoriteJob)}
                          aria-label={isFavorite(job.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart
                            size={18}
                            className={cn(
                              "transition-colors",
                              isFavorite(job.id) ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
                            )}
                          />
                        </Button>
                        <ShareJobDialog 
                          jobTitle={job.title} 
                          jobCompany={job.company}
                          jobId={job.id}
                        />
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-1" /> 
                        {job.location}
                        {/* Show distance when user location is available */}
                        {userLocation && filters.latitude && filters.longitude && (
                          <span className="ml-1 text-xs bg-blue-50 px-2 py-0.5 rounded-full">
                            {Math.round(calculateDistance(
                              filters.latitude,
                              filters.longitude,
                              job.latitude,
                              job.longitude
                            ))} km away
                          </span>
                        )}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        <Briefcase size={16} className="mr-1" /> 
                        {job.type}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock size={16} className="mr-1" /> 
                        Posted: {formatDate(job.postedDate)}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        {job.workArrangement === 'onsite' ? (
                          <><Building size={16} className="mr-1" /> On-site</>
                        ) : job.workArrangement === 'remote' ? (
                          <><Home size={16} className="mr-1" /> Remote</>
                        ) : (
                          <><Laptop size={16} className="mr-1" /> Hybrid</>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">{job.category}</Badge>
                      <Badge variant="outline" className="bg-green-50">£{job.salary} {job.salaryPeriod}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Link href={`/jobs/${job.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-600 line-clamp-2">{job.description}</p>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.requiredSkills?.slice(0, 3).map((skill, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50">
                      {skill}
                    </Badge>
                  ))}
                  {job.requiredSkills?.length > 3 && (
                    <Badge variant="outline">+{job.requiredSkills.length - 3} more</Badge>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Apply by: {formatDate(job.applicationDeadline)}
                  </span>
                  <Link href={`/jobs/${job.id}/apply`}>
                    <Button variant="outline" size="sm">Quick Apply</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}