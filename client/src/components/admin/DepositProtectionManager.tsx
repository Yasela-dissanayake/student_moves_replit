import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldCheck, ShieldX, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Types
interface DepositScheme {
  name: string;
  website: string;
  description: string;
}

interface Schemes {
  dps: DepositScheme;
  mydeposits: DepositScheme;
  tds: DepositScheme;
}

interface DepositSchemeCredentials {
  id: number;
  userId: number;
  schemeName: string;
  schemeUsername: string;
  schemePassword: string;
  accountNumber: string | null;
  apiKey: string | null;
  isDefault: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

interface Property {
  id: number;
  title: string;
  address: string;
}

interface Tenant {
  id: number;
  name: string;
  email?: string;
}

interface Tenancy {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string;
  depositProtectionScheme: string | null;
  depositProtectionId: string | null;
  active: boolean;
  createdAt: string;
}

interface UnprotectedDeposit {
  tenancy: Tenancy;
  property: Property | null;
  tenant: Tenant | null;
  depositPayment: {
    id: number;
    amount: string;
    paidDate: string | null;
  } | null;
}

interface RegisterDepositResult {
  success: boolean;
  depositProtectionId?: string;
  certificateUrl?: string;
  error?: string;
}

interface AutoRegisterResult {
  success: number;
  failed: number;
  errors: string[];
}

const DepositProtectionManager: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<string>('dps');
  const [selectedCredentialsId, setSelectedCredentialsId] = useState<number | null>(null);
  const [registering, setRegistering] = useState<number | null>(null);
  const [autoRegistering, setAutoRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegisterDepositResult | null>(null);
  const [autoRegistrationResult, setAutoRegistrationResult] = useState<AutoRegisterResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deposit protection schemes
  const { data: schemes, isLoading: schemesLoading } = useQuery({
    queryKey: ['/api/deposit-protection/schemes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deposit-protection/schemes');
      return response.json() as Promise<Schemes>;
    }
  });

  // Fetch unprotected deposits
  const { 
    data: unprotectedDeposits, 
    isLoading: depositsLoading,
    error: depositsError,
    refetch: refetchUnprotectedDeposits
  } = useQuery({
    queryKey: ['/api/deposit-protection/unprotected'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deposit-protection/unprotected');
      return response.json() as Promise<UnprotectedDeposit[]>;
    }
  });
  
  // Fetch deposit scheme credentials
  const { 
    data: credentials, 
    isLoading: credentialsLoading 
  } = useQuery({
    queryKey: ['/api/deposit-scheme-credentials'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deposit-scheme-credentials');
      return response.json() as Promise<DepositSchemeCredentials[]>;
    }
  });

  // Mutation for registering a deposit
  const registerDepositMutation = useMutation({
    mutationFn: async ({ tenancyId, scheme, credentialsId }: { tenancyId: number, scheme: string, credentialsId?: number | null }) => {
      const response = await apiRequest('POST', '/api/deposit-protection/register', {
        tenancyId,
        scheme,
        credentialsId
      });
      return response.json() as Promise<RegisterDepositResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/unprotected'] });
    }
  });

  // Mutation for auto-registering all unprotected deposits
  const autoRegisterMutation = useMutation({
    mutationFn: async ({ defaultScheme, credentialsId }: { defaultScheme: string, credentialsId?: number | null }) => {
      const response = await apiRequest('POST', '/api/deposit-protection/auto-register', {
        defaultScheme,
        credentialsId
      });
      return response.json() as Promise<AutoRegisterResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/unprotected'] });
    }
  });

