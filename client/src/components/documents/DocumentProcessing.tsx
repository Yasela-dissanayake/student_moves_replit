import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, AlertTriangle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DocumentProcessingProps {
  onDocumentSaved?: (documentId: string) => void;
  defaultPropertyId?: number;
  defaultTenantId?: number;
}

interface ExtractedDocumentInfo {
  documentType: string;
  title: string;
  extractedText: string;
  keyDetails: any;
  confidence: number;
}

interface StructuredDocument {
  title: string;
  content: string;
  documentType: string;
  keyDetails: any;
  recommendation?: string;
}

const documentFormSchema = z.object({
  title: z.string().min(3, { message: "Title is required and must be at least 3 characters" }),
  documentType: z.string().min(1, { message: "Document type is required" }),
  content: z.string().optional(),
  propertyId: z.number().optional(),
  tenantId: z.number().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

const DocumentProcessing: React.FC<DocumentProcessingProps> = ({ 
  onDocumentSaved,
  defaultPropertyId,
  defaultTenantId 
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedDocumentInfo | null>(null);
  const [structuredDocument, setStructuredDocument] = useState<StructuredDocument | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      documentType: "",
      content: "",
      propertyId: defaultPropertyId,
      tenantId: defaultTenantId,
    },
  });

  const extractDocument = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/documents/extract", formData);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setExtractedInfo(data);
      form.setValue("title", data.title || "");
      form.setValue("documentType", data.documentType || "");
      form.setValue("content", data.extractedText || "");
      setActiveTab("review");
      toast({
        title: "Document extracted successfully",
        description: "The document has been processed. Please review the extracted information.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to extract document",
        description: error.message || "Something went wrong while processing your document",
        variant: "destructive",
      });
    }
  });

  const structureDocument = useMutation({
    mutationFn: async (data: { extractedText: string, documentType: string }) => {
      const response = await apiRequest("POST", "/api/documents/structure", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setStructuredDocument(data);
      setActiveTab("finalize");
      toast({
        title: "Document structured successfully",
        description: "The document has been structured. Please review before saving.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to structure document",
        description: error.message || "Something went wrong while structuring your document",
        variant: "destructive",
      });
    }
  });

  const saveDocument = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const documentData = {
        ...data,
        propertyId: data.propertyId || undefined,
        tenantId: data.tenantId || undefined,
        content: structuredDocument?.content || data.content,
        keyDetails: structuredDocument?.keyDetails || extractedInfo?.keyDetails || {},
      };
      
      const response = await apiRequest("POST", "/api/documents/save", documentData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document saved",
        description: "Your document has been saved successfully",
      });
      
      if (onDocumentSaved) {
        onDocumentSaved(data.id);
      }
      
      // Reset form and state
      form.reset();
      setFile(null);
      setExtractedInfo(null);
      setStructuredDocument(null);
      setActiveTab("upload");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save document",
        description: error.message || "Something went wrong while saving your document",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (defaultPropertyId) {
        formData.append('propertyId', defaultPropertyId.toString());
      }
      
      if (defaultTenantId) {
        formData.append('tenantId', defaultTenantId.toString());
      }
      
      await extractDocument.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewSubmit = (data: DocumentFormValues) => {
    structureDocument.mutate({
      extractedText: data.content || "",
      documentType: data.documentType,
    });
  };

  const handleFinalSubmit = (data: DocumentFormValues) => {
    saveDocument.mutate(data);
  };

  const documentTypes = [
    { value: "tenancy_agreement", label: "Tenancy Agreement" },
    { value: "property_inventory", label: "Property Inventory" },
    { value: "gas_safety_certificate", label: "Gas Safety Certificate" },
    { value: "epc", label: "Energy Performance Certificate" },
    { value: "right_to_rent", label: "Right to Rent" },
    { value: "hmo_license", label: "HMO License" },
    { value: "deposit_protection", label: "Deposit Protection" },
    { value: "maintenance_request", label: "Maintenance Request" },
    { value: "invoice", label: "Invoice" },
    { value: "receipt", label: "Receipt" },
    { value: "other", label: "Other" },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
        <TabsTrigger value="upload" disabled={isUploading}>Upload</TabsTrigger>
        <TabsTrigger value="review" disabled={!extractedInfo}>Review & Edit</TabsTrigger>
        <TabsTrigger value="finalize" disabled={!structuredDocument}>Finalize</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload a document to extract information using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="document-upload" 
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 mb-3 text-primary" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{file.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, DOCX, JPEG, PNG, TXT (MAX. 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input 
                  id="document-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                />
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setFile(null);
              document.getElementById('document-upload')?.dispatchEvent(new MouseEvent('click'));
            }}>
              {file ? "Change File" : "Select File"}
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading || extractDocument.isPending}>
              {(isUploading || extractDocument.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extract Document
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="review">
        <Card>
          <CardHeader>
            <CardTitle>Review & Edit Document</CardTitle>
            <CardDescription>
              Edit the extracted information before processing
            </CardDescription>
          </CardHeader>
          {extractedInfo && (
            <>
              {extractedInfo.confidence < 0.7 && (
                <div className="px-6">
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Low Confidence Detection</AlertTitle>
                    <AlertDescription>
                      The AI confidence in this extraction is low ({Math.round(extractedInfo.confidence * 100)}%). 
                      Please review the information carefully.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReviewSubmit)}>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter document title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Document content"
                              className="min-h-[300px] font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("upload")}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={structureDocument.isPending}
                    >
                      {structureDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Structure Document
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </>
          )}
        </Card>
      </TabsContent>
      
      <TabsContent value="finalize">
        <Card>
          <CardHeader>
            <CardTitle>Finalize Document</CardTitle>
            <CardDescription>
              Review the structured document before saving
            </CardDescription>
          </CardHeader>
          {structuredDocument && (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFinalSubmit)}>
                  <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-md">
                      <Alert variant="default" className="mb-4 border-green-200 bg-green-50">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Document Structured Successfully</AlertTitle>
                        <AlertDescription>
                          The AI has structured your document into a standardized format.
                          {structuredDocument.recommendation && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              <strong>AI Recommendation:</strong> {structuredDocument.recommendation}
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="prose prose-sm max-w-none mt-4">
                        <h3 className="text-lg font-semibold">{structuredDocument.title}</h3>
                        <div className="whitespace-pre-wrap font-mono text-sm">
                          {structuredDocument.content}
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("review")}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={saveDocument.isPending}
                    >
                      {saveDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Document
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DocumentProcessing;