/**
 * AI Tools Page
 * Provides access to OpenAI-powered tools for property description generation 
 * and other AI features.
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { 
  Sparkles, 
  KeyRound, 
  HomeIcon, 
  AlertCircle,
  Wand2Icon,
  ImageIcon,
  LanguagesIcon,
  ClipboardEditIcon,
  VideoIcon,
  LayoutPanelLeft,
  ZapIcon,
  Rocket
} from "lucide-react";

import { OpenAIKeyInput } from "@/components/OpenAIKeyInput";
import { PropertyDescriptionGenerator } from "@/components/PropertyDescriptionGenerator";
import { PropertyImageAnalyzer } from "@/components/PropertyImageAnalyzer";
import PropertyFloorPlanGenerator from "@/components/PropertyFloorPlanGenerator";
import PropertyDocumentAnalyzer from "@/components/PropertyDocumentAnalyzer";

// Feature card component for AI capabilities
interface FeatureCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  status: "available" | "coming" | "beta";
  onClick?: () => void;
}

const FeatureCard = ({ title, icon, description, status, onClick }: FeatureCardProps) => {
  const statusColors = {
    available: "bg-green-100 text-green-800",
    coming: "bg-blue-100 text-blue-800",
    beta: "bg-amber-100 text-amber-800",
  };

  const statusText = {
    available: "Available Now",
    coming: "Coming Soon",
    beta: "Beta",
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <span className="mr-2 text-primary">{icon}</span>
            {title}
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
            {statusText[status]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="text-sm text-gray-600">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          variant={status === "available" ? "default" : "outline"} 
          className="w-full" 
          disabled={status !== "available"}
          onClick={onClick}
        >
          {status === "available" ? "Use Tool" : "Notify Me"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export function AITools() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [useEnhancedMode, setUseEnhancedMode] = useState(false);
  
  // Utility function to add enhanced mode parameter to API requests
  const apiUrl = (endpoint: string) => {
    // Add enhanced mode parameter for API requests when enhanced mode is active
    if (useEnhancedMode && endpoint.indexOf('?') === -1) {
      return `${endpoint}?enhanced=true`;
    } else if (useEnhancedMode) {
      return `${endpoint}&enhanced=true`;
    }
    return endpoint;
  };
  const [aiServiceStatus, setAIServiceStatus] = useState<{
    openai: boolean;
    system: boolean;
    loading: boolean;
    isMockImplementation?: boolean;
    enhancedMode?: boolean;
  }>({
    openai: false,
    system: false,
    loading: true,
    isMockImplementation: false,
    enhancedMode: false,
  });

  // Check OpenAI API status
  const { data: statusData, isLoading: isStatusLoading } = useQuery<{available?: boolean}>({
    queryKey: ['/api/ai/status'],
    retry: false,
  });

  // Check direct OpenAI status also (this endpoint has the mock info)
  const { data: openaiStatusData } = useQuery<{status?: string, message?: string, usingMock?: boolean}>({
    queryKey: ['/api/openai/status'],
    retry: false,
  });
  
  // Check enhanced OpenAI status
  const { data: enhancedOpenAiStatusData } = useQuery<{status?: string, message?: string, usingMock?: boolean}>({
    queryKey: ['/api/openai-enhanced/status'],
    retry: false,
  });

  // Update AI service status when data loads
  useEffect(() => {
    if (!isStatusLoading && statusData) {
      setAIServiceStatus({
        openai: true,
        system: statusData.available || false,
        loading: false,
        isMockImplementation: false,
        enhancedMode: false,
      });
    } else if (!isStatusLoading) {
      setAIServiceStatus({
        ...aiServiceStatus,
        loading: false,
      });
    }
  }, [statusData, isStatusLoading]);
  
  // Check for mock implementation
  useEffect(() => {
    if (openaiStatusData) {
      setAIServiceStatus(prev => ({
        ...prev,
        isMockImplementation: openaiStatusData.usingMock === true
      }));
    }
  }, [openaiStatusData]);
  
  // Check for enhanced mode availability
  useEffect(() => {
    if (enhancedOpenAiStatusData) {
      setAIServiceStatus(prev => ({
        ...prev,
        enhancedMode: enhancedOpenAiStatusData.status === 'success'
      }));
    }
  }, [enhancedOpenAiStatusData]);
  
  // Load saved enhanced mode preference
  useEffect(() => {
    const savedPreference = sessionStorage.getItem('aitools_enhanced_mode');
    if (savedPreference === 'true') {
      setUseEnhancedMode(true);
    }
  }, []);

  // Handle tool selection
  const handleToolSelect = (tool: string) => {
    setActiveTab(tool);
  };
  
  // Handle enhanced mode toggle
  const handleEnhancedModeToggle = (checked: boolean) => {
    if (checked && !aiServiceStatus.enhancedMode) {
      toast({
        variant: "destructive",
        title: "Enhanced Mode Unavailable",
        description: "Enhanced OpenAI implementation is not available. Please check your API key or connection."
      });
      return;
    }
    
    setUseEnhancedMode(checked);
    toast({
      title: `${checked ? 'Enhanced' : 'Standard'} Mode Activated`,
      description: checked 
        ? "Using enhanced OpenAI implementation with advanced features."
        : "Using standard OpenAI implementation."
    });
    
    // Store preference in session storage
    sessionStorage.setItem('aitools_enhanced_mode', checked ? 'true' : 'false');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <HomeIcon className="h-4 w-4 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI Tools</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Tools
            </h1>
            {aiServiceStatus.isMockImplementation && (
              <Badge variant="outline" className="text-amber-600 border-amber-600 font-semibold">
                MOCK IMPLEMENTATION
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {aiServiceStatus.isMockImplementation 
              ? "Using simulated AI responses to save on API costs. All features work without OpenAI subscription."
              : "Enhance your property management with AI-powered tools."}
          </p>
        </div>
        
        {!aiServiceStatus.loading && !aiServiceStatus.openai && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>
              Unable to connect to OpenAI. Please check your connection or provide an API key below.
            </AlertDescription>
          </Alert>
        )}
        
        {!aiServiceStatus.loading && aiServiceStatus.openai && !aiServiceStatus.system && (
          <Alert className="max-w-md bg-amber-50 border-amber-200 text-amber-800">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              No system API key available. Please provide your own OpenAI API key to use these tools.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {aiServiceStatus.isMockImplementation && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <h3 className="text-amber-800 font-semibold text-sm mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Mock OpenAI Implementation Active
          </h3>
          <p className="text-amber-700 text-sm">
            You are using a cost-free simulation of the OpenAI API. No actual API calls will be made, saving on subscription costs.
            All responses are simulated but follow realistic patterns. Perfect for testing and development.
          </p>
          <p className="text-amber-700 text-sm mt-2">
            <strong>How to use real OpenAI:</strong> Set <code className="px-1 py-0.5 bg-amber-100 rounded">USE_MOCK_OPENAI</code> to <code className="px-1 py-0.5 bg-amber-100 rounded">false</code> in <code className="px-1 py-0.5 bg-amber-100 rounded">server/openai.ts</code> to use the real OpenAI API with your configured API key.
          </p>
        </div>
      )}
      
      {!aiServiceStatus.loading && !aiServiceStatus.isMockImplementation && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm mb-1 flex items-center">
              <ZapIcon className="h-4 w-4 mr-2 text-primary" />
              AI Implementation Mode
            </h3>
            <p className="text-gray-600 text-sm">
              {useEnhancedMode 
                ? "Enhanced mode enabled with advanced features and improved model access."
                : "Standard mode enabled with basic OpenAI integration."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Standard</span>
            <Switch 
              checked={useEnhancedMode}
              onCheckedChange={handleEnhancedModeToggle}
              disabled={!aiServiceStatus.enhancedMode}
            />
            <span className="text-xs text-gray-500 flex items-center gap-1">
              Enhanced
              {useEnhancedMode && (
                <Rocket className="h-3 w-3 text-primary" />
              )}
            </span>
          </div>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api-key">API Key</TabsTrigger>
          <TabsTrigger value="property-description">Property Description</TabsTrigger>
          <TabsTrigger value="image-analysis">Image Analysis</TabsTrigger>
          <TabsTrigger value="floor-plan">Floor Plan Generator</TabsTrigger>
          <TabsTrigger value="document-analysis">Document Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Property Description Generator"
              icon={<ClipboardEditIcon className="h-5 w-5" />}
              description="Generate professional and engaging property descriptions with customizable options."
              status="available"
              onClick={() => handleToolSelect("property-description")}
            />
            
            <FeatureCard
              title="Property Image Analysis"
              icon={<ImageIcon className="h-5 w-5" />}
              description="Analyze property images to identify features, condition issues, and staging suggestions."
              status="available"
              onClick={() => handleToolSelect("image-analysis")}
            />
            
            <FeatureCard
              title="Multi-language Translations"
              icon={<LanguagesIcon className="h-5 w-5" />}
              description="Translate property descriptions and messages into multiple languages for international clients."
              status="coming"
            />
            
            <FeatureCard
              title="Virtual Tour Script Generator"
              icon={<VideoIcon className="h-5 w-5" />}
              description="Create professional scripts for virtual property tour videos."
              status="coming"
            />
            
            <FeatureCard
              title="Floor Plan Generator"
              icon={<LayoutPanelLeft className="h-5 w-5" />}
              description="Generate property floor plans from room images with AI-powered layout analysis."
              status="available"
              onClick={() => handleToolSelect("floor-plan")}
            />
            
            <FeatureCard
              title="Document Analysis"
              icon={<Wand2Icon className="h-5 w-5" />}
              description="Extract and analyze information from property documents, leases, and contracts."
              status="available"
              onClick={() => handleToolSelect("document-analysis")}
            />
          </div>
        </TabsContent>

        <TabsContent value="api-key">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyRound className="mr-2 h-5 w-5" />
                  OpenAI API Key Management
                </CardTitle>
                <CardDescription>
                  Manage your OpenAI API key for using AI-powered features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpenAIKeyInput />
              </CardContent>
              <CardFooter className="bg-gray-50 border-t">
                <p className="text-xs text-gray-500">
                  Your API key is used securely and is only stored in your browser's session storage. 
                  For more information, visit the <a href="https://platform.openai.com/docs/api-reference" className="text-primary underline" target="_blank" rel="noopener noreferrer">OpenAI API Documentation</a>.
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="property-description">
          <div className="max-w-5xl mx-auto">
            <PropertyDescriptionGenerator apiUrl={apiUrl} useEnhancedMode={useEnhancedMode} />
          </div>
        </TabsContent>

        <TabsContent value="image-analysis">
          <div className="max-w-5xl mx-auto">
            <PropertyImageAnalyzer apiUrl={apiUrl} useEnhancedMode={useEnhancedMode} />
          </div>
        </TabsContent>
        
        <TabsContent value="floor-plan">
          <div className="max-w-5xl mx-auto">
            <PropertyFloorPlanGenerator apiUrl={apiUrl} useEnhancedMode={useEnhancedMode} />
          </div>
        </TabsContent>
        
        <TabsContent value="document-analysis">
          <div className="max-w-5xl mx-auto">
            <PropertyDocumentAnalyzer apiUrl={apiUrl} useEnhancedMode={useEnhancedMode} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}