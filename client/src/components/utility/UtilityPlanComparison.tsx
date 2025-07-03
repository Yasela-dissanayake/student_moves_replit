import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Star, AlertCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from '@/lib/auth';

type UtilityPlan = {
  id: number;
  providerId: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  unitPrice: number | null;
  standingCharge: number | null;
  contractLength: number;
  exitFees: number;
  features: string[];
  termsUrl: string;
  isPopular: boolean;
  isPromoted: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type UtilityProvider = {
  id: number;
  name: string;
  displayName: string;
  utilityType: string;
  status: string;
  logoUrl: string;
  website: string;
  greenEnergy: boolean;
  studentDiscount: boolean;
};

type ComparisonSubmissionData = {
  utilityType: string;
  searchPostcode: string;
  providersCompared: Array<{
    id: number;
    name: string;
    planId: number | null;
    currentMonthly?: number;
    estimatedMonthly?: number;
    upgradeMonthly?: number;
  }>;
  potentialSavings: number;
  resultCount: number;
  selectedProviderId: number | null;
  selectedPlanId: number | null;
  conversionToSwitch: boolean;
};

type SwitchRequestData = {
  propertyId: number;
  utilityType: string;
  currentProviderId: number | null;
  newProviderId: number;
  newPlanId: number | null;
  notes: string;
  preferredContactMethod: 'email' | 'phone';
  contactEmail: string;
  contactPhone: string;
  preferredContactTime: 'morning' | 'afternoon' | 'evening' | 'anytime';
};

interface UtilityPlanComparisonProps {
  providerId: number;
  utilityType: string;
  postcode: string;
  propertyId?: number;
  currentPlanId?: number | null;
  onRequestSwitch?: (providerId: number, planId: number | null) => void;
}

const UtilityPlanComparison = ({
  providerId,
  utilityType,
  postcode,
  propertyId,
  currentPlanId,
  onRequestSwitch
}: UtilityPlanComparisonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useSession();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<ComparisonSubmissionData | null>(null);

  // Fetch provider details
  const {
    data: providerData,
    isLoading: providerLoading
  } = useQuery({
    queryKey: ['/api/utilities/providers', providerId],
    enabled: !!providerId,
  });

  // Fetch provider plans
  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError
  } = useQuery({
    queryKey: ['/api/utilities/plans/provider', providerId],
    enabled: !!providerId,
  });

  // Mutation for recording comparison history
  const recordComparisonMutation = useMutation({
    mutationFn: (comparisonData: ComparisonSubmissionData) => 
      apiRequest('/api/utilities/comparison-history', 'POST', comparisonData),
    onSuccess: () => {
      console.log('Comparison recorded successfully');
    },
    onError: (error) => {
      console.error('Error recording comparison:', error);
    }
  });

  // Create a comparison record when plans load
  useEffect(() => {
    if (isAuthenticated && plansData?.plans && plansData.plans.length > 0 && providerData?.provider) {
      const provider = providerData.provider;
      
      // Create comparison data structure
      const comparisonData: ComparisonSubmissionData = {
        utilityType,
        searchPostcode: postcode,
        providersCompared: [{
          id: provider.id,
          name: provider.displayName,
          planId: null,
          estimatedMonthly: Math.min(...plansData.plans.map((plan: UtilityPlan) => plan.monthlyPrice))
        }],
        potentialSavings: 0, // Will be calculated when they select a specific plan
        resultCount: plansData.plans.length,
        selectedProviderId: null,
        selectedPlanId: null,
        conversionToSwitch: false
      };
      
      setComparison(comparisonData);
      
      // Record the comparison if the user is authenticated
      if (isAuthenticated) {
        recordComparisonMutation.mutate(comparisonData);
      }
    }
  }, [isAuthenticated, plansData, providerData, utilityType, postcode, recordComparisonMutation]);

  // Mutation for initiating a switch request
  const switchRequestMutation = useMutation({
    mutationFn: (requestData: SwitchRequestData) => 
      apiRequest('/api/utilities/switch-request', 'POST', requestData),
    onSuccess: () => {
      toast({
        title: 'Switch request submitted',
        description: 'Your utility switch request has been submitted successfully.',
        variant: 'default',
      });
      
      // Update comparison record if it exists
      if (comparison && selectedPlanId) {
        const updatedComparison = {
          ...comparison,
          selectedProviderId: providerId,
          selectedPlanId: selectedPlanId,
          conversionToSwitch: true
        };
        
        // Update the comparison record
        apiRequest(`/api/utilities/comparison-history/${comparison.id}/switch`, 'PATCH', {
          switched: true,
          selectedProviderId: providerId,
          selectedPlanId: selectedPlanId
        }).catch(error => {
          console.error('Error updating comparison history:', error);
        });
      }
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/switch-requests'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit switch request. Please try again.',
        variant: 'destructive',
      });
      console.error('Error submitting switch request:', error);
    }
  });

  // Handle switch request
  const handleSwitchRequest = (planId: number | null) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to request a utility switch.',
        variant: 'destructive',
      });
      return;
    }

    if (!propertyId) {
      if (onRequestSwitch) {
        onRequestSwitch(providerId, planId);
        return;
      }
      
      toast({
        title: 'Property required',
        description: 'Please select a property for this utility switch.',
        variant: 'destructive',
      });
      return;
    }

    // Prepare switch request data
    const requestData: SwitchRequestData = {
      propertyId,
      utilityType,
      currentProviderId: null, // This would be set if we know their current provider
      newProviderId: providerId,
      newPlanId: planId,
      notes: `Switch request for ${utilityType} to ${providerData?.provider?.displayName}${planId ? ` - ${plansData?.plans?.find((p: UtilityPlan) => p.id === planId)?.displayName}` : ''}`,
      preferredContactMethod: 'email',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
      preferredContactTime: 'anytime'
    };

    // Update UI state
    setSelectedPlanId(planId);
    
    // Submit the switch request
    switchRequestMutation.mutate(requestData);
  };

  // Error handling
  useEffect(() => {
    if (plansError) {
      toast({
        title: 'Error',
        description: 'Failed to load utility plans. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [plansError, toast]);

  if (providerLoading || plansLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const provider = providerData?.provider as UtilityProvider;
  const plans = plansData?.plans as UtilityPlan[];

  if (!provider || !plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Plans Available</CardTitle>
          <CardDescription>
            No utility plans are available for this provider at the moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {provider.displayName} Plans
          {provider.greenEnergy && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Green Energy
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Compare available plans and select the one that suits your needs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4">Plan</TableHead>
              <TableHead className="w-1/6">Monthly Cost</TableHead>
              <TableHead className="w-1/6">Contract</TableHead>
              <TableHead className="w-1/6">Exit Fee</TableHead>
              <TableHead className="w-1/4">Features</TableHead>
              <TableHead className="w-1/12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    {plan.displayName}
                    {plan.isPopular && (
                      <Badge variant="secondary" className="mt-1 w-fit">
                        <Star className="h-3 w-3 mr-1" /> Popular
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">£{plan.monthlyPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    £{plan.annualPrice.toFixed(2)}/year
                  </div>
                  {plan.unitPrice && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 cursor-help">
                            <HelpCircle className="h-3 w-3 mr-1" /> 
                            Unit details
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unit price: {plan.unitPrice}p/kWh</p>
                          <p>Standing charge: {plan.standingCharge}p/day</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell>{plan.contractLength} months</TableCell>
                <TableCell>£{plan.exitFees.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {plan.features.length > 3 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-help">
                              +{plan.features.length - 3} more
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {plan.features.slice(3).map((feature, index) => (
                                <p key={index} className="text-xs">{feature}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    variant={currentPlanId === plan.id ? "outline" : "default"} 
                    size="sm"
                    className={currentPlanId === plan.id ? "pointer-events-none" : ""}
                    onClick={() => handleSwitchRequest(plan.id)}
                    disabled={switchRequestMutation.isPending || currentPlanId === plan.id}
                  >
                    {switchRequestMutation.isPending && selectedPlanId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : currentPlanId === plan.id ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : null}
                    {currentPlanId === plan.id ? 'Current' : 'Select'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {provider.studentDiscount && (
            <div className="flex items-center">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-2">
                Student Discount
              </Badge>
              Special rates available for students with valid ID.
            </div>
          )}
        </div>
        <Button variant="outline" asChild>
          <a href={provider.website} target="_blank" rel="noopener noreferrer">
            Visit Provider Website
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UtilityPlanComparison;