import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyType } from "@/lib/types";
import { createProperty, updateProperty, generatePropertyDescription } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { 
  Loader2, 
  PlusCircle, 
  X, 
  Home, 
  Upload, 
  Wand2, 
  Camera, 
  Zap as BoltIcon,
  Plus 
} from "lucide-react";

interface PropertyManagementProps {
  propertyId?: number;
  isEdit?: boolean;
}

const propertySchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  postcode: z.string().min(5, { message: "Postcode is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  propertyType: z.string().min(1, { message: "Property type is required" }),
  bedrooms: z.string().min(1, { message: "Number of bedrooms is required" }),
  bathrooms: z.string().min(1, { message: "Number of bathrooms is required" }),
  available: z.boolean().default(true),
  university: z.string().optional(),
  distanceToUniversity: z.string().optional(),
  features: z.array(z.string()).default([]),
  area: z.string().optional(),
  billsIncluded: z.boolean().default(true),
  includedBills: z.array(z.string()).default(['gas', 'electricity', 'water', 'broadband']),
  furnished: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  parkingAvailable: z.boolean().default(false),
  virtualTourUrl: z.string().optional(),
  videos: z.array(z.string()).default([])
});

export default function PropertyManagement({ propertyId, isEdit = false }: PropertyManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Property details query (for edit mode)
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: isEdit && !!propertyId,
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: (data: any) => createProperty(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive"
      });
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateProperty(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive"
      });
    }
  });

  // Generate description mutation
  const generateDescriptionMutation = useMutation({
    mutationFn: (propertyDetails: any) => generatePropertyDescription(propertyDetails),
    onSuccess: (data) => {
      form.setValue("description", data.description);
      toast({
        title: "Success",
        description: "Description generated successfully",
      });
      setIsGeneratingDescription(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate description",
        variant: "destructive"
      });
      setIsGeneratingDescription(false);
    }
  });

  // Form setup
  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      city: "",
      postcode: "",
      price: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      available: true,
      university: "",
      distanceToUniversity: "",
      features: [],
      area: "",
      billsIncluded: true, // All properties must include bills
      includedBills: ['gas', 'electricity', 'water', 'broadband'], // All-inclusive utilities required
      furnished: false,
      petsAllowed: false,
      smokingAllowed: false,
      parkingAvailable: false,
      virtualTourUrl: "",
      videos: []
    }
  });

  // Pre-fill form with existing data if in edit mode
  if (isEdit && property && !form.formState.isDirty) {
    form.reset({
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      postcode: property.postcode,
      price: property.price.toString(),
      propertyType: property.propertyType,
      virtualTourUrl: property.virtualTourUrl || "",
      videos: property.videos || [],
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      available: property.available,
      university: property.university || "",
      distanceToUniversity: property.distanceToUniversity || "",
      area: property.area || "",
      billsIncluded: property.billsIncluded !== null ? property.billsIncluded : true,
      includedBills: property.includedBills || ['gas', 'electricity', 'water', 'broadband'],
      furnished: property.furnished || false,
      petsAllowed: property.petsAllowed || false,
      smokingAllowed: property.smokingAllowed || false,
      parkingAvailable: property.parkingAvailable || false
    });
    
    setSelectedFeatures(property.features || []);
    setImages(property.images || []);
  }

  // Form submission handler
  const onSubmit = (values: z.infer<typeof propertySchema>) => {
    const propertyData = {
      ...values,
      price: parseFloat(values.price),
      bedrooms: parseInt(values.bedrooms),
      bathrooms: parseInt(values.bathrooms),
      ownerId: user?.id,
      features: selectedFeatures,
      images,
      // Include any videos and virtualTourUrl
      videos: values.videos || [],
      virtualTourUrl: values.virtualTourUrl || "",
      // Ensure all-inclusive utilities are included
      billsIncluded: true,
      includedBills: ['gas', 'electricity', 'water', 'broadband']
    };

    if (isEdit && propertyId) {
      updatePropertyMutation.mutate({ id: propertyId, data: propertyData });
    } else {
      createPropertyMutation.mutate(propertyData);
    }
  };

  // Handle feature addition
  const handleAddFeature = () => {
    if (newFeature.trim() && !selectedFeatures.includes(newFeature.trim())) {
      setSelectedFeatures([...selectedFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  // Handle feature removal
  const handleRemoveFeature = (feature: string) => {
    setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
  };

  // Handle image upload (mock)
  const handleImageUpload = () => {
    // In a real implementation, this would handle file upload
    // For this demo, we'll just add a placeholder image URL
    const newImageUrl = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80";
    setImages([...images, newImageUrl]);
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Generate AI description
  const handleGenerateDescription = () => {
    setIsGeneratingDescription(true);
    const propertyDetails = {
      title: form.getValues("title"),
      propertyType: form.getValues("propertyType"),
      bedrooms: parseInt(form.getValues("bedrooms") || "0"),
      bathrooms: parseInt(form.getValues("bathrooms") || "0"),
      location: `${form.getValues("city")}, ${form.getValues("postcode")}`,
      university: form.getValues("university"),
      features: selectedFeatures,
      furnished: form.getValues("furnished"),
      billsIncluded: true, // Always true for student properties
      tone: "professional"
    };

    generateDescriptionMutation.mutate(propertyDetails);
  };

  // Loading state
  if (isEdit && isLoadingProperty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading property details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Property" : "Add New Property"}</h1>
          <p className="text-gray-500">
            {isEdit ? "Update your property information" : "Add a new property to your portfolio"}
          </p>
        </div>
        {isEdit && property && (
          <div className="flex items-center">
            <Badge variant={property.available ? "secondary" : "secondary"} className="mr-2">
              {property.available ? "Available" : "Unavailable"}
            </Badge>
            <Link href={`/properties/${propertyId}`}>
              <Button variant="outline" size="sm">View Property</Button>
            </Link>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="features">Features & Images</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="media">Media & Tours</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic details about your property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Modern Student Apartment in City Center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-end gap-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your property..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mb-1"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDescription}
                    >
                      {isGeneratingDescription ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="studio">Studio</SelectItem>
                              <SelectItem value="flat">Flat/Apartment</SelectItem>
                              <SelectItem value="house">House</SelectItem>
                              <SelectItem value="ensuite">En-suite Room</SelectItem>
                              <SelectItem value="shared">Shared House</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select number" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 Bedroom</SelectItem>
                              <SelectItem value="2">2 Bedrooms</SelectItem>
                              <SelectItem value="3">3 Bedrooms</SelectItem>
                              <SelectItem value="4">4 Bedrooms</SelectItem>
                              <SelectItem value="5">5 Bedrooms</SelectItem>
                              <SelectItem value="6">6+ Bedrooms</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select number" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 Bathroom</SelectItem>
                              <SelectItem value="2">2 Bathrooms</SelectItem>
                              <SelectItem value="3">3 Bathrooms</SelectItem>
                              <SelectItem value="4">4+ Bathrooms</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Rent (£)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" placeholder="150.00" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the weekly rent amount (utilities included)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Available for rent</FormLabel>
                          <FormDescription>
                            Uncheck if the property is already rented or unavailable
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("features")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab("features")}
                  >
                    Next: Features & Images
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Features & Images</CardTitle>
                  <CardDescription>
                    Add features and images that make your property attractive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* All-inclusive utilities section */}
                    <div className="p-4 bg-emerald-50 rounded-lg border-emerald-200 border">
                      <h3 className="text-lg font-semibold text-emerald-700 flex items-center mb-3">
                        <BoltIcon className="h-5 w-5 mr-2" />
                        All-Inclusive Utilities
                      </h3>
                      <p className="text-sm text-emerald-600 mb-4">
                        All properties must include utilities (gas, electricity, water, broadband) in the rent
                      </p>
                      
                      <FormField
                        control={form.control}
                        name="billsIncluded"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={true} // Always included, cannot be disabled
                                />
                              </FormControl>
                              <FormLabel className="font-medium">Bills Included</FormLabel>
                            </div>
                            <FormDescription className="ml-6">
                              Bills must be included in the rent for student properties
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <div className="ml-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={true} disabled={true} />
                          <Label className="text-emerald-700">Gas</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={true} disabled={true} />
                          <Label className="text-emerald-700">Electricity</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={true} disabled={true} />
                          <Label className="text-emerald-700">Water</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={true} disabled={true} />
                          <Label className="text-emerald-700">Broadband</Label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Property amenities options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="furnished"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Furnished</FormLabel>
                              <FormDescription>
                                Property comes with furniture
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="parkingAvailable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Parking Available</FormLabel>
                              <FormDescription>
                                Property has parking facilities
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="petsAllowed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Pets Allowed</FormLabel>
                              <FormDescription>
                                Tenants can keep pets
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="smokingAllowed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Smoking Allowed</FormLabel>
                              <FormDescription>
                                Smoking is permitted inside
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Property features */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Property Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeatures.map((feature) => (
                          <Badge key={feature} className="flex items-center gap-1 py-1.5 pl-2 pr-1">
                            {feature}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 hover:bg-transparent"
                              onClick={() => handleRemoveFeature(feature)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add a feature e.g. Garden" 
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddFeature}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add
                        </Button>
                      </div>
                    </div>
                    
                    {/* Property images */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Property Images</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative rounded-md overflow-hidden group">
                            <img
                              src={image} 
                              alt={`Property ${index}`}
                              className="w-full h-40 object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-40 flex flex-col items-center justify-center border-dashed"
                          onClick={handleImageUpload}
                        >
                          <Upload className="h-8 w-8 mb-2" />
                          <span>Upload Image</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab("details")}
                  >
                    Previous: Details
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab("location")}
                  >
                    Next: Location
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                  <CardDescription>
                    Provide address and university proximity details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Student Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Manchester" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="postcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postcode</FormLabel>
                          <FormControl>
                            <Input placeholder="M1 1AA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area/Neighborhood</FormLabel>
                        <FormControl>
                          <Input placeholder="University District" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nearby University</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select university" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="University of Manchester">University of Manchester</SelectItem>
                            <SelectItem value="University of Leeds">University of Leeds</SelectItem>
                            <SelectItem value="University of Birmingham">University of Birmingham</SelectItem>
                            <SelectItem value="University of Liverpool">University of Liverpool</SelectItem>
                            <SelectItem value="University of Nottingham">University of Nottingham</SelectItem>
                            <SelectItem value="other">Other (specify in description)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="distanceToUniversity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance to University</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select distance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Less than 5 minutes">Less than 5 minutes</SelectItem>
                            <SelectItem value="5-10 minutes">5-10 minutes</SelectItem>
                            <SelectItem value="10-15 minutes">10-15 minutes</SelectItem>
                            <SelectItem value="15-20 minutes">15-20 minutes</SelectItem>
                            <SelectItem value="20-30 minutes">20-30 minutes</SelectItem>
                            <SelectItem value="More than 30 minutes">More than 30 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Walking distance will be calculated automatically after saving
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("features")}
                  >
                    Previous: Features & Images
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab("media")}
                  >
                    Next: Media & Tours
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media & Virtual Tours</CardTitle>
                  <CardDescription>
                    Add videos and virtual tour links to showcase your property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Property Videos</h3>
                    <p className="text-sm text-muted-foreground">
                      Add YouTube or Vimeo video links to showcase your property. Videos significantly improve engagement and rental success rates.
                    </p>
                    
                    {form.watch("videos")?.map((video, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`videos.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="https://youtube.com/watch?v=..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const currentVideos = form.getValues("videos") || [];
                            form.setValue(
                              "videos",
                              currentVideos.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const currentVideos = form.getValues("videos") || [];
                        form.setValue("videos", [...currentVideos, ""]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Video Link
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Virtual Tour</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a 360° virtual tour link (Matterport, Zillow 3D Home, etc.) to allow potential tenants to explore the property virtually.
                    </p>
                    
                    <FormField
                      control={form.control}
                      name="virtualTourUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Virtual Tour URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://my.matterport.com/show/?m=..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a link to your virtual tour platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab("location")}
                  >
                    Previous: Location
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
                  >
                    {isEdit 
                      ? updatePropertyMutation.isPending 
                        ? "Updating..." 
                        : "Update Property" 
                      : createPropertyMutation.isPending 
                        ? "Creating..." 
                        : "Create Property"
                    }
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}