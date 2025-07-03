import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { TenancyType, PropertyType, UserType } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  ExternalLink,
  FileText,
  Download,
  RefreshCw,
  Building,
  Info
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { DepositSchemeManager } from "./DepositSchemeManager";

interface DepositProtectionProps {
  tenancyId: number;
}

// Deposit registration type
interface DepositRegistration {
  id: number;
  tenancyId: number;
  propertyId: number;
  schemeName: 'dps' | 'mydeposits' | 'tds';
  protectionType: 'custodial' | 'insured';
  depositAmount: number;
  depositReferenceId?: string;
  certificateUrl?: string;
  prescribedInfoUrl?: string;
  status: 'pending' | 'in_progress' | 'registered' | 'failed' | 'expired' | 'renewed' | 'released';
  registeredAt: string;
  expiryDate?: string;
  errorMessage?: string;
}

// Deposit scheme credentials type
interface DepositSchemeCredentials {
  id: number;
  schemeName: 'dps' | 'mydeposits' | 'tds';
  isDefault: boolean;
}

export default function DepositProtection({ tenancyId }: DepositProtectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProtecting, setIsProtecting] = useState(false);
  const [depositProtectionScheme, setDepositProtectionScheme] = useState<'dps' | 'mydeposits' | 'tds'>("dps");
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null);
  const [showSchemeManager, setShowSchemeManager] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualDepositId, setManualDepositId] = useState("");
  const [crmSystem, setCrmSystem] = useState<'propertyfile' | 'fixflo' | 'reapit' | 'jupix'>('propertyfile');

  // Get tenancy details
  const { data: tenancy, isLoading: isLoadingTenancy } = useQuery<TenancyType>({
    queryKey: [`/api/tenancies/${tenancyId}`],
  });

  // Get property details
  const { data: property, isLoading: isLoadingProperty } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${tenancy?.propertyId}`],
    enabled: !!tenancy,
  });

  // Get tenant details
  const { data: tenant, isLoading: isLoadingTenant } = useQuery<UserType>({
    queryKey: [`/api/users/${tenancy?.tenantId}`],
    enabled: !!tenancy,
  });
  
  // Get deposit registration details
  const { 
    data: depositRegistration, 
    isLoading: isLoadingRegistration,
    refetch: refetchRegistration
  } = useQuery<DepositRegistration>({
    queryKey: [`/api/deposit-protection/registrations/tenancy/${tenancyId}`],
    enabled: !!tenancyId,
  });
  
  // Get deposit scheme credentials for the current user
  const { 
    data: schemeCredentials,
    isLoading: isLoadingCredentials 
  } = useQuery<DepositSchemeCredentials[]>({
    queryKey: ['/api/deposit-protection/credentials'],
    retry: 1
  });
  
  // Set default scheme based on available credentials
  useEffect(() => {
    if (schemeCredentials && Array.isArray(schemeCredentials) && schemeCredentials.length > 0) {
      // Find the default credential if it exists
      const defaultCredential = schemeCredentials.find(c => c.isDefault);
      if (defaultCredential) {
        setDepositProtectionScheme(defaultCredential.schemeName);
        setSelectedCredentialId(defaultCredential.id);
      } else {
        // Otherwise just use the first one
        setDepositProtectionScheme(schemeCredentials[0].schemeName);
        setSelectedCredentialId(schemeCredentials[0].id);
      }
    }
  }, [schemeCredentials]);

  // Mutation to register deposit with scheme
  const registerDepositMutation = useMutation({
    mutationFn: (data: { 
      scheme: string; 
      credentialId?: number;
      manualDepositId?: string;
    }) => apiRequest('POST', `/api/deposit-protection/register/${tenancyId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenancies/${tenancyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deposit-protection/registrations/tenancy/${tenancyId}`] });
      
      toast({
        title: "Success",
        description: "Deposit protected successfully",
        variant: "default",
      });
      
      setIsProtecting(false);
      
      // If we have a certificate URL, open it in a new tab
      if (data.certificateUrl) {
        window.open(data.certificateUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to protect deposit",
        variant: "destructive",
      });
      setIsProtecting(false);
    },
  });
  
  // Mutation to download/regenerate prescribed information
  const generatePrescribedInfoMutation = useMutation({
    mutationFn: (registrationId: number) => 
      apiRequest('POST', `/api/deposit-protection/registrations/${registrationId}/prescribed-info`),
    onSuccess: (data) => {
      if (data.prescribedInfoUrl) {
        window.open(data.prescribedInfoUrl, '_blank');
      }
      refetchRegistration();
      toast({
        title: "Success",
        description: "Prescribed information document generated",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate prescribed information",
        variant: "destructive",
      });
    },
  });
  
  // Mutation to register deposit with CRM integration
  const registerWithCrmMutation = useMutation({
    mutationFn: (data: { 
      scheme: string; 
      crmSystem: string;
      credentialId?: number;
    }) => apiRequest('POST', `/api/deposit-protection/register-with-crm/${tenancyId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenancies/${tenancyId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/deposit-protection/registrations/tenancy/${tenancyId}`] });
      
      toast({
        title: "Success",
        description: "Deposit protected successfully via CRM integration",
        variant: "default",
      });
      
      setIsProtecting(false);
      
      // If we have a certificate URL, open it in a new tab
      if (data.certificateUrl) {
        window.open(data.certificateUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to protect deposit via CRM",
        variant: "destructive",
      });
      setIsProtecting(false);
    },
  });

  // Handle deposit protection submission
  const handleProtectDeposit = () => {
    if (!depositProtectionScheme) {
      toast({
        title: "Missing information",
        description: "Please select a deposit protection scheme",
        variant: "destructive",
      });
      return;
    }

    setIsProtecting(true);
    
    // If in manual mode, use the manual deposit ID
    if (manualMode) {
      if (!manualDepositId) {
        toast({
          title: "Missing information",
          description: "Please enter the deposit protection ID",
          variant: "destructive",
        });
        setIsProtecting(false);
        return;
      }
      
      registerDepositMutation.mutate({
        scheme: depositProtectionScheme,
        manualDepositId: manualDepositId
      });
    } else {
      // In API mode, use the selected credential
      registerDepositMutation.mutate({
        scheme: depositProtectionScheme,
        credentialId: selectedCredentialId || undefined
      });
    }
  };
  
  // Handle CRM integration deposit protection
  const handleCrmProtectDeposit = () => {
    if (!depositProtectionScheme) {
      toast({
        title: "Missing information",
        description: "Please select a deposit protection scheme",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCredentialId) {
      toast({
        title: "Missing information",
        description: "Please select deposit scheme credentials",
        variant: "destructive",
      });
      return;
    }

    setIsProtecting(true);
    
    registerWithCrmMutation.mutate({
      scheme: depositProtectionScheme,
      crmSystem: crmSystem,
      credentialId: selectedCredentialId
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoadingTenancy || isLoadingProperty || isLoadingTenant) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading deposit protection details...</p>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Tenancy Not Found</h3>
        <p className="text-gray-500">The tenancy information could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deposit Protection</h1>

      {depositRegistration && depositRegistration.status === 'registered' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deposit Protected</CardTitle>
              <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Protected
              </div>
            </div>
            <CardDescription>
              This tenancy's deposit is protected with {depositRegistration.schemeName.toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Protection Details</h3>
                  <p className="text-sm text-gray-500">
                    Details of the deposit protection registration
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">Scheme</Label>
                      <p className="font-medium">
                        {depositRegistration.schemeName === 'dps' 
                          ? 'Deposit Protection Service (DPS)' 
                          : depositRegistration.schemeName === 'mydeposits'
                            ? 'mydeposits'
                            : 'Tenancy Deposit Scheme (TDS)'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Protection ID</Label>
                      <p className="font-medium">{depositRegistration.depositReferenceId || "Not recorded"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Deposit Amount</Label>
                      <p className="font-medium">£{Number(depositRegistration.depositAmount).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Protection Type</Label>
                      <p className="font-medium capitalize">{depositRegistration.protectionType}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">Registration Date</Label>
                      <p className="font-medium">
                        {formatDate(depositRegistration.registeredAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Expiry Date</Label>
                      <p className="font-medium">
                        {depositRegistration.expiryDate 
                          ? formatDate(depositRegistration.expiryDate) 
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Tenancy Dates</Label>
                      <p className="font-medium">
                        {formatDate(tenancy.startDate)} - {formatDate(tenancy.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {depositRegistration.certificateUrl && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(depositRegistration.certificateUrl, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
            )}
            
            {depositRegistration.prescribedInfoUrl ? (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(depositRegistration.prescribedInfoUrl, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Prescribed Info
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => generatePrescribedInfoMutation.mutate(depositRegistration.id)}
                disabled={generatePrescribedInfoMutation.isPending}
              >
                {generatePrescribedInfoMutation.isPending ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Prescribed Info
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : depositRegistration && ['pending', 'in_progress', 'failed'].includes(depositRegistration.status) ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deposit Protection {depositRegistration.status === 'failed' ? 'Failed' : 'In Progress'}</CardTitle>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                depositRegistration.status === 'failed' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {depositRegistration.status === 'failed' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Failed
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Processing
                  </>
                )}
              </div>
            </div>
            <CardDescription>
              {depositRegistration.status === 'failed' 
                ? 'We encountered a problem registering this deposit' 
                : 'Your deposit is being registered with the protection scheme'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {depositRegistration.status === 'failed' && depositRegistration.errorMessage && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{depositRegistration.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">Scheme</Label>
                      <p className="font-medium">
                        {depositRegistration.schemeName === 'dps' 
                          ? 'Deposit Protection Service (DPS)' 
                          : depositRegistration.schemeName === 'mydeposits'
                            ? 'mydeposits'
                            : 'Tenancy Deposit Scheme (TDS)'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <p className="font-medium capitalize">{depositRegistration.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Deposit Amount</Label>
                      <p className="font-medium">£{Number(depositRegistration.depositAmount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-500">Started</Label>
                      <p className="font-medium">{formatDate(depositRegistration.registeredAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Property</Label>
                      <p className="font-medium">{property?.title || `Property #${depositRegistration.propertyId}`}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Tenant</Label>
                      <p className="font-medium">{tenant?.name || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {depositRegistration.status === 'failed' ? (
              <Button 
                className="w-full"
                onClick={() => {
                  registerDepositMutation.mutate({
                    scheme: depositRegistration.schemeName,
                    credentialId: selectedCredentialId || undefined
                  });
                }}
                disabled={registerDepositMutation.isPending}
              >
                {registerDepositMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Protection
                  </>
                )}
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => refetchRegistration()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Protect Deposit</CardTitle>
              <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Not Protected
              </div>
            </div>
            <CardDescription>
              Register this deposit with a government-approved protection scheme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">Deposit Protection Required</h3>
                  <p className="text-sm text-gray-500">
                    The deposit must be protected within 30 days of receipt as per UK law
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <Label className="text-sm text-gray-500">Property</Label>
                  <p className="font-medium">{property?.title || "Unknown Property"}</p>
                  <p className="text-sm text-gray-500">{property?.address}, {property?.city}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Tenant</Label>
                  <p className="font-medium">{tenant?.name || "Unknown Tenant"}</p>
                  <p className="text-sm text-gray-500">{tenant?.email}</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <Label className="text-sm text-gray-500">Deposit Amount</Label>
                    <p className="font-medium">£{Number(tenancy.depositAmount).toFixed(2)}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm text-gray-500">Tenancy Period</Label>
                    <p className="font-medium">
                      {formatDate(tenancy.startDate)} - {formatDate(tenancy.endDate)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Registration Method</h3>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="manual-mode" className="cursor-pointer">Manual</Label>
                    <Switch 
                      id="manual-mode" 
                      checked={!manualMode} 
                      onCheckedChange={(checked) => setManualMode(!checked)}
                    />
                    <Label htmlFor="manual-mode" className="cursor-pointer">API</Label>
                  </div>
                </div>
                
                {!manualMode && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <h3 className="font-medium">CRM Integration</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" className="p-0 h-auto ml-1">
                              <Info className="h-4 w-4 text-gray-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>CRM integration allows you to register deposits directly through your property management system.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="crm-mode" className="cursor-pointer text-sm text-gray-500">Disabled</Label>
                      <Switch
                        id="crm-mode"
                        checked={!!crmSystem}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCrmSystem('propertyfile');
                          } else {
                            setCrmSystem('propertyfile');
                          }
                        }}
                      />
                      <Label htmlFor="crm-mode" className="cursor-pointer text-sm text-gray-500">Enabled</Label>
                    </div>
                  </div>
                )}
              </div>
              
              {manualMode ? (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label htmlFor="manual-scheme">Deposit Protection Scheme</Label>
                    <Select 
                      value={depositProtectionScheme} 
                      onValueChange={(value: any) => setDepositProtectionScheme(value)}
                    >
                      <SelectTrigger id="manual-scheme" className="w-full">
                        <SelectValue placeholder="Select a scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dps">Deposit Protection Service (DPS)</SelectItem>
                        <SelectItem value="mydeposits">mydeposits</SelectItem>
                        <SelectItem value="tds">Tenancy Deposit Scheme (TDS)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the scheme where you manually registered this deposit
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="manual-id">Protection ID</Label>
                    <Input
                      id="manual-id"
                      placeholder="Enter the deposit protection ID"
                      value={manualDepositId}
                      onChange={(e) => setManualDepositId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the ID provided by the protection scheme
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isLoadingCredentials ? (
                    <div className="text-center py-4">
                      <Spinner className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading your deposit scheme credentials...</p>
                    </div>
                  ) : !schemeCredentials || schemeCredentials.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="mb-2">You don't have any deposit scheme credentials</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setShowSchemeManager(true)}
                      >
                        Add Deposit Scheme Credentials
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="api-scheme">Deposit Protection Scheme</Label>
                        <Select 
                          value={depositProtectionScheme} 
                          onValueChange={(value: any) => {
                            setDepositProtectionScheme(value);
                            // Also set the credential ID for this scheme
                            if (Array.isArray(schemeCredentials)) {
                              const credential = schemeCredentials.find(c => c.schemeName === value);
                              if (credential) {
                                setSelectedCredentialId(credential.id);
                              }
                            }
                          }}
                        >
                          <SelectTrigger id="api-scheme" className="w-full">
                            <SelectValue placeholder="Select a scheme" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(schemeCredentials) && schemeCredentials.map((credential) => (
                              <SelectItem key={credential.id} value={credential.schemeName}>
                                {credential.schemeName === 'dps' 
                                  ? 'Deposit Protection Service (DPS)' 
                                  : credential.schemeName === 'mydeposits'
                                    ? 'mydeposits'
                                    : 'Tenancy Deposit Scheme (TDS)'}
                                {credential.isDefault && ' (Default)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            Uses your registered API credentials
                          </p>
                          <Button 
                            variant="link" 
                            className="text-xs p-0 h-auto" 
                            onClick={() => setShowSchemeManager(true)}
                          >
                            Manage Credentials
                          </Button>
                        </div>
                      </div>
                      
                      {crmSystem && (
                        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center mb-3">
                            <div className="bg-blue-100 p-2 rounded-full mr-2">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-medium text-blue-700">CRM Integration</h3>
                          </div>
                          
                          <Label htmlFor="crm-system">Property Management System</Label>
                          <Select 
                            value={crmSystem} 
                            onValueChange={(value: 'propertyfile' | 'fixflo' | 'reapit' | 'jupix') => setCrmSystem(value)}
                          >
                            <SelectTrigger id="crm-system" className="w-full mt-1">
                              <SelectValue placeholder="Select CRM System" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="propertyfile">PropertyFile</SelectItem>
                              <SelectItem value="fixflo">Fixflo</SelectItem>
                              <SelectItem value="reapit">Reapit</SelectItem>
                              <SelectItem value="jupix">Jupix</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-blue-600 mt-1">
                            Your deposit will be registered through your property management system
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              className="w-full mr-2"
              onClick={() => refetchRegistration()}
            >
              Cancel
            </Button>
            <Button
              className="w-full ml-2"
              onClick={handleProtectDeposit}
              disabled={isProtecting || registerDepositMutation.isPending || 
                (!manualMode && (!schemeCredentials || !Array.isArray(schemeCredentials) || schemeCredentials.length === 0))}
            >
              {isProtecting || registerDepositMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Protecting...
                </>
              ) : (
                "Protect Deposit"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Legal Reminder</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The deposit must be protected in a government-approved scheme within 30 days of receipt. 
                Failing to protect a deposit can result in penalties of up to 3 times the deposit amount.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Deposit Scheme Manager Dialog */}
      <Dialog open={showSchemeManager} onOpenChange={setShowSchemeManager}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Deposit Scheme Manager</DialogTitle>
            <DialogDescription>
              Manage your deposit protection scheme credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto">
            <DepositSchemeManager />
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSchemeManager(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Legal Reminder</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The deposit must be protected in a government-approved scheme within 30 days of receipt. 
                Failing to protect a deposit can result in penalties of up to 3 times the deposit amount.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
