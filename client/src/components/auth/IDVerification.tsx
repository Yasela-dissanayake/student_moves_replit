import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { File, Camera, Upload, AlertCircle, Check, X } from "lucide-react";
import { submitVerification } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  documentType: z.enum(["passport", "driving_license", "national_id"], {
    message: "Please select a document type",
  }),
  documentImage: z.instanceof(File, {
    message: "Please upload your ID document image",
  }),
  selfieImage: z.instanceof(File, {
    message: "Please upload your selfie image",
  }),
});

export default function IDVerification() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: "passport",
    },
  });
  
  const documentImageValue = form.watch("documentImage");
  const selfieImageValue = form.watch("selfieImage");
  
  const documentPreviewUrl = documentImageValue instanceof File 
    ? URL.createObjectURL(documentImageValue) 
    : null;
    
  const selfiePreviewUrl = selfieImageValue instanceof File 
    ? URL.createObjectURL(selfieImageValue) 
    : null;

  const handleDocumentUpload = () => {
    documentInputRef.current?.click();
  };

  const handleSelfieUpload = () => {
    selfieInputRef.current?.click();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("documentType", values.documentType);
      formData.append("documentImage", values.documentImage);
      formData.append("selfieImage", values.selfieImage);
      
      const response = await submitVerification(formData);
      
      setVerificationResult(response);
      
      toast({
        title: "Verification submitted",
        description: response.verificationResult.isMatch 
          ? "Your identity has been verified successfully."
          : "We couldn't verify your identity automatically. An admin will review your submission.",
        variant: response.verificationResult.isMatch ? "success" : "default",
      });
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || "Failed to verify identity. Please try again.");
      
      toast({
        title: "Verification failed",
        description: err.message || "There was a problem verifying your identity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Identity Verification</CardTitle>
        <CardDescription>
          Please upload your ID document and a selfie to verify your identity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {verificationResult ? (
          <div className="space-y-6">
            <Alert variant={verificationResult.verificationResult.isMatch ? "success" : "destructive"}>
              {verificationResult.verificationResult.isMatch ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {verificationResult.verificationResult.isMatch 
                  ? "Verification Successful" 
                  : "Verification Needs Review"}
              </AlertTitle>
              <AlertDescription>
                {verificationResult.verificationResult.message}
              </AlertDescription>
            </Alert>
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Document Information</h3>
              <dl className="grid grid-cols-2 gap-2">
                {verificationResult.documentInfo.name && (
                  <>
                    <dt className="text-gray-500">Name:</dt>
                    <dd>{verificationResult.documentInfo.name}</dd>
                  </>
                )}
                {verificationResult.documentInfo.dateOfBirth && (
                  <>
                    <dt className="text-gray-500">Date of Birth:</dt>
                    <dd>{verificationResult.documentInfo.dateOfBirth}</dd>
                  </>
                )}
                {verificationResult.documentInfo.documentNumber && (
                  <>
                    <dt className="text-gray-500">Document Number:</dt>
                    <dd>{verificationResult.documentInfo.documentNumber}</dd>
                  </>
                )}
                {verificationResult.documentInfo.nationality && (
                  <>
                    <dt className="text-gray-500">Nationality:</dt>
                    <dd>{verificationResult.documentInfo.nationality}</dd>
                  </>
                )}
              </dl>
            </div>
            
            <p className="text-center">
              You will be redirected to your dashboard in a few seconds...
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Document Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="passport" />
                          </FormControl>
                          <FormLabel className="font-normal">Passport</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="driving_license" />
                          </FormControl>
                          <FormLabel className="font-normal">Driving License</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="national_id" />
                          </FormControl>
                          <FormLabel className="font-normal">National ID Card</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="documentImage"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>ID Document Image</FormLabel>
                      <FormDescription>
                        Please upload a clear photo of your ID document
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          className="hidden"
                          ref={documentInputRef}
                        />
                      </FormControl>
                      
                      {documentPreviewUrl ? (
                        <div className="relative mt-2 rounded-md overflow-hidden border border-gray-200">
                          <img 
                            src={documentPreviewUrl} 
                            alt="ID document preview" 
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              onClick={handleDocumentUpload}
                            >
                              Change Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={handleDocumentUpload}
                          className="mt-2 border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                        >
                          <File className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload document</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG (max 10MB)</p>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="selfieImage"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Selfie Image</FormLabel>
                      <FormDescription>
                        Please upload a clear selfie of your face
                      </FormDescription>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          className="hidden"
                          ref={selfieInputRef}
                        />
                      </FormControl>
                      
                      {selfiePreviewUrl ? (
                        <div className="relative mt-2 rounded-md overflow-hidden border border-gray-200">
                          <img 
                            src={selfiePreviewUrl} 
                            alt="Selfie preview" 
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              onClick={handleSelfieUpload}
                            >
                              Change Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={handleSelfieUpload}
                          className="mt-2 border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                        >
                          <Camera className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload selfie</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG (max 10MB)</p>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-500">By submitting, you acknowledge that:</p>
                <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                  <li>Your ID documents will be processed securely for verification purposes only</li>
                  <li>We will compare your selfie with your ID document to verify your identity</li>
                  <li>This is required as per the UK Right to Rent legislation</li>
                </ul>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Submit for Verification"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
