import { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

// Document analysis mode options
const analysisOptions = [
  { value: "general", label: "General Analysis" },
  { value: "lease-analysis", label: "Lease Analysis" },
  { value: "compliance-check", label: "Compliance Check" },
  { value: "summarization", label: "Document Summary" },
  { value: "risk-assessment", label: "Risk Assessment" },
  { value: "right-to-rent", label: "Right to Rent Verification" },
  { value: "guarantor", label: "Guarantor Analysis" },
  { value: "contract-review", label: "Contract Review" },
  { value: "custom", label: "Custom Analysis" }
];

// Document types for information extraction
const documentTypes = [
  { value: "lease", label: "Lease / Tenancy Agreement" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "passport", label: "Passport" },
  { value: "id", label: "ID Document" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "reference_letter", label: "Reference Letter" },
  { value: "right_to_rent", label: "Right to Rent Document" },
  { value: "guarantor_agreement", label: "Guarantor Agreement" },
  { value: "other", label: "Other Document" }
];

export default function TestDocumentAnalysis() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<string>("general");
  const [documentType, setDocumentType] = useState<string>("lease");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [structuredResult, setStructuredResult] = useState<any>(null);
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL for the selected file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setFilePreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      
      // Reset results when new file is selected
      setResult("");
      setStructuredResult(null);
    }
  };
  
  // Convert file to base64
  const getBase64FromFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Analyze document
  const handleAnalyzeDocument = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No document selected",
        description: "Please select a document to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('analysisMode', analysisMode);
      if (analysisMode === 'custom' && customPrompt) {
        formData.append('customPrompt', customPrompt);
      }
      
      const response = await fetch('/api/openai-document/analyze-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const responseData = await response.json();
      setResult(responseData.result);
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Extract document information
  const handleExtractInfo = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No document selected",
        description: "Please select a document to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      
      const response = await fetch('/api/openai-document/extract-info', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const responseData = await response.json();
      setStructuredResult(responseData.result);
    } catch (error) {
      console.error("Error extracting document info:", error);
      toast({
        title: "Information extraction failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Verify right to rent document
  const handleVerifyRightToRent = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No document selected",
        description: "Please select a document to verify.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      
      const response = await fetch('/api/openai-document/verify-right-to-rent', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const responseData = await response.json();
      setStructuredResult(responseData.result);
    } catch (error) {
      console.error("Error verifying right to rent document:", error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/admin/test-ai-service">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to AI Services
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Document Analysis Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Select a document to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="document">Document</Label>
                  <Input 
                    id="document"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </div>
                
                {filePreview && (
                  <div className="mt-4">
                    <Label>Document Preview</Label>
                    <div className="border rounded-md overflow-hidden mt-1">
                      <img 
                        src={filePreview} 
                        alt="Document preview" 
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="analyze">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="analyze">Document Analysis</TabsTrigger>
              <TabsTrigger value="extract">Extract Information</TabsTrigger>
              <TabsTrigger value="verify">Right to Rent</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze">
              <Card>
                <CardHeader>
                  <CardTitle>Document Analysis</CardTitle>
                  <CardDescription>Analyze document content and structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAnalyzeDocument}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="analysisMode">Analysis Type</Label>
                        <Select 
                          value={analysisMode} 
                          onValueChange={setAnalysisMode}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select analysis type" />
                          </SelectTrigger>
                          <SelectContent>
                            {analysisOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {analysisMode === 'custom' && (
                        <div>
                          <Label htmlFor="customPrompt">Custom Analysis Prompt</Label>
                          <Textarea
                            id="customPrompt"
                            placeholder="Enter your custom analysis instructions..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-4 w-full"
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? <Spinner className="mr-2" /> : null}
                      {isProcessing ? "Analyzing..." : "Analyze Document"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {result && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                      {result}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="extract">
              <Card>
                <CardHeader>
                  <CardTitle>Extract Document Information</CardTitle>
                  <CardDescription>Extract structured information from documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExtractInfo}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="documentType">Document Type</Label>
                        <Select 
                          value={documentType} 
                          onValueChange={setDocumentType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-4 w-full"
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? <Spinner className="mr-2" /> : null}
                      {isProcessing ? "Extracting..." : "Extract Information"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {structuredResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Extracted Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-auto">
                      {JSON.stringify(structuredResult, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="verify">
              <Card>
                <CardHeader>
                  <CardTitle>Right to Rent Verification</CardTitle>
                  <CardDescription>Verify right to rent documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerifyRightToRent}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="documentType">Document Type</Label>
                        <Select 
                          value={documentType} 
                          onValueChange={setDocumentType}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="brp">Biometric Residence Permit</SelectItem>
                            <SelectItem value="visa">Visa</SelectItem>
                            <SelectItem value="immigration_status">Immigration Status Document</SelectItem>
                            <SelectItem value="id_card">National ID Card</SelectItem>
                            <SelectItem value="other">Other Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="mt-4 w-full"
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? <Spinner className="mr-2" /> : null}
                      {isProcessing ? "Verifying..." : "Verify Document"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {structuredResult && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Verification Results</CardTitle>
                    <CardDescription>
                      {structuredResult.isValid 
                        ? "✅ Document appears to be valid" 
                        : "❌ Document validation failed"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Document Type</h3>
                        <p className="text-muted-foreground">{structuredResult.documentType}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Compliance Status</h3>
                        <p className="text-muted-foreground">{structuredResult.complianceStatus}</p>
                      </div>
                      
                      {structuredResult.issues && structuredResult.issues.length > 0 && (
                        <div>
                          <h3 className="font-medium">Issues</h3>
                          <ul className="list-disc pl-5">
                            {structuredResult.issues.map((issue: string, index: number) => (
                              <li key={index} className="text-muted-foreground">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {structuredResult.recommendations && structuredResult.recommendations.length > 0 && (
                        <div>
                          <h3 className="font-medium">Recommendations</h3>
                          <ul className="list-disc pl-5">
                            {structuredResult.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-muted-foreground">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-medium">Extracted Information</h3>
                        <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                          {JSON.stringify(structuredResult.extractedInfo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}