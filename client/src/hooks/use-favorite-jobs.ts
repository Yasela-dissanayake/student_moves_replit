import { useState, useEffect } from 'react';

// Type for a job item (simplified version of what we have in JobListings)
export interface FavoriteJob {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: number;
  salaryPeriod: string;
  type: string;
  category: string;
  workArrangement: 'onsite' | 'remote' | 'hybrid';
  postedDate: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  applicationDeadline: string;
  status: string;
  latitude: number;
  longitude: number;
}

/**
 * Hook to manage favorite jobs
 * Persists favorites to localStorage
 */
export function useFavoriteJobs() {
  const [favorites, setFavorites] = useState<Record<number, FavoriteJob>>({});
  const [loaded, setLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteJobs');
    if (storedFavorites) {
      try {
        const parsedFavorites = JSON.parse(storedFavorites);
        setFavorites(parsedFavorites);
      } catch (e) {
        console.error('Error parsing favorite jobs from localStorage', e);
      }
    }
    setLoaded(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('favoriteJobs', JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  // Add a job to favorites
  const addFavorite = (job: FavoriteJob) => {
    setFavorites((prev) => ({
      ...prev,
      [job.id]: job,
    }));
  };

  // Remove a job from favorites
  const removeFavorite = (jobId: number) => {
    setFavorites((prev) => {
      const newFavorites = { ...prev };
      delete newFavorites[jobId];
      return newFavorites;
    });
  };

  // Check if a job is in favorites
  const isFavorite = (jobId: number): boolean => {
    return !!favorites[jobId];
  };

  // Toggle a job's favorite status
  const toggleFavorite = (job: FavoriteJob) => {
    if (isFavorite(job.id)) {
      removeFavorite(job.id);
    } else {
      addFavorite(job);
    }
  };

  // Get all favorite jobs as an array
  const getFavoriteJobs = (): FavoriteJob[] => {
    return Object.values(favorites);
  };

  // Clear all favorites
  const clearFavorites = () => {
    setFavorites({});
  };

  return {
    favorites: getFavoriteJobs(),
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}