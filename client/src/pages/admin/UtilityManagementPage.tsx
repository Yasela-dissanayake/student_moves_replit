import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Link } from "wouter";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle,
  ArrowUpDown, 
  UploadCloud, 
  Sparkles,
  Info as InfoIcon,
  Search
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import TenantUtilityManagement from "@/components/utility/TenantUtilityManagement";

// Helper function to format currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(value);
};

// Types for the utility management feature
interface UtilityProvider {
  id: number;
  name: string;
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license';
  logoUrl?: string;
  website?: string;
  customerServicePhone?: string;
  customerServiceEmail?: string;
  apiIntegration: boolean;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface UtilityTariff {
  id: number;
  providerId: number;
  providerName?: string;
  name: string;
  description?: string;
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license';
  fixedTerm: boolean;
  termLength?: number;
  earlyExitFee?: number;
  standingCharge?: number;
  unitRate?: number;
  estimatedAnnualCost?: number;
  greenEnergy?: boolean;
  specialOffers?: string[];
  availableFrom?: string;
  availableUntil?: string;
  region?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminBankingDetails {
  id: number;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  bankName: string;
  reference?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UtilityContract {
  id: number;
  propertyId: number;
  tenancyId?: number;
  utilityType: 'gas' | 'electricity' | 'dual_fuel' | 'water' | 'broadband' | 'tv_license';
  providerId: number;
  providerName?: string;
  tariffId?: number;
  tariffName?: string;
  accountNumber?: string;
  meterSerialNumber?: string;
  meterReadingDay?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  depositAmount?: number;
  depositPaid: boolean;
  monthlyPaymentAmount?: number;
  paymentDay?: number;
  paymentMethod?: string;
  bankingDetailsId?: number;
  status: 'pending' | 'in_progress' | 'active' | 'cancelled' | 'expired' | 'blocked';
  autoRenewal: boolean;
  tenancyAgreementUploaded: boolean;
  tenancyAgreementDocumentId?: number;
  aiProcessed: boolean;
  lastAiCheckDate?: string;
  bestDealAvailable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComparisonResult {
  providerId: number;
  tariffId: number;
  providerName: string;
  tariffName: string;
  annualCost: number;
  monthlyCost: number;
  termLength: number;
  fixedTerm: boolean;
  standingCharge: number;
  unitRate: number;
  specialOffers: string[];
  savings: number;
}

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  postcode: string;
}

interface Tenancy {
  id: number;
  propertyId: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

const utilityTypeNames = {
  gas: "Gas",
  electricity: "Electricity",
  dual_fuel: "Dual Fuel (Gas & Electricity)",
  water: "Water",
  broadband: "Broadband",
  tv_license: "TV License"
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
  blocked: "bg-purple-100 text-purple-800"
};

// Interface for cheapest tariff data
interface CheapestTariff {
  id: number;
  providerId: number;
  providerName: string;
  name: string;
  description: string;
  fixedTerm: boolean;
  termLength: number;
  earlyExitFee: number;
  standingCharge: number;
  unitRate: number;
  estimatedAnnualCost: number;
  greenEnergy: boolean;
  specialOffers: string[];
  rank: number | string;
  apiIntegration: boolean;
}

interface CheapestTariffsResponse {
  success: boolean;
  cheapestTariffs: Record<string, CheapestTariff[]>;
}

const UtilityManagementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedUtilityType, setSelectedUtilityType] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedBankingDetailsId, setSelectedBankingDetailsId] = useState<number | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);
  const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
  const [selectedContract, setSelectedContract] = useState<UtilityContract | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tenancyFile, setTenancyFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Utility setup form state
  const [utilitySetupForm, setUtilitySetupForm] = useState({
    accountNumber: "",
    providerId: "",
    monthlyEstimate: "",
    contractStartDate: "",
    utilityType: "dual_fuel",
    // Customer details
    customerTitle: "",
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    customerDateOfBirth: "",
    // Address details (if different from property)
    usePropertyAddress: true,
    billingAddress: "",
    billingCity: "",
    billingPostcode: "",
    // Additional details
    previousAddress: "",
    moveInDate: "",
    specialRequirements: "",
    marketingConsent: false
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // New provider/tariff form states
  const [newProviderForm, setNewProviderForm] = useState({
    name: "",
    utilityType: "gas",
    customerServicePhone: "",
    website: "",
    active: true
  });
  
  const [newTariffForm, setNewTariffForm] = useState({
    providerId: 0,
    name: "",
    description: "",
    utilityType: "gas",
    fixedTerm: false,
    termLength: 12,
    estimatedAnnualCost: 0,
    standingCharge: 0,
    unitRate: 0
  });
  
  const [newBankingForm, setNewBankingForm] = useState({
    accountName: "",
    accountNumber: "",
    sortCode: "",
    bankName: "",
    reference: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    isDefault: false
  });

  // Admin configuration form state
  const [adminConfigForm, setAdminConfigForm] = useState({
    businessName: "",
    contactFirstName: "",
    contactLastName: "",
    contactTitle: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessCity: "",
    businessPostcode: "",
    companyNumber: "",
    vatNumber: "",
    preferredContactMethod: "email",
    businessType: "property_management",
    authorized: true
  });

  const [isEditingAdminConfig, setIsEditingAdminConfig] = useState(false);
  
  // Fetch properties
  const { data: propertiesData, isLoading: isPropertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties');
      const data = await response.json();
      console.log('Properties data loaded:', data);
      return data;
    },
  });
  
