import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Types for Right to Rent verification
interface RightToRentStatus {
  verified: boolean;
  status?: string;
  checkDate?: Date;
  expiryDate?: Date;
  nationality?: string;
  certificate?: {
    id: number;
    url: string;
  };
}

// Helper function to safely access properties with default values
function getSafeValue<T>(obj: any, property: string, defaultValue: T): T {
  if (!obj || obj[property] === undefined || obj[property] === null) {
    return defaultValue;
  }
  return obj[property] as T;
}
import DashboardLayout from "@/components/layout/DashboardLayout";
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
  XCircle,
  Calendar,
  Flag
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import IDDocumentVerification from "@/components/dashboard/IDDocumentVerification";

// Validation schema for right to rent verification form
const rightToRentDetailsSchema = z.object({
  nationality: z.string().min(1, "Nationality is required"),
  immigrationStatus: z.string().min(1, "Immigration status is required"),
  rightToRentExpiryDate: z.date().optional(),
  shareCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue",
  }),
});

// Main component props
interface RightToRentVerificationProps {
  userId?: number;
  isAdmin?: boolean;
}

export default function RightToRentVerification({
  userId,
  isAdmin = false
}: RightToRentVerificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(1);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [idVerificationComplete, setIdVerificationComplete] = useState(false);

  // Setup form for Right to Rent details
  const form = useForm<z.infer<typeof rightToRentDetailsSchema>>({
    resolver: zodResolver(rightToRentDetailsSchema),
    defaultValues: {
      nationality: "",
      immigrationStatus: "",
      acceptTerms: false,
    }
  });

  // Fetch user's Right to Rent status if available
  const { data: rightToRentStatus, isLoading: isLoadingStatus } = useQuery<RightToRentStatus>({
    queryKey: ['/api/right-to-rent/status'],
    enabled: !!userId,
  });

  // Submit Right to Rent details
  const rightToRentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rightToRentDetailsSchema>) => {
      const response = await apiRequest("POST", "/api/right-to-rent/verify", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Right to Rent details submitted",
        description: "Your information has been successfully verified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/right-to-rent/status'] });
      setVerificationComplete(true);
      setActiveStep(3);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit Right to Rent details. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof rightToRentDetailsSchema>) => {
    rightToRentMutation.mutate(values);
  };

  // Determine if the next step should be enabled
  const canProceedToNextStep = () => {
    if (activeStep === 1) {
      return idVerificationComplete;
    } else if (activeStep === 2) {
      return form.formState.isValid;
    }
    return false;
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Handle ID verification completion
  const handleIdVerificationComplete = () => {
    setIdVerificationComplete(true);
    toast({
      title: "ID verification complete",
      description: "Your identity has been successfully verified.",
    });
  };

  // If status is already verified, show the verified status
  if (getSafeValue(rightToRentStatus, 'verified', false)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Right to Rent Verified
          </CardTitle>
          <CardDescription>
            Your Right to Rent status has been verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Verification Complete</AlertTitle>
            <AlertDescription>
              Your Right to Rent has been verified. This allows you to legally rent property in the UK.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Verification Details</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Verified
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified On:</span>
                  <span>{getSafeValue(rightToRentStatus, 'checkDate', null) ? format(new Date(getSafeValue(rightToRentStatus, 'checkDate', new Date())), 'dd MMM yyyy') : 'Unknown'}</span>
                </div>
                {getSafeValue(rightToRentStatus, 'expiryDate', null) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid Until:</span>
                    <span>{format(new Date(getSafeValue(rightToRentStatus, 'expiryDate', new Date())), 'dd MMM yyyy')}</span>
                  </div>
                )}
                {getSafeValue(rightToRentStatus, 'nationality', null) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nationality:</span>
                    <span className="flex items-center">
                      {getSafeValue(rightToRentStatus, 'nationality', '')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">What This Means</h3>
              <div className="bg-gray-50 p-4 rounded-md space-y-3 text-sm">
                <p className="text-gray-700">
                  Your Right to Rent verification confirms you can legally rent property in the UK under the Immigration Act 2014.
                </p>
                {getSafeValue(rightToRentStatus, 'status', null) === 'time-limited' && (
                  <Alert className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Time-Limited Right to Rent</AlertTitle>
                    <AlertDescription>
                      Your Right to Rent is valid until {getSafeValue(rightToRentStatus, 'expiryDate', null) 
                        ? format(new Date(getSafeValue(rightToRentStatus, 'expiryDate', new Date())), 'dd MMM yyyy') 
                        : 'the specified date'}. 
                      You will need to renew your verification before this date.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Right to Rent Verification</h1>
        <p className="text-gray-500">
          Complete your verification to comply with UK Right to Rent legislation
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className={`flex items-center ${activeStep === 1 ? "text-primary font-medium" : "text-gray-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              activeStep === 1 
                ? "bg-primary text-white" 
                : activeStep > 1 
                  ? "bg-green-500 text-white" 
                  : "bg-gray-100 text-gray-500"
            }`}>
              {activeStep > 1 ? <Check className="h-4 w-4" /> : 1}
            </div>
            <span>ID Verification</span>
          </div>
          <div className={`h-0.5 flex-grow mx-2 mt-4 ${activeStep > 1 ? "bg-primary" : "bg-gray-200"}`}></div>
          <div className={`flex items-center ${activeStep === 2 ? "text-primary font-medium" : "text-gray-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              activeStep === 2 
                ? "bg-primary text-white" 
                : activeStep > 2 
                  ? "bg-green-500 text-white" 
                  : "bg-gray-100 text-gray-500"
            }`}>
              {activeStep > 2 ? <Check className="h-4 w-4" /> : 2}
            </div>
            <span>Right to Rent Details</span>
          </div>
          <div className={`h-0.5 flex-grow mx-2 mt-4 ${activeStep > 2 ? "bg-primary" : "bg-gray-200"}`}></div>
          <div className={`flex items-center ${activeStep === 3 ? "text-primary font-medium" : "text-gray-500"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              activeStep === 3 
                ? "bg-primary text-white" 
                : "bg-gray-100 text-gray-500"
            }`}>
              {activeStep > 3 ? <Check className="h-4 w-4" /> : 3}
            </div>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
      
      {/* Step content */}
      <div className="border rounded-lg p-6">
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Step 1: Identity Verification</h2>
              <p className="text-gray-600 mb-4">
                Verify your identity with a government-issued ID document and selfie
              </p>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Important Information</AlertTitle>
              <AlertDescription>
                UK law requires landlords to verify that all tenants have the right to rent property in the UK.
                The information you provide will be used to check your immigration status.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6">
              <IDDocumentVerification
                userId={userId}
                verificationType="tenant"
                isAdmin={isAdmin}
              />
            </div>
            
            {/* Mock completion for demo - in a real implementation, this would be triggered by the actual verification */}
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={handleIdVerificationComplete}
                className="mr-4"
              >
                Complete ID Verification (Demo)
              </Button>
            </div>
          </div>
        )}
        
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Step 2: Right to Rent Details</h2>
              <p className="text-gray-600 mb-4">
                Provide additional information to verify your right to rent in the UK
              </p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="ie">Ireland</SelectItem>
                          <SelectItem value="eu">EU Citizen (settled status)</SelectItem>
                          <SelectItem value="other_visa">Non-EU with Visa</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select your nationality as it appears on your passport or ID card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="immigrationStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immigration Status</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="unlimited" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Unlimited right to rent (UK/Irish citizen, settled status, or indefinite leave)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="limited" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Time-limited right to rent (visa, pre-settled status)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="checking_service" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Using Home Office Checking Service
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("immigrationStatus") === "limited" && (
                  <FormField
                    control={form.control}
                    name="rightToRentExpiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Right to Rent Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The date your right to rent in the UK expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("immigrationStatus") === "checking_service" && (
                  <FormField
                    control={form.control}
                    name="shareCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Office Share Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1234-5678-9012" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the share code from the Home Office checking service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Right to Rent Declaration
                        </FormLabel>
                        <FormDescription>
                          I confirm that the information I have provided is accurate and complete. 
                          I understand that providing false information may lead to criminal prosecution 
                          under the Immigration Act 2014.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        )}
        
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 inline-flex mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Verification Complete</h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Your Right to Rent verification has been submitted successfully. Your status will be updated once the verification process is complete.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto text-left">
                <h3 className="font-medium mb-3">Verification Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID Verification:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Right to Rent Status:</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submitted On:</span>
                    <span>{format(new Date(), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        {activeStep < 3 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={activeStep === 1}
            >
              Back
            </Button>
            
            <Button
              onClick={activeStep === 2 ? form.handleSubmit(onSubmit) : handleNext}
              disabled={!canProceedToNextStep() || (activeStep === 2 && (rightToRentMutation.isPending || !rightToRentStatus))}
            >
              {activeStep === 2 ? (
                rightToRentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )
              ) : (
                "Next"
              )}
            </Button>
          </div>
        )}
        
        {activeStep === 3 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
      
      {/* Explanatory information */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Info className="h-5 w-5 mr-2 text-blue-500" />
            About Right to Rent
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="mb-4">
            Under the Immigration Act 2014, landlords and letting agents in England must check that all tenants 
            have the legal right to rent property in the UK before the start of a tenancy.
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2">
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-gray-600">
                Your identity document and personal information will be verified against government databases
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2">
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-gray-600">
                This verification is legally required for all tenancy agreements in England
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2">
                <Shield className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-gray-600">
                All data is processed securely and in compliance with UK data protection laws
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}