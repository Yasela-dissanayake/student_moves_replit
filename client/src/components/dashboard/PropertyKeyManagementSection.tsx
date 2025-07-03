import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from '@/lib/auth';
import { Key, Plus, RotateCcw, User, Home } from "lucide-react";

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
  heldBy: number | null;
  createdAt: string;
}

interface PropertyInfo {
  id: number;
  title: string;
}

export default function PropertyKeyManagementSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>();
  
  // Form state
  const [newKeyData, setNewKeyData] = useState({
    propertyId: 0,
    keyType: 'front_door',
    keyCode: '',
    keyLocation: 'office',
    notes: '',
    isOriginal: true,
    copiesAvailable: 0,
    status: 'available'
  });
  
  // Fetch properties
  const { data: properties } = useQuery<PropertyInfo[]>({
    queryKey: ['/api/properties'],
  });
  
  // Fetch keys
  const { data: keys, isLoading } = useQuery<PropertyKey[]>({
    queryKey: ['/api/property-keys', { propertyId: selectedPropertyId }],
    enabled: true,
  });
  
  // Create key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (newKey: any) => {
      const response = await apiRequest('POST', '/api/property-keys', newKey);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-keys'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Key added",
        description: "The property key has been successfully added.",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to add key",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setNewKeyData({
      propertyId: 0,
      keyType: 'front_door',
      keyCode: '',
      keyLocation: 'office',
      notes: '',
      isOriginal: true,
      copiesAvailable: 0,
      status: 'available'
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyData.propertyId) {
      toast({
        title: "Property required",
        description: "Please select a property for this key.",
        variant: "destructive",
      });
      return;
    }
    createKeyMutation.mutate(newKeyData);
  };
  
  const getKeyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'front_door': 'Front Door',
      'back_door': 'Back Door',
      'bedroom': 'Bedroom',
      'window': 'Window',
      'garage': 'Garage',
      'mailbox': 'Mailbox',
      'gate': 'Gate',
      'communal': 'Communal Entrance',
      'other': 'Other',
    };
    return types[type] || type;
  };
  
  const getKeyLocationLabel = (location: string) => {
    const locations: Record<string, string> = {
      'office': 'Office',
      'key_safe': 'Key Safe',
      'with_agent': 'With Agent',
      'with_landlord': 'With Landlord',
      'with_tenant': 'With Tenant',
      'with_contractor': 'With Contractor',
      'other': 'Other Location',
    };
    return locations[location] || location;
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'damaged':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Property Key Management</h2>
          <p className="text-gray-600 mb-4">Track and manage keys for all your managed properties.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Key
        </Button>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="property-filter">Filter by Property</Label>
        <Select
          value={selectedPropertyId?.toString() || ''}
          onValueChange={(value) => setSelectedPropertyId(value ? Number(value) : undefined)}
        >
          <SelectTrigger className="w-full md:w-[400px]">
            <SelectValue placeholder="All Properties" />
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
      
      {isLoading ? (
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading keys...</p>
        </div>
      ) : keys && keys.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keys.map((key) => (
            <Card key={key.id} className="overflow-hidden border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    <Key className="h-5 w-5 mr-2 text-primary" />
                    {getKeyTypeLabel(key.keyType)}
                  </CardTitle>
                  <Badge className={getStatusBadgeColor(key.status)}>
                    {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  Property: {properties?.find(p => p.id === key.propertyId)?.title || `Property #${key.propertyId}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Key Code:</span>
                    <span>{key.keyCode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span>{getKeyLocationLabel(key.keyLocation)}</span>
                  </div>
                  {key.isOriginal && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <Badge variant="outline" className="bg-blue-50">Original</Badge>
                    </div>
                  )}
                  {key.notes && (
                    <div className="mt-2">
                      <span className="text-gray-500 block mb-1">Notes:</span>
                      <p className="text-gray-700 text-sm italic">{key.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-6">
          <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No Keys Found</h3>
          <p className="text-gray-500 mb-4">
            {selectedPropertyId 
              ? "No keys found for the selected property." 
              : "You haven't added any property keys yet."}
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Key
          </Button>
        </Card>
      )}
      
      {/* Add Key Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Property Key</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="property">Property</Label>
                <Select
                  value={newKeyData.propertyId.toString()}
                  onValueChange={(value) => setNewKeyData({...newKeyData, propertyId: Number(value)})}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select a property</SelectItem>
                    {properties?.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="keyType">Key Type</Label>
                  <Select
                    value={newKeyData.keyType}
                    onValueChange={(value) => setNewKeyData({...newKeyData, keyType: value})}
                  >
                    <SelectTrigger id="keyType">
                      <SelectValue placeholder="Select key type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front_door">Front Door</SelectItem>
                      <SelectItem value="back_door">Back Door</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                      <SelectItem value="garage">Garage</SelectItem>
                      <SelectItem value="mailbox">Mailbox</SelectItem>
                      <SelectItem value="gate">Gate</SelectItem>
                      <SelectItem value="communal">Communal Entrance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="keyLocation">Key Location</Label>
                  <Select
                    value={newKeyData.keyLocation}
                    onValueChange={(value) => setNewKeyData({...newKeyData, keyLocation: value})}
                  >
                    <SelectTrigger id="keyLocation">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="key_safe">Key Safe</SelectItem>
                      <SelectItem value="with_agent">With Agent</SelectItem>
                      <SelectItem value="with_landlord">With Landlord</SelectItem>
                      <SelectItem value="with_tenant">With Tenant</SelectItem>
                      <SelectItem value="with_contractor">With Contractor</SelectItem>
                      <SelectItem value="other">Other Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="keyCode">Key Code (Optional)</Label>
                <Input
                  id="keyCode"
                  value={newKeyData.keyCode}
                  onChange={(e) => setNewKeyData({...newKeyData, keyCode: e.target.value})}
                  placeholder="Enter key code or identification"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={newKeyData.notes}
                  onChange={(e) => setNewKeyData({...newKeyData, notes: e.target.value})}
                  placeholder="Add any additional notes about this key"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOriginal"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={newKeyData.isOriginal}
                    onChange={(e) => setNewKeyData({...newKeyData, isOriginal: e.target.checked})}
                  />
                  <Label htmlFor="isOriginal" className="font-normal">Original Key</Label>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="copies">Copies Available</Label>
                  <Input
                    id="copies"
                    type="number"
                    min="0"
                    value={newKeyData.copiesAvailable}
                    onChange={(e) => setNewKeyData({...newKeyData, copiesAvailable: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createKeyMutation.isPending}>
                {createKeyMutation.isPending ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-b-2 rounded-full border-white"></span>
                    Adding...
                  </>
                ) : (
                  <>Add Key</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}