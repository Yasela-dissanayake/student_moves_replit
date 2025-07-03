import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  UserCircle, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  Mail,
  Phone
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";

export default function Tenants() {
  const { toast } = useToast();

  // Fetch tenants for properties managed by the agent
  const { data: tenancies = [], isLoading } = useQuery({
    queryKey: ['/api/tenancies/agent'],
    queryFn: () => apiRequest('GET', '/api/tenancies/agent').then(res => res.json()),
  });

  return (
    <AgentPageTemplate 
      title="Tenants" 
      description="Manage tenants for your properties"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search tenants..."
            className="pl-10 py-2 pr-4 border rounded-md w-[250px] text-sm"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : tenancies.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tenants found</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any active tenants at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenancies.map((tenancy) => (
                    <TableRow key={tenancy.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <div>{tenancy.tenant?.name || 'Unknown Tenant'}</div>
                            <div className="text-xs text-muted-foreground">
                              {tenancy.tenant?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {tenancy.property?.title || `Property ID: ${tenancy.property_id}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tenancy.property?.address}, {tenancy.property?.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenancy.active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        £{tenancy.rent_amount || tenancy.property?.price || 0}/month
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" title="Email tenant">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Call tenant">
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