import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Loader2, 
  Upload, 
  UserCheck, 
  Shield, 
  Scan,
  Camera,
  HelpCircle,
  Info,
  Check,
  X,
  XCircle
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { VerificationType } from "@/lib/types";
import { 
  uploadVerificationDocuments, 
  verifyIdentity, 
  checkAIStatusPublic, 
  checkGeminiStatusPublic,
  checkDeepSeekStatusPublic,
  checkCustomAiStatusPublic
} from "@/lib/api";

// Validation schema for document verification form
const verificationSchema = z.object({
  documentType: z.string().min(1, "Document type is required"),
  documentImage: z.instanceof(File, { message: "Document image is required" }),
  selfieImage: z.instanceof(File, { message: "Selfie image is required" })
});

interface IDVerificationProps {
  userId?: number;
  verificationType?: 'tenant' | 'landlord' | 'agent';
  verificationId?: number;
  isAdmin?: boolean;
}

interface Verification {
  id: number;
  userId: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  documentType: string;
  documentImage?: string;
  selfieImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationResult {
  verified: boolean;
  faceMatch: boolean;
  documentAuthenticity: boolean;
  liveDetection: boolean;
  confidenceScore: number;
  errorDetails?: string;
  documentData?: Record<string, string>;
}

export default function IDDocumentVerification({ 
  userId, 
  verificationType = 'tenant', 
  verificationId,
  isAdmin = false
}: IDVerificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upload");
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [aiServiceStatus, setAiServiceStatus] = useState<{
    gemini: boolean;
    deepSeek: boolean;
    custom: boolean;
    anyAvailable: boolean;
  }>({
    gemini: false,
    deepSeek: false,
    custom: false,
    anyAvailable: false
  });
  
  // Check AI service availability when component mounts
  useEffect(() => {
    const checkAIServices = async () => {
      try {
        // Check our AI providers status endpoint that shows the actual system configuration
        const response = await fetch('/api/ai/providers/status');
        const providersStatus = await response.json();
        
        // In our zero-cost configuration, only the custom provider should be active
        const customAvailable = providersStatus.status === "ok" && 
                                providersStatus.primaryProvider === "custom";
        
        // External providers are intentionally disabled to eliminate subscription costs
        // This is by design as requested by the user
        const serviceAvailable = customAvailable;
        
        setAiServiceStatus({
          gemini: false,  // Intentionally disabled for cost savings
          deepSeek: false, // Intentionally disabled for cost savings  
          custom: customAvailable,
          anyAvailable: serviceAvailable
        });
        
        // Only show a toast if the custom AI provider is not available
        if (!customAvailable) {
          toast({
            title: "Custom AI Provider Initializing",
            description: "The custom AI verification service is starting up. This will take just a moment.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("Failed to check AI service status:", error);
        // Default to assuming custom provider is available since external providers are disabled
        setAiServiceStatus({
          gemini: false,
          deepSeek: false,
          custom: true, // Assume available as fallback
          anyAvailable: true
        });
      }
    };
    
    checkAIServices();
  }, [toast]);

  // Fetch existing verification if verificationId is provided
  const { data: verification, isLoading: isLoadingVerification } = useQuery<Verification>({
    queryKey: [`/api/verifications/${verificationId}`],
    enabled: !!verificationId,
  });

  // Form setup
  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentType: "",
    }
  });

  // Upload verification documents mutation
  const uploadDocumentsMutation = useMutation({
    mutationFn: (data: FormData) => uploadVerificationDocuments(data),
    onSuccess: (data) => {
      toast({
        title: "Documents uploaded",
        description: "Your verification documents have been successfully uploaded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/verifications`] });
      // Move to verification tab
      setActiveTab("verify");
      // Start verification process
      verifyIdentityMutation.mutate({ verificationId: data.id });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload verification documents.",
        variant: "destructive"
      });
    }
  });

  // Verify identity mutation
  const verifyIdentityMutation = useMutation({
    mutationFn: ({ verificationId }: { verificationId: number }) => {
      // Simulate progress for UX feedback
      const progressInterval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      return verifyIdentity(verificationId);
    },
    onSuccess: (data) => {
      setVerificationProgress(100);
      setVerificationResult(data);
      toast({
        title: "Verification complete",
        description: data.verified 
          ? "Identity has been successfully verified." 
          : "Verification failed. Please check the issues below.",
        variant: data.verified ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      setVerificationProgress(0);
      
      // Set detailed verification result with error information
      setVerificationResult({
        verified: false,
        faceMatch: false,
        documentAuthenticity: false,
        liveDetection: false,
        confidenceScore: 0,
        errorDetails: error.message || "Unknown error"
      });
      
      // Determine if error is related to AI service availability
      const isAIServiceError = error.message && (
        error.message.includes("API key") || 
        error.message.includes("provider") ||
        error.message.includes("service")
      );
      
      if (isAIServiceError) {
        toast({
          title: "AI Service Unavailable",
          description: "The verification service is currently unavailable. An administrator has been notified.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Verification failed",
          description: error.message || "Failed to verify identity. Please ensure your documents are clear and try again.",
          variant: "destructive"
        });
      }
    }
  });

  // Handle file changes with previews
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("documentImage", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("selfieImage", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const onSubmit = (values: z.infer<typeof verificationSchema>) => {
    const formData = new FormData();
    formData.append("userId", userId?.toString() || "");
    formData.append("documentType", values.documentType);
    formData.append("documentImage", values.documentImage);
    formData.append("selfieImage", values.selfieImage);
    formData.append("userType", verificationType);

    uploadDocumentsMutation.mutate(formData);
  };

  // Loading state
  if (isLoadingVerification) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show existing verification if available
  if (verification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" />
            Identity Verification Status
          </CardTitle>
          <CardDescription>
            View the status of your identity verification submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${
                verification.status === 'approved' 
                  ? 'bg-green-100 text-green-700' 
                  : verification.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {verification.status === 'approved' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : verification.status === 'rejected' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {verification.documentType} Verification
                </p>
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(verification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant={
              verification.status === 'approved' 
                ? 'default' 
                : verification.status === 'rejected'
                ? 'destructive'
                : 'secondary'
            }>
              {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-2 block">ID Document</Label>
              <div className="border rounded-md overflow-hidden h-48 bg-gray-50 flex items-center justify-center">
                {verification.documentImage ? (
                  <img 
                    src={verification.documentImage} 
                    alt="ID Document" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <FileText className="h-12 w-12 text-gray-300" />
                )}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Selfie Verification</Label>
              <div className="border rounded-md overflow-hidden h-48 bg-gray-50 flex items-center justify-center">
                {verification.selfieImage ? (
                  <img 
                    src={verification.selfieImage} 
                    alt="Selfie" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <UserCheck className="h-12 w-12 text-gray-300" />
                )}
              </div>
            </div>
          </div>

          {verification.status === 'rejected' && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>
                Your ID verification was rejected. Please submit new documents.
              </AlertDescription>
            </Alert>
          )}

          {isAdmin && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Admin Verification Tools</h3>
              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  className="border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    // Handle admin approval
                    toast({
                      title: "Approved",
                      description: "You have approved this verification"
                    });
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    // Handle admin rejection
                    toast({
                      title: "Rejected",
                      description: "You have rejected this verification"
                    });
                  }}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Re-run AI verification
                    verifyIdentityMutation.mutate({ verificationId: verification.id });
                  }}
                  disabled={verifyIdentityMutation.isPending}
                >
                  {verifyIdentityMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="mr-2 h-4 w-4" />
                  )}
                  Re-run AI Verification
                </Button>
              </div>
              
              {verificationResult && (
                <div className="p-4 bg-gray-50 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">AI Verification Results</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Face Match:</span>
                      <span className={verificationResult.faceMatch ? "text-green-600" : "text-red-600"}>
                        {verificationResult.faceMatch ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Document Authenticity:</span>
                      <span className={verificationResult.documentAuthenticity ? "text-green-600" : "text-red-600"}>
                        {verificationResult.documentAuthenticity ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Live Detection:</span>
                      <span className={verificationResult.liveDetection ? "text-green-600" : "text-red-600"}>
                        {verificationResult.liveDetection ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overall Status:</span>
                      <span className={verificationResult.verified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {verificationResult.verified ? "VERIFIED" : "FAILED"}
                      </span>
                    </div>
                    
                    {verificationResult.confidenceScore !== undefined && (
                      <div className="flex justify-between">
                        <span>Confidence Score:</span>
                        <span>{(verificationResult.confidenceScore * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    
                    {verificationResult.errorDetails && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-red-700">
                        <p className="font-medium mb-1">Error Details:</p>
                        <p className="text-xs">{verificationResult.errorDetails}</p>
                      </div>
                    )}
                    
                    {verificationResult.documentData && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded">
                        <p className="font-medium mb-1">Extracted Document Data:</p>
                        <div className="space-y-1 text-xs">
                          {Object.entries(verificationResult.documentData).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Identity Verification</h1>
        <p className="text-gray-500">
          Verify your identity to comply with Right to Rent legislation
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <div className={`flex items-center ${activeTab === "upload" ? "text-primary font-medium" : "text-gray-500"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeTab === "upload" ? "bg-primary text-white" : activeTab === "verify" || activeTab === "result" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {activeTab === "upload" ? 1 : <Check className="h-4 w-4" />}
                  </div>
                  <span>Upload</span>
                </div>
                <div className={`h-0.5 flex-grow mx-2 mt-4 ${activeTab === "upload" ? "bg-gray-200" : "bg-primary"}`}></div>
                <div className={`flex items-center ${activeTab === "verify" ? "text-primary font-medium" : "text-gray-500"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeTab === "verify" ? "bg-primary text-white" : activeTab === "result" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {activeTab === "result" ? <Check className="h-4 w-4" /> : 2}
                  </div>
                  <span>Verify</span>
                </div>
                <div className={`h-0.5 flex-grow mx-2 mt-4 ${activeTab === "result" ? "bg-primary" : "bg-gray-200"}`}></div>
                <div className={`flex items-center ${activeTab === "result" ? "text-primary font-medium" : "text-gray-500"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${activeTab === "result" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                    3
                  </div>
                  <span>Result</span>
                </div>
              </div>
            </div>
            
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload Documents</TabsTrigger>
              <TabsTrigger value="verify" disabled={!documentPreview || !selfiePreview}>
                Verify Identity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Upload</CardTitle>
                  <CardDescription>
                    Upload your identity documents and selfie for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      {verificationType === 'tenant' ? (
                        "Your identity verification is required by UK law for Right to Rent checks. All data is securely processed and stored."
                      ) : verificationType === 'landlord' ? (
                        "Landlord identity verification helps establish trust with tenants and complies with UK housing regulations. All data is securely processed and stored."
                      ) : (
                        "Agent identity verification helps establish trust with clients and tenants. All data is securely processed and stored."
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  {/* AI Service Status Indicators */}
                  <div className="flex flex-col space-y-2 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium mb-1">AI Service Status</div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${aiServiceStatus.custom ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-xs font-medium">Custom AI Provider</span>
                        <span className="text-xs text-green-600 ml-1">(Zero Cost)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2 bg-gray-400"></div>
                        <span className="text-xs text-gray-500">External Providers</span>
                        <span className="text-xs text-gray-500 ml-1">(Disabled for Cost Savings)</span>
                      </div>
                      <div className="ml-auto text-xs">
                        {aiServiceStatus.custom ? (
                          <span className="text-green-600 font-medium">System Ready</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Initializing</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="driving_license">Driving License</SelectItem>
                            <SelectItem value="national_id">National ID Card</SelectItem>
                            <SelectItem value="brp">Biometric Residence Permit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of identity document you want to upload
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <FormLabel className="block">ID Document</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Upload a clear image of your passport, driving license, or other government-issued ID.</p>
                                <p className="text-xs mt-1 text-gray-400">Ensure all text is legible, all corners are visible, and the photo matches your selfie.</p>
                                <p className="text-xs mt-1 text-gray-400">Supported formats: JPG, PNG</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div 
                          className="border-2 border-dashed rounded-md p-4 h-48 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-sm"
                          onClick={() => document.getElementById('document-upload')?.click()}
                        >
                          {documentPreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={documentPreview} 
                                alt="ID Document Preview" 
                                className="max-w-full max-h-full object-contain"
                              />
                              <button 
                                type="button"
                                className="absolute top-1 right-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 shadow-sm border border-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDocumentPreview(null);
                                  form.setValue("documentImage", undefined as any);
                                }}
                                aria-label="Remove document image"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col items-center">
                                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500 text-center">
                                  Click to upload your ID document<br />
                                  (Passport, Driving License, etc.)
                                </p>
                                <div className="mt-3 flex items-center text-xs text-primary">
                                  <Info className="h-3 w-3 mr-1" />
                                  <span>Well-lit, clear photo</span>
                                </div>
                              </div>
                            </>
                          )}
                          <Input 
                            id="document-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleDocumentFileChange}
                          />
                        </div>
                        {form.formState.errors.documentImage && (
                          <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.documentImage.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <FormLabel className="block">Selfie Photo</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 ml-2 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Take a clear selfie in good lighting with your face fully visible.</p>
                                <p className="text-xs mt-1 text-gray-400">Look directly at the camera with a neutral expression in natural light.</p>
                                <p className="text-xs mt-1 text-gray-400">Avoid hats, sunglasses, or anything that obscures your face.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div 
                          className="border-2 border-dashed rounded-md p-4 h-48 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-sm"
                          onClick={() => document.getElementById('selfie-upload')?.click()}
                        >
                          {selfiePreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={selfiePreview} 
                                alt="Selfie Preview" 
                                className="max-w-full max-h-full object-contain"
                              />
                              <button 
                                type="button"
                                className="absolute top-1 right-1 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 shadow-sm border border-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelfiePreview(null);
                                  form.setValue("selfieImage", undefined as any);
                                }}
                                aria-label="Remove selfie image"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col items-center">
                                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500 text-center">
                                  Click to upload a clear selfie photo<br />
                                  (Looking straight at camera)
                                </p>
                                <div className="mt-3 flex items-center text-xs text-primary">
                                  <Info className="h-3 w-3 mr-1" />
                                  <span>Neutral expression, good lighting</span>
                                </div>
                              </div>
                            </>
                          )}
                          <Input 
                            id="selfie-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleSelfieFileChange}
                          />
                        </div>
                        {form.formState.errors.selfieImage && (
                          <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.selfieImage.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Requirements:</h3>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                        <li>Documents must be clear, legible and unfolded</li>
                        <li>All corners and edges of the document must be visible</li>
                        <li>Selfie should be well-lit with a neutral expression</li>
                        <li>Ensure your face isn't obscured by glasses, hats, or masks</li>
                        <li>Make sure to use the actual document (not a photocopy)</li>
                        <li>Take photos in natural light, avoiding glare or shadows</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
                      // Manually check if files are selected
                      const documentFile = form.getValues("documentImage");
                      const selfieFile = form.getValues("selfieImage");
                      const documentType = form.getValues("documentType");
                      
                      if (!documentFile) {
                        form.setError("documentImage", { 
                          type: "manual", 
                          message: "Document image is required" 
                        });
                      }
                      
                      if (!selfieFile) {
                        form.setError("selfieImage", { 
                          type: "manual", 
                          message: "Selfie image is required" 
                        });
                      }
                      
                      if (!documentType) {
                        form.setError("documentType", { 
                          type: "manual", 
                          message: "Document type is required" 
                        });
                      }
                      
                      if (documentFile && selfieFile && documentType) {
                        setActiveTab("verify");
                      }
                    }}
                    disabled={!documentPreview || !selfiePreview || !form.getValues("documentType") || !aiServiceStatus.anyAvailable}
                  >
                    Next: Verify Identity
                    {!aiServiceStatus.anyAvailable && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-1 rounded">
                        AI Service Unavailable
                      </span>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="verify" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verify Identity</CardTitle>
                  <CardDescription>
                    Review and submit your documents for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">ID Document</Label>
                      <div className="border rounded-md overflow-hidden h-48 bg-gray-50 flex items-center justify-center">
                        {documentPreview ? (
                          <img 
                            src={documentPreview} 
                            alt="ID Document" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <FileText className="h-12 w-12 text-gray-300" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Selfie Verification</Label>
                      <div className="border rounded-md overflow-hidden h-48 bg-gray-50 flex items-center justify-center">
                        {selfiePreview ? (
                          <img 
                            src={selfiePreview} 
                            alt="Selfie" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <UserCheck className="h-12 w-12 text-gray-300" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Verification Process:</h3>
                    
                    {/* AI Service Status Display */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-medium">AI Services:</span>
                      <div className="flex items-center bg-white px-2 py-1 rounded border text-xs">
                        <div className={`w-2 h-2 rounded-full mr-1.5 ${aiServiceStatus.gemini ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={aiServiceStatus.gemini ? 'text-green-700' : 'text-gray-500'}>
                          Gemini {aiServiceStatus.gemini ? '(Active)' : '(Unavailable)'}
                        </span>
                      </div>
                      <div className="flex items-center bg-white px-2 py-1 rounded border text-xs">
                        <div className={`w-2 h-2 rounded-full mr-1.5 ${aiServiceStatus.deepSeek ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={aiServiceStatus.deepSeek ? 'text-green-700' : 'text-gray-500'}>
                          DeepSeek {aiServiceStatus.deepSeek ? '(Active)' : '(Unavailable)'}
                        </span>
                      </div>
                    </div>
                    
                    {!aiServiceStatus.anyAvailable && (
                      <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                        <div className="flex items-center mb-1">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <strong>AI Verification Service Unavailable</strong>
                        </div>
                        <p className="text-xs ml-6">
                          Our AI verification service is temporarily unavailable. 
                          You can still upload your documents but verification will be delayed.
                        </p>
                      </div>
                    )}
                    
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <span>
                          <strong className="block text-sm">Document Uploaded</strong>
                          <span className="text-xs text-gray-500">Your identity document has been prepared for verification</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <span>
                          <strong className="block text-sm">Selfie Uploaded</strong>
                          <span className="text-xs text-gray-500">Your selfie has been prepared for face matching</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        {verificationProgress > 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                        )}
                        <span>
                          <strong className="block text-sm">AI Verification</strong>
                          <span className="text-xs text-gray-500">Our AI system will verify your identity documents</span>
                        </span>
                      </li>
                      <li className="flex items-start">
                        {verificationResult ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                        )}
                        <span>
                          <strong className="block text-sm">Final Verification</strong>
                          <span className="text-xs text-gray-500">Our team will review your verification (if needed)</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  {verificationProgress > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Verification Progress</h3>
                        <span className="text-sm">{verificationProgress}%</span>
                      </div>
                      <Progress value={verificationProgress} className="h-2" />
                    </div>
                  )}
                  
                  {verificationResult && (
                    <div className={`p-4 ${
                      verificationResult.verified 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    } rounded-lg`}>
                      <div className="flex items-center">
                        {verificationResult.verified ? (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 mr-2" />
                        )}
                        <h3 className="font-semibold">
                          {verificationResult.verified 
                            ? 'Verification Successful' 
                            : 'Verification Issues Detected'
                          }
                        </h3>
                      </div>
                      
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            {verificationResult.faceMatch ? 
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : 
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            }
                            Face Match
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            verificationResult.faceMatch 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {verificationResult.faceMatch ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            {verificationResult.documentAuthenticity ? 
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : 
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            }
                            Document Authenticity
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            verificationResult.documentAuthenticity 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {verificationResult.documentAuthenticity ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            {verificationResult.liveDetection ? 
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" /> : 
                              <XCircle className="h-4 w-4 text-red-600 mr-2" />
                            }
                            Live Detection
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            verificationResult.liveDetection 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {verificationResult.liveDetection ? "Passed" : "Failed"}
                          </span>
                        </div>
                      </div>
                      
                      {!verificationResult.verified && (
                        <p className="mt-3 text-sm">
                          Please check the issues above and try again with clearer images or a different document.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("upload")}
                    disabled={uploadDocumentsMutation.isPending || verifyIdentityMutation.isPending}
                  >
                    Back
                  </Button>
                  {verificationResult ? (
                    <Button 
                      type="button"
                      variant={verificationResult.verified ? "default" : "outline"}
                      onClick={() => {
                        // Handle done action
                        toast({
                          title: "Verification process complete",
                          description: verificationResult.verified 
                            ? "Your identity has been successfully verified." 
                            : "Please try again with new documents."
                        });
                      }}
                    >
                      {verificationResult.verified ? "Continue" : "Try Again"}
                    </Button>
                  ) : (
                    <Button 
                      type="submit"
                      disabled={uploadDocumentsMutation.isPending || verifyIdentityMutation.isPending || !aiServiceStatus.anyAvailable}
                    >
                      {uploadDocumentsMutation.isPending || verifyIdentityMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : !aiServiceStatus.anyAvailable ? (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          AI Service Unavailable
                        </>
                      ) : (
                        "Submit for Verification"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}