import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, VideoIcon, Check } from 'lucide-react';
import { PropertyType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { createViewingRequest } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Define form schema
const requestViewingSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(9, { message: "Please enter a valid phone number" }),
  university: z.string().optional(),
  preferredDate: z.date({ required_error: "Please select a date" }),
  preferredTime: z.enum(["morning", "afternoon", "evening"], {
    required_error: "Please select a preferred time",
  }),
  message: z.string().optional(),
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "You must accept the terms and conditions",
  }),
  // Enhanced fields
  isGroupViewing: z.boolean().default(false),
  groupMembers: z.array(
    z.object({
      name: z.string().min(2, { message: "Name is required" }).optional(),
      email: z.string().email({ message: "Please enter a valid email address" }).optional(),
      phone: z.string().optional(),
    })
  ).optional().default([]),
  timePreference: z.object({
    weekdays: z.boolean().default(true),
    weekends: z.boolean().default(false),
    eveningsOnly: z.boolean().default(false),
  }).default({
    weekdays: true,
    weekends: false,
    eveningsOnly: false,
  }),
  alternativeDates: z.array(z.date()).optional().default([]),
  virtualViewingRequested: z.boolean().default(false),
  virtualViewingType: z.enum(["recorded", "live"]).optional(),
  isVerifiedStudent: z.boolean().default(false),
});

type RequestViewingFormValues = z.infer<typeof requestViewingSchema>;

