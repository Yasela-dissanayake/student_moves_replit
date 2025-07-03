import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Star, 
  KeyRound,
  Trash,
  RefreshCw,
  FileText,
  ShieldCheck
} from 'lucide-react';

// Define types
interface DepositSchemeCredentials {
  id: number;
  schemeName: 'dps' | 'mydeposits' | 'tds';
  schemeUsername: string;
  accountNumber?: string;
  apiKey?: string;
  apiSecret?: string;
  protectionType: 'custodial' | 'insured';
  isDefault: boolean;
  isVerified: boolean;
  lastVerified?: string;
}

interface DepositRegistration {
  id: number;
  tenancyId: number;
  propertyId: number;
  schemeName: 'dps' | 'mydeposits' | 'tds';
  depositAmount: number;
  depositReferenceId?: string;
  certificateUrl?: string;
  prescribedInfoUrl?: string;
  status: 'pending' | 'in_progress' | 'registered' | 'failed' | 'expired' | 'renewed' | 'released';
  registeredAt: string;
  expiryDate?: string;
}

// Form validation schema for deposit scheme credentials
const depositSchemeCredentialsSchema = z.object({
  schemeName: z.enum(['dps', 'mydeposits', 'tds']),
  schemeUsername: z.string().min(1, 'Username is required'),
  schemePassword: z.string().min(1, 'Password is required'),
  accountNumber: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  protectionType: z.enum(['custodial', 'insured']),
  isDefault: z.boolean().default(false)
});

type DepositSchemeCredentialsFormValues = z.infer<typeof depositSchemeCredentialsSchema>;