  const handleRegisterDeposit = async (tenancyId: number) => {
    setRegistering(tenancyId);
    try {
      const result = await registerDepositMutation.mutateAsync({
        tenancyId,
        scheme: selectedScheme,
        credentialsId: selectedCredentialsId
      });
      setRegistrationResult(result);
      setIsDialogOpen(true);
      
      if (result.success) {
        toast({
          title: "Deposit Registered Successfully",
          description: `Protection ID: ${result.depositProtectionId}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to Register Deposit",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to register deposit: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setRegistering(null);
    }
  };

  const handleAutoRegisterDeposits = async () => {
    setAutoRegistering(true);
    try {
      const result = await autoRegisterMutation.mutateAsync({
        defaultScheme: selectedScheme,
        credentialsId: selectedCredentialsId
      });
      setAutoRegistrationResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Auto-Registration Complete",
          description: `Successfully registered ${result.success} deposits. Failed: ${result.failed}`,
          variant: result.failed > 0 ? "destructive" : "default"
        });
      } else if (result.failed > 0) {
        toast({
          title: "Auto-Registration Failed",
          description: `Failed to register ${result.failed} deposits`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No Deposits to Register",
          description: "There were no unprotected deposits to register",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to auto-register deposits: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setAutoRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Deposit Protection Management
          </CardTitle>
          <CardDescription>
            Manage tenant deposit protection in compliance with UK legislation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unprotected" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="unprotected">Unprotected Deposits</TabsTrigger>
              <TabsTrigger value="schemes">Available Schemes</TabsTrigger>
            </TabsList>

            <TabsContent value="unprotected" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Unprotected Deposits</h3>
                  <p className="text-sm text-muted-foreground">
                    Deposits that require protection according to UK law
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Select Scheme</span>
                    <Select value={selectedScheme} onValueChange={setSelectedScheme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dps">Deposit Protection Service</SelectItem>
                        <SelectItem value="mydeposits">mydeposits</SelectItem>
                        <SelectItem value="tds">Tenancy Deposit Scheme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Use Credentials</span>
                    <Select 
                      value={selectedCredentialsId ? String(selectedCredentialsId) : ""}
                      onValueChange={(value) => setSelectedCredentialsId(value ? Number(value) : null)}
                    >
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Use system default (no credentials)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Use system default</SelectItem>
                        {credentials?.map((cred) => (
                          <SelectItem key={cred.id} value={String(cred.id)}>
                            {cred.schemeName} - {cred.schemeUsername} {cred.isDefault ? "(Default)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleAutoRegisterDeposits} 
                    disabled={autoRegistering || !unprotectedDeposits || unprotectedDeposits.length === 0}
                    className="flex items-center gap-2"
                  >
                    {autoRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Auto-Register All
                  </Button>
                </div>
              </div>

              {depositsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading unprotected deposits...</span>
                </div>
              ) : depositsError ? (
                <Alert variant="destructive">
                  <ShieldX className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load unprotected deposits. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : unprotectedDeposits && unprotectedDeposits.length > 0 ? (
                <Table>
                  <TableCaption>
                    All deposits must be protected within 30 days of receipt.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Tenancy Start</TableHead>
                      <TableHead>Deposit Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unprotectedDeposits.map((deposit) => (
                      <TableRow key={deposit.tenancy.id}>
                        <TableCell className="font-medium">
                          {deposit.property?.title || 'Unknown property'}
                          <div className="text-xs text-muted-foreground">
                            {deposit.property?.address || 'No address available'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {deposit.tenant?.name || 'Unknown tenant'}
                          {deposit.tenant?.email && (
                            <div className="text-xs text-muted-foreground">
                              {deposit.tenant.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(deposit.tenancy.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>£{deposit.tenancy.depositAmount}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <ShieldX className="h-3 w-3" />
                            Unprotected
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleRegisterDeposit(deposit.tenancy.id)}
                            disabled={registering === deposit.tenancy.id}
                          >
                            {registering === deposit.tenancy.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Register Now
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <ShieldCheck className="h-8 w-8 text-primary mb-2" />
                  <h3 className="text-lg font-semibold">All Deposits Protected</h3>
                  <p className="text-sm text-muted-foreground">
                    Great job! There are no unprotected deposits that require attention.
                  </p>
                </div>
              )}

              {autoRegistrationResult && (
                <Alert variant={autoRegistrationResult.failed > 0 ? "destructive" : "default"}>
                  <AlertTitle>Auto-Registration Results</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Success Rate:</span>
                        <div className="w-64">
                          <Progress 
                            value={
                              autoRegistrationResult.success + autoRegistrationResult.failed > 0
                                ? (autoRegistrationResult.success / (autoRegistrationResult.success + autoRegistrationResult.failed)) * 100
                                : 0
                            } 
                            className="h-2"
                          />
                        </div>
                      </div>
                      <p>
                        Successfully registered {autoRegistrationResult.success} deposits. 
                        Failed: {autoRegistrationResult.failed}
                      </p>
                      {autoRegistrationResult.errors.length > 0 && (
                        <div className="mt-2">
                          <details>
                            <summary className="text-sm font-medium cursor-pointer">View Errors</summary>
                            <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                              {autoRegistrationResult.errors.map((error, i) => (
                                <li key={i} className="text-red-500">{error}</li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="schemes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schemesLoading ? (
                  <div className="col-span-3 flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading schemes...</span>
                  </div>
                ) : schemes ? (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-primary">
                          {schemes.dps.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{schemes.dps.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href={schemes.dps.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                            Visit Website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-primary">
                          {schemes.mydeposits.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{schemes.mydeposits.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href={schemes.mydeposits.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                            Visit Website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-primary">
                          {schemes.tds.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{schemes.tds.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href={schemes.tds.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                            Visit Website
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  </>
                ) : (
                  <div className="col-span-3">
                    <Alert>
                      <AlertTitle>No Schemes Available</AlertTitle>
                      <AlertDescription>
                        Could not load deposit protection schemes information.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Deposit Protection Requirements</CardTitle>
                  <CardDescription>
                    Legal requirements for landlords and agents in the UK
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <h4 className="font-semibold">30-Day Rule</h4>
                    <p className="text-sm">
                      Landlords must register deposits with an approved scheme within 30 days of receiving them.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Prescribed Information</h4>
                    <p className="text-sm">
                      Landlords must provide tenants with the Prescribed Information relating to the deposit protection within 30 days.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Penalties</h4>
                    <p className="text-sm">
                      Failure to protect deposits can result in penalties of 1-3 times the deposit amount and restrictions on using Section 21 notices.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {registrationResult?.success
                ? "Deposit Successfully Protected"
                : "Deposit Protection Failed"}
            </DialogTitle>
            <DialogDescription>
              {registrationResult?.success
                ? "The tenant's deposit has been successfully registered with the protection scheme."
                : "There was a problem registering the deposit with the protection scheme."}
            </DialogDescription>
          </DialogHeader>

          {registrationResult?.success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Protection ID:</span>
                    <span className="font-mono text-sm">{registrationResult.depositProtectionId}</span>
                  </div>
                  {registrationResult.certificateUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Certificate:</span>
                      <Button variant="link" size="sm" asChild className="p-0">
                        <a
                          href={registrationResult.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          View Certificate <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Alert>
                <AlertTitle>Next Steps</AlertTitle>
                <AlertDescription>
                  The tenant must be provided with the Prescribed Information related to this deposit protection within 30 days of receiving the deposit.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {registrationResult?.error || "Unknown error occurred during registration."}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepositProtectionManager;