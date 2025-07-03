import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Link } from 'wouter';
import { ContributeRentalDataForm } from '@/components/landlord/ContributeRentalDataForm';
import { RentalInvestmentCalculator } from '@/components/landlord/RentalInvestmentCalculator';
import { PropertyComparison } from '@/components/landlord/PropertyComparison';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Building, 
  Building2,
  Briefcase,
  PiggyBank,
  HelpCircle,
  ArrowUpRight,
  MapPin,
  Info,
  Calculator
} from 'lucide-react';

// Define interfaces for property data
interface PropertyType {
  type: string;
  averageSalePrice: number;
  averageRent: number | null;
}

interface TrendingArea {
  name: string;
  averagePrice: number | null;
  averageRent?: number | null;
  trend: 'rising' | 'rising_fast' | 'stable' | 'declining';
}

interface AreaBreakdown {
  name: string;
  averageSalePrice: number | null;
  averageRent: number | null;
  rentalYield: number | null;
  saleTrend: string | null;
  rentTrend: string | null;
}

export default function MarketIntelligenceDashboard() {
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
  const [selectedBedrooms, setSelectedBedrooms] = useState('all');
  const { toast } = useToast();
  
  // Fetch dashboard data for the main view
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['/api/market-intelligence/dashboard-data', selectedArea, selectedPropertyType, selectedBedrooms],
    retryOnMount: true,
    retry: 2,
    queryFn: async ({ queryKey }) => {
      const [endpoint] = queryKey;
      const response = await fetch(endpoint as string);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });
  
  // Fetch recommendations if the user is logged in
  const { data: recommendationsData, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/market-intelligence/user-recommendations'],
    retry: 1,
    enabled: false, // Only load when user is logged in - we'll enable this later
    queryFn: async ({ queryKey }) => {
      const [endpoint] = queryKey;
      const response = await fetch(endpoint as string);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });
  
  // Handle errors
  useEffect(() => {
    if (dashboardError) {
      toast({
        title: "Error loading market data",
        description: "There was a problem loading the market intelligence data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [dashboardError, toast]);

  if (dashboardLoading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Property Market Intelligence</h1>
        <p className="text-muted-foreground">Loading market data...</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full h-[140px] animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-1/3 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/2 bg-muted rounded mb-2"></div>
                <div className="h-4 w-1/4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/landlord/dashboard">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Property Market Intelligence</h1>
          <p className="text-muted-foreground">
            Data-driven insights from UK Land Registry, ONS, and community contributions
          </p>
        </div>
        
        <div className="flex gap-2 flex-col sm:flex-row mt-4 md:mt-0">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              <SelectItem value="london">London</SelectItem>
              <SelectItem value="manchester">Manchester</SelectItem>
              <SelectItem value="birmingham">Birmingham</SelectItem>
              <SelectItem value="leeds">Leeds</SelectItem>
              <SelectItem value="edinburgh">Edinburgh</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="flat">Flats</SelectItem>
              <SelectItem value="terraced">Terraced</SelectItem>
              <SelectItem value="semi-detached">Semi-Detached</SelectItem>
              <SelectItem value="detached">Detached</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bedrooms</SelectItem>
              <SelectItem value="1">1 Bedroom</SelectItem>
              <SelectItem value="2">2 Bedrooms</SelectItem>
              <SelectItem value="3">3 Bedrooms</SelectItem>
              <SelectItem value="4">4+ Bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {dashboardData?.data ? (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Home size={16} />
                  Average Sale Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.data.overallStats.averageSalePrice 
                    ? `£${Math.round(dashboardData.data.overallStats.averageSalePrice).toLocaleString()}` 
                    : 'No data'}
                </div>
                <p className="text-xs text-muted-foreground">Based on Land Registry data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building size={16} />
                  Average Monthly Rent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.data.overallStats.averageRent 
                    ? `£${Math.round(dashboardData.data.overallStats.averageRent).toLocaleString()}` 
                    : 'No data'}
                </div>
                <p className="text-xs text-muted-foreground">Based on ONS and user data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PiggyBank size={16} />
                  Typical Rental Yield
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.data.overallStats.averageSalePrice && dashboardData.data.overallStats.averageRent 
                    ? `${((dashboardData.data.overallStats.averageRent * 12 / dashboardData.data.overallStats.averageSalePrice) * 100).toFixed(1)}%` 
                    : 'No data'}
                </div>
                <p className="text-xs text-muted-foreground">Annual return calculation</p>
              </CardContent>
            </Card>
          </div>

          {/* Main content tabs */}
          <Tabs defaultValue="market-overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="market-overview">Market Overview</TabsTrigger>
              <TabsTrigger value="area-breakdown">Area Breakdown</TabsTrigger>
              <TabsTrigger value="property-comparison">Property Comparison</TabsTrigger>
              <TabsTrigger value="rental-calculator">Rental Calculator</TabsTrigger>
              <TabsTrigger value="contribute-data">Contribute Data</TabsTrigger>
            </TabsList>
            
            <TabsContent value="market-overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Type Breakdown */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 size={18} />
                      Property Type Breakdown
                    </CardTitle>
                    <CardDescription>
                      Average prices by property type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboardData.data.propertyTypes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardData.data.propertyTypes
                            .filter((pt: PropertyType) => pt.averageSalePrice)
                            .map((pt: PropertyType) => ({
                              type: pt.type.charAt(0).toUpperCase() + pt.type.slice(1),
                              averagePrice: Math.round(pt.averageSalePrice),
                              averageRent: Math.round(pt.averageRent || 0)
                            }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" angle={-45} textAnchor="end" height={60} />
                          <YAxis tickFormatter={(value) => `£${(value / 1000)}k`} />
                          <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                          <Bar dataKey="averagePrice" fill="#8884d8" name="Avg. Sale Price" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No property data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Average Rent by Property Type */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building size={18} />
                      Rental Price Comparison
                    </CardTitle>
                    <CardDescription>
                      Average monthly rent by property type
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboardData.data.propertyTypes.filter((pt: PropertyType) => pt.averageRent).length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dashboardData.data.propertyTypes
                            .filter((pt: PropertyType) => pt.averageRent)
                            .map((pt: PropertyType) => ({
                              type: pt.type.charAt(0).toUpperCase() + pt.type.slice(1),
                              averageRent: Math.round(pt.averageRent || 0)
                            }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" angle={-45} textAnchor="end" height={60} />
                          <YAxis tickFormatter={(value) => `£${value}`} />
                          <Tooltip formatter={(value) => `£${value.toLocaleString()}`} />
                          <Bar dataKey="averageRent" fill="#82ca9d" name="Avg. Monthly Rent" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No rental data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Trending Areas - Sales */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp size={18} />
                      Trending Areas - Sales
                    </CardTitle>
                    <CardDescription>
                      Areas with rising property prices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.data.overallStats.trendingSaleAreas.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.data.overallStats.trendingSaleAreas.map((area: TrendingArea, i: number) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-muted-foreground" />
                              <div className="font-medium">{area.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div>
                                {area.averagePrice ? `£${Math.round(area.averagePrice).toLocaleString()}` : 'N/A'}
                              </div>
                              <Badge variant={area.trend === 'rising_fast' ? 'destructive' : 'default'} className="ml-2">
                                <TrendingUp size={14} className="mr-1" />
                                {area.trend === 'rising_fast' ? 'Fast Growth' : 'Growing'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No trending areas data available</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Trending Areas - Rentals */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp size={18} />
                      Trending Areas - Rentals
                    </CardTitle>
                    <CardDescription>
                      Areas with rising rental prices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dashboardData.data.overallStats.trendingRentalAreas.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardData.data.overallStats.trendingRentalAreas.map((area: TrendingArea, i: number) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-muted-foreground" />
                              <div className="font-medium">{area.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div>
                                {area.averageRent ? `£${Math.round(area.averageRent).toLocaleString()}/mo` : 'N/A'}
                              </div>
                              <Badge variant={area.trend === 'rising_fast' ? 'destructive' : 'default'} className="ml-2">
                                <TrendingUp size={14} className="mr-1" />
                                {area.trend === 'rising_fast' ? 'Fast Growth' : 'Growing'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No trending rental areas data available</p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Data Sources & Information */}
                <Card className="col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info size={18} />
                      Data Sources & Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">UK Land Registry</h3>
                        <p className="text-sm text-muted-foreground">Property sales data from the UK government's Land Registry, includes actual sale prices achieved.</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Office for National Statistics</h3>
                        <p className="text-sm text-muted-foreground">Official government rental and housing statistics providing reliable market indicators.</p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Community Contributions</h3>
                        <p className="text-sm text-muted-foreground">Real rental prices shared by landlords in our community for greater market transparency.</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">Data is updated monthly. Last update: {new Date().toLocaleDateString()}</p>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="area-breakdown">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Area Comparison</CardTitle>
                    <CardDescription>
                      Compare key metrics across different areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left pb-2">Area</th>
                            <th className="text-left pb-2">Avg. Sale Price</th>
                            <th className="text-left pb-2">Avg. Monthly Rent</th>
                            <th className="text-left pb-2">Rental Yield</th>
                            <th className="text-left pb-2">Sale Trend</th>
                            <th className="text-left pb-2">Rental Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.data.areaBreakdown.map((area: AreaBreakdown, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="py-3">{area.name}</td>
                              <td className="py-3">
                                {area.averageSalePrice 
                                  ? `£${Math.round(area.averageSalePrice).toLocaleString()}` 
                                  : 'N/A'}
                              </td>
                              <td className="py-3">
                                {area.averageRent 
                                  ? `£${Math.round(area.averageRent).toLocaleString()}` 
                                  : 'N/A'}
                              </td>
                              <td className="py-3">
                                {area.rentalYield 
                                  ? `${area.rentalYield.toFixed(1)}%` 
                                  : 'N/A'}
                              </td>
                              <td className="py-3">
                                {area.saleTrend ? (
                                  <Badge variant={
                                    area.saleTrend === 'rising' || area.saleTrend === 'rising_fast' 
                                      ? 'default' 
                                      : area.saleTrend === 'falling' || area.saleTrend === 'falling_fast' 
                                        ? 'destructive' 
                                        : 'secondary'
                                  }>
                                    {area.saleTrend === 'rising_fast' ? 'Strong Growth' :
                                     area.saleTrend === 'rising' ? 'Growing' :
                                     area.saleTrend === 'stable' ? 'Stable' :
                                     area.saleTrend === 'falling' ? 'Declining' :
                                     area.saleTrend === 'falling_fast' ? 'Strong Decline' : 'Unknown'}
                                  </Badge>
                                ) : 'N/A'}
                              </td>
                              <td className="py-3">
                                {area.rentTrend ? (
                                  <Badge variant={
                                    area.rentTrend === 'rising' || area.rentTrend === 'rising_fast' 
                                      ? 'default' 
                                      : area.rentTrend === 'falling' || area.rentTrend === 'falling_fast' 
                                        ? 'destructive' 
                                        : 'secondary'
                                  }>
                                    {area.rentTrend === 'rising_fast' ? 'Strong Growth' :
                                     area.rentTrend === 'rising' ? 'Growing' :
                                     area.rentTrend === 'stable' ? 'Stable' :
                                     area.rentTrend === 'falling' ? 'Declining' :
                                     area.rentTrend === 'falling_fast' ? 'Strong Decline' : 'Unknown'}
                                  </Badge>
                                ) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="property-comparison">
              <div className="grid grid-cols-1 gap-6">
                <PropertyComparison />
              </div>
            </TabsContent>
            
            <TabsContent value="rental-calculator">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator size={18} />
                      Property Investment Analysis Tools
                    </CardTitle>
                    <CardDescription>
                      Use these calculators to analyze potential property investments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="basic">Basic Yield Calculator</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced Investment Calculator</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic">
                        <RentalYieldCalculator />
                      </TabsContent>
                      
                      <TabsContent value="advanced">
                        <RentalInvestmentCalculator />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="contribute-data">
              <Card>
                <CardHeader>
                  <CardTitle>Contribute Rental Data</CardTitle>
                  <CardDescription>
                    Help improve market intelligence by anonymously sharing your rental data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="flex flex-col space-y-2 border-b pb-4">
                      <h3 className="text-lg font-medium">Why contribute?</h3>
                      <p>Sharing your rental data helps build a more accurate picture of the real rental market. This benefits all landlords in making informed decisions.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <BarChart3 size={16} className="text-primary" />
                          </div>
                          <div className="text-sm">Get better market insights with more accurate data</div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <ArrowUpRight size={16} className="text-primary" />
                          </div>
                          <div className="text-sm">Help identify emerging rental trends in your area</div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5 bg-primary/10 p-1 rounded-full">
                            <PiggyBank size={16} className="text-primary" />
                          </div>
                          <div className="text-sm">Make more informed investment decisions</div>
                        </div>
                      </div>
                    </div>
                    
                    <ContributeRentalDataForm />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="py-10 text-center">
          <p>No market data available. Please try again later.</p>
        </div>
      )}
    </div>
  );
}

// Interface for market comparison data
interface MarketComparison {
  areaName: string;
  areaAverageYield: number | null;
  areaAverageRent: number | null;
  areaAverageSalePrice: number | null;
  comparisonToAverage: number | null;
}

// Interface for rental yield calculation results
interface RentalYieldResult {
  yield: number;
  annualRent: number;
  marketComparison?: MarketComparison;
}

function RentalYieldCalculator() {
  const [propertyPrice, setPropertyPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [area, setArea] = useState('');
  const [calculatedYield, setCalculatedYield] = useState<RentalYieldResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  
  async function calculateYield() {
    if (!propertyPrice || !monthlyRent) {
      toast({
        title: "Missing information",
        description: "Please enter both purchase price and monthly rent",
        variant: "destructive"
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const result = await apiRequest(
        'POST',
        '/api/market-intelligence/calculate-yield',
        {
          purchasePrice: parseFloat(propertyPrice),
          monthlyRent: parseFloat(monthlyRent),
          area: area || undefined
        }
      );
      
      if (result.success) {
        setCalculatedYield(result.data);
      } else {
        toast({
          title: "Calculation failed",
          description: result.error || "Failed to calculate rental yield",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Calculation error",
        description: "An error occurred while calculating yield",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rental Yield Calculator</CardTitle>
          <CardDescription>
            Calculate the rental yield for a property investment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="propertyPrice" className="text-sm font-medium">
                  Purchase Price (£)
                </label>
                <Input
                  id="propertyPrice"
                  placeholder="e.g. 250000"
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="monthlyRent" className="text-sm font-medium">
                  Monthly Rent (£)
                </label>
                <Input
                  id="monthlyRent"
                  placeholder="e.g. 1200"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="area" className="text-sm font-medium">
                Area (Optional - for comparison)
              </label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger id="area">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="london">London</SelectItem>
                  <SelectItem value="manchester">Manchester</SelectItem>
                  <SelectItem value="birmingham">Birmingham</SelectItem>
                  <SelectItem value="leeds">Leeds</SelectItem>
                  <SelectItem value="edinburgh">Edinburgh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={calculateYield} disabled={isCalculating} className="w-full">
              {isCalculating ? "Calculating..." : "Calculate Yield"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Your calculated rental yield and market comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calculatedYield ? (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Annual rental yield</div>
                <div className="text-3xl font-bold">{calculatedYield.yield.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Annual rent: £{calculatedYield.annualRent.toLocaleString()}
                </div>
              </div>
              
              {calculatedYield.marketComparison && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Comparison to {calculatedYield.marketComparison.areaName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Area average yield:</span>
                      <span className="font-medium">
                        {calculatedYield.marketComparison.areaAverageYield 
                          ? `${calculatedYield.marketComparison.areaAverageYield.toFixed(2)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Your yield compared to average:</span>
                      <span className={`font-medium ${
                        calculatedYield.marketComparison.comparisonToAverage !== null
                        ? (calculatedYield.marketComparison.comparisonToAverage > 0 
                            ? 'text-green-600' 
                            : calculatedYield.marketComparison.comparisonToAverage < 0 
                              ? 'text-red-600' 
                              : '')
                        : ''
                      }`}>
                        {calculatedYield.marketComparison.comparisonToAverage
                          ? `${calculatedYield.marketComparison.comparisonToAverage > 0 ? '+' : ''}${calculatedYield.marketComparison.comparisonToAverage.toFixed(2)}%` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Area average rent:</span>
                      <span className="font-medium">
                        {calculatedYield.marketComparison.areaAverageRent 
                          ? `£${Math.round(calculatedYield.marketComparison.areaAverageRent).toLocaleString()}/month` 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Area average price:</span>
                      <span className="font-medium">
                        {calculatedYield.marketComparison.areaAverageSalePrice 
                          ? `£${Math.round(calculatedYield.marketComparison.areaAverageSalePrice).toLocaleString()}` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <HelpCircle size={14} />
                  <span>Rental yield = (Annual rent ÷ Property value) × 100</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Enter your property details and calculate to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}