export default function RequestViewing() {
  const { propertyId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch property data
  const { data: property, isLoading } = useQuery<PropertyType>({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property');
      }
      return response.json();
    }
  });

  // Set up form
  const form = useForm<RequestViewingFormValues>({
    resolver: zodResolver(requestViewingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      university: "",
      message: "",
      termsAccepted: false,
      // Enhanced viewing options
      isGroupViewing: false,
      groupMembers: [{}, {}],
      timePreference: {
        weekdays: true,
        weekends: false,
        eveningsOnly: false
      },
      alternativeDates: [],
      virtualViewingRequested: false,
      isVerifiedStudent: false
    }
  });

  // Get stored property data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('viewingProperty');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      // Check if stored data matches current property ID
      if (parsedData.id === Number(propertyId)) {
        // Auto-fill form with any data from logged-in user
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          form.setValue('name', user.name || '');
          form.setValue('email', user.email || '');
          form.setValue('phone', user.phone || '');
          if (property?.university) {
            form.setValue('university', property.university);
          }
        }
      }
    }
  }, [form, propertyId, property]);

  // Submit viewing request
  const submitRequest = async (data: RequestViewingFormValues) => {
    setIsSubmitting(true);
    try {
      // Format date for submission
      const formattedDate = format(data.preferredDate, 'yyyy-MM-dd');
      
      // Format alternative dates if provided
      const formattedAlternativeDates = data.alternativeDates && data.alternativeDates.length > 0
        ? data.alternativeDates.map(date => format(date, 'yyyy-MM-dd'))
        : [];
      
      // Prepare viewing request data with enhanced fields
      const viewingRequest = {
        // Basic information
        propertyId: Number(propertyId),
        name: data.name,
        email: data.email,
        phone: data.phone,
        university: data.university || '',
        preferredDate: formattedDate,
        preferredTime: data.preferredTime,
        message: data.message || `I'd like to schedule a viewing for ${property?.title}.`,
        
        // Enhanced fields
        isGroupViewing: data.isGroupViewing,
        groupMembers: data.isGroupViewing ? data.groupMembers.filter(member => member.name || member.email) : [],
        timePreference: data.timePreference,
        alternativeDates: formattedAlternativeDates,
        virtualViewingRequested: data.virtualViewingRequested,
        virtualViewingType: data.virtualViewingRequested ? data.virtualViewingType : undefined,
        isVerifiedStudent: data.isVerifiedStudent,
      };
      
      // Submit request using the API function
      await createViewingRequest(viewingRequest);
      
      // Show success message
      toast({
        title: "Viewing request submitted!",
        description: "We'll be in touch shortly to confirm your viewing.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      // Redirect back to property page
      navigate(`/properties/${propertyId}`);
    } catch (error) {
      console.error('Error submitting viewing request:', error);
      toast({
        title: "Error submitting request",
        description: "Please try again later or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="mb-6 text-gray-600">
              The property you're looking for might have been removed or is no longer available.
            </p>
            <Button
              onClick={() => navigate('/properties')}
              className="mx-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        size="sm"
        className="mb-6"
        onClick={() => navigate(`/properties/${propertyId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Property
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Request a Viewing</CardTitle>
              <CardDescription>
                Complete the form below to arrange a viewing of this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submitRequest)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
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
                            <Input placeholder="john.smith@example.com" {...field} />
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
                            <Input placeholder="07123456789" {...field} />
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
                            <Input placeholder="University of Example" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Preferred Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  <CalendarDays className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  // Disable dates in the past and Sundays
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today || date.getDay() === 0;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Select a date for your viewing (Sundays excluded)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="preferredTime"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Preferred Time</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="morning" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Morning (9am - 12pm)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="afternoon" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Afternoon (12pm - 5pm)
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="evening" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Evening (5pm - 8pm)
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Let us know if you have any specific questions or requirements..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2 text-blue-800 flex items-center">
                      <VideoIcon className="mr-2 h-5 w-5" />
                      Enhanced Viewing Options
                    </h3>
                    
                    <Tabs defaultValue="schedule" className="mt-2">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="schedule">Scheduling</TabsTrigger>
                        <TabsTrigger value="group">Group Viewing</TabsTrigger>
                        <TabsTrigger value="virtual">Virtual Options</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="schedule" className="pt-4 px-1">
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-2">
                            <span className="font-medium text-sm">Time Preferences</span>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <FormField
                                control={form.control}
                                name="timePreference.weekdays"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">Weekdays</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="timePreference.weekends"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">Weekends</FormLabel>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="timePreference.eveningsOnly"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Switch 
                                        checked={field.value} 
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">Evenings Only</FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="alternativeDates"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alternative Dates (Optional)</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                      >
                                        <CalendarDays className="mr-2 h-4 w-4" />
                                        {field.value && field.value.length > 0 ? (
                                          `${field.value.length} date${field.value.length > 1 ? 's' : ''} selected`
                                        ) : (
                                          <span>Select alternative dates</span>
                                        )}
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="multiple"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return date < today || date.getDay() === 0;
                                      }}
                                      initialFocus
                                      max={3}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Add up to 3 alternative dates if you're flexible
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="group" className="pt-4 px-1">
                        <FormField
                          control={form.control}
                          name="isGroupViewing"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 mb-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Group Viewing
                                </FormLabel>
                                <FormDescription>
                                  I'm bringing friends or potential housemates to the viewing
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("isGroupViewing") && (
                          <div className="border border-gray-200 rounded-md p-3 mb-4">
                            <div className="flex items-center mb-2">
                              <Users className="h-5 w-5 mr-2 text-primary" />
                              <h4 className="font-medium">Group Members</h4>
                            </div>
                            
                            <div className="space-y-4">
                              {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="space-y-3 border-t pt-3 first:border-0 first:pt-0">
                                  <h5 className="text-sm font-medium">Person {index + 1}</h5>
                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={form.control}
                                      name={`groupMembers.${index}.name`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input placeholder="Name" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`groupMembers.${index}.email`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input placeholder="Email" {...field} />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="virtual" className="pt-4 px-1">
                        <FormField
                          control={form.control}
                          name="virtualViewingRequested"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0 mb-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Request Virtual Viewing
                                </FormLabel>
                                <FormDescription>
                                  I'd like to view this property virtually before/instead of in-person
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("virtualViewingRequested") && (
                          <FormField
                            control={form.control}
                            name="virtualViewingType"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Virtual Viewing Option</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="recorded" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Recorded Video Tour
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="live" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Live Video Call Tour
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isVerifiedStudent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <Check className="mr-1 h-4 w-4 text-green-600" />
                            I am a verified student
                          </FormLabel>
                          <FormDescription>
                            Check this if you're currently enrolled at a university
                          </FormDescription>
                        </div>
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
                          <FormLabel>
                            I agree to the terms and conditions
                          </FormLabel>
                          <FormDescription>
                            We'll contact you to confirm your viewing time.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Submitting Request...
                      </>
                    ) : (
                      "Submit Viewing Request"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Property Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Property Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{property.title}</h3>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{property.address}, {property.city}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">£{property.price}/week</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{property.propertyType}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="font-medium">{property.availableDate}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Viewing Information</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Viewings typically last 30-45 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary mt-0.5" />
                    <span>Please arrive 5 minutes before your scheduled time</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}