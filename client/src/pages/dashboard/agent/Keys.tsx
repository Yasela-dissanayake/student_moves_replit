import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Key, 
  Home, 
  User, 
  Calendar, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle 
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";

const addKeySchema = z.object({
  property_id: z.string().min(1, "Property is required"),
  key_number: z.string().min(1, "Key number is required"),
  key_type: z.string().min(1, "Key type is required"),
  notes: z.string().optional(),
});

export default function KeyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch properties managed by the agent
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent').then(res => res.json()),
  });

  // Form for adding new key
  const form = useForm<z.infer<typeof addKeySchema>>({
    resolver: zodResolver(addKeySchema),
    defaultValues: {
      property_id: "",
      key_number: "",
      key_type: "",
      notes: "",
    },
  });

  // Add key mutation
  const addKeyMutation = useMutation({
    mutationFn: (data: z.infer<typeof addKeySchema>) => 
      apiRequest('POST', '/api/agent/keys', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/keys'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Key added successfully",
        description: "The new key has been registered in the system.",
      });
    },
    onError: (error) => {
      console.error("Error adding key:", error);
      toast({
        title: "Error",
        description: "Failed to add key. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: z.infer<typeof addKeySchema>) {
    addKeyMutation.mutate(data);
  }

  // Mock key data until proper API is available
  const keys = properties.map(property => ({
    id: `key-${property.id}`,
    property_id: property.id,
    property: property,
    key_number: `K${property.id}-A`,
    key_type: 'Main Door',
    issued_to: null,
    status: 'in-office',
    issue_date: null,
    return_date: null,
    notes: 'Original key'
  }));

  // Add some sample issued keys
  if (properties.length > 0) {
    keys.push({
      id: `key-${properties[0].id}-issued`,
      property_id: properties[0].id,
      property: properties[0],
      key_number: `K${properties[0].id}-B`,
      key_type: 'Main Door',
      issued_to: 'John Smith (Contractor)',
      status: 'issued',
      issue_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      return_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'For maintenance work'
    });

    if (properties.length > 1) {
      keys.push({
        id: `key-${properties[1].id}-issued`,
        property_id: properties[1].id,
        property: properties[1],
        key_number: `K${properties[1].id}-B`,
        key_type: 'Main Door + Window',
        issued_to: 'Sarah Johnson (Tenant)',
        status: 'issued',
        issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        return_date: null, // No return date for tenant
        notes: 'Tenant copy'
      });
    }
  }

  const availableKeys = keys.filter(key => key.status === 'in-office');
  const issuedKeys = keys.filter(key => key.status === 'issued');
  const isLoading = isLoadingProperties;

  return (
    <AgentPageTemplate 
      title="Key Management" 
      description="Track and manage property keys"
    >
      <div className="flex justify-end mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Key</DialogTitle>
              <DialogDescription>
                Register a new key for one of your properties.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="property_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property: any) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.title} - {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="key_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Number/ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., K123-A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="key_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select key type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Main Door">Main Door</SelectItem>
                          <SelectItem value="Window">Window</SelectItem>
                          <SelectItem value="Main Door + Window">Main Door + Window</SelectItem>
                          <SelectItem value="Garage">Garage</SelectItem>
                          <SelectItem value="Garden Gate">Garden Gate</SelectItem>
                          <SelectItem value="Communal Entrance">Communal Entrance</SelectItem>
                          <SelectItem value="Mailbox">Mailbox</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about this key..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addKeyMutation.isPending}
                  >
                    {addKeyMutation.isPending && <Loader className="mr-2 h-4 w-4" />}
                    Add Key
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Keys</p>
                <p className="text-2xl font-semibold">{keys.length}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="mr-4 bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Keys</p>
                <p className="text-2xl font-semibold">{availableKeys.length}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="mr-4 bg-amber-100 p-3 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Keys Issued Out</p>
                <p className="text-2xl font-semibold">{issuedKeys.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No keys found</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                There are no keys registered in the system yet.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add New Key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key ID</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Key Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued To</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        {key.key_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{key.property?.title || `Property ID: ${key.property_id}`}</div>
                            <div className="text-xs text-muted-foreground">
                              {key.property?.address}, {key.property?.city}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{key.key_type}</TableCell>
                      <TableCell>
                        {key.status === 'in-office' ? (
                          <Badge className="bg-green-100 text-green-800">Available</Badge>
                        ) : key.status === 'issued' ? (
                          <Badge className="bg-amber-100 text-amber-800">Issued</Badge>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.issued_to ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {key.issued_to}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.issue_date ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(key.issue_date), 'dd MMM yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.return_date ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(key.return_date), 'dd MMM yyyy')}
                          </div>
                        ) : key.status === 'issued' ? (
                          <span className="text-muted-foreground text-sm">No return date</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {key.status === 'in-office' ? (
                            <Button variant="outline" size="sm">
                              Issue Key
                            </Button>
                          ) : key.status === 'issued' ? (
                            <Button variant="outline" size="sm">
                              Mark Returned
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm">
                            View History
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