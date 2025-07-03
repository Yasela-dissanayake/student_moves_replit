import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
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
  HomeIcon,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";

export default function Tenancies() {
  const { toast } = useToast();

  // Fetch tenancies managed by the agent
  const { data: tenancies = [], isLoading } = useQuery({
    queryKey: ['/api/tenancies/agent'],
    queryFn: () => apiRequest('GET', '/api/tenancies/agent'),
  });

  // Define Tenancy type
  type Tenancy = {
    id: number;
    propertyId: number;
    tenantId: number;
    property?: {
      title?: string;
    };
    tenant?: {
      name?: string;
    };
    startDate?: string;
    endDate?: string;
    rentAmount?: string | number;
    depositAmount?: string | number;
    depositProtectionScheme?: string;
    active?: boolean;
    signedByTenant?: boolean;
    signedByOwner?: boolean;
  };

  // Get different tenancy statuses
  const activeTenancies = (tenancies as Tenancy[]).filter(tenancy => tenancy.active);
  const pendingTenancies = (tenancies as Tenancy[]).filter(tenancy => 
    !tenancy.active && (!tenancy.signedByTenant || !tenancy.signedByOwner)
  );
  const expiredTenancies = (tenancies as Tenancy[]).filter(tenancy => 
    !tenancy.active && tenancy.endDate && new Date(tenancy.endDate) < new Date()
  );

  const formatCurrency = (amount: string | number | undefined): string => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(parseFloat(amount.toString()));
  };

  const renderTenancyStatus = (tenancy: Tenancy) => {
    if (tenancy.active) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
    } else if (!tenancy.signedByTenant || !tenancy.signedByOwner) {
      return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Pending Signatures</Badge>;
    } else if (tenancy.endDate && new Date(tenancy.endDate) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    } else {
      return <Badge variant="outline">Inactive</Badge>;
    }
  };

  const renderTenanciesTable = (tenanciesList: Tenancy[]) => {
    if (tenanciesList.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tenancies found</h3>
          <p className="text-muted-foreground mt-2">
            There are no tenancies in this category.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Rent Amount</TableHead>
              <TableHead>Deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenanciesList.map((tenancy: Tenancy) => (
              <TableRow key={tenancy.id}>
                <TableCell className="font-medium">
                  {tenancy.property?.title || `Property ID: ${tenancy.propertyId}`}
                </TableCell>
                <TableCell>
                  {tenancy.tenant?.name || `Tenant ID: ${tenancy.tenantId}`}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      From: {tenancy.startDate 
                        ? format(new Date(tenancy.startDate), 'dd MMM yyyy')
                        : 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      To: {tenancy.endDate 
                        ? format(new Date(tenancy.endDate), 'dd MMM yyyy')
                        : 'Ongoing'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatCurrency(tenancy.rentAmount)}
                </TableCell>
                <TableCell>
                  {formatCurrency(tenancy.depositAmount)}
                  {tenancy.depositProtectionScheme && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {tenancy.depositProtectionScheme}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {renderTenancyStatus(tenancy)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/tenancies/${tenancy.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FileText className="h-4 w-4" /> Documents
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AgentPageTemplate 
      title="Tenancies" 
      description="Manage tenancies for your properties"
    >
      <div className="flex justify-end mb-6">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Tenancy
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center mb-4">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" /> Active Tenancies
                </h3>
                {renderTenanciesTable(activeTenancies)}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold flex items-center mb-4">
                  <Clock className="mr-2 h-5 w-5 text-amber-500" /> Pending Tenancies
                </h3>
                {renderTenanciesTable(pendingTenancies)}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold flex items-center mb-4">
                  <Calendar className="mr-2 h-5 w-5 text-gray-500" /> Expired Tenancies
                </h3>
                {renderTenanciesTable(expiredTenancies)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AgentPageTemplate>
  );
}