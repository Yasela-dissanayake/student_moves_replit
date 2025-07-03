import { useState, useEffect } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  timestamp: string;
  filters: {
    search: string;
    category: string;
    location: string;
    type: string;
    workArrangement: string;
    distanceInKm?: number;
    latitude?: number;
    longitude?: number;
    salaryRange: [number, number];
  };
  sortBy: string;
}

/**
 * Hook to manage saved job searches
 * Persists saved searches to localStorage
 */
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('savedJobSearches');
    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches);
        setSavedSearches(parsedSearches);
      } catch (e) {
        console.error('Error parsing saved job searches from localStorage', e);
      }
    }
    setLoaded(true);
  }, []);

  // Save searches to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('savedJobSearches', JSON.stringify(savedSearches));
    }
  }, [savedSearches, loaded]);

  // Generate a random ID for a new saved search
  const generateSearchId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  };

  // Add a new saved search
  const saveSearch = (searchName: string, filters: SavedSearch['filters'], sortBy: string): SavedSearch => {
    const newSearch: SavedSearch = {
      id: generateSearchId(),
      name: searchName,
      timestamp: new Date().toISOString(),
      filters,
      sortBy
    };
    
    setSavedSearches(prev => [newSearch, ...prev]);
    return newSearch;
  };

  // Remove a saved search by ID
  const removeSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId));
  };

  // Update an existing saved search
  const updateSearch = (searchId: string, updates: Partial<SavedSearch>) => {
    setSavedSearches(prev => 
      prev.map(search => 
        search.id === searchId 
          ? { ...search, ...updates, timestamp: new Date().toISOString() } 
          : search
      )
    );
  };
  
  // Get all saved searches
  const getAllSearches = (): SavedSearch[] => {
    return savedSearches;
  };

  // Get a specific saved search by ID
  const getSearchById = (searchId: string): SavedSearch | undefined => {
    return savedSearches.find(search => search.id === searchId);
  };

  // Clear all saved searches
  const clearAllSearches = () => {
    setSavedSearches([]);
  };

  return {
    savedSearches: getAllSearches(),
    saveSearch,
    removeSearch,
    updateSearch,
    getSearchById,
    clearAllSearches,
  };
}