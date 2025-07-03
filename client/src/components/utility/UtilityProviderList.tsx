import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bolt, Flame, Droplet, Wifi, Tv, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type UtilityProvider = {
  id: number;
  name: string;
  displayName: string;
  utilityType: 'electricity' | 'gas' | 'water' | 'internet' | 'tv_license' | 'council_tax';
  status: string;
  description: string;
  logoUrl: string;
  website: string;
  contactPhone: string;
  contactEmail: string;
  averageRating: number;
  reviewCount: number;
  features: string[];
  greenEnergy: boolean;
  studentDiscount: boolean;
  studentDiscountDetails: string | null;
  priceIndex: number;
  comparisonData: any;
  createdAt: string;
  updatedAt: string | null;
};

type UtilityType = {
  type: string;
  displayName: string;
  icon: string;
  description: string;
};

const UtilityProviderList = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast } = useToast();

  // Fetch utility types
  const { 
    data: utilityTypesData, 
    isLoading: typesLoading, 
    error: typesError 
  } = useQuery({
    queryKey: ['/api/utility-types'],
    retry: 1,
  });

  // Fetch all utility providers
  const { 
    data: providersData, 
    isLoading: providersLoading, 
    error: providersError,
    refetch: refetchProviders
  } = useQuery({
    queryKey: ['/api/utilities/providers'],
    retry: 1,
  });

  // Filter providers based on active tab
  const filteredProviders = activeTab === 'all' 
    ? providersData?.providers 
    : providersData?.providers?.filter(
        (provider: UtilityProvider) => provider.utilityType === activeTab
      );

  // Get the icon for a utility type
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'electricity':
        return <Bolt className="h-4 w-4" />;
      case 'gas':
        return <Flame className="h-4 w-4" />;
      case 'water':
        return <Droplet className="h-4 w-4" />;
      case 'internet':
        return <Wifi className="h-4 w-4" />;
      case 'tv_license':
        return <Tv className="h-4 w-4" />;
      case 'council_tax':
        return <Building className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Error handling
  useEffect(() => {
    if (typesError) {
      toast({
        title: 'Error',
        description: 'Failed to load utility types. Please try again later.',
        variant: 'destructive',
      });
    }

    if (providersError) {
      toast({
        title: 'Error',
        description: 'Failed to load utility providers. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [typesError, providersError, toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Utility Providers</h2>
        <p className="text-muted-foreground">
          Browse and compare utility providers for your property.
        </p>
      </div>

      {/* Tabs for filtering by utility type */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="mb-1">All</TabsTrigger>
          
          {typesLoading ? (
            // Show skeletons while loading
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 mb-1 mx-1" />
            ))
          ) : (
            // Show tabs for each utility type
            utilityTypesData?.utilityTypes?.map((type: UtilityType) => (
              <TabsTrigger key={type.type} value={type.type} className="mb-1">
                <span className="mr-1.5 flex items-center">
                  {getUtilityIcon(type.type)}
                </span>
                {type.displayName}
              </TabsTrigger>
            ))
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {providersLoading ? (
            // Show skeletons while loading
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredProviders?.length > 0 ? (
            // Show provider cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider: UtilityProvider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            // Show message if no providers
            <div className="text-center py-10">
              <p className="text-lg text-muted-foreground">
                No utility providers found for this category.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetchProviders()}
              >
                Refresh
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Provider card component
const ProviderCard = ({ provider }: { provider: UtilityProvider }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{provider.displayName}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              {getProviderIcon(provider.utilityType)}
              <span className="ml-1.5 capitalize">{provider.utilityType.replace('_', ' ')}</span>
            </CardDescription>
          </div>
          <div className="flex">
            {provider.greenEnergy && (
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                Green Energy
              </Badge>
            )}
            {provider.studentDiscount && (
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                Student Discount
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-sm text-muted-foreground mb-3">{provider.description}</p>
        
        {provider.features.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Features:</p>
            <div className="flex flex-wrap gap-1">
              {provider.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium">
              Rating: {provider.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({provider.reviewCount} reviews)
            </span>
          </div>
          <Button variant="default" size="sm" asChild>
            <a href={provider.website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to get utility icon
const getProviderIcon = (type: string) => {
  switch (type) {
    case 'electricity':
      return <Bolt className="h-4 w-4" />;
    case 'gas':
      return <Flame className="h-4 w-4" />;
    case 'water':
      return <Droplet className="h-4 w-4" />;
    case 'internet':
      return <Wifi className="h-4 w-4" />;
    case 'tv_license':
      return <Tv className="h-4 w-4" />;
    case 'council_tax':
      return <Building className="h-4 w-4" />;
    default:
      return null;
  }
};

export default UtilityProviderList;