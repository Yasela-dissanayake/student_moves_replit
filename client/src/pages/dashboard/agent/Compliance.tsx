import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  Home, 
  AlertTriangle, 
  FileCheck, 
  CalendarClock,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { format, addMonths, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";

// Helper function to get compliance status from date
const getComplianceStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'missing', label: 'Missing', variant: 'destructive' };
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const threeMonthsFromNow = addMonths(today, 3);
  
  if (isBefore(expiry, today)) {
    return { status: 'expired', label: 'Expired', variant: 'destructive' };
  } else if (isBefore(expiry, threeMonthsFromNow)) {
    return { status: 'expiring', label: 'Expiring Soon', variant: 'warning' };
  } else {
    return { status: 'valid', label: 'Valid', variant: 'success' };
  }
};

export default function Compliance() {
  const { toast } = useToast();

  // Fetch properties managed by the agent
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent').then(res => res.json()),
  });

  // Calculate compliance statistics
  const complianceStats = properties.reduce((stats, property) => {
    // Gas safety
    const gasStatus = getComplianceStatus(property.gas_check_expiry_date);
    stats.gasChecks[gasStatus.status]++;
    
    // Electrical safety
    const electricalStatus = getComplianceStatus(property.electrical_check_expiry_date);
    stats.electricalChecks[electricalStatus.status]++;
    
    // EPC
    const epcStatus = getComplianceStatus(property.epc_expiry_date);
    stats.epcCertificates[epcStatus.status]++;
    
    // HMO
    if (property.hmo_licensed) {
      const hmoStatus = getComplianceStatus(property.hmo_license_expiry_date);
      stats.hmoLicenses[hmoStatus.status]++;
    }
    
    return stats;
  }, {
    gasChecks: { valid: 0, expiring: 0, expired: 0, missing: 0 },
    electricalChecks: { valid: 0, expiring: 0, expired: 0, missing: 0 },
    epcCertificates: { valid: 0, expiring: 0, expired: 0, missing: 0 },
    hmoLicenses: { valid: 0, expiring: 0, expired: 0, missing: 0 }
  });

  const totalProperties = properties.length;
  
  // Calculate overall compliance score (simple average of valid certificates)
  const calculateComplianceScore = () => {
    if (totalProperties === 0) return 0;
    
    const validGas = complianceStats.gasChecks.valid;
    const validElectrical = complianceStats.electricalChecks.valid;
    const validEPC = complianceStats.epcCertificates.valid;
    
    return Math.round(((validGas + validElectrical + validEPC) / (totalProperties * 3)) * 100);
  };
  
  const complianceScore = calculateComplianceScore();

  return (
    <AgentPageTemplate 
      title="Compliance Management" 
      description="Monitor and manage property compliance certificates"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <Progress value={complianceScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gas Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Valid</span>
              <Badge variant="success" className="ml-auto">
                {complianceStats.gasChecks.valid} / {totalProperties}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expiring Soon</span>
              <Badge variant="warning" className="ml-auto">
                {complianceStats.gasChecks.expiring}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expired/Missing</span>
              <Badge variant="destructive" className="ml-auto">
                {complianceStats.gasChecks.expired + complianceStats.gasChecks.missing}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Electrical Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Valid</span>
              <Badge variant="success" className="ml-auto">
                {complianceStats.electricalChecks.valid} / {totalProperties}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expiring Soon</span>
              <Badge variant="warning" className="ml-auto">
                {complianceStats.electricalChecks.expiring}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expired/Missing</span>
              <Badge variant="destructive" className="ml-auto">
                {complianceStats.electricalChecks.expired + complianceStats.electricalChecks.missing}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EPC Certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Valid</span>
              <Badge variant="success" className="ml-auto">
                {complianceStats.epcCertificates.valid} / {totalProperties}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expiring Soon</span>
              <Badge variant="warning" className="ml-auto">
                {complianceStats.epcCertificates.expiring}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Expired/Missing</span>
              <Badge variant="destructive" className="ml-auto">
                {complianceStats.epcCertificates.expired + complianceStats.epcCertificates.missing}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No properties found</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any properties to check for compliance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Gas Safety</TableHead>
                    <TableHead>Electrical Safety</TableHead>
                    <TableHead>EPC</TableHead>
                    <TableHead>HMO License</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => {
                    const gasStatus = getComplianceStatus(property.gas_check_expiry_date);
                    const electricalStatus = getComplianceStatus(property.electrical_check_expiry_date);
                    const epcStatus = getComplianceStatus(property.epc_expiry_date);
                    const hmoStatus = property.hmo_licensed 
                      ? getComplianceStatus(property.hmo_license_expiry_date) 
                      : { status: 'n/a', label: 'N/A', variant: 'secondary' };
                  
                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Home className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{property.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {property.address}, {property.city}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant={gasStatus.variant} className="mb-1 w-fit">
                              {gasStatus.label}
                            </Badge>
                            {property.gas_check_expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(property.gas_check_expiry_date), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant={electricalStatus.variant} className="mb-1 w-fit">
                              {electricalStatus.label}
                            </Badge>
                            {property.electrical_check_expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(property.electrical_check_expiry_date), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant={epcStatus.variant} className="mb-1 w-fit">
                              {epcStatus.label}
                            </Badge>
                            {property.epc_expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(property.epc_expiry_date), 'dd MMM yyyy')}
                              </span>
                            )}
                            {property.epc_rating && (
                              <span className="text-xs font-medium">
                                Rating: {property.epc_rating}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <Badge variant={hmoStatus.variant} className="mb-1 w-fit">
                              {hmoStatus.label}
                            </Badge>
                            {property.hmo_licensed && property.hmo_license_expiry_date && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(property.hmo_license_expiry_date), 'dd MMM yyyy')}
                              </span>
                            )}
                            {property.hmo_licensed && property.hmo_license_number && (
                              <span className="text-xs font-medium">
                                License: {property.hmo_license_number}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <FileCheck className="h-4 w-4 mr-2" /> Update Compliance
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AgentPageTemplate>
  );
}