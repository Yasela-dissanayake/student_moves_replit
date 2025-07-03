import React, { useState, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiRequestMethod } from '@/lib/queryClient';
import { Loader2, FileImage, Check, X, Info, AlertCircle, CheckCheck, Rocket } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoomImage {
  id: string;
  base64Image: string;
  roomLabel: string;
  file: File;
}

interface FloorPlanResult {
  svgContent: string;
  description: string;
  accuracy: number;
  roomLabels: string[];
}

interface PropertyFloorPlanGeneratorProps {
  apiUrl?: (endpoint: string) => string;
  useEnhancedMode?: boolean;
}

function PropertyFloorPlanGenerator({ apiUrl = (url: string) => url, useEnhancedMode = false }: PropertyFloorPlanGeneratorProps) {
  const [images, setImages] = useState<RoomImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<FloorPlanResult | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [openaiAvailable, setOpenaiAvailable] = useState(true);
  const { toast } = useToast();

  // Check OpenAI API status when component mounts
  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        interface OpenAIStatusResponse {
          status: string;
          message: string;
          usingMock: boolean;
        }
        
        // Use the appropriate status endpoint based on the mode
        const endpoint = useEnhancedMode ? '/api/openai-enhanced/status' : '/api/openai/status';
        const response = await apiRequest('GET', endpoint);
        if (!response.ok) {
          setOpenaiAvailable(false);
          return;
        }
        
        const data = await response.json() as OpenAIStatusResponse;
        setIsUsingMock(data.usingMock || false);
        setOpenaiAvailable(data.status === 'success');
      } catch (error) {
        console.error('Error checking API status:', error);
        setOpenaiAvailable(false);
      }
    };

    checkApiStatus();
  }, [useEnhancedMode]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Read the file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Image = event.target.result as string;
        const newImage: RoomImage = {
          id: Date.now().toString(),
          base64Image,
          roomLabel: '',
          file
        };
        setImages([...images, newImage]);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset the file input
    e.target.value = '';
  };
  
  const handleRoomLabelChange = (id: string, label: string) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, roomLabel: label } : img
    ));
  };
  
  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };
  
  const generateFloorPlan = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please add at least one image to generate a floor plan",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      setResult(null);
      
      // Prepare the images for the API request
      const imageData = images.map(img => ({
        base64Image: img.base64Image,
        roomLabel: img.roomLabel || `Room ${images.indexOf(img) + 1}`
      }));
      
      // Generate the floor plan
      interface FloorPlanResponse {
        status: string;
        floorPlan: FloorPlanResult;
      }
      
      // Use the apiUrl function to get the correct endpoint based on enhanced mode
      const endpoint = useEnhancedMode ? '/api/openai-enhanced/generate-floor-plan' : '/api/openai/generate-floor-plan';
      const response = await apiRequest('POST', apiUrl(endpoint), { images: imageData });
      
      if (!response.ok) {
        throw new Error('Failed to generate floor plan');
      }
      
      const data = await response.json() as FloorPlanResponse;
      if (data.status === 'success') {
        setResult(data.floorPlan);
        toast({
          title: "Floor plan generated",
          description: useEnhancedMode 
            ? "Your floor plan has been successfully created using enhanced OpenAI"
            : "Your floor plan has been successfully created",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate floor plan",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating floor plan:', error);
      toast({
        title: "Error",
        description: "An error occurred while generating the floor plan",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Function to download the SVG
  const downloadSVG = () => {
    if (!result) return;
    
    const blob = new Blob([result.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor-plan.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Property Floor Plan Generator</CardTitle>
            <CardDescription>
              Upload room images to generate a property floor plan
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {useEnhancedMode && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="border-blue-400 text-blue-500 flex gap-1 items-center">
                      <Rocket size={14} /> Enhanced Mode
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Using enhanced OpenAI implementation for higher quality results.</p>
                    <p>This mode uses the latest OpenAI models and features.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {isUsingMock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="border-orange-400 text-orange-500 flex gap-1 items-center">
                      <Info size={14} /> Mock AI
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Using mock implementation to save on API costs.</p>
                    <p>Results are simulated, not real AI-generated content.</p>
                    <p>To use real OpenAI, set USE_MOCK_OPENAI to false in server/openai.ts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!openaiAvailable && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OpenAI API Unavailable</AlertTitle>
            <AlertDescription>
              <p>The OpenAI API is not configured or is unavailable. Using mock implementation for demonstration purposes.</p>
              <p className="mt-2">Floor plans will still be generated, but they will be simulated rather than AI-generated.</p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <Label htmlFor="image-upload">Add Room Images</Label>
          <div className="flex flex-col gap-2">
            {/* File input */}
            <div className="flex items-center gap-2">
              <Input 
                id="image-upload" 
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isGenerating}
              />
              <Button
                onClick={() => document.getElementById('image-upload')?.click()}
                variant="outline"
                disabled={isGenerating}
              >
                <FileImage className="mr-2 h-4 w-4" />
                Browse
              </Button>
            </div>
            
            {/* Image preview/labels list */}
            {images.length > 0 && (
              <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {images.map((img) => (
                  <div key={img.id} className="border rounded-md p-3 space-y-2">
                    <div className="aspect-video relative overflow-hidden rounded-md">
                      <img 
                        src={img.base64Image} 
                        alt="Room preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={img.roomLabel}
                        onChange={(e) => handleRoomLabelChange(img.id, e.target.value)}
                        placeholder="Enter room label (e.g. Living Room)"
                        disabled={isGenerating}
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeImage(img.id)}
                        disabled={isGenerating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Generate button */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={generateFloorPlan}
            disabled={isGenerating || images.length === 0}
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Floor Plan...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Generate Floor Plan
              </>
            )}
          </Button>
        </div>
        
        {/* Result section */}
        {result && (
          <div className="space-y-4 mt-8 border rounded-md p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Generated Floor Plan</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Accuracy:</span>
                <div className="w-32 flex items-center gap-2">
                  <Progress value={result.accuracy} />
                  <span className="text-sm">{result.accuracy}%</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <Alert className="bg-green-50 border-green-200 text-green-700 my-4">
              <CheckCheck className="h-4 w-4" />
              <AlertTitle>Floor Plan Generated Successfully</AlertTitle>
              <AlertDescription>
                {isUsingMock ? "Mock implementation used - floor plan created with simulated AI." : "Floor plan created with OpenAI vision analysis."}
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* SVG display */}
              <div className="flex-1 border rounded-md p-2 bg-white">
                <div dangerouslySetInnerHTML={{ __html: result.svgContent }} />
              </div>
              
              {/* Description and room list */}
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Room List</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {result.roomLabels.map((label, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={downloadSVG} variant="outline">
                Download SVG
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Upload images of different rooms to generate a comprehensive floor plan
        </p>
      </CardFooter>
    </Card>
  );
}

export default PropertyFloorPlanGenerator;