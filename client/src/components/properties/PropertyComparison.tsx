import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Check, 
  X, 
  HelpCircle, 
  Bed, 
  Bath, 
  Wifi, 
  Flame, 
  Droplet, 
  Bolt, 
  Home, 
  Clock, 
  MapPin, 
  School, 
  Minus,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Trash2
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PropertyType } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PropertyComparisonProps {
  properties: PropertyType[];
  onRemoveProperty?: (propertyId: number) => void;
  onClearAll?: () => void;
  onViewProperty?: (propertyId: number) => void;
}

export default function PropertyComparison({ 
  properties, 
  onRemoveProperty, 
  onClearAll,
  onViewProperty
}: PropertyComparisonProps) {
  const [differences, setDifferences] = useState<Record<string, string[]>>({});
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  // Find differences between properties
  useEffect(() => {
    if (properties.length < 2) return;

    const foundDifferences: Record<string, string[]> = {};
    
    // Compare key attributes
    const attributesToCompare = [
      'price', 'bedrooms', 'bathrooms', 'propertyType', 'available',
      'billsIncluded', 'furnished'
    ];
    
    attributesToCompare.forEach(attr => {
      const values = new Set(properties.map(p => String(p[attr as keyof PropertyType])));
      if (values.size > 1) {
        foundDifferences[attr] = Array.from(values);
      }
    });
    
    // Compare included bills
    const billTypes = ['electricity', 'gas', 'water', 'internet'];
    billTypes.forEach(bill => {
      const values = new Set(properties.map(p => {
        const includedBills = p.includedBills || [];
        return includedBills.includes(bill) ? 'Yes' : 'No';
      }));
      
      if (values.size > 1) {
        foundDifferences[`bills_${bill}`] = Array.from(values);
      }
    });
    
    // Compare features
    const featureTypes = ['parking', 'garden', 'petsAllowed', 'washingMachine', 'dishwasher'];
    featureTypes.forEach(feature => {
      const values = new Set(properties.map(p => {
        const features = p.features || [];
        return features.includes(feature) ? 'Yes' : 'No';
      }));
      
      if (values.size > 1) {
        foundDifferences[`feature_${feature}`] = Array.from(values);
      }
    });
    
    setDifferences(foundDifferences);
  }, [properties]);

  // If no properties to compare
  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Comparison</CardTitle>
          <CardDescription>
            Add properties to compare their features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No properties to compare</AlertTitle>
            <AlertDescription>
              Browse properties and click "Add to Compare" to start comparing properties.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Function to render cell content based on property attribute
  const renderCellContent = (property: PropertyType, field: string) => {
    // Helper for yes/no fields
    const YesNoIndicator = ({ condition }: { condition: boolean }) => (
      condition ? 
        <Check className="h-5 w-5 text-green-500 mx-auto" /> : 
        <X className="h-5 w-5 text-red-500 mx-auto" />
    );
    
    // Helper for included bills
    const isBillIncluded = (bill: string) => {
      const includedBills = property.includedBills || [];
      return includedBills.includes(bill);
    };
    
    // Helper for features
    const hasFeature = (feature: string) => {
      const features = property.features || [];
      return features.includes(feature);
    };
    
    // Check if this field has differences and should be highlighted
    const isDifferent = differences[field] !== undefined && highlightDifferences;
    const cellClass = isDifferent ? "bg-yellow-50" : "";
    
    switch (field) {
      case 'image':
        return (
          <div className="w-full h-24 overflow-hidden rounded-md">
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[0]} 
                alt={property.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Home className="h-10 w-10 text-gray-400" />
              </div>
            )}
          </div>
        );
      
      case 'title':
        return (
          <div>
            <div className="font-medium">{property.title}</div>
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {property.city}
            </div>
          </div>
        );
        
      case 'price':
        return (
          <TableCell className={cellClass}>
            <div className="font-bold text-lg">£{property.price}</div>
            <div className="text-xs text-muted-foreground">per week</div>
          </TableCell>
        );
        
      case 'available':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            {property.available ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">Not Available</Badge>
            )}
          </TableCell>
        );
        
      case 'propertyType':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <div className="flex items-center justify-center">
              <Home className="h-4 w-4 mr-1 text-primary" />
              {property.propertyType}
            </div>
          </TableCell>
        );
        
      case 'bedrooms':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <div className="flex items-center justify-center">
              <Bed className="h-4 w-4 mr-1 text-primary" />
              {property.bedrooms}
            </div>
          </TableCell>
        );
        
      case 'bathrooms':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <div className="flex items-center justify-center">
              <Bath className="h-4 w-4 mr-1 text-primary" />
              {property.bathrooms}
            </div>
          </TableCell>
        );
        
      case 'distanceToUniversity':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <div className="flex items-center justify-center">
              <School className="h-4 w-4 mr-1 text-primary" />
              {property.distanceToUniversity ? (
                <span>{property.distanceToUniversity} miles</span>
              ) : (
                <span>N/A</span>
              )}
            </div>
          </TableCell>
        );
        
      case 'availableDate':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <div className="flex items-center justify-center">
              <Clock className="h-4 w-4 mr-1 text-primary" />
              {property.availableDate ? (
                <span>{new Date(property.availableDate).toLocaleDateString()}</span>
              ) : (
                <span>Immediate</span>
              )}
            </div>
          </TableCell>
        );
        
      case 'billsIncluded':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={!!property.billsIncluded} />
          </TableCell>
        );
        
      case 'bills_electricity':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center justify-center">
                    <Bolt className={`h-5 w-5 ${isBillIncluded('electricity') ? 'text-yellow-500' : 'text-gray-300'}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Electricity {isBillIncluded('electricity') ? 'included' : 'not included'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
        
      case 'bills_gas':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center justify-center">
                    <Flame className={`h-5 w-5 ${isBillIncluded('gas') ? 'text-orange-500' : 'text-gray-300'}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gas {isBillIncluded('gas') ? 'included' : 'not included'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
        
      case 'bills_water':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center justify-center">
                    <Droplet className={`h-5 w-5 ${isBillIncluded('water') ? 'text-blue-500' : 'text-gray-300'}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Water {isBillIncluded('water') ? 'included' : 'not included'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
        
      case 'bills_internet':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center justify-center">
                    <Wifi className={`h-5 w-5 ${isBillIncluded('internet') ? 'text-purple-500' : 'text-gray-300'}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Internet {isBillIncluded('internet') ? 'included' : 'not included'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        );
        
      case 'furnished':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={!!property.furnished} />
          </TableCell>
        );
        
      case 'feature_parking':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={hasFeature('parking')} />
          </TableCell>
        );
        
      case 'feature_garden':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={hasFeature('garden')} />
          </TableCell>
        );
        
      case 'feature_petsAllowed':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={hasFeature('pets_allowed')} />
          </TableCell>
        );
        
      case 'feature_washingMachine':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={hasFeature('washing_machine')} />
          </TableCell>
        );
        
      case 'feature_dishwasher':
        return (
          <TableCell className={`text-center ${cellClass}`}>
            <YesNoIndicator condition={hasFeature('dishwasher')} />
          </TableCell>
        );
        
      case 'actions':
        return (
          <TableCell>
            <div className="flex flex-col space-y-2">
              {onViewProperty && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => onViewProperty(property.id)}
                >
                  View
                </Button>
              )}
              
              {onRemoveProperty && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-red-500 hover:text-red-600"
                  onClick={() => onRemoveProperty(property.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </TableCell>
        );
        
      default:
        return (
          <TableCell className={cellClass}>
            <Minus className="h-4 w-4 mx-auto text-gray-400" />
          </TableCell>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Property Comparison</CardTitle>
            <CardDescription>
              Compare {properties.length} properties side by side
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setHighlightDifferences(!highlightDifferences)}
            >
              {highlightDifferences ? (
                <>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Hide Differences
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Show Differences
                </>
              )}
            </Button>
            
            {onClearAll && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearAll}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Property</TableHead>
                  {properties.map((property) => (
                    <TableHead key={property.id} className="text-center min-w-[200px]">
                      {renderCellContent(property, 'image')}
                      <div className="mt-2">
                        {renderCellContent(property, 'title')}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {/* Basic Details */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={properties.length + 1} className="py-2">
                    Basic Details
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Price</TableCell>
                  {properties.map((property) => renderCellContent(property, 'price'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Availability</TableCell>
                  {properties.map((property) => renderCellContent(property, 'available'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Property Type</TableCell>
                  {properties.map((property) => renderCellContent(property, 'propertyType'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Bedrooms</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bedrooms'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Bathrooms</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bathrooms'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Distance to University</TableCell>
                  {properties.map((property) => renderCellContent(property, 'distanceToUniversity'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Available From</TableCell>
                  {properties.map((property) => renderCellContent(property, 'availableDate'))}
                </TableRow>
                
                {/* Bills */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={properties.length + 1} className="py-2">
                    Bills & Utilities
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">All Bills Included</TableCell>
                  {properties.map((property) => renderCellContent(property, 'billsIncluded'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Electricity</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bills_electricity'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Gas</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bills_gas'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Water</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bills_water'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Internet</TableCell>
                  {properties.map((property) => renderCellContent(property, 'bills_internet'))}
                </TableRow>
                
                {/* Features */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={properties.length + 1} className="py-2">
                    Features
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Furnished</TableCell>
                  {properties.map((property) => renderCellContent(property, 'furnished'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Parking</TableCell>
                  {properties.map((property) => renderCellContent(property, 'feature_parking'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Garden/Outdoor Space</TableCell>
                  {properties.map((property) => renderCellContent(property, 'feature_garden'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Pets Allowed</TableCell>
                  {properties.map((property) => renderCellContent(property, 'feature_petsAllowed'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Washing Machine</TableCell>
                  {properties.map((property) => renderCellContent(property, 'feature_washingMachine'))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Dishwasher</TableCell>
                  {properties.map((property) => renderCellContent(property, 'feature_dishwasher'))}
                </TableRow>
                
                {/* Actions */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell colSpan={properties.length + 1} className="py-2">
                    Actions
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium"></TableCell>
                  {properties.map((property) => renderCellContent(property, 'actions'))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}