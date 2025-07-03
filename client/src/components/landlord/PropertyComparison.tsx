import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart,
  LineChart,
  BarChart3, // Using BarChart3 instead of RadarChart which is not available in lucide-react
  SearchX,
  TrendingUp,
  PoundSterling,
  ArrowUpRight,
  ArrowDownRight,
  Bed,
  Home,
  MapPin,
  BarChartHorizontal
} from 'lucide-react';
import { getProperties } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend
);

// Type definition for property data
interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  createdAt: string;
  images?: string[];
}

// Metrics for comparison
type PropertyMetric = 'price' | 'pricePerBedroom' | 'pricePerBathroom' | 'area' | 'yield';

interface PropertyComparisonData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export function PropertyComparison() {
  // State for selected properties
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<string>('');
  const [activeView, setActiveView] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'radar'>('bar');
  const [comparisonMetric, setComparisonMetric] = useState<PropertyMetric>('price');
  
  // Fetch properties from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => getProperties()
  });
  
  // Set available properties when data loads
  useEffect(() => {
    if (data?.success && Array.isArray(data.data)) {
      setAvailableProperties(data.data.map((p: any) => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        price: p.price,
        propertyType: p.property_type,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        area: p.area,
        createdAt: p.created_at,
        images: p.images
      })));
    }
  }, [data]);
  
  // Add a property to comparison
  const addProperty = () => {
    if (!currentProperty) return;
    
    const propertyToAdd = availableProperties.find(p => p.id.toString() === currentProperty);
    if (!propertyToAdd) return;
    
    if (!selectedProperties.some(p => p.id === propertyToAdd.id)) {
      setSelectedProperties([...selectedProperties, propertyToAdd]);
    }
    
    setCurrentProperty('');
  };
  
  // Remove a property from comparison
  const removeProperty = (id: number) => {
    setSelectedProperties(selectedProperties.filter(p => p.id !== id));
  };
  
  // Calculate yield (estimated based on average rental prices)
  const calculateEstimatedYield = (property: Property): number => {
    // This is a simplified calculation - would ideally use actual rental data
    const averageRentalYieldByCity: Record<string, number> = {
      'London': 4.5,
      'Manchester': 5.8,
      'Birmingham': 5.2,
      'Leeds': 6.0,
      'Edinburgh': 5.5,
      'Bristol': 4.8,
      'Newcastle': 6.2,
      'Liverpool': 6.5,
      'Glasgow': 6.0,
      'Sheffield': 5.9,
      'Cardiff': 5.3,
      'Belfast': 5.7,
      'Nottingham': 6.3,
      'Oxford': 4.2,
      'Cambridge': 4.1,
    };
    
    // Use city average or default to 5%
    const baseYield = averageRentalYieldByCity[property.city] || 5.0;
    
    // Adjust based on property type (flats typically have higher yields)
    let adjustedYield = baseYield;
    if (property.propertyType === 'flat' || property.propertyType === 'apartment') {
      adjustedYield += 0.3;
    } else if (property.propertyType === 'detached') {
      adjustedYield -= 0.3;
    }
    
    return adjustedYield;
  };
  
  // Calculate price per bedroom
  const calculatePricePerBedroom = (property: Property): number => {
    return property.bedrooms > 0 ? property.price / property.bedrooms : property.price;
  };
  
  // Calculate price per bathroom
  const calculatePricePerBathroom = (property: Property): number => {
    return property.bathrooms > 0 ? property.price / property.bathrooms : property.price;
  };
  
  // Get comparison data based on selected metric
  const getComparisonData = (): PropertyComparisonData => {
    const labels = selectedProperties.map(p => p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title);
    
    let values: number[] = [];
    let label = '';
    
    switch(comparisonMetric) {
      case 'price':
        values = selectedProperties.map(p => p.price);
        label = 'Price (£)';
        break;
      case 'pricePerBedroom':
        values = selectedProperties.map(p => calculatePricePerBedroom(p));
        label = 'Price per Bedroom (£)';
        break;
      case 'pricePerBathroom':
        values = selectedProperties.map(p => calculatePricePerBathroom(p));
        label = 'Price per Bathroom (£)';
        break;
      case 'area':
        values = selectedProperties.map(p => p.area || 0);
        label = 'Area (sq ft)';
        break;
      case 'yield':
        values = selectedProperties.map(p => calculateEstimatedYield(p));
        label = 'Estimated Yield (%)';
        break;
    }
    
    return {
      labels,
      datasets: [
        {
          label,
          data: values,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Get options for chart display
  const getChartOptions = () => {
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `Property Comparison - ${
            comparisonMetric === 'price' ? 'Price' :
            comparisonMetric === 'pricePerBedroom' ? 'Price per Bedroom' :
            comparisonMetric === 'pricePerBathroom' ? 'Price per Bathroom' :
            comparisonMetric === 'area' ? 'Area' : 'Estimated Yield'
          }`,
        },
      },
    };
  };
  
  // Get radar chart data for multi-metric comparison
  const getRadarData = () => {
    return {
      labels: ['Price', 'Price/Bedroom', 'Price/Bathroom', 'Area', 'Yield'],
      datasets: selectedProperties.map((property, index) => ({
        label: property.title.length > 10 ? property.title.substring(0, 10) + '...' : property.title,
        data: [
          // Normalize values for radar chart
          property.price / 1000, // Price in thousands
          calculatePricePerBedroom(property) / 1000, // Price per bedroom in thousands
          calculatePricePerBathroom(property) / 1000, // Price per bathroom in thousands
          property.area || 0,
          calculateEstimatedYield(property) * 10, // Scale yield for visualization
        ],
        backgroundColor: `rgba(${50 + index * 50}, ${100 + index * 30}, ${150 + index * 20}, 0.2)`,
        borderColor: `rgba(${50 + index * 50}, ${100 + index * 30}, ${150 + index * 20}, 1)`,
        borderWidth: 1,
      })),
    };
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return `£${value.toLocaleString()}`;
  };
  
  const renderPropertyBadge = (property: Property) => {
    return (
      <Badge 
        variant={property.propertyType === 'flat' ? 'secondary' : 
               property.propertyType === 'detached' ? 'default' : 'outline'} 
        className="ml-2"
      >
        {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
        <p>Error loading properties. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartHorizontal className="h-5 w-5" />
          Property Comparison Tool
        </CardTitle>
        <CardDescription>
          Select properties to compare key metrics and investment potential
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Property selection */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={currentProperty} onValueChange={setCurrentProperty}>
            <SelectTrigger className="sm:w-[300px]">
              <SelectValue placeholder="Select a property to compare" />
            </SelectTrigger>
            <SelectContent>
              {availableProperties.map(property => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.title} - {property.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={addProperty} disabled={!currentProperty}>
            Add to Comparison
          </Button>
        </div>
        
        {/* Selected properties list */}
        {selectedProperties.length > 0 ? (
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Selected Properties ({selectedProperties.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedProperties.map(property => (
                <div key={property.id} className="flex items-center bg-muted px-3 py-1 rounded-md text-sm">
                  <span className="mr-2">{property.title}</span>
                  <button 
                    onClick={() => removeProperty(property.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <SearchX className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No properties selected for comparison</p>
            <p className="text-sm text-muted-foreground">Add properties using the selector above</p>
          </div>
        )}
        
        {selectedProperties.length > 0 && (
          <>
            {/* View toggles */}
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeView === 'table' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveView('table')}
                >
                  Table View
                </Button>
                <Button 
                  variant={activeView === 'chart' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveView('chart')}
                >
                  Chart View
                </Button>
              </div>
              
              {activeView === 'chart' && (
                <div className="flex gap-2">
                  <Button 
                    variant={chartType === 'bar' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart className="h-4 w-4 mr-1" />
                    Bar
                  </Button>
                  <Button 
                    variant={chartType === 'line' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('line')}
                  >
                    <LineChart className="h-4 w-4 mr-1" />
                    Line
                  </Button>
                  <Button 
                    variant={chartType === 'radar' ? 'secondary' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('radar')}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Radar
                  </Button>
                </div>
              )}
            </div>
            
            {/* Comparison views */}
            {activeView === 'table' ? (
              <Table>
                <TableCaption>Comparison of {selectedProperties.length} properties</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Beds</TableHead>
                    <TableHead className="text-right">Baths</TableHead>
                    <TableHead className="text-right">Price/Bedroom</TableHead>
                    <TableHead className="text-right">Est. Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProperties.map(property => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.title}</TableCell>
                      <TableCell className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                        {property.city}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Home className="h-3 w-3 mr-1 text-muted-foreground" />
                          {property.propertyType}
                          {renderPropertyBadge(property)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(property.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Bed className="h-3 w-3 mr-1 text-muted-foreground" />
                          {property.bedrooms}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{property.bathrooms}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculatePricePerBedroom(property))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {calculateEstimatedYield(property).toFixed(1)}%
                          {calculateEstimatedYield(property) > 5.5 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                          ) : calculateEstimatedYield(property) < 4.5 ? (
                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="space-y-4">
                {/* Metric selector for chart view */}
                {chartType !== 'radar' && (
                  <div className="flex justify-end">
                    <Select 
                      value={comparisonMetric} 
                      onValueChange={(value) => setComparisonMetric(value as PropertyMetric)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="pricePerBedroom">Price per Bedroom</SelectItem>
                        <SelectItem value="pricePerBathroom">Price per Bathroom</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                        <SelectItem value="yield">Estimated Yield</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Chart visualization */}
                <div className="h-[400px] flex items-center justify-center">
                  {chartType === 'bar' && (
                    <Bar 
                      data={getComparisonData()} 
                      options={getChartOptions()} 
                    />
                  )}
                  
                  {chartType === 'line' && (
                    <Line 
                      data={getComparisonData()} 
                      options={getChartOptions()} 
                    />
                  )}
                  
                  {chartType === 'radar' && (
                    <Radar 
                      data={getRadarData()} 
                      options={{
                        responsive: true,
                        plugins: {
                          title: {
                            display: true,
                            text: 'Multi-metric Property Comparison',
                          },
                        },
                      }} 
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Compare up to 5 properties at once
        </div>
        {selectedProperties.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setSelectedProperties([])}>
            Clear All
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}