  // Fetch providers using direct fetch to avoid authentication issues
  const { data: providersData } = useQuery({
    queryKey: ['/api/utilities/providers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/utilities/providers-public');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Providers data loaded:', data);
        return data;
      } catch (error) {
        console.error('Error fetching providers:', error);
        // Return empty structure if fetch fails
        return { providers: [] };
      }
    },
  });
  
  // Fetch cheapest tariffs from public endpoint
  const { data: cheapestTariffsData, isLoading: isLoadingCheapestTariffs, error: tariffsError } = useQuery({
    queryKey: ['/api/utilities/cheapest-tariffs-public'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/utilities/cheapest-tariffs-public');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Cheapest tariffs data loaded:', data);
        return data;
      } catch (error) {
        console.error('Error fetching cheapest tariffs:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
  
  // Fetch banking details
  const { data: bankingDetailsData } = useQuery({
    queryKey: ['/api/utilities/banking-details'],
    queryFn: () => apiRequest('GET', '/api/utilities/banking-details').then(res => res.json()),
  });

  // Fetch admin configuration
  const { data: adminConfigData, refetch: refetchAdminConfig } = useQuery({
    queryKey: ['/api/utilities/admin-config'],
    queryFn: () => apiRequest('GET', '/api/utilities/admin-config').then(res => res.json()),
  });

  // Fetch tariffs for selected provider
  const { data: tariffsData, isLoading: isTariffsLoading } = useQuery({
    queryKey: ['/api/utilities/tariffs/provider', selectedProviderId],
    queryFn: () => selectedProviderId 
      ? apiRequest('GET', `/api/utilities/tariffs/provider/${selectedProviderId}`).then(res => res.json())
      : Promise.resolve({ tariffs: [] }),
    enabled: !!selectedProviderId,
  });
  
  // Fetch utility contracts for the selected property
  const { data: contractsData, isLoading: isContractsLoading, refetch: refetchContracts } = useQuery({
    queryKey: ['/api/utilities/contracts/property', selectedPropertyId],
    queryFn: () => selectedPropertyId 
      ? apiRequest('GET', `/api/utilities/contracts/property/${selectedPropertyId}`).then(res => res.json()) 
      : Promise.resolve(null),
    enabled: !!selectedPropertyId,
  });
  
  // Fetch tenancies for the selected property
  const { data: tenanciesData } = useQuery({
    queryKey: ['/api/tenancies/property', selectedPropertyId],
    queryFn: () => selectedPropertyId 
      ? apiRequest('GET', `/api/tenancies/property/${selectedPropertyId}`).then(res => res.json()) 
      : Promise.resolve(null),
    enabled: !!selectedPropertyId,
  });
  
  // Create provider mutation using direct fetch (bypasses authentication middleware)
  const createProviderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating provider via mutation with data:', data);
      
      // Map frontend form data to backend expected format
      const providerData = {
        name: data.name,
        utilityType: data.utilityType,
        phone: data.customerServicePhone || data.phone,
        website: data.website,
        isAvailable: data.active !== false
      };
      
      console.log('Mapped provider data for mutation:', providerData);
      
      const response = await fetch('/api/utilities/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
        credentials: 'include'
      });

      console.log('Mutation response status:', response.status);

      const responseText = await response.text();
      console.log('Mutation response text:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to create provider';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return JSON.parse(responseText);
    },
    onSuccess: (result) => {
      console.log('Provider creation successful:', result);
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/providers'] });
      toast({
        title: "Provider Created",
        description: `The utility provider "${result.provider.name}" has been added successfully.`
      });
      setNewProviderForm({
        name: "",
        utilityType: "gas",
        customerServicePhone: "",
        website: "",
        active: true
      });
    },
    onError: (error: any) => {
      console.error('Provider creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create provider",
        variant: "destructive"
      });
    }
  });
  
  // Create tariff mutation
  const createTariffMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/utilities/tariffs', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/tariffs/provider', selectedProviderId] });
      toast({
        title: "Tariff Created",
        description: "The utility tariff has been added successfully."
      });
      setNewTariffForm({
        providerId: selectedProviderId || 0,
        name: "",
        description: "",
        utilityType: selectedUtilityType as any || "gas",
        fixedTerm: false,
        termLength: 12,
        estimatedAnnualCost: 0,
        standingCharge: 0,
        unitRate: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create tariff: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Create banking details mutation
  const createBankingDetailsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/utilities/banking-details', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/banking-details'] });
      toast({
        title: "Banking Details Added",
        description: "The banking details have been saved successfully."
      });
      setNewBankingForm({
        accountName: "",
        accountNumber: "",
        sortCode: "",
        bankName: "",
        reference: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        isDefault: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save banking details: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Compare utility prices mutation
  const compareUtilityPricesMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/utilities/compare', data).then(res => res.json()),
    onSuccess: (data) => {
      setComparisonResults(data.results);
      setIsComparing(false);
      toast({
        title: "Comparison Complete",
        description: `Found ${data.results.length} tariffs for comparison.`
      });
    },
    onError: (error: any) => {
      setIsComparing(false);
      toast({
        title: "Error",
        description: `Failed to compare utilities: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Setup utility contract mutation
  const setupUtilityContractMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/utilities/setup', data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/contracts/property', selectedPropertyId] });
      toast({
        title: "Contract Setup Started",
        description: "The utility contract setup has been initiated."
      });
      setComparisonResults(null);
      setSelectedTariffId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to setup utility contract: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Register with provider mutation
  const registerWithProviderMutation = useMutation({
    mutationFn: (contractId: number) => apiRequest('POST', `/api/utilities/register/${contractId}`).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/contracts/property', selectedPropertyId] });
      setIsRegistering(false);
      toast({
        title: data.success ? "Registration Successful" : "Registration In Progress",
        description: data.message
      });
    },
    onError: (error: any) => {
      setIsRegistering(false);
      toast({
        title: "Error",
        description: `Failed to register with provider: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Upload tenancy agreement mutation
  const uploadTenancyAgreementMutation = useMutation({
    mutationFn: ({ contractId, formData }: { contractId: number, formData: FormData }) => 
      fetch(`/api/utilities/upload-tenancy/${contractId}`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error('Failed to upload document');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/contracts/property', selectedPropertyId] });
      setIsUploading(false);
      setTenancyFile(null);
      toast({
        title: "Document Uploaded",
        description: "The tenancy agreement has been uploaded successfully."
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: `Failed to upload document: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Check for better deals mutation
  const checkBetterDealsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/utilities/check-better-deals').then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/contracts/property', selectedPropertyId] });
      toast({
        title: "Check Complete",
        description: "All contracts have been checked for better deals."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to check for better deals: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Setup utility with documents mutation
  const setupUtilityMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/utilities/setup-with-documents', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to setup utility');
      }

      return response.json();
    },
    onSuccess: (result) => {
      console.log('Utility setup successful:', result);
      toast({
        title: "Utility Setup Complete",
        description: result.message || "Utility account has been set up successfully."
      });
      
      // Reset form
      setUtilitySetupForm({
        accountNumber: "",
        providerId: "",
        monthlyEstimate: "",
        contractStartDate: "",
        utilityType: "dual_fuel"
      });
      setSelectedFiles([]);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/utilities/contracts/property', selectedPropertyId] });
    },
    onError: (error: any) => {
      console.error('Utility setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup utility account",
        variant: "destructive"
      });
    }
  });

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUtilitySetup = () => {
    // Validate required fields
    if (!selectedPropertyId || !utilitySetupForm.accountNumber || !utilitySetupForm.providerId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate customer details
    if (!utilitySetupForm.customerFirstName || !utilitySetupForm.customerLastName || 
        !utilitySetupForm.customerEmail || !utilitySetupForm.customerPhone) {
      toast({
        title: "Customer Details Required",
        description: "Please fill in all required customer details (name, email, phone)",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    
    // Basic utility details
    formData.append('propertyId', selectedPropertyId.toString());
    formData.append('providerId', utilitySetupForm.providerId);
    formData.append('accountNumber', utilitySetupForm.accountNumber);
    formData.append('monthlyEstimate', utilitySetupForm.monthlyEstimate);
    formData.append('contractStartDate', utilitySetupForm.contractStartDate);
    formData.append('utilityType', utilitySetupForm.utilityType);
    
    // Customer details
    formData.append('customerTitle', utilitySetupForm.customerTitle);
    formData.append('customerFirstName', utilitySetupForm.customerFirstName);
    formData.append('customerLastName', utilitySetupForm.customerLastName);
    formData.append('customerEmail', utilitySetupForm.customerEmail);
    formData.append('customerPhone', utilitySetupForm.customerPhone);
    formData.append('customerDateOfBirth', utilitySetupForm.customerDateOfBirth);
    formData.append('previousAddress', utilitySetupForm.previousAddress);
    formData.append('moveInDate', utilitySetupForm.moveInDate);
    formData.append('specialRequirements', utilitySetupForm.specialRequirements);
    formData.append('usePropertyAddress', utilitySetupForm.usePropertyAddress.toString());
    
    // Billing address (if different from property)
    if (!utilitySetupForm.usePropertyAddress) {
      formData.append('billingAddress', utilitySetupForm.billingAddress);
      formData.append('billingCity', utilitySetupForm.billingCity);
      formData.append('billingPostcode', utilitySetupForm.billingPostcode);
    }
    
    formData.append('marketingConsent', utilitySetupForm.marketingConsent.toString());

    // Add files to form data
    selectedFiles.forEach((file, index) => {
      formData.append('documents', file);
    });

    setupUtilityMutation.mutate(formData);
  };
  
  // Handle property selection
  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(Number(propertyId));
    setComparisonResults(null);
  };
  
  // Handle utility type selection
  const handleUtilityTypeSelect = (type: string) => {
    setSelectedUtilityType(type);
    setSelectedProviderId(null);
    setComparisonResults(null);
  };
  
  // Handle provider selection
  const handleProviderSelect = (providerId: string) => {
    setSelectedProviderId(Number(providerId));
  };
  
  // Handle banking details selection
  const handleBankingDetailsSelect = (id: string) => {
    setSelectedBankingDetailsId(Number(id));
  };
  
  // Handle file change for tenancy agreement upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTenancyFile(e.target.files[0]);
    }
  };
  
  // Handle uploading tenancy agreement
  const handleUploadTenancyAgreement = () => {
    if (!selectedContract || !tenancyFile) {
      toast({
        title: "Missing Information",
        description: "Please select a contract and upload a tenancy agreement file.",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('tenancyAgreement', tenancyFile);
    
    uploadTenancyAgreementMutation.mutate({ 
      contractId: selectedContract.id, 
      formData 
    });
  };
  
  // Handle registering with provider
  const handleRegisterWithProvider = (contractId: number) => {
    setIsRegistering(true);
    registerWithProviderMutation.mutate(contractId);
  };

  // Get the properties array from the response
  const properties = Array.isArray(propertiesData) ? propertiesData : propertiesData?.properties || [];
  
  // Handle comparison
  const handleCompare = () => {
    if (!selectedPropertyId || !selectedUtilityType) {
      toast({
        title: "Required Information Missing",
        description: "Please select a property and utility type to compare.",
        variant: "destructive"
      });
      return;
    }
    
    const property = properties.find((p: Property) => p.id === selectedPropertyId);
    if (!property) return;
    
    setIsComparing(true);
    
    compareUtilityPricesMutation.mutate({
      propertyId: selectedPropertyId,
      utilityType: selectedUtilityType,
      postcode: property.postcode,
      bedrooms: property.bedrooms
    });
  };
  
  // Handle setup contract
  const handleSetupContract = () => {
    if (!selectedPropertyId || !selectedUtilityType || !selectedProviderId || !selectedTariffId || !selectedBankingDetailsId) {
      toast({
        title: "Required Information Missing",
        description: "Please select all required information to set up a contract.",
        variant: "destructive"
      });
      return;
    }
    
    // Find active tenancy for this property
    const activeTenancy = tenanciesData?.tenancies?.find((t: Tenancy) => t.propertyId === selectedPropertyId && t.active);
    
    if (!activeTenancy) {
      toast({
        title: "No Active Tenancy",
        description: "This property doesn't have an active tenancy. Add a tenancy first.",
        variant: "destructive"
      });
      return;
    }
    
    setupUtilityContractMutation.mutate({
      propertyId: selectedPropertyId,
      tenancyId: activeTenancy.id,
      utilityType: selectedUtilityType,
      providerId: selectedProviderId,
      tariffId: selectedTariffId,
      bankingDetailsId: selectedBankingDetailsId
    });
  };
  
  // Get the active tenancy
  const getActiveTenancy = () => {
    if (!tenanciesData?.tenancies || !selectedPropertyId) return null;
    return tenanciesData.tenancies.find((t: Tenancy) => t.propertyId === selectedPropertyId && t.active);
  };
  
  // Create a new provider
  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    createProviderMutation.mutate(newProviderForm);
  };
  
  // Create a new tariff
  const handleCreateTariff = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProviderId) {
      toast({
        title: "Provider Required",
        description: "Please select a provider for this tariff.",
        variant: "destructive"
      });
      return;
    }
    
    createTariffMutation.mutate({
      ...newTariffForm,
      providerId: selectedProviderId
    });
  };
  
  // Create banking details
  const handleCreateBankingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    createBankingDetailsMutation.mutate(newBankingForm);
  };

  // Create/Update admin configuration
  const saveAdminConfigMutation = useMutation({
    mutationFn: (data: any) => {
      const method = adminConfigData?.config?.id ? 'PUT' : 'POST';
      const url = adminConfigData?.config?.id 
        ? `/api/utilities/admin-config/${adminConfigData.config.id}`
        : '/api/utilities/admin-config';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({
        title: "Admin Configuration Saved",
        description: "Your business details have been updated successfully.",
      });
      setIsEditingAdminConfig(false);
      refetchAdminConfig();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save admin configuration.",
        variant: "destructive",
      });
    },
  });

  // Handle admin config save
  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminConfigMutation.mutate(adminConfigForm);
  };

  // Load existing admin config when data is fetched
  React.useEffect(() => {
    if (adminConfigData?.config) {
      setAdminConfigForm({
        businessName: adminConfigData.config.businessName || "",
        contactFirstName: adminConfigData.config.contactFirstName || "",
        contactLastName: adminConfigData.config.contactLastName || "",
        contactTitle: adminConfigData.config.contactTitle || "",
        businessEmail: adminConfigData.config.businessEmail || "",
        businessPhone: adminConfigData.config.businessPhone || "",
        businessAddress: adminConfigData.config.businessAddress || "",
        businessCity: adminConfigData.config.businessCity || "",
        businessPostcode: adminConfigData.config.businessPostcode || "",
        companyNumber: adminConfigData.config.companyNumber || "",
        vatNumber: adminConfigData.config.vatNumber || "",
        preferredContactMethod: adminConfigData.config.preferredContactMethod || "email",
        businessType: adminConfigData.config.businessType || "property_management",
        authorized: adminConfigData.config.authorized || true
      });
    }
  }, [adminConfigData]);
  
  return (
    <TooltipProvider>
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/dashboard/AdminDashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Utility Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenant">Tenant View</TabsTrigger>
          <TabsTrigger value="setup">Setup Utilities</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
          <TabsTrigger value="banking">Banking Details</TabsTrigger>
          <TabsTrigger value="admin-config">Admin Config</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        {/* Tenant View Tab */}
        <TabsContent value="tenant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Utility Management View</CardTitle>
              <CardDescription>
                This is the tenant view for managing utilities and exploring providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantUtilityManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Cheapest Tariffs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Live Cheapest Utility Tariffs</CardTitle>
              <CardDescription>
                Live view of the most affordable tariffs available across all utility types powered by AI pricing analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCheapestTariffs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tariff data...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {cheapestTariffsData?.tariffs && cheapestTariffsData.tariffs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cheapestTariffsData.tariffs.map((tariff: any) => (
                        <Card key={tariff.id} className="overflow-hidden">
                          <CardHeader className="bg-primary/5 pb-4">
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {tariff.providerName}
                                  <Badge className="ml-2" variant="default">Best Deal</Badge>
                                  {tariff.utilityType && (
                                    <Badge variant="outline" className="text-xs">
                                      {utilityTypeNames[tariff.utilityType] || tariff.utilityType}
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {tariff.tariffName} - {tariff.savings}
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">
                                  £{tariff.annualEstimate}/year
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Est. monthly: £{tariff.monthlyEstimate}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm">{tariff.tariffName}</h4>
                                <p className="text-sm text-muted-foreground">{tariff.availability}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Standing Charge:</span>
                                  <p className="font-medium">{tariff.standingCharge}p/day</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Unit Rate:</span>
                                  <p className="font-medium">{tariff.unitRate}p/kWh</p>
                                </div>
                              </div>
                              
                              {tariff.features && tariff.features.length > 0 && (
                                <div>
                                  <span className="text-sm text-muted-foreground">Features:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tariff.features.slice(0, 2).map((feature: string, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-green-600 border-green-200">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {tariff.contractLength}
                                  </Badge>
                                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                                    {tariff.exitFees}
                                  </Badge>
                                </div>
                                {tariff.website ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(tariff.website, '_blank')}
                                  >
                                    Visit Website
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">Unable to load live tariff data.</p>
                      {tariffsError && (
                        <p className="text-sm text-red-600 mb-2">
                          Error: {tariffsError instanceof Error ? tariffsError.message : 'Unknown error'}
                        </p>
                      )}
                      {cheapestTariffsData && (
                        <div className="text-xs text-gray-500 mb-2">
                          Debug: success={String(cheapestTariffsData.success)}, tariffs={cheapestTariffsData.tariffs?.length || 0}
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                <span>Live data updated every hour via utility provider APIs</span>
              </div>
            </CardFooter>
          </Card>
          
          {/* Property Utility Contracts */}
          <Card>
            <CardHeader>
              <CardTitle>Utilities Overview</CardTitle>
              <CardDescription>
                Manage utility contracts and monitor utility setup status for your properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="property-select">Select Property</Label>
                  <Select
                    value={selectedPropertyId?.toString() || ""}
                    onValueChange={handlePropertySelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {isPropertiesLoading ? (
                        <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                      ) : properties.length > 0 ? (
                        properties.map((property: Property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.title} - {property.address}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No properties found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedPropertyId && (
                <>
                  <div className="rounded-lg bg-slate-50 p-4 mb-6">
                    <h3 className="text-lg font-medium mb-2">Property Utility Contracts</h3>
                    {isContractsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading contracts...
                      </div>
                    ) : contractsData?.contracts?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utility Type</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Tariff</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Monthly Payment</TableHead>
                            <TableHead>Best Deal</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contractsData.contracts.map((contract: UtilityContract) => (
                            <TableRow key={contract.id}>
                              <TableCell>{utilityTypeNames[contract.utilityType]}</TableCell>
                              <TableCell>{providersData?.providers?.find((p: UtilityProvider) => p.id === contract.providerId)?.name || contract.providerName || 'N/A'}</TableCell>
                              <TableCell>{tariffsData?.tariffs?.find((t: UtilityTariff) => t.id === contract.tariffId)?.name || contract.tariffName || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge className={statusColors[contract.status] || "bg-gray-100"}>
                                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {contract.monthlyPaymentAmount ? formatCurrency(contract.monthlyPaymentAmount) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {contract.bestDealAvailable ? (
                                  <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-amber-500" />
                                )}
                              </TableCell>
                              <TableCell>
                                {contract.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRegisterWithProvider(contract.id)}
                                    disabled={isRegistering}
                                  >
                                    {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Register
                                  </Button>
                                )}
                                {contract.status === 'blocked' && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setSelectedContract(contract)}
                                      >
                                        Upload Tenancy
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Upload Tenancy Agreement</DialogTitle>
                                        <DialogDescription>
                                          Upload a copy of the tenancy agreement to verify the account with the utility provider.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                          <div className="mt-2">
                                            <Label htmlFor="tenancy-file" className="cursor-pointer">
                                              <span className="text-blue-600 hover:text-blue-500">
                                                Click to upload
                                              </span>{" "}
                                              or drag and drop
                                            </Label>
                                            <Input
                                              id="tenancy-file"
                                              type="file"
                                              className="hidden"
                                              accept=".pdf,.docx,.jpg,.jpeg,.png"
                                              onChange={handleFileChange}
                                            />
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            PDF, DOCX, or image files up to 10MB
                                          </p>
                                          {tenancyFile && (
                                            <div className="mt-3 text-sm">
                                              Selected: <span className="font-medium">{tenancyFile.name}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button 
                                          type="submit" 
                                          onClick={handleUploadTenancyAgreement}
                                          disabled={!tenancyFile || isUploading}
                                        >
                                          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Upload
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No utility contracts found for this property.
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab("setup")}
                          >
                            Set up utilities
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => refetchContracts()}
                    >
                      Refresh Contracts
                    </Button>
                    <Button 
                      onClick={() => checkBetterDealsMutation.mutate()}
                      disabled={checkBetterDealsMutation.isPending}
                    >
                      {checkBetterDealsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Check For Better Deals
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Setup Utilities Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Utilities for Properties</CardTitle>
              <CardDescription>
                Configure utility accounts with providers and upload supporting documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property-select">Select Property</Label>
                  <Select value={selectedPropertyId?.toString() || ""} onValueChange={(value) => setSelectedPropertyId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertiesData?.length > 0 ? (
                        propertiesData.map((property: any) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.title} - {property.city}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-properties" disabled>
                          No properties available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPropertyId && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Utility Setup with Documents</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload utility contracts, account details, and setup documents for this property.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Account Number</Label>
                        <Input 
                          placeholder="Enter utility account number"
                          className="mt-1"
                          value={utilitySetupForm.accountNumber}
                          onChange={(e) => setUtilitySetupForm(prev => ({
                            ...prev,
                            accountNumber: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Utility Provider</Label>
                        <Select 
                          value={utilitySetupForm.providerId}
                          onValueChange={(value) => setUtilitySetupForm(prev => ({
                            ...prev,
                            providerId: value
                          }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providersData?.providers?.map((provider: any) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.name} - {provider.utilityType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Monthly Estimate (£)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 85.50"
                          className="mt-1"
                          value={utilitySetupForm.monthlyEstimate}
                          onChange={(e) => setUtilitySetupForm(prev => ({
                            ...prev,
                            monthlyEstimate: e.target.value
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Contract Start Date</Label>
                        <Input 
                          type="date"
                          className="mt-1"
                          value={utilitySetupForm.contractStartDate}
                          onChange={(e) => setUtilitySetupForm(prev => ({
                            ...prev,
                            contractStartDate: e.target.value
                          }))}
                        />
                      </div>
                    </div>

                    {/* Customer Details Section */}
                    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                      <h5 className="font-medium mb-4 text-lg">Customer Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Select 
                            value={utilitySetupForm.customerTitle}
                            onValueChange={(value) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerTitle: value
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                              <SelectItem value="Prof">Prof</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>First Name *</Label>
                          <Input 
                            placeholder="Enter first name"
                            className="mt-1"
                            value={utilitySetupForm.customerFirstName}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerFirstName: e.target.value
                            }))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Last Name *</Label>
                          <Input 
                            placeholder="Enter last name"
                            className="mt-1"
                            value={utilitySetupForm.customerLastName}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerLastName: e.target.value
                            }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Email Address *</Label>
                          <Input 
                            type="email"
                            placeholder="Enter email address"
                            className="mt-1"
                            value={utilitySetupForm.customerEmail}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerEmail: e.target.value
                            }))}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Phone Number *</Label>
                          <Input 
                            type="tel"
                            placeholder="Enter phone number"
                            className="mt-1"
                            value={utilitySetupForm.customerPhone}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerPhone: e.target.value
                            }))}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Date of Birth</Label>
                          <Input 
                            type="date"
                            className="mt-1"
                            value={utilitySetupForm.customerDateOfBirth}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              customerDateOfBirth: e.target.value
                            }))}
                          />
                        </div>
                        
                        <div>
                          <Label>Move-in Date</Label>
                          <Input 
                            type="date"
                            className="mt-1"
                            value={utilitySetupForm.moveInDate}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              moveInDate: e.target.value
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label>Previous Address</Label>
                        <Input 
                          placeholder="Enter previous address (optional)"
                          className="mt-1"
                          value={utilitySetupForm.previousAddress}
                          onChange={(e) => setUtilitySetupForm(prev => ({
                            ...prev,
                            previousAddress: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="mt-4">
                        <Label>Special Requirements</Label>
                        <Input 
                          placeholder="Any special requirements or notes"
                          className="mt-1"
                          value={utilitySetupForm.specialRequirements}
                          onChange={(e) => setUtilitySetupForm(prev => ({
                            ...prev,
                            specialRequirements: e.target.value
                          }))}
                        />
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="use-property-address"
                            checked={utilitySetupForm.usePropertyAddress}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              usePropertyAddress: e.target.checked
                            }))}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="use-property-address">Use property address for billing</Label>
                        </div>
                        
                        {!utilitySetupForm.usePropertyAddress && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                            <div>
                              <Label>Billing Address</Label>
                              <Input 
                                placeholder="Enter billing address"
                                className="mt-1"
                                value={utilitySetupForm.billingAddress}
                                onChange={(e) => setUtilitySetupForm(prev => ({
                                  ...prev,
                                  billingAddress: e.target.value
                                }))}
                              />
                            </div>
                            <div>
                              <Label>City</Label>
                              <Input 
                                placeholder="Enter city"
                                className="mt-1"
                                value={utilitySetupForm.billingCity}
                                onChange={(e) => setUtilitySetupForm(prev => ({
                                  ...prev,
                                  billingCity: e.target.value
                                }))}
                              />
                            </div>
                            <div>
                              <Label>Postcode</Label>
                              <Input 
                                placeholder="Enter postcode"
                                className="mt-1"
                                value={utilitySetupForm.billingPostcode}
                                onChange={(e) => setUtilitySetupForm(prev => ({
                                  ...prev,
                                  billingPostcode: e.target.value
                                }))}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="marketing-consent"
                            checked={utilitySetupForm.marketingConsent}
                            onChange={(e) => setUtilitySetupForm(prev => ({
                              ...prev,
                              marketingConsent: e.target.checked
                            }))}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="marketing-consent">I consent to receive marketing communications</Label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Upload Documents</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <input 
                          type="file" 
                          multiple 
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden" 
                          id="utility-documents"
                          onChange={handleFileSelect}
                        />
                        <label htmlFor="utility-documents" className="cursor-pointer">
                          <div className="space-y-2">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF, Images, Word documents up to 10MB each
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {/* Show selected files */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{file.name}</span>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={handleUtilitySetup}
                        disabled={setupUtilityMutation.isPending}
                      >
                        {setupUtilityMutation.isPending ? "Setting Up..." : "Setup Utility Account"}
                      </Button>
                      <Button variant="outline">
                        Save Draft
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set Up Utilities</CardTitle>
              <CardDescription>
                Compare utility prices and set up new utility contracts for your properties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="property-select">Select Property</Label>
                  <Select
                    value={selectedPropertyId?.toString() || ""}
                    onValueChange={handlePropertySelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {isPropertiesLoading ? (
                        <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                      ) : properties.length > 0 ? (
                        properties.map((property: Property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.title} - {property.address}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No properties found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="utility-type-select">Utility Type</Label>
                  <Select
                    value={selectedUtilityType || ""}
                    onValueChange={handleUtilityTypeSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select utility type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="dual_fuel">Dual Fuel (Gas & Electricity)</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="broadband">Broadband</SelectItem>
                      <SelectItem value="tv_license">TV License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="self-end">
                  <Button 
                    onClick={handleCompare}
                    disabled={!selectedPropertyId || !selectedUtilityType || isComparing}
                  >
                    {isComparing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Compare Prices
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Utility Setup Form */}
              {selectedPropertyId && (
                <div className="mt-8 space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Set Up New Utility Account</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={utilitySetupForm.accountNumber}
                          onChange={(e) => setUtilitySetupForm(prev => ({...prev, accountNumber: e.target.value}))}
                          placeholder="Enter utility account number"
                        />
                      </div>
                      
                      <div>
                        <Label>Provider</Label>
                        <Select
                          value={utilitySetupForm.providerId}
                          onValueChange={(value) => setUtilitySetupForm(prev => ({...prev, providerId: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select utility provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providersData?.providers?.map((provider: UtilityProvider) => (
                              <SelectItem key={provider.id} value={provider.id.toString()}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Monthly Estimate (£)</Label>
                        <Input
                          type="number"
                          value={utilitySetupForm.monthlyEstimate}
                          onChange={(e) => setUtilitySetupForm(prev => ({...prev, monthlyEstimate: e.target.value}))}
                          placeholder="Expected monthly cost"
                        />
                      </div>
                      
                      <div>
                        <Label>Contract Start Date</Label>
                        <Input
                          type="date"
                          value={utilitySetupForm.contractStartDate}
                          onChange={(e) => setUtilitySetupForm(prev => ({...prev, contractStartDate: e.target.value}))}
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <Label>Upload Documents</Label>
                      <Input
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="mt-1"
                      />
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedFiles.map((file: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={handleUtilitySetup}
                      disabled={setupUtilityMutation.isPending}
                      className="w-full"
                    >
                      {setupUtilityMutation.isPending ? "Setting Up..." : "Set Up Utility Account"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utility Providers</CardTitle>
              <CardDescription>
                Manage utility providers and their information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="mb-6">
                <AccordionItem value="add-provider">
                  <AccordionTrigger>Add New Provider</AccordionTrigger>
                  <AccordionContent>
                    <form onSubmit={handleCreateProvider} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="provider-name">Provider Name</Label>
                          <Input 
                            id="provider-name"
                            value={newProviderForm.name}
                            onChange={(e) => setNewProviderForm({...newProviderForm, name: e.target.value})}
                            placeholder="e.g. British Gas"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="utility-type">Utility Type</Label>
                          <Select 
                            value={newProviderForm.utilityType}
                            onValueChange={(value) => setNewProviderForm({...newProviderForm, utilityType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select utility type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gas">Gas</SelectItem>
                              <SelectItem value="electricity">Electricity</SelectItem>
                              <SelectItem value="dual_fuel">Dual Fuel</SelectItem>
                              <SelectItem value="water">Water</SelectItem>
                              <SelectItem value="broadband">Broadband</SelectItem>
                              <SelectItem value="tv_license">TV License</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">Customer Service Phone</Label>
                          <Input 
                            id="phone"
                            value={newProviderForm.customerServicePhone}
                            onChange={(e) => setNewProviderForm({...newProviderForm, customerServicePhone: e.target.value})}
                            placeholder="Customer service number"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input 
                            id="website"
                            value={newProviderForm.website}
                            onChange={(e) => setNewProviderForm({...newProviderForm, website: e.target.value})}
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="active"
                          checked={newProviderForm.active}
                          onChange={(e) => setNewProviderForm({...newProviderForm, active: e.target.checked})}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="active">Active provider</Label>
                      </div>
                      
                      <Button type="submit" disabled={createProviderMutation.isPending}>
                        {createProviderMutation.isPending ? "Creating..." : "Create Provider"}
                      </Button>
                    </form>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Existing Providers</h3>
                {providersData?.providers?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providersData.providers.map((provider: UtilityProvider) => (
                      <Card key={provider.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {provider.name}
                            <Badge variant={provider.active ? "default" : "secondary"}>
                              {provider.active ? "Active" : "Inactive"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {utilityTypeNames[provider.utilityType] || provider.utilityType}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {provider.website && (
                            <p className="text-sm">
                              <strong>Website:</strong> 
                              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                {provider.website}
                              </a>
                            </p>
                          )}
                          {provider.customerServicePhone && (
                            <p className="text-sm">
                              <strong>Phone:</strong> {provider.customerServicePhone}
                            </p>
                          )}
                          {provider.customerServiceEmail && (
                            <p className="text-sm">
                              <strong>Email:</strong> {provider.customerServiceEmail}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No providers found. Add your first provider above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tariffs Tab */}
        <TabsContent value="tariffs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utility Tariffs</CardTitle>
              <CardDescription>
                Manage tariffs and pricing information for utility providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label>Select Provider to View/Add Tariffs</Label>
                <Select 
                  value={selectedProviderId?.toString() || ""}
                  onValueChange={(value) => setSelectedProviderId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providersData?.providers?.map((provider: UtilityProvider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name} ({utilityTypeNames[provider.utilityType] || provider.utilityType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProviderId && (
                <>
                  <Accordion type="single" collapsible className="mb-6">
                    <AccordionItem value="add-tariff">
                      <AccordionTrigger>Add New Tariff</AccordionTrigger>
                      <AccordionContent>
                        <form onSubmit={handleCreateTariff} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tariff-name">Tariff Name</Label>
                              <Input 
                                id="tariff-name"
                                value={newTariffForm.name}
                                onChange={(e) => setNewTariffForm({...newTariffForm, name: e.target.value})}
                                placeholder="e.g. Standard Variable"
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="tariff-description">Description</Label>
                              <Input 
                                id="tariff-description"
                                value={newTariffForm.description}
                                onChange={(e) => setNewTariffForm({...newTariffForm, description: e.target.value})}
                                placeholder="Brief description"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="annual-cost">Estimated Annual Cost (£)</Label>
                              <Input 
                                id="annual-cost"
                                type="number"
                                step="0.01"
                                value={newTariffForm.estimatedAnnualCost}
                                onChange={(e) => setNewTariffForm({...newTariffForm, estimatedAnnualCost: parseFloat(e.target.value) || 0})}
                                placeholder="1200.00"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="standing-charge">Standing Charge (pence/day)</Label>
                              <Input 
                                id="standing-charge"
                                type="number"
                                step="0.01"
                                value={newTariffForm.standingCharge}
                                onChange={(e) => setNewTariffForm({...newTariffForm, standingCharge: parseFloat(e.target.value) || 0})}
                                placeholder="25.50"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="unit-rate">Unit Rate (pence/kWh)</Label>
                              <Input 
                                id="unit-rate"
                                type="number"
                                step="0.01"
                                value={newTariffForm.unitRate}
                                onChange={(e) => setNewTariffForm({...newTariffForm, unitRate: parseFloat(e.target.value) || 0})}
                                placeholder="15.25"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="term-length">Term Length (months)</Label>
                              <Input 
                                id="term-length"
                                type="number"
                                value={newTariffForm.termLength}
                                onChange={(e) => setNewTariffForm({...newTariffForm, termLength: parseInt(e.target.value) || 12})}
                                placeholder="12"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="fixed-term"
                              checked={newTariffForm.fixedTerm}
                              onChange={(e) => setNewTariffForm({...newTariffForm, fixedTerm: e.target.checked})}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="fixed-term">Fixed term tariff</Label>
                          </div>
                          
                          <Button type="submit" disabled={createTariffMutation.isPending}>
                            {createTariffMutation.isPending ? "Creating..." : "Create Tariff"}
                          </Button>
                        </form>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Existing Tariffs</h3>
                    {tariffsData?.tariffs?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tariffsData.tariffs.map((tariff: UtilityTariff) => (
                          <Card key={tariff.id}>
                            <CardHeader>
                              <CardTitle>{tariff.name}</CardTitle>
                              <CardDescription>{tariff.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <p><strong>Annual Cost:</strong> {formatCurrency(tariff.estimatedAnnualCost || 0)}</p>
                                <p><strong>Standing Charge:</strong> {tariff.standingCharge}p/day</p>
                                <p><strong>Unit Rate:</strong> {tariff.unitRate}p/kWh</p>
                                <p><strong>Term:</strong> {tariff.fixedTerm ? `${tariff.termLength} months (Fixed)` : 'Variable'}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No tariffs found for this provider. Add your first tariff above.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
              <CardDescription>
                Manage admin banking details for utility payments and deposits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="mb-6">
                <AccordionItem value="add-banking">
                  <AccordionTrigger>Add New Banking Details</AccordionTrigger>
                  <AccordionContent>
                    <form onSubmit={handleCreateBankingDetails} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input 
                            id="bank-name"
                            value={newBankingForm.bankName}
                            onChange={(e) => setNewBankingForm({...newBankingForm, bankName: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="account-name">Account Name</Label>
                          <Input 
                            id="account-name"
                            value={newBankingForm.accountName}
                            onChange={(e) => setNewBankingForm({...newBankingForm, accountName: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="account-number">Account Number</Label>
                          <Input 
                            id="account-number"
                            value={newBankingForm.accountNumber}
                            onChange={(e) => setNewBankingForm({...newBankingForm, accountNumber: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="sort-code">Sort Code</Label>
                          <Input 
                            id="sort-code"
                            value={newBankingForm.sortCode}
                            onChange={(e) => setNewBankingForm({...newBankingForm, sortCode: e.target.value})}
                            placeholder="12-34-56"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="reference">Reference</Label>
                          <Input 
                            id="reference"
                            value={newBankingForm.reference}
                            onChange={(e) => setNewBankingForm({...newBankingForm, reference: e.target.value})}
                            placeholder="Optional payment reference"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-name">Contact Name</Label>
                          <Input 
                            id="contact-name"
                            value={newBankingForm.contactName}
                            onChange={(e) => setNewBankingForm({...newBankingForm, contactName: e.target.value})}
                            placeholder="Optional contact person"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input 
                            id="contact-email"
                            type="email"
                            value={newBankingForm.contactEmail}
                            onChange={(e) => setNewBankingForm({...newBankingForm, contactEmail: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-phone">Contact Phone</Label>
                          <Input 
                            id="contact-phone"
                            value={newBankingForm.contactPhone}
                            onChange={(e) => setNewBankingForm({...newBankingForm, contactPhone: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-default"
                          checked={newBankingForm.isDefault}
                          onChange={(e) => setNewBankingForm({...newBankingForm, isDefault: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="is-default">Set as default banking details</Label>
                      </div>
                      
                      <Button 
                        type="submit"
                        disabled={createBankingDetailsMutation.isPending}
                      >
                        {createBankingDetailsMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Add Banking Details
                      </Button>
                    </form>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="text-lg font-medium mb-4">Saved Banking Details</h3>
                
                {bankingDetailsData?.bankingDetails?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bank</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>Sort Code</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Default</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankingDetailsData.bankingDetails.map((details: AdminBankingDetails) => (
                        <TableRow key={details.id}>
                          <TableCell className="font-medium">{details.bankName}</TableCell>
                          <TableCell>{details.accountName}</TableCell>
                          <TableCell>{details.accountNumber}</TableCell>
                          <TableCell>{details.sortCode}</TableCell>
                          <TableCell>{details.reference || "N/A"}</TableCell>
                          <TableCell>
                            {details.contactName ? (
                              <div>
                                <div>{details.contactName}</div>
                                <div className="text-xs text-gray-500">
                                  {details.contactEmail && (
                                    <a href={`mailto:${details.contactEmail}`} className="text-blue-600 hover:underline">
                                      {details.contactEmail}
                                    </a>
                                  )}
                                  {details.contactPhone && details.contactEmail && " | "}
                                  {details.contactPhone}
                                </div>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            {details.isDefault ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No banking details found. Please add new banking details.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Configuration Tab */}
        <TabsContent value="admin-config" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Admin Configuration</CardTitle>
                  <CardDescription>
                    Manage your business details used for utility registrations
                  </CardDescription>
                </div>
                <Button 
                  variant={isEditingAdminConfig ? "outline" : "default"}
                  onClick={() => setIsEditingAdminConfig(!isEditingAdminConfig)}
                >
                  {isEditingAdminConfig ? "Cancel" : "Edit Details"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingAdminConfig ? (
                <form onSubmit={handleSaveAdminConfig} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Business Information</h3>
                      
                      <div>
                        <Label htmlFor="business-name">Business Name *</Label>
                        <Input 
                          id="business-name"
                          value={adminConfigForm.businessName}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, businessName: e.target.value})}
                          placeholder="Your property management company"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact-title">Contact Title</Label>
                          <Select 
                            value={adminConfigForm.contactTitle}
                            onValueChange={(value) => setAdminConfigForm({...adminConfigForm, contactTitle: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="business-type">Business Type</Label>
                          <Select 
                            value={adminConfigForm.businessType}
                            onValueChange={(value) => setAdminConfigForm({...adminConfigForm, businessType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="property_management">Property Management</SelectItem>
                              <SelectItem value="letting_agency">Letting Agency</SelectItem>
                              <SelectItem value="landlord">Private Landlord</SelectItem>
                              <SelectItem value="estate_agency">Estate Agency</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact-first-name">Contact First Name *</Label>
                          <Input 
                            id="contact-first-name"
                            value={adminConfigForm.contactFirstName}
                            onChange={(e) => setAdminConfigForm({...adminConfigForm, contactFirstName: e.target.value})}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="contact-last-name">Contact Last Name *</Label>
                          <Input 
                            id="contact-last-name"
                            value={adminConfigForm.contactLastName}
                            onChange={(e) => setAdminConfigForm({...adminConfigForm, contactLastName: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="business-email">Business Email *</Label>
                        <Input 
                          id="business-email"
                          type="email"
                          value={adminConfigForm.businessEmail}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, businessEmail: e.target.value})}
                          placeholder="admin@yourcompany.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="business-phone">Business Phone *</Label>
                        <Input 
                          id="business-phone"
                          value={adminConfigForm.businessPhone}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, businessPhone: e.target.value})}
                          placeholder="020 7123 4567"
                          required
                        />
                      </div>
                    </div>

                    {/* Address & Registration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Business Address & Registration</h3>
                      
                      <div>
                        <Label htmlFor="business-address">Business Address *</Label>
                        <Input 
                          id="business-address"
                          value={adminConfigForm.businessAddress}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, businessAddress: e.target.value})}
                          placeholder="123 Business Street"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="business-city">City *</Label>
                          <Input 
                            id="business-city"
                            value={adminConfigForm.businessCity}
                            onChange={(e) => setAdminConfigForm({...adminConfigForm, businessCity: e.target.value})}
                            placeholder="London"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="business-postcode">Postcode *</Label>
                          <Input 
                            id="business-postcode"
                            value={adminConfigForm.businessPostcode}
                            onChange={(e) => setAdminConfigForm({...adminConfigForm, businessPostcode: e.target.value})}
                            placeholder="SW1A 1AA"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="company-number">Company Number</Label>
                        <Input 
                          id="company-number"
                          value={adminConfigForm.companyNumber}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, companyNumber: e.target.value})}
                          placeholder="12345678"
                        />
                      </div>

                      <div>
                        <Label htmlFor="vat-number">VAT Number</Label>
                        <Input 
                          id="vat-number"
                          value={adminConfigForm.vatNumber}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, vatNumber: e.target.value})}
                          placeholder="GB123456789"
                        />
                      </div>

                      <div>
                        <Label htmlFor="preferred-contact-method">Preferred Contact Method</Label>
                        <Select 
                          value={adminConfigForm.preferredContactMethod}
                          onValueChange={(value) => setAdminConfigForm({...adminConfigForm, preferredContactMethod: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="post">Post</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="authorized"
                          checked={adminConfigForm.authorized}
                          onChange={(e) => setAdminConfigForm({...adminConfigForm, authorized: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="authorized">I am authorized to set up utilities for properties</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsEditingAdminConfig(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={saveAdminConfigMutation.isPending}
                    >
                      {saveAdminConfigMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Configuration
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {adminConfigData?.config ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Business Information</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Business Name:</span>
                            <p className="font-medium">{adminConfigData.config.businessName || "Not set"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Contact Person:</span>
                            <p className="font-medium">
                              {adminConfigData.config.contactTitle && `${adminConfigData.config.contactTitle} `}
                              {adminConfigData.config.contactFirstName} {adminConfigData.config.contactLastName}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Business Type:</span>
                            <p className="font-medium">{adminConfigData.config.businessType?.replace('_', ' ') || "Not set"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <p className="font-medium">{adminConfigData.config.businessEmail || "Not set"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Phone:</span>
                            <p className="font-medium">{adminConfigData.config.businessPhone || "Not set"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Address & Registration</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Address:</span>
                            <p className="font-medium">
                              {adminConfigData.config.businessAddress}<br />
                              {adminConfigData.config.businessCity} {adminConfigData.config.businessPostcode}
                            </p>
                          </div>
                          {adminConfigData.config.companyNumber && (
                            <div>
                              <span className="text-sm text-muted-foreground">Company Number:</span>
                              <p className="font-medium">{adminConfigData.config.companyNumber}</p>
                            </div>
                          )}
                          {adminConfigData.config.vatNumber && (
                            <div>
                              <span className="text-sm text-muted-foreground">VAT Number:</span>
                              <p className="font-medium">{adminConfigData.config.vatNumber}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-sm text-muted-foreground">Preferred Contact:</span>
                            <p className="font-medium">{adminConfigData.config.preferredContactMethod}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Authorization Status:</span>
                            <p className="font-medium flex items-center gap-2">
                              {adminConfigData.config.authorized ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Authorized
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  Not Authorized
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Configuration Found</h3>
                      <p className="text-muted-foreground mb-4">
                        You need to set up your business details before you can register utilities.
                      </p>
                      <Button onClick={() => setIsEditingAdminConfig(true)}>
                        Set Up Business Details
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
};

export default UtilityManagementPage;
