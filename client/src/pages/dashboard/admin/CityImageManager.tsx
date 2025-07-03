import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Image, RefreshCw, Trash2, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useLocation } from 'wouter';

type CityImage = {
  id: string;
  city: string;
  imageUrl: string;
  source: 'uploaded' | 'ai-generated' | 'default';
  lastUpdated: string;
};

export default function CityImageManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');

  // List of supported cities in England
  const englishCities = [
    "London", "Manchester", "Birmingham", "Leeds", "Liverpool", 
    "Nottingham", "Bristol", "Sheffield", "Leicester", "Brighton",
    "Oxford", "Cambridge", "York", "Newcastle", "Southampton",
    "Coventry", "Bath", "Durham", "Exeter", "Reading"
  ];

  // Fetch city images
  const { data: cityImages, isLoading, isError } = useQuery<CityImage[]>({
    queryKey: ['/api/admin/city-images'],
    queryFn: async () => {
      const res = await fetch('/api/admin/city-images');
      if (!res.ok) throw new Error('Failed to fetch city images');
      return res.json();
    },
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/admin/city-images/upload', formData, true);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Image uploaded successfully',
        description: `The image for ${selectedCity} has been uploaded`,
        variant: 'default',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedCity('');
      // Invalidate the city images query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/city-images'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload image',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Generate AI image mutation
  const generateMutation = useMutation({
    mutationFn: async (city: string) => {
      const response = await apiRequest('POST', '/api/admin/city-images/generate', { city });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Image generated successfully',
        description: `AI has generated an image for ${selectedCity}`,
        variant: 'default',
      });
      setIsGenerating(false);
      // Invalidate the city images query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/city-images'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate image',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setIsGenerating(false);
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (cityId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/city-images/${cityId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Image deleted successfully',
        description: 'The city image has been removed',
        variant: 'default',
      });
      // Invalidate the city images query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/city-images'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete image',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if the file is an image
      if (!file.type.match('image.*')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if the file is under 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleUpload = () => {
    if (!selectedFile || !selectedCity) {
      toast({
        title: 'Missing information',
        description: 'Please select a city and an image file',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('city', selectedCity);
    
    uploadMutation.mutate(formData);
  };

  // Handle AI image generation
  const handleGenerate = () => {
    if (!selectedCity) {
      toast({
        title: 'Missing information',
        description: 'Please select a city',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate(selectedCity);
  };

  // Handle image deletion
  const handleDelete = (cityId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate(cityId);
    }
  };

  return (
    <DashboardLayout dashboardType="admin">
      <div className="container mx-auto p-6 space-y-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">City Image Manager</h1>
            <p className="text-gray-600">Upload, generate, and manage city images for the hero section</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Upload and generate section */}
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Add New City Image</CardTitle>
                <CardDescription>Upload your own image or generate one with AI</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="upload" className="w-1/2">Upload</TabsTrigger>
                    <TabsTrigger value="generate" className="w-1/2">AI Generate</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="city-select">Select City</Label>
                      <select 
                        id="city-select"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                      >
                        <option value="">Select a city</option>
                        {englishCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="space-y-2">
                      <Label htmlFor="image-upload">City Image (JPEG, PNG)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-primary cursor-pointer transition-colors" onClick={() => document.getElementById('image-upload')?.click()}>
                        <input 
                          id="image-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {previewUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="max-h-40 mx-auto rounded-md object-cover"
                            />
                            <p className="text-sm text-gray-500">Click to change image</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <UploadCloud className="w-10 h-10 mx-auto text-gray-400" />
                            <p className="text-sm font-medium">Drag and drop or click to upload</p>
                            <p className="text-xs text-gray-500">Max file size: 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      disabled={!selectedFile || !selectedCity || uploadMutation.isPending}
                      onClick={handleUpload}
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="generate" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="city-select-ai">Select City</Label>
                      <select 
                        id="city-select-ai"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                      >
                        <option value="">Select a city</option>
                        {englishCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                      <Image className="w-10 h-10 mx-auto text-gray-400" />
                      <p className="mt-2 text-sm font-medium">AI will generate an image of {selectedCity || "the selected city"}</p>
                      <p className="text-xs text-gray-500 mt-1">Using OpenAI DALL-E 3 for high-quality city images</p>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="default"
                      disabled={!selectedCity || isGenerating}
                      onClick={handleGenerate}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Note</AlertTitle>
                      <AlertDescription>
                        AI generation may take up to 30 seconds and uses DALL-E 3 credits.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Existing images table */}
          <div className="col-span-1 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>City Image Library</CardTitle>
                <CardDescription>Manage existing city images</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Failed to load city images. Please try refreshing the page.
                    </AlertDescription>
                  </Alert>
                ) : cityImages && cityImages.length > 0 ? (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>City</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cityImages.map((image) => (
                          <TableRow key={image.id}>
                            <TableCell className="font-medium">{image.city}</TableCell>
                            <TableCell>
                              <img 
                                src={image.imageUrl} 
                                alt={`${image.city} preview`} 
                                className="h-12 w-20 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell>
                              {image.source === 'uploaded' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Uploaded
                                </span>
                              )}
                              {image.source === 'ai-generated' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  AI Generated
                                </span>
                              )}
                              {image.source === 'default' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Default
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(image.lastUpdated).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(image.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md">
                    <Image className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No images found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by uploading a city image or generating one with AI.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}