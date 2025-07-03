import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Define city data structure
interface City {
  id: string;
  name: string;
  imagePath?: string;
}

// Define the list of cities
const AVAILABLE_CITIES: City[] = [
  { id: 'london', name: 'London' },
  { id: 'manchester', name: 'Manchester' },
  { id: 'leeds', name: 'Leeds' },
  { id: 'birmingham', name: 'Birmingham' },
  { id: 'liverpool', name: 'Liverpool' },
  { id: 'nottingham', name: 'Nottingham' },
  { id: 'sheffield', name: 'Sheffield' },
  { id: 'bristol', name: 'Bristol' },
  { id: 'cardiff', name: 'Cardiff' },
  { id: 'edinburgh', name: 'Edinburgh' },
  { id: 'glasgow', name: 'Glasgow' },
  { id: 'newcastle', name: 'Newcastle' },
  { id: 'cambridge', name: 'Cambridge' },
  { id: 'oxford', name: 'Oxford' },
  { id: 'brighton', name: 'Brighton' },
  { id: 'plymouth', name: 'Plymouth' },
  { id: 'york', name: 'York' },
];

export function CityImageManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Fetch existing city images
  const { data: cityImages, isLoading: isLoadingCityImages } = useQuery({
    queryKey: ['/api/city-images'],
    queryFn: async () => {
      const response = await fetch('/api/city-images');
      if (!response.ok) {
        throw new Error('Failed to fetch city images');
      }
      return response.json();
    },
  });
  
  // Upload city image mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      cityId,
      file,
    }: {
      cityId: string;
      file: File;
    }) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('cityId', cityId);
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Return a promise that resolves or rejects based on the XHR response
      return new Promise((resolve, reject) => {
        xhr.open('POST', '/api/city-images/upload');
        
        xhr.onload = () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'));
          }
        };
        
        xhr.onerror = () => {
          setIsUploading(false);
          reject(new Error('Network error during upload'));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Image Uploaded',
        description: 'City image was successfully uploaded and set.',
        variant: 'default',
      });
      
      // Reset states
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/city-images'] });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading the image.',
        variant: 'destructive',
      });
      setIsUploading(false);
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image file size should be less than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  // Handle upload button click
  const handleUpload = () => {
    if (!selectedCity) {
      toast({
        title: 'City Required',
        description: 'Please select a city for this image.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: 'Image Required',
        description: 'Please select an image to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    uploadMutation.mutate({
      cityId: selectedCity,
      file: selectedFile,
    });
  };
  
  // Find city name by ID
  const getCityNameById = (cityId: string): string => {
    const city = AVAILABLE_CITIES.find(city => city.id === cityId);
    return city ? city.name : cityId;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>City Image Management</CardTitle>
        <CardDescription>
          Upload and manage background images for different cities.
          These images will be displayed on the homepage and city-specific pages.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="upload">
          <TabsList className="mb-4">
            <TabsTrigger value="upload">Upload New Image</TabsTrigger>
            <TabsTrigger value="manage">Manage Existing Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="city-select">Select City</Label>
                <Select 
                  value={selectedCity} 
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger id="city-select">
                    <SelectValue placeholder="Choose a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CITIES.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="image-upload">Upload Image</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="image-upload" 
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {selectedFile ? (
                          <div className="flex flex-col items-center space-y-2">
                            <CheckCircle className="w-8 h-8 text-primary" />
                            <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                              }}
                              className="mt-2"
                            >
                              <X className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG or WEBP (MAX. 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                    <span className="text-sm font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-6">
            {isLoadingCityImages ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : cityImages && cityImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cityImages.map((cityImage: any) => (
                  <Card key={cityImage.cityId} className="overflow-hidden">
                    <div className="aspect-video relative bg-muted/30">
                      {cityImage.imagePath ? (
                        <img
                          src={cityImage.imagePath}
                          alt={getCityNameById(cityImage.cityId)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardFooter className="flex justify-between items-center pt-4">
                      <span className="font-medium">
                        {getCityNameById(cityImage.cityId)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          // Handle delete functionality
                          toast({
                            title: 'Delete Image',
                            description: 'This functionality is not yet implemented.',
                            variant: 'default',
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Images Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload city images using the Upload tab.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {selectedCity && selectedFile && (
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || !selectedCity || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload Image
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}