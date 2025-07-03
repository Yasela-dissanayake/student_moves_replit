import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Loader2, ImageIcon, Download, Save, Check, List, Upload, RefreshCw, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from 'wouter';

// List of common cities for the UK
const COMMON_UK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 
  'Edinburgh', 'Glasgow', 'Cardiff', 'Belfast', 'Bristol',
  'Newcastle', 'Sheffield', 'Nottingham', 'Southampton', 'Oxford',
  'Cambridge', 'York', 'Leicester', 'Coventry', 'Bath'
];

const GenerateAiImagesPage: React.FC = () => {
  // State for city image generation
  const [cityName, setCityName] = useState('');
  const [cityImageStyle, setCityImageStyle] = useState('photorealistic');
  const [generatedCityImage, setGeneratedCityImage] = useState<string | null>(null);
  const [loadingCityImage, setLoadingCityImage] = useState(false);
  const [cityImageError, setCityImageError] = useState<string | null>(null);
  const [savedCities, setSavedCities] = useState<string[]>([]);
  const [savingImage, setSavingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // State for custom image generation
  const [customPrompt, setCustomPrompt] = useState('');
  const [customImageSize, setCustomImageSize] = useState('1024x1024');
  const [generatedCustomImage, setGeneratedCustomImage] = useState<string | null>(null);
  const [loadingCustomImage, setLoadingCustomImage] = useState(false);
  const [customImageError, setCustomImageError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Check which cities already have saved images
  useEffect(() => {
    const checkSavedCities = async () => {
      try {
        const response = await axios.get('/api/city-images/list');
        if (response.data.success) {
          setSavedCities(response.data.cities || []);
        }
      } catch (error) {
        console.error('Error fetching saved cities:', error);
        // Continue silently - this is not critical functionality
      }
    };
    
    checkSavedCities();
  }, []);

  // Generate city image
  const generateCityImage = async () => {
    if (!cityName.trim()) {
      setCityImageError('Please enter a city name');
      return;
    }

    setCityImageError(null);
    setLoadingCityImage(true);
    
    try {
      // Use the generate-city endpoint that's fixed to work with the custom AI provider
      const response = await axios.post('/api/openai-image/generate-city', {
        city: cityName,
        style: cityImageStyle
      });
      
      if (response.data.success) {
        console.log('Image generation successful. Image URL:', response.data.imageUrl);
        console.log('Image provider:', response.data.provider);
        console.log('Image data type:', typeof response.data.imageUrl);
        console.log('Image data starts with:', response.data.imageUrl.substring(0, 50));
        
        setGeneratedCityImage(response.data.imageUrl);
        
        // Show provider info in toast
        toast({
          title: 'Image Generated Successfully',
          description: `Generated using ${response.data.provider || 'AI'} provider`,
          variant: 'default',
        });
        
        // Show toast if mock was used
        if (response.data.mockUsed) {
          toast({
            title: 'Using fallback image',
            description: 'API limit reached. Using a placeholder image instead.',
            variant: 'default',
          });
        }
      } else {
        setCityImageError(response.data.error || 'Failed to generate city image');
      }
    } catch (error: any) {
      console.error('Error generating city image:', error);
      setCityImageError(error.response?.data?.message || error.message || 'An error occurred');
      
      // Try the old endpoint as fallback if the new one fails
      try {
        const fallbackResponse = await axios.post('/api/openai-image/city', {
          cityName,
          style: cityImageStyle
        });
        
        if (fallbackResponse.data.success) {
          setGeneratedCityImage(fallbackResponse.data.imageUrl);
          toast({
            title: 'Using alternative endpoint',
            description: 'Generated image using fallback endpoint',
            variant: 'default',
          });
        } else {
          throw new Error(fallbackResponse.data.error || 'Fallback also failed');
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Original error handling
        if (error.response?.data?.useMock) {
          toast({
            title: 'API Key Error',
            description: 'OpenAI API key is not configured. Using placeholder images.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoadingCityImage(false);
    }
  };

  // Generate custom image
  const generateCustomImage = async () => {
    if (!customPrompt.trim()) {
      setCustomImageError('Please enter a prompt');
      return;
    }

    setCustomImageError(null);
    setLoadingCustomImage(true);
    
    try {
      const response = await axios.post('/api/openai-image/generate', {
        prompt: customPrompt,
        size: customImageSize
      });
      
      if (response.data.success) {
        setGeneratedCustomImage(response.data.imageUrl);
        
        // Show toast if mock was used
        if (response.data.mockUsed) {
          toast({
            title: 'Using fallback image',
            description: 'API limit reached. Using a placeholder image instead.',
            variant: 'default',
          });
        }
      } else {
        setCustomImageError(response.data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating custom image:', error);
      setCustomImageError(error.response?.data?.message || error.message || 'An error occurred');
      
      // Check if we should use mock
      if (error.response?.data?.useMock) {
        toast({
          title: 'API Key Error',
          description: 'OpenAI API key is not configured. Using placeholder images.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingCustomImage(false);
    }
  };

  // Function to download the generated image
  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // Get image data and determine file extension
      let fileExtension = 'jpg';
      
      // If the URL is a data URL, we can use it directly
      if (imageUrl.startsWith('data:')) {
        link.href = imageUrl;
        
        // Set proper extension based on MIME type
        if (imageUrl.startsWith('data:image/svg+xml')) {
          fileExtension = 'svg';
        } else if (imageUrl.startsWith('data:image/png')) {
          fileExtension = 'png';
        }
      } else {
        // Otherwise fetch the image and convert to a blob URL
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
        
        // Detect file type from the response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('svg')) {
          fileExtension = 'svg';
        } else if (contentType?.includes('png')) {
          fileExtension = 'png';
        }
      }
      
      // Set download attributes with proper extension
      link.download = `${filename.toLowerCase().replace(/\s+/g, '-')}.${fileExtension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download started',
        description: `Downloading ${filename} image as ${fileExtension.toUpperCase()}...`,
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the image. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to save the city image to the server for future use
  const saveCityImage = async () => {
    if (!generatedCityImage || !cityName) return;
    
    setSavingImage(true);
    setUploadProgress(10);
    
    try {
      // Create a simulated upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 20;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Get image data - either fetch from URL or use directly if it's a data URL
      let imageData;
      if (generatedCityImage.startsWith('data:')) {
        imageData = generatedCityImage;
      } else {
        const response = await fetch(generatedCityImage);
        const blob = await response.blob();
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      
      // Send to server
      const response = await axios.post('/api/city-images/save', {
        cityName: cityName.trim(),
        imageData,
        style: cityImageStyle
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.data.success) {
        // Update the saved cities list
        setSavedCities(prev => {
          if (!prev.includes(cityName)) {
            return [...prev, cityName];
          }
          return prev;
        });
        
        toast({
          title: 'Image saved',
          description: `The image for ${cityName} has been saved and will be used in the application.`,
        });
      } else {
        throw new Error(response.data.message || 'Failed to save image');
      }
    } catch (error: any) {
      console.error('Error saving city image:', error);
      toast({
        title: 'Failed to save image',
        description: error.message || 'An error occurred while saving the image',
        variant: 'destructive',
      });
    } finally {
      setSavingImage(false);
      setUploadProgress(0);
    }
  };
  
  // Check if a city name is already saved
  const isCitySaved = (name: string): boolean => {
    return savedCities.some(city => 
      city.toLowerCase() === name.toLowerCase()
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Link href="/dashboard/admin">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">AI City Image Generator</h1>
      <p className="text-gray-500 mb-8">Generate and save AI images of cities for use in the student housing platform.</p>
      
      <Tabs defaultValue="city">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="city">City Images</TabsTrigger>
          <TabsTrigger value="custom">Custom Images</TabsTrigger>
        </TabsList>
        
        {/* City Image Generation */}
        <TabsContent value="city">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left panel - Image Generator */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Generate City Images</CardTitle>
                  <CardDescription>
                    Generate realistic images of cities for property listings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cityName">City Name</Label>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <Input
                          id="cityName"
                          placeholder="Enter city name (e.g., London, Manchester)"
                          value={cityName}
                          onChange={(e) => setCityName(e.target.value)}
                          disabled={loadingCityImage}
                          className="w-full"
                        />
                      </div>
                      <Select
                        value={cityName || ""}
                        onValueChange={(value) => setCityName(value)}
                        disabled={loadingCityImage}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_UK_CITIES.map(city => (
                            <SelectItem key={city} value={city}>
                              {city} {isCitySaved(city) && <span className="ml-2 text-green-500">✓</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cityImageStyle">Image Style</Label>
                    <Select
                      value={cityImageStyle}
                      onValueChange={(value) => setCityImageStyle(value)}
                      disabled={loadingCityImage}
                    >
                      <SelectTrigger id="cityImageStyle">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photorealistic">Photorealistic</SelectItem>
                        <SelectItem value="architectural">Architectural</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="historic">Historic</SelectItem>
                        <SelectItem value="artistic">Artistic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {cityImageError && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{cityImageError}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button 
                      onClick={generateCityImage} 
                      disabled={loadingCityImage || !cityName.trim()}
                    >
                      {loadingCityImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Generate City Image
                        </>
                      )}
                    </Button>
                    
                    {generatedCityImage && !loadingCityImage && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => downloadImage(generatedCityImage, `${cityName}-city-image`)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={saveCityImage}
                          disabled={savingImage}
                          className="ml-auto"
                        >
                          {savingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save to Site
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {savingImage && (
                    <div className="w-full mt-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Saving image: {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {generatedCityImage && (
                    <div className="w-full mt-4">
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium">Generated Image</h3>
                        {isCitySaved(cityName) && (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" /> Saved
                          </Badge>
                        )}
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="flex flex-col">
                          {/* Simplified image display */}
                          <div className="bg-white h-64 w-full flex items-center justify-center">
                            <img 
                              src={generatedCityImage || ''} 
                              alt={`AI generated image of ${cityName}`} 
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          
                          {/* Information about the image type */}
                          <div className="p-2 bg-gray-100 text-xs">
                            <p>Provider: Custom AI (SVG Generator)</p>
                            <p>City: {cityName}</p>
                            <p>Style: {cityImageStyle}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        City: {cityName}, Style: {cityImageStyle}
                      </p>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Right panel - Saved Cities */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <List className="h-5 w-5 mr-2" />
                    Saved City Images
                  </CardTitle>
                  <CardDescription>
                    Cities with saved AI-generated images for the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {savedCities.length > 0 ? (
                    <ul className="space-y-2">
                      {savedCities.map(city => (
                        <li key={city} className="flex items-center p-2 rounded bg-gray-50 border">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span>{city}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No cities saved yet</p>
                      <p className="text-sm mt-1">Generate and save city images to see them here</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Refresh the list of saved cities
                      axios.get('/api/city-images/list')
                        .then(response => {
                          if (response.data.success) {
                            setSavedCities(response.data.cities || []);
                            toast({
                              title: 'Refresh complete',
                              description: 'The list of saved cities has been updated.',
                            });
                          }
                        })
                        .catch(error => {
                          console.error('Error refreshing city list:', error);
                        });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh List
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Custom Image Generation */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Generate Custom Images</CardTitle>
              <CardDescription>
                Create custom AI-generated images with your own prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Image Prompt</Label>
                <Input
                  id="customPrompt"
                  placeholder="Describe the image you want to generate"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={loadingCustomImage}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customImageSize">Image Size</Label>
                <Select
                  value={customImageSize}
                  onValueChange={(value) => setCustomImageSize(value)}
                  disabled={loadingCustomImage}
                >
                  <SelectTrigger id="customImageSize">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                    <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                    <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {customImageError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{customImageError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <div className="flex flex-wrap gap-2 w-full">
                <Button 
                  onClick={generateCustomImage} 
                  disabled={loadingCustomImage || !customPrompt.trim()}
                >
                  {loadingCustomImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
                
                {generatedCustomImage && !loadingCustomImage && (
                  <Button 
                    variant="outline" 
                    onClick={() => downloadImage(generatedCustomImage, `custom-image-${Date.now()}`)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
              
              {generatedCustomImage && (
                <div className="w-full mt-4">
                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-2">Generated Image</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-white h-64 w-full flex items-center justify-center">
                      <img 
                        src={generatedCustomImage || ''} 
                        alt="AI generated custom image" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Size: {customImageSize}
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GenerateAiImagesPage;