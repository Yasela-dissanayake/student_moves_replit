import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Key, Home, RotateCcw, KeyRound, UserRound, CheckCircle, Building } from "lucide-react";

// Types for the property key data
interface PropertyKey {
  id: number;
  propertyId: number;
  keyType: string;
  keyCode: string | null;
  keyLocation: string;
  status: string;
  notes: string | null;
  isOriginal: boolean;
  copiesAvailable: number | null;
  dateAssigned: string | null;
  dateReturned: string | null;
  heldBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

interface KeyAssignmentHistory {
  id: number;
  keyId: number;
  assignedTo: number;
  assignedBy: number;
  assignedDate: string;
  returnDate: string | null;
  returnedTo: number | null;
  condition: string | null;
  notes: string | null;
  assignedToName?: string;
  assignedByName?: string;
  returnedToName?: string;
  assignedToType?: string;
}

interface User {
  id: number;
  name: string;
  userType: string;
}

interface PropertyInfo {
  id: number;
  title: string;
}

interface PropertyKeyManagementProps {
  propertyId?: number;
  isAgent?: boolean;
}

const KEY_TYPE_OPTIONS = [
  { value: 'front_door', label: 'Front Door' },
  { value: 'back_door', label: 'Back Door' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'window', label: 'Window' },
  { value: 'garage', label: 'Garage' },
  { value: 'mailbox', label: 'Mailbox' },
  { value: 'gate', label: 'Gate' },
  { value: 'communal', label: 'Communal Entrance' },
  { value: 'other', label: 'Other' },
];

const KEY_LOCATION_OPTIONS = [
  { value: 'office', label: 'Office' },
  { value: 'key_safe', label: 'Key Safe' },
  { value: 'with_agent', label: 'With Agent' },
  { value: 'with_landlord', label: 'With Landlord' },
  { value: 'with_tenant', label: 'With Tenant' },
  { value: 'with_contractor', label: 'With Contractor' },
  { value: 'other', label: 'Other Location' },
];

const StatusBadge = ({ status }: { status: string }) => {
  let color = '';
  switch (status) {
    case 'available':
      color = 'bg-green-100 text-green-800';
      break;
    case 'assigned':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'lost':
      color = 'bg-red-100 text-red-800';
      break;
    case 'damaged':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  return <Badge className={color}>{status}</Badge>;
};

export default function PropertyKeyManagement({ propertyId, isAgent = false }: PropertyKeyManagementProps) {
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedKeyId, setSelectedKeyId] = useState<number | null>(null);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);
  const [isAssignKeyDialogOpen, setIsAssignKeyDialogOpen] = useState(false);
  const [isReturnKeyDialogOpen, setIsReturnKeyDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(propertyId);
  
  // Form states
  const [newKeyData, setNewKeyData] = useState({
    propertyId: propertyId || 0,
    keyType: 'front_door',
    keyCode: '',
    keyLocation: 'office',
    notes: '',
    isOriginal: true,
    copiesAvailable: 0,
    status: 'available'
  });
  
  const [assignKeyData, setAssignKeyData] = useState({
    assignedTo: 0,
    notes: ''
  });
  
  const [returnKeyData, setReturnKeyData] = useState({
    returnedTo: 0,
    condition: 'good',
    notes: ''
  });
  
  // Fetch properties (for agents)
  const { data: properties } = useQuery<PropertyInfo[]>({
    queryKey: ['/api/properties'],
    enabled: isAgent
  });
  
  // Fetch users for assignment
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch keys based on filter
  const keysQuery = useQuery<PropertyKey[]>({
    queryKey: ['/api/property-keys', { propertyId: selectedPropertyId, status: selectedTab !== 'all' ? selectedTab : undefined }],
    enabled: !!selectedPropertyId || !propertyId,
  });
  
  // Fetch history for a selected key
  const historyQuery = useQuery<KeyAssignmentHistory[]>({
    queryKey: ['/api/property-keys', selectedKeyId, 'history'],
    enabled: !!selectedKeyId,
  });
  
  // Fetch selected key data
  const selectedKeyQuery = useQuery<PropertyKey>({
    queryKey: ['/api/property-keys', selectedKeyId],
    enabled: !!selectedKeyId,
  });
  
  // Mutations
  const createKeyMutation = useMutation({
    mutationFn: async (newKey: any) => {
      const response = await apiRequest('POST', '/api/property-keys', newKey);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys'] });
      setIsAddKeyDialogOpen(false);
      toast({
        title: "Key created",
        description: "The key has been added successfully.",
      });
      resetNewKeyForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create key",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const assignKeyMutation = useMutation({
    mutationFn: async ({ keyId, data }: { keyId: number, data: any }) => {
      const response = await apiRequest('POST', `/api/property-keys/${keyId}/assign`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys', selectedKeyId, 'history'] });
      setIsAssignKeyDialogOpen(false);
      toast({
        title: "Key assigned",
        description: "The key has been assigned successfully.",
      });
      resetAssignKeyForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to assign key",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const returnKeyMutation = useMutation({
    mutationFn: async ({ keyId, data }: { keyId: number, data: any }) => {
      const response = await apiRequest('POST', `/api/property-keys/${keyId}/return`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys', selectedKeyId, 'history'] });
      setIsReturnKeyDialogOpen(false);
      toast({
        title: "Key returned",
        description: "The key has been marked as returned.",
      });
      resetReturnKeyForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to return key",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Reset form functions
  const resetNewKeyForm = () => {
    setNewKeyData({
      propertyId: propertyId || 0,
      keyType: 'front_door',
      keyCode: '',
      keyLocation: 'office',
      notes: '',
      isOriginal: true,
      copiesAvailable: 0,
      status: 'available'
    });
  };
  
  const resetAssignKeyForm = () => {
    setAssignKeyData({
      assignedTo: 0,
      notes: ''
    });
  };
  
  const resetReturnKeyForm = () => {
    setReturnKeyData({
      returnedTo: 0,
      condition: 'good',
      notes: ''
    });
  };
  
  // Handle form submissions
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyData.propertyId) {
      toast({
        title: "Missing property",
        description: "Please select a property for this key.",
        variant: "destructive",
      });
      return;
    }
    
    createKeyMutation.mutate(newKeyData);
  };
  
  const handleAssignKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKeyId) {
      toast({
        title: "No key selected",
        description: "Please select a key to assign.",
        variant: "destructive",
      });
      return;
    }
    
    if (!assignKeyData.assignedTo) {
      toast({
        title: "Missing recipient",
        description: "Please select who to assign the key to.",
        variant: "destructive",
      });
      return;
    }
    
    assignKeyMutation.mutate({
      keyId: selectedKeyId,
      data: assignKeyData
    });
  };
  
  const handleReturnKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKeyId) {
      toast({
        title: "No key selected",
        description: "Please select a key to mark as returned.",
        variant: "destructive",
      });
      return;
    }
    
    if (!returnKeyData.returnedTo) {
      toast({
        title: "Missing recipient",
        description: "Please select who received the returned key.",
        variant: "destructive",
      });
      return;
    }
    
    returnKeyMutation.mutate({
      keyId: selectedKeyId,
      data: returnKeyData
    });
  };
  
  const canBeAssigned = (key: PropertyKey) => key.status === 'available';
  const canBeReturned = (key: PropertyKey) => key.status === 'assigned';
  
  // Format a date string for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Get key type label
  const getKeyTypeLabel = (type: string) => {
    return KEY_TYPE_OPTIONS.find(option => option.value === type)?.label || type;
  };
  
  // Get key location label
  const getKeyLocationLabel = (location: string) => {
    return KEY_LOCATION_OPTIONS.find(option => option.value === location)?.label || location;
  };
  
  // Get user name
  const getUserName = (userId: number | null) => {
    if (!userId) return 'N/A';
    return users?.find(user => user.id === userId)?.name || `User #${userId}`;
  };
  
  // Render loading state
  if (keysQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-2">Loading property keys...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Property Key Management</h2>
          <p className="text-gray-500">Manage access keys for your properties</p>
        </div>
        <Button onClick={() => setIsAddKeyDialogOpen(true)}>
          <Key className="h-4 w-4 mr-2" />
          Add New Key
        </Button>
      </div>
      
      {isAgent && (
        <div className="mb-6">
          <Label htmlFor="property-select">Select Property</Label>
          <Select
            value={selectedPropertyId?.toString() || ''}
            onValueChange={(value) => setSelectedPropertyId(value ? Number(value) : undefined)}
          >
            <SelectTrigger className="w-full md:w-[350px]">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {properties?.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Keys</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="lost">Lost/Missing</TabsTrigger>
          <TabsTrigger value="damaged">Damaged</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="space-y-4">
          {keysQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load property keys. Please try again later.</AlertDescription>
            </Alert>
          ) : keysQuery.data && keysQuery.data.length === 0 ? (
            <div className="text-center p-10 border rounded-lg bg-gray-50">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Keys Found</h3>
              <p className="text-gray-500 mb-4">
                {selectedTab === 'all' 
                  ? "You haven't added any keys yet." 
                  : `You don't have any keys with '${selectedTab}' status.`}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddKeyDialogOpen(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Add Your First Key
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keysQuery.data?.map((key) => (
                <Card 
                  key={key.id}
                  className={`border-l-4 ${key.status === 'available' 
                    ? 'border-l-green-500' 
                    : key.status === 'assigned' 
                    ? 'border-l-blue-500'
                    : key.status === 'lost' 
                    ? 'border-l-red-500'
                    : 'border-l-yellow-500'}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Key className="h-5 w-5 mr-2 text-primary" />
                          {getKeyTypeLabel(key.keyType)}
                          {key.isOriginal && <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">Original</Badge>}
                        </CardTitle>
                        <CardDescription>
                          Code: {key.keyCode || 'N/A'}
                        </CardDescription>
                      </div>
                      <StatusBadge status={key.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="font-medium">{getKeyLocationLabel(key.keyLocation)}</span>
                      </div>
                      
                      {key.status === 'assigned' && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Held By:</span>
                          <span className="font-medium">{getUserName(key.heldBy)}</span>
                        </div>
                      )}
                      
                      {key.copiesAvailable !== null && key.copiesAvailable > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Copies Available:</span>
                          <span className="font-medium">{key.copiesAvailable}</span>
                        </div>
                      )}
                      
                      {key.notes && (
                        <div className="pt-1">
                          <span className="text-gray-500 block">Notes:</span>
                          <span className="text-sm italic">{key.notes}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex space-x-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedKeyId(key.id)}
                      >
                        History
                      </Button>
                      
                      {canBeAssigned(key) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedKeyId(key.id);
                            setIsAssignKeyDialogOpen(true);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                      
                      {canBeReturned(key) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            setSelectedKeyId(key.id);
                            setIsReturnKeyDialogOpen(true);
                          }}
                        >
                          Return
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Key History Dialog */}
      {selectedKeyId && (
        <Dialog open={!!selectedKeyId && !isAssignKeyDialogOpen && !isReturnKeyDialogOpen} onOpenChange={(open) => !open && setSelectedKeyId(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Key History</DialogTitle>
              <DialogDescription>
                {selectedKeyQuery.data ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{getKeyTypeLabel(selectedKeyQuery.data.keyType)}</Badge>
                    <span>—</span>
                    <span className="text-sm">Code: {selectedKeyQuery.data.keyCode || 'N/A'}</span>
                  </div>
                ) : 'Loading key details...'}
              </DialogDescription>
            </DialogHeader>
            
            {historyQuery.isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : historyQuery.isError ? (
              <div className="py-4 text-center text-red-500">
                Failed to load key history
              </div>
            ) : historyQuery.data && historyQuery.data.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <Home className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>This key has no assignment history yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4">
                  {historyQuery.data?.map((record, index) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium flex items-center">
                          <UserRound className="h-4 w-4 mr-2" />
                          Assigned to {record.assignedToName || `User #${record.assignedTo}`}
                          <Badge variant="outline" className="ml-2">{record.assignedToType || 'User'}</Badge>
                        </h4>
                        <div className="text-sm text-gray-500">
                          {formatDate(record.assignedDate)}
                        </div>
                      </div>
                      
                      <div className="text-sm mt-2">
                        <span className="text-gray-500">Assigned by:</span> {record.assignedByName || `User #${record.assignedBy}`}
                      </div>
                      
                      {record.notes && (
                        <div className="mt-2 text-sm italic border-l-2 border-gray-200 pl-3 py-1">
                          {record.notes}
                        </div>
                      )}
                      
                      {record.returnDate && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                          <div className="flex justify-between">
                            <div className="flex items-center text-sm font-medium text-green-600">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Returned to {record.returnedToName || `User #${record.returnedTo}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(record.returnDate)}
                            </div>
                          </div>
                          
                          {record.condition && (
                            <div className="text-sm mt-1">
                              <span className="text-gray-500">Condition:</span> {record.condition}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedKeyId(null)}>Close</Button>
              
              {selectedKeyQuery.data && canBeAssigned(selectedKeyQuery.data) && (
                <Button onClick={() => setIsAssignKeyDialogOpen(true)}>
                  Assign This Key
                </Button>
              )}
              
              {selectedKeyQuery.data && canBeReturned(selectedKeyQuery.data) && (
                <Button onClick={() => setIsReturnKeyDialogOpen(true)}>
                  Mark as Returned
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Add New Key Dialog */}
      <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateKey}>
            <DialogHeader>
              <DialogTitle>Add New Key</DialogTitle>
              <DialogDescription>
                Create a new property key to track
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {isAgent && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="property" className="text-right">Property</Label>
                  <div className="col-span-3">
                    <Select
                      value={newKeyData.propertyId?.toString() || ''}
                      onValueChange={(value) => setNewKeyData({...newKeyData, propertyId: Number(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="keyType" className="text-right">Key Type</Label>
                <div className="col-span-3">
                  <Select
                    value={newKeyData.keyType}
                    onValueChange={(value) => setNewKeyData({...newKeyData, keyType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select key type" />
                    </SelectTrigger>
                    <SelectContent>
                      {KEY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="keyCode" className="text-right">Key Code</Label>
                <div className="col-span-3">
                  <Input
                    id="keyCode"
                    value={newKeyData.keyCode}
                    onChange={(e) => setNewKeyData({...newKeyData, keyCode: e.target.value})}
                    placeholder="e.g. FD-001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="keyLocation" className="text-right">Location</Label>
                <div className="col-span-3">
                  <Select
                    value={newKeyData.keyLocation}
                    onValueChange={(value) => setNewKeyData({...newKeyData, keyLocation: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {KEY_LOCATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isOriginal" className="text-right">Original Key</Label>
                <div className="col-span-3">
                  <Select
                    value={newKeyData.isOriginal ? "true" : "false"}
                    onValueChange={(value) => setNewKeyData({...newKeyData, isOriginal: value === "true"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No (Copy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="copies" className="text-right">Copies Available</Label>
                <div className="col-span-3">
                  <Input
                    id="copies"
                    type="number"
                    min="0"
                    value={newKeyData.copiesAvailable}
                    onChange={(e) => setNewKeyData({...newKeyData, copiesAvailable: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Notes</Label>
                <div className="col-span-3">
                  <Input
                    id="notes"
                    value={newKeyData.notes}
                    onChange={(e) => setNewKeyData({...newKeyData, notes: e.target.value})}
                    placeholder="Optional notes about this key"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetNewKeyForm();
                  setIsAddKeyDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createKeyMutation.isPending || !newKeyData.propertyId}
              >
                {createKeyMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  <>Add Key</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Assign Key Dialog */}
      <Dialog open={isAssignKeyDialogOpen} onOpenChange={setIsAssignKeyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAssignKey}>
            <DialogHeader>
              <DialogTitle>Assign Key</DialogTitle>
              <DialogDescription>
                {selectedKeyQuery.data ? (
                  <>
                    Assign {getKeyTypeLabel(selectedKeyQuery.data.keyType)} key
                    {selectedKeyQuery.data.keyCode ? ` (${selectedKeyQuery.data.keyCode})` : ''} to a user
                  </>
                ) : (
                  'Assign this key to a user'
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignTo" className="text-right">Assign To</Label>
                <div className="col-span-3">
                  <Select
                    value={assignKeyData.assignedTo ? assignKeyData.assignedTo.toString() : ''}
                    onValueChange={(value) => setAssignKeyData({...assignKeyData, assignedTo: Number(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.userType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assignNotes" className="text-right">Notes</Label>
                <div className="col-span-3">
                  <Input
                    id="assignNotes"
                    value={assignKeyData.notes}
                    onChange={(e) => setAssignKeyData({...assignKeyData, notes: e.target.value})}
                    placeholder="e.g. For property viewing on Friday"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetAssignKeyForm();
                  setIsAssignKeyDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={assignKeyMutation.isPending || !assignKeyData.assignedTo}
              >
                {assignKeyMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Assigning...
                  </>
                ) : (
                  <>Assign Key</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Return Key Dialog */}
      <Dialog open={isReturnKeyDialogOpen} onOpenChange={setIsReturnKeyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleReturnKey}>
            <DialogHeader>
              <DialogTitle>Return Key</DialogTitle>
              <DialogDescription>
                {selectedKeyQuery.data ? (
                  <>
                    Record the return of {getKeyTypeLabel(selectedKeyQuery.data.keyType)} key
                    {selectedKeyQuery.data.keyCode ? ` (${selectedKeyQuery.data.keyCode})` : ''}
                  </>
                ) : (
                  'Record the return of this key'
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="returnedTo" className="text-right">Returned To</Label>
                <div className="col-span-3">
                  <Select
                    value={returnKeyData.returnedTo ? returnKeyData.returnedTo.toString() : ''}
                    onValueChange={(value) => setReturnKeyData({...returnKeyData, returnedTo: Number(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(user => ['agent', 'landlord', 'admin'].includes(user.userType))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.userType})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="condition" className="text-right">Condition</Label>
                <div className="col-span-3">
                  <Select
                    value={returnKeyData.condition}
                    onValueChange={(value) => setReturnKeyData({...returnKeyData, condition: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good Condition</SelectItem>
                      <SelectItem value="fair">Fair Condition</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="returnNotes" className="text-right">Notes</Label>
                <div className="col-span-3">
                  <Input
                    id="returnNotes"
                    value={returnKeyData.notes}
                    onChange={(e) => setReturnKeyData({...returnKeyData, notes: e.target.value})}
                    placeholder="Any notes about the return"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetReturnKeyForm();
                  setIsReturnKeyDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={returnKeyMutation.isPending || !returnKeyData.returnedTo}
              >
                {returnKeyMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>Mark as Returned</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}