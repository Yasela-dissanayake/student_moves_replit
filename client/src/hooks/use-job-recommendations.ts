import { useState, useEffect } from 'react';
import { FavoriteJob } from './use-favorite-jobs';

// Types for job recommendations
export interface JobRecommendation {
  job: FavoriteJob;
  score: number;
  reason: string;
}

/**
 * Custom hook for generating job recommendations based on user preferences and favorites
 */
export function useJobRecommendations(
  allJobs: FavoriteJob[], 
  favorites: FavoriteJob[],
  recentSearches: Array<{
    search: string;
    category: string;
    location: string;
    type: string;
    workArrangement: string;
  }> = []
) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial loading state
    setIsLoading(true);
    
    // Simple timeout to simulate loading and avoid UI jank
    const timer = setTimeout(() => {
      // Generate recommendations
      const results = generateRecommendations();
      setRecommendations(results);
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [allJobs, favorites, recentSearches]);

  /**
   * Generate job recommendations based on user preferences
   */
  const generateRecommendations = (): JobRecommendation[] => {
    // If no jobs, return empty array
    if (!allJobs || allJobs.length === 0) {
      return [];
    }
    
    // Find jobs not in favorites
    const availableJobs = allJobs.filter(job => 
      !favorites.some(fav => fav.id === job.id)
    );
    
    // If no jobs available after filtering, return empty array
    if (availableJobs.length === 0) {
      return [];
    }
    
    // Initialize result array
    const results: JobRecommendation[] = [];
    
    // Track user preferences
    const preferredCategories = new Set<string>();
    const preferredLocations = new Set<string>();
    const preferredWorkTypes = new Set<string>(); 
    const preferredSkills = new Set<string>();
    
    // Extract preferences from favorites
    favorites.forEach(job => {
      preferredCategories.add(job.category);
      preferredLocations.add(job.location);
      preferredWorkTypes.add(job.workArrangement);
      job.requiredSkills.forEach(skill => preferredSkills.add(skill));
    });
    
    // Extract preferences from recent searches
    recentSearches.forEach(search => {
      if (search.category) preferredCategories.add(search.category);
      if (search.location) preferredLocations.add(search.location);
      if (search.workArrangement) preferredWorkTypes.add(search.workArrangement);
    });
    
    // Add category-based recommendation
    if (preferredCategories.size > 0) {
      for (const category of preferredCategories) {
        const categoryMatches = availableJobs.filter(job => 
          job.category === category && 
          !results.some(r => r.job.id === job.id)
        );
        
        if (categoryMatches.length > 0) {
          // Sort by salary (highest first)
          const bestMatch = categoryMatches.sort((a, b) => b.salary - a.salary)[0];
          results.push({
            job: bestMatch,
            score: 90,
            reason: `Matches your interest in ${category}`
          });
          
          // Break after finding one good category match
          if (results.length >= 1) break;
        }
      }
    }
    
    // Add location-based recommendation
    if (preferredLocations.size > 0) {
      for (const location of preferredLocations) {
        const locationMatches = availableJobs.filter(job => 
          job.location === location && 
          !results.some(r => r.job.id === job.id)
        );
        
        if (locationMatches.length > 0) {
          // Sort by posting date (newest first)
          const bestMatch = locationMatches.sort((a, b) => 
            new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
          )[0];
          
          results.push({
            job: bestMatch,
            score: 80,
            reason: `Located in ${location} where you've shown interest`
          });
          
          // Break after finding one good location match
          if (results.length >= 2) break;
        }
      }
    }
    
    // Add work arrangement-based recommendation
    if (preferredWorkTypes.size > 0) {
      for (const workType of preferredWorkTypes) {
        const workTypeMatches = availableJobs.filter(job => 
          job.workArrangement === workType && 
          !results.some(r => r.job.id === job.id)
        );
        
        if (workTypeMatches.length > 0) {
          // Sort by salary (highest first)
          const bestMatch = workTypeMatches.sort((a, b) => b.salary - a.salary)[0];
          
          const arrangementText = 
            workType === 'remote' ? 'remote work' : 
            workType === 'onsite' ? 'on-site work' : 'hybrid work';
            
          results.push({
            job: bestMatch,
            score: 70,
            reason: `Offers ${arrangementText} that you prefer`
          });
          
          // Break after finding one good work type match
          if (results.length >= 3) break;
        }
      }
    }
    
    // If we don't have enough recommendations yet, add recent jobs
    const remainingCount = 4 - results.length;
    if (remainingCount > 0) {
      const jobsToAdd = availableJobs
        .filter(job => !results.some(r => r.job.id === job.id))
        .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
        .slice(0, remainingCount);
        
      jobsToAdd.forEach(job => {
        results.push({
          job,
          score: 60,
          reason: 'Recently posted opportunity'
        });
      });
    }
    
    // Sort results by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  };

  return { recommendations, isLoading };
}