import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Coin,
  ExternalLink,
  GraduationCap,
  HomeIcon,
  Info,
  RefreshCw,
} from "lucide-react";

interface FundingOpportunity {
  id: string;
  title: string;
  description: string;
  fundingType: string;
  eligibility: string[];
  applicationDeadline: string;
  maxAmount: string;
  relevanceScore: number;
  source: string;
  url: string;
}

interface GovernmentFundingProps {
  userType: 'landlord' | 'agent';
  propertyData?: any;
}

export default function GovernmentFunding({ userType, propertyData }: GovernmentFundingProps) {
  const { toast } = useToast();
  const [selectedFunding, setSelectedFunding] = useState<string | null>(null);
  
  // Fetch funding opportunities
  const { data: fundingOpportunities, isLoading, refetch } = useQuery({
    queryKey: ['/api/government-funding', userType],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Request refresh of funding data
  const refreshMutation = useMutation({
    mutationFn: () => {
      return apiRequest('POST', '/api/government-funding/refresh', { userType });
    },
    onSuccess: () => {
      toast({
        title: "Funding Information Updated",
        description: "The latest government funding opportunities have been fetched.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to refresh funding information. Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Handle refresh button click
  const handleRefresh = () => {
    refreshMutation.mutate();
  };
  
  // Get funding type badge color
  const getFundingTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grant':
        return 'bg-green-100 text-green-800';
      case 'tax relief':
        return 'bg-blue-100 text-blue-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      case 'subsidy':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort opportunities by relevance
  const sortedOpportunities = fundingOpportunities 
    ? [...fundingOpportunities].sort((a, b) => b.relevanceScore - a.relevanceScore)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Government Funding Opportunities</h2>
          <p className="text-muted-foreground">
            AI-powered funding opportunities for {userType === 'landlord' ? 'landlords' : 'letting agents'}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="gap-2"
        >
          {refreshMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full rounded-lg" />
          <Skeleton className="h-[125px] w-full rounded-lg" />
          <Skeleton className="h-[125px] w-full rounded-lg" />
        </div>
      ) : sortedOpportunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Funding Opportunities</h3>
            <p className="text-muted-foreground max-w-md mt-2 mb-4">
              No relevant government funding opportunities were found for your properties. Check back later or adjust your property details.
            </p>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {sortedOpportunities.map((funding: FundingOpportunity) => (
              <Card key={funding.id} className={selectedFunding === funding.id ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{funding.title}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={getFundingTypeColor(funding.fundingType)}>
                          {funding.fundingType}
                        </Badge>
                        <span className="text-sm flex items-center gap-1">
                          <Coin className="h-3.5 w-3.5" /> Up to {funding.maxAmount}
                        </span>
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Deadline: {funding.applicationDeadline}
                        </span>
                      </CardDescription>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedFunding(selectedFunding === funding.id ? null : funding.id)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className={`h-4 w-4 transition-transform ${selectedFunding === funding.id ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                
                {selectedFunding === funding.id && (
                  <>
                    <CardContent className="pb-3 pt-0">
                      <p className="text-sm mb-4">{funding.description}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Eligibility Criteria</h4>
                          <ul className="text-sm list-disc pl-5 space-y-1">
                            {funding.eligibility.map((criteria, idx) => (
                              <li key={idx}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4" />
                          <span>Relevance score: {funding.relevanceScore}/10</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-0">
                      <div className="text-sm text-muted-foreground">
                        Source: {funding.source}
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={funding.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Apply Now
                        </a>
                      </Button>
                    </CardFooter>
                  </>
                )}
              </Card>
            ))}
          </div>
          
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center text-sm text-muted-foreground bg-muted px-4 py-2 rounded-md">
              <GraduationCap className="h-4 w-4 mr-2" />
              <span>AI-powered funding opportunities are tailored to your property portfolio and updated regularly.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}