/**
 * Property Image Analyzer Component
 * Uses OpenAI Vision API to analyze property images
 */

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ImageIcon,
  LoaderIcon,
  Copy,
  CheckCircle,
  AlertTriangleIcon,
  AlertCircle,
  UploadIcon,
  RefreshCwIcon,
  Sparkles,
  BuildingIcon,
  HomeIcon,
  CameraIcon,
  SearchIcon,
  BrushIcon,
  ListIcon,
  RulerIcon,
  LampIcon,
  ShieldCheckIcon,
  AccessibilityIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AnalysisMode = 
  | "general" 
  | "features" 
  | "condition" 
  | "staging" 
  | "value" 
  | "room-measurements" 
  | "lighting-analysis"
  | "safety-compliance"
  | "accessibility"
  | "risk-assessment"
  | "custom";

interface AnalysisResult {
  id: string;
  imageUrl: string;
  content: string;
  timestamp: Date;
  mode: AnalysisMode;
  customPrompt?: string;
}

interface PropertyImageAnalyzerProps {
  apiUrl?: (endpoint: string) => string;
  useEnhancedMode?: boolean;
}

export function PropertyImageAnalyzer({ apiUrl = (url: string) => url, useEnhancedMode = false }: PropertyImageAnalyzerProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode>("general");
  const [customPrompt, setCustomPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMockImplementation, setIsMockImplementation] = useState(false);
  
  // Check OpenAI status to see if we're using mock implementation
  useEffect(() => {
    const checkMockStatus = async () => {
      try {
        // Use apiUrl to support enhanced mode
        const response = await fetch(apiUrl('/api/openai/status'));
        if (response.ok) {
          const data = await response.json();
          setIsMockImplementation(data.usingMock === true);
        }
      } catch (error) {
        console.error('Error checking mock status:', error);
      }
    };
    
    checkMockStatus();
  }, [apiUrl]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Update file state
      setFile(selectedFile);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Clear previous analysis
      setAnalysisResult("");
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [toast]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files?.[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!droppedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
      const objectUrl = URL.createObjectURL(droppedFile);
      setPreviewUrl(objectUrl);
      setAnalysisResult("");
    }
  }, [toast]);

  // Prevent default for drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Reset the current image
  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysisResult("");
    setCustomPrompt("");
  }, []);

  // Get prompt based on analysis mode
  const getPromptForMode = useCallback((mode: AnalysisMode, customText?: string): string => {
    switch (mode) {
      case "general":
        return "Analyze this property image in detail. What are the key features visible, overall style, and notable aspects of this space?";
      case "features":
        return "Identify all features visible in this property image. List all amenities, fixtures, and notable elements with bullet points.";
      case "condition":
        return "Assess the condition of this property based on the image. Identify any visible maintenance issues, wear and tear, or areas that may need attention.";
      case "staging":
        return "Provide staging suggestions for this property image. What improvements or changes would make this space more appealing to potential tenants or buyers?";
      case "value":
        return "Based on this property image, what elements might positively or negatively impact the property's value or rental potential?";
      case "room-measurements":
        return "Analyze this property image and provide estimated room dimensions. Give your best approximation of room size based on visible furniture, fixtures, and architectural elements.";
      case "lighting-analysis":
        return "Analyze the lighting conditions in this property image. Identify natural light sources, artificial lighting, and suggest improvements to enhance the lighting quality for better ambiance and functionality.";
      case "safety-compliance":
        return "Evaluate this property image for visible safety and compliance issues. Identify any potential hazards, accessibility concerns, or items that might not meet standard housing regulations.";
      case "accessibility":
        return "Assess this property image for accessibility features and potential barriers. Identify elements that support or hinder accessibility for people with mobility, visual, or other impairments.";
      case "risk-assessment":
        return "Perform a detailed risk assessment of this property image. Identify potential hazards, compliance issues, and safety concerns. Categorize risks by severity (high/medium/low) and provide recommendations for remediation.";
      case "custom":
        return customText || "Analyze this property image.";
      default:
        return "Analyze this property image in detail.";
    }
  }, []);

  // Analyze image
  const analyzeImage = useCallback(async () => {
    if (!file) {
      toast({
        title: "No image selected",
        description: "Please select an image to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0);
    
    try {
      const prompt = getPromptForMode(
        analysisModes, 
        analysisModes === "custom" ? customPrompt : undefined
      );
      
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
      
      // Simulate upload progress while we convert the image
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + (100 - prev) * 0.1;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
      
      // Get the base64 string
      const base64 = await base64Promise;
      
      // Send to server - use apiUrl to support enhanced mode
      const response = await fetch(apiUrl("/api/openai/analyze-image"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "analyzeImage",
          base64Image: base64,
          prompt
        }),
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.result) {
        setAnalysisResult(result.result);
        
        // Add to history
        const newAnalysis: AnalysisResult = {
          id: Date.now().toString(),
          imageUrl: previewUrl!,
          content: result.result,
          timestamp: new Date(),
          mode: analysisModes,
          customPrompt: analysisModes === "custom" ? customPrompt : undefined,
        };
        
        setAnalysisHistory([newAnalysis, ...analysisHistory]);
        
        toast({
          title: "Analysis Complete",
          description: "Image analysis has been completed successfully.",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Error",
        description: "An error occurred while analyzing the image.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  }, [file, analysisModes, customPrompt, previewUrl, analysisHistory, toast, getPromptForMode]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        toast({
          title: "Copied!",
          description: "Analysis copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Error copying to clipboard:", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    );
  }, [toast]);

  // Get icon for analysis mode
  const getModeIcon = useCallback((mode: AnalysisMode) => {
    switch (mode) {
      case "general":
        return <SearchIcon className="h-4 w-4" />;
      case "features":
        return <ListIcon className="h-4 w-4" />;
      case "condition":
        return <HomeIcon className="h-4 w-4" />;
      case "staging":
        return <BrushIcon className="h-4 w-4" />;
      case "value":
        return <BuildingIcon className="h-4 w-4" />;
      case "room-measurements":
        return <RulerIcon className="h-4 w-4" />;
      case "lighting-analysis":
        return <LampIcon className="h-4 w-4" />;
      case "safety-compliance":
        return <ShieldCheckIcon className="h-4 w-4" />;
      case "accessibility":
        return <AccessibilityIcon className="h-4 w-4" />;
      case "risk-assessment":
        return <AlertTriangleIcon className="h-4 w-4" />;
      case "custom":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  }, []);

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze">Analyze Image</TabsTrigger>
          <TabsTrigger value="history">
            History ({analysisHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze">
          <div className="space-y-8">
            {isMockImplementation && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <span className="font-medium">Mock implementation active:</span> Using local AI simulation for image analysis. Results are for demonstration purposes only.
                </AlertDescription>
              </Alert>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CameraIcon className="mr-2 h-5 w-5" />
                  Property Image Analysis
                  {useEnhancedMode && (
                    <Badge variant="outline" className="ml-2 text-primary border-primary font-semibold">
                      Enhanced Mode
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Upload a property image to analyze features, condition, and more using AI.
                  {useEnhancedMode 
                    ? " Using advanced OpenAI implementation for more detailed, accurate analysis."
                    : isMockImplementation 
                      ? " Using simulated AI responses for demonstration purposes."
                      : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!previewUrl ? (
                  <div
                    className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm font-medium mb-1">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, WEBP (max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-md overflow-hidden border">
                      <img
                        src={previewUrl}
                        alt="Property preview"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute bottom-2 right-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleReset}
                          className="opacity-90"
                        >
                          <RefreshCwIcon className="h-4 w-4 mr-1" />
                          Change
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="analysis-mode">Analysis Mode</Label>
                        <Select
                          value={analysisModes}
                          onValueChange={(value) => setAnalysisModes(value as AnalysisMode)}
                        >
                          <SelectTrigger id="analysis-mode">
                            <SelectValue placeholder="Select analysis mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">
                              <div className="flex items-center">
                                <SearchIcon className="h-4 w-4 mr-2" />
                                General Analysis
                              </div>
                            </SelectItem>
                            <SelectItem value="features">
                              <div className="flex items-center">
                                <ListIcon className="h-4 w-4 mr-2" />
                                Feature Identification
                              </div>
                            </SelectItem>
                            <SelectItem value="condition">
                              <div className="flex items-center">
                                <HomeIcon className="h-4 w-4 mr-2" />
                                Condition Assessment
                              </div>
                            </SelectItem>
                            <SelectItem value="staging">
                              <div className="flex items-center">
                                <BrushIcon className="h-4 w-4 mr-2" />
                                Staging Suggestions
                              </div>
                            </SelectItem>
                            <SelectItem value="value">
                              <div className="flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-2" />
                                Value Factors
                              </div>
                            </SelectItem>
                            <SelectItem value="room-measurements">
                              <div className="flex items-center">
                                <RulerIcon className="h-4 w-4 mr-2" />
                                Room Measurements
                              </div>
                            </SelectItem>
                            <SelectItem value="lighting-analysis">
                              <div className="flex items-center">
                                <LampIcon className="h-4 w-4 mr-2" />
                                Lighting Analysis
                              </div>
                            </SelectItem>
                            <SelectItem value="safety-compliance">
                              <div className="flex items-center">
                                <ShieldCheckIcon className="h-4 w-4 mr-2" />
                                Safety Compliance
                              </div>
                            </SelectItem>
                            <SelectItem value="accessibility">
                              <div className="flex items-center">
                                <AccessibilityIcon className="h-4 w-4 mr-2" />
                                Accessibility Features
                              </div>
                            </SelectItem>
                            <SelectItem value="risk-assessment">
                              <div className="flex items-center">
                                <AlertTriangleIcon className="h-4 w-4 mr-2" />
                                Risk Assessment
                              </div>
                            </SelectItem>
                            <SelectItem value="custom">
                              <div className="flex items-center">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Custom Prompt
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {analysisModes === "custom" && (
                        <div className="space-y-2">
                          <Label htmlFor="custom-prompt">Custom Prompt</Label>
                          <Textarea
                            id="custom-prompt"
                            placeholder="Enter your custom prompt for image analysis"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                      )}

                      <Button
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        {isAnalyzing ? (
                          <>
                            <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing Image...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze with AI
                          </>
                        )}
                      </Button>

                      {isAnalyzing && (
                        <div className="space-y-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-center text-gray-500">
                            Uploading and analyzing image...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysisResult && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-primary" />
                      Analysis Results
                      {useEnhancedMode && (
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                          ENHANCED RESPONSE
                        </Badge>
                      )}
                      {isMockImplementation && !useEnhancedMode && (
                        <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 text-xs">
                          SIMULATED RESPONSE
                        </Badge>
                      )}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {analysisModes.charAt(0).toUpperCase() + analysisModes.slice(1)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {useEnhancedMode 
                      ? "Enhanced AI-powered analysis using advanced OpenAI models"
                      : "AI-powered analysis of your property image"}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="rounded-md bg-gray-50 p-4 text-sm whitespace-pre-line">
                    {analysisResult}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleReset()}>
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    New Analysis
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(analysisResult)}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Results
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            {analysisHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No Analysis History</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-md">
                    Your image analysis history will appear here once you've analyzed some property images.
                  </p>
                  <Button variant="outline">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Analyze New Image
                  </Button>
                </CardContent>
              </Card>
            ) : (
              analysisHistory.map((analysis) => (
                <Card key={analysis.id} className="overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3 bg-gray-100">
                      <img
                        src={analysis.imageUrl}
                        alt="Property"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center">
                            {getModeIcon(analysis.mode)}
                            <span className="ml-2">
                              {analysis.mode.charAt(0).toUpperCase() + analysis.mode.slice(1)} Analysis
                            </span>
                            {useEnhancedMode && (
                              <Badge variant="outline" className="ml-2 text-green-600 border-green-600 text-xs">
                                ENHANCED
                              </Badge>
                            )}
                            {isMockImplementation && !useEnhancedMode && (
                              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 text-xs">
                                SIMULATED
                              </Badge>
                            )}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {new Date(analysis.timestamp).toLocaleDateString()}
                          </Badge>
                        </div>
                        {analysis.customPrompt && (
                          <CardDescription className="text-xs italic mt-1">
                            "{analysis.customPrompt}"
                          </CardDescription>
                        )}
                      </CardHeader>
                      <Separator />
                      <CardContent className="text-sm h-48 overflow-y-auto pt-3">
                        <p className="whitespace-pre-line">{analysis.content}</p>
                      </CardContent>
                      <CardFooter className="border-t bg-gray-50 pt-3 pb-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => copyToClipboard(analysis.content)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}