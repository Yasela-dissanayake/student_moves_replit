import React from 'react';
import { Link } from 'wouter';
import { Briefcase, MapPin, Heart, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FavoriteJob, useFavoriteJobs } from '@/hooks/use-favorite-jobs';
import { JobRecommendation, useJobRecommendations } from '@/hooks/use-job-recommendations';
import { ShareJobDialog } from './ShareJobDialog';

interface JobRecommendationsProps {
  allJobs: FavoriteJob[];
  recentSearches?: Array<{
    search: string;
    category: string;
    location: string;
    type: string;
    workArrangement: string;
  }>;
}

export function JobRecommendations({ allJobs, recentSearches = [] }: JobRecommendationsProps) {
  const { favorites, isFavorite, toggleFavorite } = useFavoriteJobs();
  const { recommendations, isLoading } = useJobRecommendations(allJobs, favorites, recentSearches);
  
  // Always show something - if no personalized recommendations, show newest jobs
  const hasRecommendations = !isLoading && recommendations.length > 0;
  const fallbackRecommendations = !hasRecommendations ? 
    allJobs
      .filter(job => !favorites.some(fav => fav.id === job.id))
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 4)
      .map(job => ({
        job,
        score: 5,
        reason: 'Recently posted opportunity'
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-yellow-500" />
        <h3 className="text-lg font-medium">Recommended for you</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <RecommendationSkeleton key={index} />
            ))
          : hasRecommendations 
            ? recommendations.map((recommendation) => (
                <RecommendationCard 
                  key={recommendation.job.id}
                  recommendation={recommendation}
                  isFavorite={isFavorite(recommendation.job.id)}
                  onToggleFavorite={() => toggleFavorite(recommendation.job)}
                />
              ))
            : fallbackRecommendations.map((recommendation) => (
                <RecommendationCard 
                  key={recommendation.job.id}
                  recommendation={recommendation}
                  isFavorite={isFavorite(recommendation.job.id)}
                  onToggleFavorite={() => toggleFavorite(recommendation.job)}
                />
              ))
        }
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: JobRecommendation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function RecommendationCard({ recommendation, isFavorite, onToggleFavorite }: RecommendationCardProps) {
  const { job, reason } = recommendation;
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-md">
              <Link href={`/jobs/${job.id}`} className="hover:text-primary">
                {job.title}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">{job.company}</CardDescription>
          </div>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={16}
                className={cn(
                  "transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"
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
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin size={14} />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Briefcase size={14} />
            <span>{job.type}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-xs">£{job.salary} {job.salaryPeriod}</Badge>
            <Badge variant="secondary" className="text-xs">{job.workArrangement}</Badge>
          </div>
        </div>
        
        <div className="mt-3 bg-yellow-50 p-2 rounded-md text-sm text-yellow-800 border border-yellow-100">
          <Sparkles size={14} className="inline-block mr-1 text-yellow-500" />
          {reason}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/jobs/${job.id}`} className="w-full">
          <Button size="sm" variant="outline" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function RecommendationSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="w-full">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-14 w-full mt-3" />
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}