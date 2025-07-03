import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { AlertCircle, FileText, Upload, Check, BadgeCheck, Copy, ZoomIn } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface AnalysisResult {
  documentType: string;
  extractedText: string;
  structuredData: Record<string, any>;
  confidence: number;
  warnings?: string[];
  enhancedAnalysis?: any;
}

const DocumentImageAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [extractionMethod, setExtractionMethod] = useState<string>("general");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [showImageDialog, setShowImageDialog] = useState<boolean>(false);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if file is an image
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file to analyze",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (documentType) {
        formData.append('documentType', documentType);
      }
      
      formData.append('extractionMethod', extractionMethod);
      
      if (customPrompt) {
        formData.append('prompt', customPrompt);
      }
      
      const response = await apiRequest("POST", "/api/documents/analyze-image", formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze document image");
      }
      
      const analysisResult = await response.json();
      setResult(analysisResult);
      setActiveTab("results");
      
      toast({
        title: "Analysis complete",
        description: "Document image analyzed successfully",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "An error occurred while analyzing the document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      variant: "default",
      duration: 2000
    });
  };

  const renderStructuredData = (data: Record<string, any>) => {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border rounded p-2">
            <div className="font-medium text-sm text-primary">{key}</div>
            <div className="text-sm">
              {typeof value === 'object' && value !== null ? (
                <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-20">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span>{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={20} />
          Document Image Analysis
        </CardTitle>
        <CardDescription>
          Analyze document images to extract text and structured information using AI
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Document Upload</TabsTrigger>
            <TabsTrigger value="options">Analysis Options</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Analysis Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 relative">
              <Input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                accept="image/*"
              />
              <div className="flex flex-col items-center text-center pointer-events-none">
                <Upload size={40} className="text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Click or drop file</h3>
                <p className="text-sm text-muted-foreground">
                  Supports JPEG, PNG, GIF image formats
                </p>
              </div>
            </div>
            
            {imagePreview && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Image Preview</Label>
                <div className="relative border rounded-md overflow-hidden max-h-60">
                  <img 
                    src={imagePreview} 
                    alt="Document preview" 
                    className="w-full object-contain"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80"
                    onClick={() => setShowImageDialog(true)}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </div>
              </div>
            )}
            
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogContent className="max-w-4xl h-[90vh] flex items-center justify-center p-0">
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Document large preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type (Optional)</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-detect</SelectItem>
                    <SelectItem value="tenancy_agreement">Tenancy Agreement</SelectItem>
                    <SelectItem value="lease_contract">Lease Contract</SelectItem>
                    <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                    <SelectItem value="property_inspection">Property Inspection</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="deposit_certificate">Deposit Certificate</SelectItem>
                    <SelectItem value="reference_letter">Reference Letter</SelectItem>
                    <SelectItem value="right_to_rent">Right to Rent</SelectItem>
                    <SelectItem value="guarantor_form">Guarantor Form</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="utility_bill">Utility Bill</SelectItem>
                    <SelectItem value="epc_certificate">EPC Certificate</SelectItem>
                    <SelectItem value="other">Other Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="extractionMethod">Extraction Method</Label>
                <Select value={extractionMethod} onValueChange={setExtractionMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select extraction method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General (Default)</SelectItem>
                    <SelectItem value="ocr">Text Extraction (OCR)</SelectItem>
                    <SelectItem value="form">Form Fields</SelectItem>
                    <SelectItem value="receipt">Receipt/Invoice</SelectItem>
                    <SelectItem value="id">ID Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customPrompt">Custom Analysis Prompt (Optional)</Label>
              <Textarea
                id="customPrompt"
                placeholder="Provide specific instructions for the analysis, e.g. 'Extract tenant names and addresses from this document'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-20"
              />
              <p className="text-xs text-muted-foreground">
                Custom prompts can help guide the AI to extract specific information from your document.
              </p>
            </div>
            
            <Alert className="bg-muted/50 text-foreground border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Tips</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground">
                For best results, ensure your document image is clear, well-lit, and properly oriented.
                If you know the document type, selecting it will improve accuracy. Custom prompts can
                help when you need to extract specific details.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {result && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BadgeCheck className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Analysis Results</h3>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="mr-2">Confidence: </span>
                    <span className={`font-medium ${result.confidence > 0.7 ? 'text-green-500' : result.confidence > 0.4 ? 'text-amber-500' : 'text-red-500'}`}>
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Document Type</Label>
                    <div className="p-2 bg-muted rounded flex items-center justify-between">
                      <span>{result.documentType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Extracted Text</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => copyToClipboard(result.extractedText)}
                    >
                      <Copy size={14} className="mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded max-h-60 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{result.extractedText}</pre>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Structured Data</Label>
                  <div className="p-3 bg-muted rounded max-h-80 overflow-y-auto">
                    {renderStructuredData(result.structuredData)}
                  </div>
                </div>
                
                {result.warnings && result.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 text-sm">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {result.enhancedAnalysis && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Enhanced Analysis Results</Label>
                    <div className="p-3 bg-muted rounded max-h-80 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {typeof result.enhancedAnalysis === 'object' 
                          ? JSON.stringify(result.enhancedAnalysis, null, 2)
                          : result.enhancedAnalysis}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setImagePreview(null);
            setResult(null);
            setActiveTab("preview");
          }}
        >
          Reset
        </Button>
        
        <Button
          variant="default"
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="flex items-center"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              Analyze Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentImageAnalysis;