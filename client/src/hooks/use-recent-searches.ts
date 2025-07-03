import { useState, useEffect } from 'react';

export interface RecentSearch {
  search: string;
  category: string;
  location: string;
  type: string;
  workArrangement: string;
  timestamp: string;
}

const STORAGE_KEY = 'job-recent-searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Custom hook to track recent job searches for personalized recommendations
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const storedSearches = localStorage.getItem(STORAGE_KEY);
    if (storedSearches) {
      try {
        const parsedSearches = JSON.parse(storedSearches);
        setRecentSearches(parsedSearches);
      } catch (error) {
        console.error('Error parsing recent searches from localStorage:', error);
        // If there's an error, reset the storage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Update localStorage when recentSearches changes
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  const addRecentSearch = (search: Omit<RecentSearch, 'timestamp'>) => {
    setRecentSearches(prevSearches => {
      // Create a new search object with timestamp
      const newSearch: RecentSearch = {
        ...search,
        timestamp: new Date().toISOString()
      };
      
      // Remove any existing searches that are identical (ignoring timestamp)
      const filteredSearches = prevSearches.filter(
        s => !(
          s.search === search.search &&
          s.category === search.category &&
          s.location === search.location &&
          s.type === search.type &&
          s.workArrangement === search.workArrangement
        )
      );
      
      // Add the new search to the beginning of the array and limit to max size
      return [newSearch, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
}