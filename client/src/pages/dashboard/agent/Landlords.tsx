import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  UserCircle, 
  Search, 
  Plus,
  Mail,
  Phone,
  Home,
  CalendarClock
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";

export default function Landlords() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [landlordData, setLandlordData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: ''
  });

  // Fetch landlords for the agent
  const { data: landlords = [], isLoading: isLoadingLandlords } = useQuery({
    queryKey: ['/api/landlords/agent'],
    queryFn: () => apiRequest('GET', '/api/landlords/agent').then(res => res.json()),
  });

  // Fetch properties (to match with landlords)
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent').then(res => res.json()),
  });

  const isLoading = isLoadingLandlords || isLoadingProperties;

  // Add landlord mutation
  const addLandlordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/landlords/agent', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Landlord added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/landlords/agent'] });
      setIsAddDialogOpen(false);
      setLandlordData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add landlord",
        variant: "destructive",
      });
    },
  });

  // Get count of properties by landlord
  const getPropertyCountByLandlord = (landlordId: any) => {
    return properties.filter((property: any) => property.landlord_id === landlordId).length;
  };

  const handleAddLandlord = () => {
    setIsAddDialogOpen(true);
  };

  const handleSubmitLandlord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!landlordData.name || !landlordData.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    addLandlordMutation.mutate(landlordData);
  };

  const handleInputChange = (field: string, value: string) => {
    setLandlordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AgentPageTemplate 
      title="Landlords" 
      description="Manage landlords and their properties"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search landlords..."
            className="pl-10 py-2 pr-4 border rounded-md w-[250px] text-sm"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddLandlord}>
              <Plus className="mr-2 h-4 w-4" /> Add Landlord
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Landlord</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitLandlord} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={landlordData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter landlord name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={landlordData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={landlordData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={landlordData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={landlordData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={landlordData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addLandlordMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {addLandlordMutation.isPending ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Landlord
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : landlords.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No landlords found</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                You don't have any landlords added yet.
              </p>
              <Button onClick={handleAddLandlord}>
                <Plus className="mr-2 h-4 w-4" /> Add Landlord
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Meeting</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landlords.map((landlord) => (
                    <TableRow key={landlord.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <div>{landlord.name}</div>
                            <div className="text-xs text-muted-foreground">{landlord.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          {getPropertyCountByLandlord(landlord.id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Not scheduled</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" title="Email landlord">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Call landlord">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AgentPageTemplate>
  );
}