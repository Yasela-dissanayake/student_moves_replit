import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  ImagePlus,
  Trash2,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  MapPin,
  X,
} from 'lucide-react';

// Import categories and conditions
const MarketplaceItemCategories = [
  'textbooks',
  'electronics',
  'furniture',
  'clothing',
  'kitchen',
  'sports',
  'tickets',
  'services',
  'other'
];

const MarketplaceItemConditions = [
  'new',
  'like_new',
  'very_good',
  'good',
  'fair',
  'poor'
];

// Form schema with validation
const listingFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters' }).max(100, { message: 'Title cannot exceed 100 characters' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters' }).max(1000, { message: 'Description cannot exceed 1000 characters' }),
  price: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, { message: 'Price must be a positive number' }),
  category: z.string({ required_error: 'Please select a category' }),
  condition: z.string({ required_error: 'Please select a condition' }),
  location: z.string().min(3, { message: 'Location is required' }),
  meetInPerson: z.boolean().default(true),
  canDeliver: z.boolean().default(false),
  tags: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingFormSchema>;

export function CreateListingForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize form
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      location: '',
      meetInPerson: true,
      canDeliver: false,
      tags: '',
    },
  });
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    // Convert FileList to Array
    const filesArray = Array.from(fileList);
    
    // Maximum 5 images allowed
    if (images.length + filesArray.length > 5) {
      toast({
        title: 'Too many images',
        description: 'You can only upload a maximum of 5 images',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size and type
    const invalidFiles = filesArray.filter(file => {
      // Max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 5MB size limit`,
          variant: 'destructive',
        });
        return true;
      }
      
      // Only images allowed
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        return true;
      }
      
      return false;
    });
    
    if (invalidFiles.length > 0) return;
    
    // Add new files to state
    const newImages = [...images, ...filesArray];
    setImages(newImages);
    
    // Generate preview URLs
    const newImageUrls = filesArray.map(file => URL.createObjectURL(file));
    setImageUrls([...imageUrls, ...newImageUrls]);
    
    // Clear input value
    e.target.value = '';
  };
  
  // Remove image
  const removeImage = (index: number) => {
    const newImages = [...images];
    const newImageUrls = [...imageUrls];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newImageUrls[index]);
    
    newImages.splice(index, 1);
    newImageUrls.splice(index, 1);
    
    setImages(newImages);
    setImageUrls(newImageUrls);
  };
  
  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/marketplace/items', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create listing');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Listing created',
        description: 'Your item has been listed successfully',
      });
      
      // Redirect to the new listing
      setLocation(`/marketplace/${data.itemId}`);
    },
    onError: (error) => {
      toast({
        title: 'Failed to create listing',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });
  
  // Form submission handler
  const onSubmit = (values: ListingFormValues) => {
    // Show error if no images
    if (images.length === 0) {
      toast({
        title: 'Images required',
        description: 'Please upload at least one image of your item',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create FormData object
    const formData = new FormData();
    
    // Stringify the data for server to parse
    formData.append('data', JSON.stringify(values));
    
    // Add images
    images.forEach(image => {
      formData.append('images', image);
    });
    
    // Submit the form
    createListingMutation.mutate(formData);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <Button 
        variant="ghost" 
        onClick={() => setLocation('/marketplace')}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Button>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sell an Item</CardTitle>
            <CardDescription>
              List your item on the student marketplace. Fill out the details below to create your listing.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Item Details Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Item Details</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. MacBook Pro 2023" {...field} />
                          </FormControl>
                          <FormDescription>
                            A clear, concise title for your item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your item in detail..." 
                              rows={5}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Include details like brand, model, specifications, condition details, reason for selling, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (£)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                  placeholder="e.g. Leeds University"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your campus or neighborhood
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MarketplaceItemCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MarketplaceItemConditions.map((condition) => (
                                  <SelectItem key={condition} value={condition}>
                                    {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. apple, laptop, student desk" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add comma-separated tags to help buyers find your item
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Image Upload Section */}
                    <div className="space-y-3">
                      <Label>Photos</Label>
                      <div className="grid grid-cols-5 gap-3">
                        {/* Image Previews */}
                        {imageUrls.map((url, index) => (
                          <div 
                            key={index} 
                            className="aspect-square bg-gray-100 rounded-md relative border flex items-center justify-center overflow-hidden group"
                          >
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                            <button 
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add Image Button */}
                        {images.length < 5 && (
                          <div 
                            className="aspect-square bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="text-center p-4">
                              <ImagePlus className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">Add Photo</p>
                            </div>
                            <input 
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                            />
                          </div>
                        )}
                        
                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, 5 - images.length - 1) }).map((_, index) => (
                          <div 
                            key={`empty-${index}`}
                            className="aspect-square bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center"
                          >
                            <p className="text-xs text-gray-300">Photo {images.length + index + 2}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Upload up to 5 high-quality images of your item (max 5MB each)
                      </p>
                      {images.length === 0 && (
                        <p className="text-xs text-red-500">At least one image is required</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Delivery Options Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Delivery Options</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="meetInPerson"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Meet in Person</FormLabel>
                            <FormDescription>
                              You're willing to meet the buyer on campus or nearby
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="canDeliver"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Delivery Available</FormLabel>
                            <FormDescription>
                              You're willing to deliver the item or arrange shipping
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Safety Guidelines */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-medium text-blue-800">Safety Guidelines</h4>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                          <li>Meet in public places during daytime</li>
                          <li>Don't share personal financial information</li>
                          <li>Use our messaging system for all communications</li>
                          <li>Be honest about the item's condition</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/marketplace')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || images.length === 0}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Listing'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}