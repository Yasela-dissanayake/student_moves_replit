import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PropertyType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { createApplication, createGuestApplication } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Bed, 
  Bath, 
  Wifi, 
  Coffee, 
  Sofa, 
  ChefHat, 
  School, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Video,
  PanelTopOpen,
  CheckCircle,
  User,
  Mail,
  Phone
} from "lucide-react";

interface PropertyDetailProps {
  property: PropertyType;
}

// Define application form schema
const applicationFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  university: z.string().optional(),
  moveInDate: z.string().optional(),
  message: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms to continue"
  })
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export default function PropertyDetail({ property }: PropertyDetailProps) {
  const {
    id,
    title,
    description,
    address,
    city,
    postcode,
    price,
    propertyType,
    bedrooms,
    bathrooms,
    available,
    features,
    images,
    videos,
    virtualTourUrl,
    university,
    distanceToUniversity
  } = property;

  const { toast } = useToast();
  const { user, isAuthenticated, userType } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Format image sources with reliable fallback
  const getPlaceholderImage = () => {
    const safeTitle = title || 'Property';
    const safeType = propertyType || 'House';
    return `https://placehold.co/1200x800?text=${encodeURIComponent(safeTitle)}&desc=${encodeURIComponent(safeType)}`;
  };
  
  // Make sure we have valid image sources
  const imageSources = (images && images.length > 0 && images.filter(img => img && typeof img === 'string').length > 0)
    ? images.filter(img => img && typeof img === 'string')
    : [getPlaceholderImage()];

  // Set up form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      university: university || "",
      message: `I'm interested in renting ${title} at ${address}, ${city}.`,
      termsAccepted: false
    }
  });

  // Handle image navigation
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageSources.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => prevIndex === 0 ? imageSources.length - 1 : prevIndex - 1);
  };

  // Apply for property (supports both authenticated and guest users)
  const applicationMutation = useMutation({
    mutationFn: (data: ApplicationFormValues) => {
      // For authenticated tenant users, use the regular endpoint
      if (isAuthenticated && userType === 'tenant') {
        return createApplication({
          propertyId: id,
          tenantId: user?.id,
          message: data.message || `I'm interested in renting ${title} at ${address}, ${city}.`,
        });
      } 
      // For guests or non-tenant users, use the new guest application endpoint
      else {
        return createGuestApplication({
          propertyId: id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          university: data.university || '',
          moveInDate: data.moveInDate || '',
          message: data.message || `I'm interested in renting ${title} at ${address}, ${city}.`
        });
      }
    },
    onSuccess: (response) => {
      // For authenticated users, refresh their applications list
      if (isAuthenticated && userType === 'tenant') {
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      }
      
      toast({
        title: "Application submitted!",
        description: "The landlord will contact you soon.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      setIsDialogOpen(false);
      
      // Only navigate to applications dashboard if user is logged in as tenant
      if (isAuthenticated && userType === 'tenant') {
        navigate('/dashboard/applications');
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to submit application",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Handle form submission for both logged-in and guest users
  const onSubmit = (data: ApplicationFormValues) => {
    // Store the application data for all users
    localStorage.setItem('pendingApplication', JSON.stringify({
      propertyId: id,
      propertyTitle: title,
      propertyAddress: `${address}, ${city}`,
      timestamp: new Date().toISOString(),
      ...data
    }));
    
    // Submit application for all users (both authenticated and guests)
    applicationMutation.mutate(data);
  };

  // Apply handler to open the dialog for all users
  const handleApply = () => {
    // Store the current property details in localStorage for the application process
    localStorage.setItem('selectedProperty', JSON.stringify({
      id,
      title,
      address,
      city,
      price,
      bedrooms,
      propertyType,
      university,
      timestamp: new Date().toISOString(),
    }));
    
    // Always open the dialog, regardless of authentication status
    setIsDialogOpen(true);
    
    // If property is unavailable, show a warning toast
    if (!available) {
      toast({
        title: "Property unavailable",
        description: "This property is currently unavailable for rent.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/properties" className="text-primary hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to properties
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Image gallery */}
          <div className="relative rounded-lg overflow-hidden mb-6 h-[400px]">
            <img 
              src={imageSources[currentImageIndex]} 
              alt={title} 
              className="w-full h-full object-cover"
            />
            
            {imageSources.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {imageSources.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Property details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <p className="text-lg text-gray-600 mb-2">{address}, {city}, {postcode}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">£{Number(price).toFixed(0)}</p>
                <p className="text-gray-500">per week</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col items-center p-3 bg-light rounded-lg">
                <Bed className="h-6 w-6 text-primary mb-1" />
                <span className="text-sm font-medium">{bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-light rounded-lg">
                <Bath className="h-6 w-6 text-primary mb-1" />
                <span className="text-sm font-medium">{bathrooms} {bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-light rounded-lg">
                <span className="uppercase text-xs">Type</span>
                <span className="text-sm font-medium">{propertyType}</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-light rounded-lg">
                <Badge 
                  variant={available ? "default" : "destructive"} 
                  className={`mb-1 ${available ? "bg-green-100 hover:bg-green-100 text-green-800 border-green-300" : ""}`}
                >
                  {available ? "Available" : "Unavailable"}
                </Badge>
                <span className="text-sm">{available ? "Ready to rent" : "Currently occupied"}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {features && features.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
                <div className="flex items-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>All Bills Included</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fast Broadband</span>
                </div>
              </div>
            </div>

            {/* Virtual Tour and Videos Section */}
            {(virtualTourUrl || (videos && videos.length > 0)) && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Virtual Tour & Videos</h2>
                
                {virtualTourUrl && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <PanelTopOpen className="h-5 w-5 text-primary mr-2" />
                      3D Virtual Tour
                    </h3>
                    <div className="bg-light rounded-lg p-4">
                      <p className="mb-2">Experience this property in immersive 3D:</p>
                      <a 
                        href={virtualTourUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        <Button variant="outline" className="gap-2">
                          <PanelTopOpen className="h-4 w-4" />
                          Open Virtual Tour
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
                
                {videos && videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Video className="h-5 w-5 text-primary mr-2" />
                      Property Videos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((videoUrl, index) => (
                        <div key={index} className="bg-light rounded-lg p-4">
                          <p className="mb-2">Video Tour {index + 1}:</p>
                          <a 
                            href={videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center text-primary hover:underline"
                          >
                            <Button variant="outline" className="gap-2">
                              <Video className="h-4 w-4" />
                              Watch Video
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {university && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Location</h2>
                <div className="flex items-center mb-2">
                  <School className="h-5 w-5 text-primary mr-2" />
                  <span>{university}</span>
                </div>
                {distanceToUniversity && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-2" />
                    <span>{distanceToUniversity} from university</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Interested in this property?</CardTitle>
              <CardDescription>Apply now to secure your student accommodation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <span>12-month tenancy</span>
                </div>
                <div className="flex items-center">
                  <Wifi className="h-5 w-5 text-primary mr-2" />
                  <span>All utilities included</span>
                </div>
                <div className="flex items-center text-primary font-medium">
                  <span className="mr-1">£{(Number(price) * 4).toFixed(0)}</span>
                  <span className="text-gray-500 font-normal">per month</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch">
              <Button 
                className="w-full mb-3" 
                onClick={handleApply}
                disabled={!available || applicationMutation.isPending}
              >
                {applicationMutation.isPending ? "Submitting..." : "Apply Now"}
              </Button>
              
              {!available && (
                <div className="text-sm text-center text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  This property is currently unavailable
                </div>
              )}
              
              <div className="text-sm text-center text-gray-500 mt-2">
                No commitment to apply, just register your interest
              </div>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All-Inclusive Living</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Electricity, Gas & Water</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>High-Speed Internet</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secured Deposit Scheme</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Online Contract Signing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Apply for {title}</DialogTitle>
            <DialogDescription>
              Anyone can apply! No login required - just fill in your details below to register your interest in this property.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md pl-3 bg-background">
                        <User className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input 
                          placeholder="Enter your full name" 
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md pl-3 bg-background">
                        <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input 
                          placeholder="Enter your email" 
                          type="email" 
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md pl-3 bg-background">
                        <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input 
                          placeholder="Enter your phone number" 
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
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
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md pl-3 bg-background">
                        <School className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input 
                          placeholder="Enter your university" 
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Move-in Date (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md pl-3 bg-background">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        <Input 
                          type="date" 
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself and why you're interested in this property" 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        I agree to the <a href="/terms" className="text-primary hover:underline">terms and conditions</a>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={applicationMutation.isPending}
                >
                  {applicationMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Submit Application
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
