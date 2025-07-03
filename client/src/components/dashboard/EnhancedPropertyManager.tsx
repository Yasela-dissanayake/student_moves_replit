import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CircleDollarSign, 
  Search, 
  Plus, 
  Pencil, 
  FilterX, 
  SlidersHorizontal, 
  Building, 
  MapPin, 
  Rows3, 
  LayoutGrid, 
  Home, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowDownUp,
  Eye,
  ListFilter,
  CalendarCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Clock
} from "lucide-react";
import { Property } from '@shared/schema';
import { format } from 'date-fns';

interface EnhancedPropertyManagerProps {
  properties: Property[];
  onViewProperty: (id: number) => void;
  onEditProperty: (id: number) => void;
  onCreateProperty?: () => void;
}

export default function EnhancedPropertyManager({ 
  properties, 
  onViewProperty, 
  onEditProperty,
  onCreateProperty 
}: EnhancedPropertyManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Filter properties based on search and filters
  const filteredProperties = properties.filter(property => {
    // Search term filter
    const searchMatch = 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.propertyType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Availability filter
    const availabilityMatch = 
      selectedAvailability === 'all' || 
      (selectedAvailability === 'available' && property.available) ||
      (selectedAvailability === 'unavailable' && !property.available);
    
    // Property type filter
    const propertyTypeMatch = 
      selectedPropertyType === 'all' || 
      property.propertyType.toLowerCase() === selectedPropertyType.toLowerCase();
    
    return searchMatch && availabilityMatch && propertyTypeMatch;
  });

  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    let aValue: any = a[sortField as keyof Property] || '';
    let bValue: any = b[sortField as keyof Property] || '';
    
    if (sortField === 'price') {
      aValue = parseFloat(aValue.toString());
      bValue = parseFloat(bValue.toString());
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Extract unique property types for filter dropdown
  const propertyTypes = Array.from(new Set(properties.map(p => p.propertyType)));

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Check if a property has compliance issues
  const hasComplianceIssues = (property: Property) => {
    const now = new Date();
    const issues = [];
    
    // EPC check
    if (!property.epcRating || (property.epcExpiryDate && new Date(property.epcExpiryDate) < now)) {
      issues.push('EPC');
    }
    
    // Gas check
    if (!property.gasChecked || (property.gasCheckExpiryDate && new Date(property.gasCheckExpiryDate) < now)) {
      issues.push('Gas Safety');
    }
    
    // Electrical check
    if (!property.electricalChecked || (property.electricalCheckExpiryDate && new Date(property.electricalCheckExpiryDate) < now)) {
      issues.push('Electrical Safety');
    }
    
    // HMO check for larger properties
    if (property.bedrooms > 4 && !property.hmoLicensed) {
      issues.push('HMO License');
    }
    
    return issues.length > 0 ? issues : null;
  };

  // Get compliance score for a property
  const getComplianceScore = (property: Property) => {
    let total = 3; // EPC, Gas, Electrical
    if (property.bedrooms > 4) total++; // Add HMO if applicable
    
    let fulfilled = 0;
    const now = new Date();
    
    // EPC check
    if (property.epcRating && property.epcExpiryDate && new Date(property.epcExpiryDate) > now) {
      fulfilled++;
    }
    
    // Gas check
    if (property.gasChecked && property.gasCheckExpiryDate && new Date(property.gasCheckExpiryDate) > now) {
      fulfilled++;
    }
    
    // Electrical check
    if (property.electricalChecked && property.electricalCheckExpiryDate && new Date(property.electricalCheckExpiryDate) > now) {
      fulfilled++;
    }
    
    // HMO check
    if (property.bedrooms <= 4 || property.hmoLicensed) {
      fulfilled++;
    }
    
    return Math.round((fulfilled / total) * 100);
  };

  // Format date with fallback
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not set';
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Show compliance details dialog
  const showComplianceDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsComplianceDialogOpen(true);
  };

  // Render the table view of properties
  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">
              <button 
                className="flex items-center space-x-1 hover:text-primary"
                onClick={() => handleSort('title')}
              >
                <span>Property</span>
                {sortField === 'title' && (
                  <ArrowDownUp className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </button>
            </TableHead>
            <TableHead>
              <button 
                className="flex items-center space-x-1 hover:text-primary"
                onClick={() => handleSort('price')}
              >
                <span>Price</span>
                {sortField === 'price' && (
                  <ArrowDownUp className={`h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
              </button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Beds</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Compliance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProperties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No properties match your filters
              </TableCell>
            </TableRow>
          ) : (
            sortedProperties.map((property) => {
              const complianceIssues = hasComplianceIssues(property);
              const complianceScore = getComplianceScore(property);
              
              return (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-medium">{property.title}</span>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" /> 
                        {property.address}, {property.city}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-primary">£{parseFloat(property.price.toString()).toLocaleString()}</span>
                    {property.billsIncluded && (
                      <span className="ml-1 text-xs text-muted-foreground">incl. bills</span>
                    )}
                  </TableCell>
                  <TableCell>{property.propertyType}</TableCell>
                  <TableCell>{property.bedrooms}</TableCell>
                  <TableCell>
                    {property.available ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Let
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => showComplianceDetails(property)}
                    >
                      {complianceIssues ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Issues ({complianceIssues.length})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Compliant
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewProperty(property.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProperty(property.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Render the grid view of properties
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedProperties.length === 0 ? (
        <div className="sm:col-span-2 lg:col-span-3 text-center py-10 text-muted-foreground">
          No properties match your filters
        </div>
      ) : (
        sortedProperties.map((property) => {
          const complianceIssues = hasComplianceIssues(property);
          const complianceScore = getComplianceScore(property);
          
          return (
            <Card key={property.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {property.images && property.images.length > 0 ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Building className="h-10 w-10 text-muted-foreground opacity-30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {property.available ? (
                    <Badge className="bg-green-600">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Let</Badge>
                  )}
                  {complianceIssues && (
                    <Badge 
                      variant="outline" 
                      className="bg-red-50 text-red-700 border-red-200 cursor-pointer"
                      onClick={() => showComplianceDetails(property)}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Issues
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <MapPin className="h-3 w-3 mr-1" /> 
                  {property.address}, {property.city}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg text-primary">£{parseFloat(property.price.toString()).toLocaleString()}</span>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="flex items-center">
                      <Home className="h-4 w-4 mr-1" />
                      {property.bedrooms} beds
                    </span>
                    <span>{property.propertyType}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {property.billsIncluded && (
                    <Badge variant="outline" className="text-xs">
                      Bills Included
                    </Badge>
                  )}
                  {property.furnished && (
                    <Badge variant="outline" className="text-xs">
                      Furnished
                    </Badge>
                  )}
                  {property.university && (
                    <Badge variant="outline" className="text-xs">
                      Near {property.university}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-2 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewProperty(property.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEditProperty(property.id)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
            <SelectTrigger className="min-w-[130px]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                <SelectValue placeholder="Availability" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Not Available</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
            <SelectTrigger className="min-w-[130px]">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <SelectValue placeholder="Property Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {propertyTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            
            {onCreateProperty && (
              <Button onClick={onCreateProperty} className="ml-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Showing {sortedProperties.length} of {properties.length} properties
          </h3>
        </div>
        
        {searchTerm || selectedAvailability !== 'all' || selectedPropertyType !== 'all' ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchTerm('');
              setSelectedAvailability('all');
              setSelectedPropertyType('all');
            }}
            className="text-xs"
          >
            <FilterX className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        ) : null}
      </div>
      
      {viewMode === 'table' ? renderTableView() : renderGridView()}
      
      {/* Compliance Details Dialog */}
      {selectedProperty && (
        <Dialog open={isComplianceDialogOpen} onOpenChange={setIsComplianceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Property Compliance Status</DialogTitle>
              <DialogDescription>
                Details for {selectedProperty.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Compliance:</span>
                <Badge 
                  variant="outline" 
                  className={`
                    ${getComplianceScore(selectedProperty) === 100 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : getComplianceScore(selectedProperty) >= 75
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  `}
                >
                  {getComplianceScore(selectedProperty)}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">EPC Certificate</span>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                  </div>
                  {selectedProperty.epcRating && selectedProperty.epcExpiryDate && new Date(selectedProperty.epcExpiryDate) > new Date() ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> 
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" /> 
                      Required
                    </Badge>
                  )}
                </div>
                {selectedProperty.epcRating && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span>Rating: {selectedProperty.epcRating}</span>
                    {selectedProperty.epcExpiryDate && (
                      <span className="ml-2 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires: {formatDate(selectedProperty.epcExpiryDate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">Gas Safety</span>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                  </div>
                  {selectedProperty.gasChecked && selectedProperty.gasCheckExpiryDate && new Date(selectedProperty.gasCheckExpiryDate) > new Date() ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> 
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" /> 
                      Required
                    </Badge>
                  )}
                </div>
                {selectedProperty.gasChecked && selectedProperty.gasCheckDate && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last checked: {formatDate(selectedProperty.gasCheckDate)}
                    </span>
                    {selectedProperty.gasCheckExpiryDate && (
                      <span className="ml-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires: {formatDate(selectedProperty.gasCheckExpiryDate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">Electrical Safety</span>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                  </div>
                  {selectedProperty.electricalChecked && selectedProperty.electricalCheckExpiryDate && new Date(selectedProperty.electricalCheckExpiryDate) > new Date() ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> 
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" /> 
                      Required
                    </Badge>
                  )}
                </div>
                {selectedProperty.electricalChecked && selectedProperty.electricalCheckDate && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last checked: {formatDate(selectedProperty.electricalCheckDate)}
                    </span>
                    {selectedProperty.electricalCheckExpiryDate && (
                      <span className="ml-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires: {formatDate(selectedProperty.electricalCheckExpiryDate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {selectedProperty.bedrooms > 4 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium">HMO License</span>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </div>
                    {selectedProperty.hmoLicensed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> 
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> 
                        Required
                      </Badge>
                    )}
                  </div>
                  {selectedProperty.hmoLicensed && selectedProperty.hmoLicenseNumber && (
                    <div className="text-sm text-muted-foreground">
                      License Number: {selectedProperty.hmoLicenseNumber}
                      {selectedProperty.hmoLicenseExpiryDate && (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Expires: {formatDate(selectedProperty.hmoLicenseExpiryDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComplianceDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsComplianceDialogOpen(false);
                onEditProperty(selectedProperty.id);
              }}>
                Update Compliance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}