// Main component
export function DepositSchemeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState<string>('credentials');
  
  // State for dialog
  const [addCredentialDialogOpen, setAddCredentialDialogOpen] = useState(false);
  
  // Fetch credentials data
  const { 
    data: credentials, 
    isLoading: isLoadingCredentials,
    error: credentialsError
  } = useQuery({
    queryKey: ['/api/deposit-protection/credentials'],
    retry: 1
  });
  
  // Fetch deposit registrations data
  const { 
    data: registrations, 
    isLoading: isLoadingRegistrations,
    error: registrationsError
  } = useQuery({
    queryKey: ['/api/deposit-protection/registrations'],
    retry: 1
  });
  
  // Mutation for adding new credentials
  const addCredentialsMutation = useMutation({
    mutationFn: (data: DepositSchemeCredentialsFormValues) => 
      apiRequest('POST', '/api/deposit-protection/credentials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/credentials'] });
      setAddCredentialDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Deposit scheme credentials added successfully',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add deposit scheme credentials',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for setting default credentials
  const setDefaultCredentialsMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('POST', `/api/deposit-protection/credentials/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/credentials'] });
      toast({
        title: 'Success',
        description: 'Default deposit scheme credentials updated',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update default credentials',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for verifying credentials
  const verifyCredentialsMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('POST', `/api/deposit-protection/credentials/${id}/verify`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/credentials'] });
      toast({
        title: data.success ? 'Success' : 'Error',
        description: data.message || (data.success 
          ? 'Credentials verified successfully' 
          : 'Failed to verify credentials'),
        variant: data.success ? 'default' : 'destructive'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify credentials',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for deleting credentials
  const deleteCredentialsMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/deposit-protection/credentials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/credentials'] });
      toast({
        title: 'Success',
        description: 'Deposit scheme credentials deleted',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete credentials',
        variant: 'destructive'
      });
    }
  });
  
  // Mutation for re-generating prescribed information
  const regeneratePrescribedInfoMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('POST', `/api/deposit-protection/registrations/${id}/prescribed-info`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/registrations'] });
      if (data.prescribedInfoUrl) {
        window.open(data.prescribedInfoUrl, '_blank');
      }
      toast({
        title: 'Success',
        description: 'Prescribed information regenerated',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate prescribed information',
        variant: 'destructive'
      });
    }
  });
  
  // Form for adding new credentials
  const form = useForm<DepositSchemeCredentialsFormValues>({
    resolver: zodResolver(depositSchemeCredentialsSchema),
    defaultValues: {
      schemeName: 'dps',
      schemeUsername: '',
      schemePassword: '',
      accountNumber: '',
      apiKey: '',
      apiSecret: '',
      protectionType: 'custodial',
      isDefault: false
    }
  });
  
  // Handle form submission
  const onSubmit = (data: DepositSchemeCredentialsFormValues) => {
    addCredentialsMutation.mutate(data);
  };

  // Helper function to get scheme display name
  const getSchemeDisplayName = (schemeName: string) => {
    switch (schemeName) {
      case 'dps':
        return 'Deposit Protection Service (DPS)';
      case 'mydeposits':
        return 'mydeposits';
      case 'tds':
        return 'Tenancy Deposit Scheme (TDS)';
      default:
        return schemeName;
    }
  };
  
  // Helper function to format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'renewed':
        return 'bg-purple-100 text-purple-800';
      case 'released':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Deposit Protection Management</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="credentials">Scheme Credentials</TabsTrigger>
          <TabsTrigger value="registrations">Deposit Registrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Your Deposit Scheme Credentials</h3>
            
            <Dialog open={addCredentialDialogOpen} onOpenChange={setAddCredentialDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Credentials</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Deposit Scheme Credentials</DialogTitle>
                  <DialogDescription>
                    Enter your deposit protection scheme credentials to enable automatic deposit registration.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="schemeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Scheme</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a scheme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dps">Deposit Protection Service (DPS)</SelectItem>
                              <SelectItem value="mydeposits">mydeposits</SelectItem>
                              <SelectItem value="tds">Tenancy Deposit Scheme (TDS)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the deposit protection scheme you use
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="schemeUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your scheme username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="schemePassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Enter your scheme password" 
                            />
                          </FormControl>
                          <FormDescription>
                            Your password is stored securely with encryption
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your account number" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="For API access" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="apiSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Secret (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                placeholder="For API access" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="protectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protection Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select protection type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="custodial">Custodial (scheme holds deposit)</SelectItem>
                              <SelectItem value="insured">Insured (you hold deposit)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Set as Default</FormLabel>
                            <FormDescription>
                              This scheme will be used by default for new deposits
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addCredentialsMutation.isPending}
                      >
                        {addCredentialsMutation.isPending && (
                          <Spinner className="mr-2 h-4 w-4" />
                        )}
                        Add Credentials
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoadingCredentials ? (
            <div className="flex justify-center p-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : credentialsError ? (
            <Card className="p-6">
              <div className="text-center text-red-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load deposit scheme credentials</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/credentials'] })}
                >
                  Try Again
                </Button>
              </div>
            </Card>
          ) : !credentials || !Array.isArray(credentials) || credentials.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <KeyRound className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Deposit Scheme Credentials</h3>
                <p className="text-gray-500 mb-4">
                  Add your deposit protection scheme credentials to enable automatic deposit registration
                </p>
                <DialogTrigger asChild>
                  <Button>Add Your First Credentials</Button>
                </DialogTrigger>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {Array.isArray(credentials) && credentials.map((credential: DepositSchemeCredentials) => (
                <Card key={credential.id} className="overflow-hidden">
                  <CardHeader className={credential.isDefault ? "bg-primary/10" : ""}>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{getSchemeDisplayName(credential.schemeName)}</CardTitle>
                        <CardDescription>
                          Username: {credential.schemeUsername}
                          {credential.accountNumber && ` • Account: ${credential.accountNumber}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {credential.isVerified ? (
                          <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </div>
                        ) : (
                          <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Verified
                          </div>
                        )}
                        
                        {credential.isDefault && (
                          <div className="bg-primary/20 text-primary text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Protection Type:</span>
                        <span className="font-medium capitalize">{credential.protectionType}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">API Access:</span>
                        <span className="font-medium">{credential.apiKey ? 'Yes' : 'No'}</span>
                      </div>
                      
                      {credential.lastVerified && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Verified:</span>
                          <span className="font-medium">{formatDate(credential.lastVerified)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t bg-gray-50 p-3">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => verifyCredentialsMutation.mutate(credential.id)}
                        disabled={verifyCredentialsMutation.isPending}
                      >
                        {verifyCredentialsMutation.isPending && verifyCredentialsMutation.variables === credential.id && (
                          <Spinner className="mr-2 h-3 w-3" />
                        )}
                        Verify Credentials
                      </Button>
                      
                      {!credential.isDefault && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDefaultCredentialsMutation.mutate(credential.id)}
                          disabled={setDefaultCredentialsMutation.isPending}
                        >
                          {setDefaultCredentialsMutation.isPending && setDefaultCredentialsMutation.variables === credential.id && (
                            <Spinner className="mr-2 h-3 w-3" />
                          )}
                          Set as Default
                        </Button>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete these credentials?')) {
                          deleteCredentialsMutation.mutate(credential.id);
                        }
                      }}
                      disabled={deleteCredentialsMutation.isPending}
                    >
                      {deleteCredentialsMutation.isPending && deleteCredentialsMutation.variables === credential.id && (
                        <Spinner className="mr-2 h-3 w-3" />
                      )}
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Your Deposit Registrations</h3>
          </div>
          
          {isLoadingRegistrations ? (
            <div className="flex justify-center p-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : registrationsError ? (
            <Card className="p-6">
              <div className="text-center text-red-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load deposit registrations</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/deposit-protection/registrations'] })}
                >
                  Try Again
                </Button>
              </div>
            </Card>
          ) : !registrations || !Array.isArray(registrations) || registrations.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Deposit Registrations</h3>
                <p className="text-gray-500 mb-4">
                  Deposits will appear here when you register them with protection schemes
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(registrations) && registrations.map((registration: DepositRegistration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">Property #{registration.propertyId}</TableCell>
                      <TableCell>{getSchemeDisplayName(registration.schemeName)}</TableCell>
                      <TableCell>£{registration.depositAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(registration.status)}`}>
                          {registration.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(registration.registeredAt)}</TableCell>
                      <TableCell>{formatDate(registration.expiryDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {registration.certificateUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(registration.certificateUrl, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Certificate
                            </Button>
                          )}
                          
                          {registration.prescribedInfoUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(registration.prescribedInfoUrl, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              PI Document
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => regeneratePrescribedInfoMutation.mutate(registration.id)}
                              disabled={regeneratePrescribedInfoMutation.isPending}
                            >
                              {regeneratePrescribedInfoMutation.isPending && regeneratePrescribedInfoMutation.variables === registration.id && (
                                <Spinner className="mr-2 h-3 w-3" />
                              )}
                              Generate PI
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}