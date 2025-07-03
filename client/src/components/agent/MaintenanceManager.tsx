import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  Plus,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  PoundSterling,
  UserCog2,
  MapPin,
  Home,
  Wrench,
  Activity,
  Filter,
  X
} from "lucide-react";
import { MaintenanceRequest, Property, Contractor } from '@shared/schema';

interface MaintenanceWithDetails extends MaintenanceRequest {
  property: Property;
  assignedContractor?: Contractor;
}

interface MaintenanceManagerProps {
  maintenanceRequests: MaintenanceWithDetails[];
  properties: Property[];
  contractors: Contractor[];
  onCreateMaintenanceRequest: (requestData: any) => void;
  onUpdateMaintenanceRequest: (id: number, requestData: any) => void;
  onAssignContractor: (requestId: number, contractorId: number) => void;
}

export default function MaintenanceManager({
  maintenanceRequests,
  properties,
  contractors,
  onCreateMaintenanceRequest,
  onUpdateMaintenanceRequest,
  onAssignContractor
}: MaintenanceManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceWithDetails | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    estimatedCost: '',
    requiresLandlordApproval: false
  });
  
  const [selectedContractor, setSelectedContractor] = useState<number | null>(null);
  
  // Enhance maintenance requests with property data
  const enhancedRequests = maintenanceRequests.map(request => {
    const property = properties.find(p => p.id === request.propertyId);
    return {
      ...request,
      property: property || { address: 'Unknown location', id: 0 },
      assignedContractor: contractors.find(c => c.id === (request.assignedContractorId || 0))
    };
  });
  
  const filteredRequests = enhancedRequests.filter(request => {
    // Status filter
    if (activeTab !== 'all' && request.status !== activeTab) {
      return false;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      request.title.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower) ||
      (request.property?.address && request.property.address.toLowerCase().includes(searchLower)) ||
      (request.category && request.category.toLowerCase().includes(searchLower))
    );
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'requiresLandlordApproval') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleCreateRequest = () => {
    const newRequest = {
      ...formData,
      propertyId: parseInt(formData.propertyId),
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined
    };
    
    onCreateMaintenanceRequest(newRequest);
    setFormData({
      propertyId: '',
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      estimatedCost: '',
      requiresLandlordApproval: false
    });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Maintenance Request Created",
      description: "The maintenance request has been created successfully.",
    });
  };
  
  const handleAssignContractor = () => {
    if (!selectedRequest || !selectedContractor) return;
    
    onAssignContractor(selectedRequest.id, selectedContractor);
    setSelectedContractor(null);
    setIsAssignDialogOpen(false);
    
    toast({
      title: "Contractor Assigned",
      description: "The contractor has been assigned to this maintenance request.",
    });
  };
  
  const handleUpdateStatus = (requestId: number, newStatus: string) => {
    onUpdateMaintenanceRequest(requestId, { status: newStatus });
    
    toast({
      title: "Status Updated",
      description: `The maintenance request status has been updated to ${newStatus}.`,
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Scheduled</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'plumbing':
        return <Wrench className="h-4 w-4" />;
      case 'electrical':
        return <Activity className="h-4 w-4" />;
      case 'appliance':
        return <Home className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div>
            <CardTitle>Maintenance Manager</CardTitle>
            <CardDescription>Manage property maintenance requests and repairs</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Maintenance Request</DialogTitle>
                <DialogDescription>
                  Fill out the details to create a new maintenance request
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="propertyId">Property</Label>
                  <select 
                    id="propertyId"
                    name="propertyId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={formData.propertyId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                    placeholder="Brief title of the maintenance issue"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Detailed description of the maintenance issue"
                    required
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select 
                      id="priority"
                      name="priority"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <select 
                      id="category"
                      name="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="general">General</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="appliance">Appliance</option>
                      <option value="heating">Heating</option>
                      <option value="structural">Structural</option>
                      <option value="external">External/Garden</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedCost">Estimated Cost (£)</Label>
                  <Input 
                    id="estimatedCost" 
                    name="estimatedCost" 
                    type="number" 
                    value={formData.estimatedCost} 
                    onChange={handleInputChange} 
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresLandlordApproval"
                    name="requiresLandlordApproval"
                    checked={formData.requiresLandlordApproval}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="requiresLandlordApproval">Requires landlord approval</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleCreateRequest}>Create Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search maintenance requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" className="hidden md:flex">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">No maintenance requests found</h3>
                <p className="text-sm">Try adjusting your filters or create a new request</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <Card key={request.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{request.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{request.property.address}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{request.description}</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(request.reportedDate, 'dd MMM yyyy')}</span>
                        </div>
                        {request.category && (
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(request.category)}
                            <span className="capitalize">{request.category}</span>
                          </div>
                        )}
                        {request.estimatedCost && (
                          <div className="flex items-center gap-1">
                            <PoundSterling className="h-3 w-3" />
                            <span>Est. £{request.estimatedCost}</span>
                          </div>
                        )}
                        {request.assignedContractor && (
                          <div className="flex items-center gap-1">
                            <UserCog2 className="h-3 w-3" />
                            <span>{request.assignedContractor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 flex flex-row md:flex-col items-center justify-between gap-2 md:w-[140px]">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedRequest(request)}>
                        View Details
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            Update Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'pending')}>
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Mark as Pending</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'scheduled')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Mark as Scheduled</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'in-progress')}>
                            <Activity className="mr-2 h-4 w-4" />
                            <span>Mark as In Progress</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'completed')}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Mark as Completed</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(request.id, 'cancelled')}>
                            <X className="mr-2 h-4 w-4" />
                            <span>Mark as Cancelled</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button variant="outline" size="sm" className="w-full" 
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Maintenance Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest && !isAssignDialogOpen} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Maintenance Request Details</DialogTitle>
              <DialogDescription>
                Full details of maintenance request #{selectedRequest.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedRequest.title}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedRequest.status)}
                  {getPriorityBadge(selectedRequest.priority)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold">Property</h4>
                  <p>{selectedRequest.property.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Reported Date</h4>
                  <p>{format(selectedRequest.reportedDate, 'PPP')}</p>
                </div>
                {selectedRequest.scheduledDate && (
                  <div>
                    <h4 className="text-sm font-semibold">Scheduled Date</h4>
                    <p>{format(selectedRequest.scheduledDate, 'PPP')}</p>
                  </div>
                )}
                {selectedRequest.completedDate && (
                  <div>
                    <h4 className="text-sm font-semibold">Completed Date</h4>
                    <p>{format(selectedRequest.completedDate, 'PPP')}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold">Category</h4>
                  <p className="capitalize">{selectedRequest.category || 'General'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Estimated Cost</h4>
                  <p>{selectedRequest.estimatedCost ? `£${selectedRequest.estimatedCost}` : 'Not specified'}</p>
                </div>
                {selectedRequest.actualCost && (
                  <div>
                    <h4 className="text-sm font-semibold">Actual Cost</h4>
                    <p>£{selectedRequest.actualCost}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold">Landlord Approval</h4>
                  <p>
                    {selectedRequest.requiresLandlordApproval
                      ? selectedRequest.landlordApproved 
                        ? 'Approved' 
                        : 'Pending Approval'
                      : 'Not Required'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-1">Description</h4>
                <p className="whitespace-pre-line">{selectedRequest.description}</p>
              </div>
              
              {selectedRequest.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-1">Notes</h4>
                  <p className="whitespace-pre-line">{selectedRequest.notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-semibold mb-1">Assigned Contractor</h4>
                {selectedRequest.assignedContractor ? (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="font-medium">{selectedRequest.assignedContractor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.assignedContractor.email} • {selectedRequest.assignedContractor.phone}
                    </div>
                    {selectedRequest.assignedContractor.services && selectedRequest.assignedContractor.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequest.assignedContractor.services.map((service, index) => (
                          <Badge key={index} variant="outline" className="capitalize">{service}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">No contractor assigned</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAssignDialogOpen(true)}
                    >
                      Assign Contractor
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Assign Contractor Dialog */}
      {selectedRequest && (
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assign Contractor</DialogTitle>
              <DialogDescription>
                Select a contractor to assign to this maintenance request
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Maintenance Request</h3>
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.property.address}</p>
              </div>
              
              <Label htmlFor="contractor">Select Contractor</Label>
              <select 
                id="contractor"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 mt-1"
                value={selectedContractor || ''}
                onChange={(e) => setSelectedContractor(parseInt(e.target.value))}
              >
                <option value="">Select a contractor</option>
                {contractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name} - {contractor.services.join(', ')}
                  </option>
                ))}
              </select>
              
              {selectedContractor && (
                <div className="mt-4 bg-muted p-3 rounded-md">
                  <h4 className="font-medium">
                    {contractors.find(c => c.id === selectedContractor)?.name}
                  </h4>
                  <div className="text-sm text-muted-foreground mt-1">
                    <div>
                      <span className="font-semibold">Email:</span> {contractors.find(c => c.id === selectedContractor)?.email}
                    </div>
                    <div>
                      <span className="font-semibold">Phone:</span> {contractors.find(c => c.id === selectedContractor)?.phone}
                    </div>
                    {contractors.find(c => c.id === selectedContractor)?.hourlyRate && (
                      <div>
                        <span className="font-semibold">Rate:</span> £{contractors.find(c => c.id === selectedContractor)?.hourlyRate}/hour
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contractors.find(c => c.id === selectedContractor)?.services.map((service, index) => (
                      <Badge key={index} variant="outline" className="capitalize">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignContractor} disabled={!selectedContractor}>Assign Contractor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}