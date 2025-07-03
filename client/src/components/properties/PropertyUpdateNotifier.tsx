import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  BellRing, 
  Check, 
  AlertTriangle, 
  Mail, 
  Phone, 
  MessageSquare,
  AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define schema for the form
const notificationSchema = z.object({
  updateType: z.enum([
    "price",
    "availability",
    "description",
    "features",
    "photos",
    "virtual_tour",
    "custom"
  ], {
    required_error: "Please select an update type",
  }),
  newValue: z.string().optional(),
  previousValue: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long").max(500, "Message cannot exceed 500 characters"),
  sendToApplicants: z.boolean().default(true),
  sendToTenants: z.boolean().default(false),
});

type NotificationForm = z.infer<typeof notificationSchema>;

interface PropertyUpdateNotifierProps {
  property: Property;
  onNotificationSent?: () => void;
}

export function PropertyUpdateNotifier({ property, onNotificationSent }: PropertyUpdateNotifierProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCustomUpdate, setIsCustomUpdate] = useState(false);

  // Set up form with validation
  const form = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      updateType: "custom",
      message: `Hi there! I wanted to let you know about an important update to ${property.title}.`,
      sendToApplicants: true,
      sendToTenants: false,
    },
  });

  // Handle update type change
  const handleUpdateTypeChange = (value: string) => {
    setIsCustomUpdate(value === "custom");
    
    // Set default message based on update type
    let defaultMessage = "";
    switch (value) {
      case "price":
        defaultMessage = `Great news! We've adjusted the price for ${property.title}. This property is now available at a new rate.`;
        break;
      case "availability":
        defaultMessage = `Update on ${property.title}: The availability status of this property has changed.`;
        break;
      case "description":
        defaultMessage = `We've updated the description for ${property.title} with new information about the property.`;
        break;
      case "features":
        defaultMessage = `Good news! We've added new features to ${property.title} that we thought you'd be interested in.`;
        break;
      case "photos":
        defaultMessage = `We've added new photos of ${property.title}. Take a look to see more of this beautiful property!`;
        break;
      case "virtual_tour":
        defaultMessage = `A new virtual tour is now available for ${property.title}. Experience the property from the comfort of your home!`;
        break;
      case "custom":
        defaultMessage = `Hi there! I wanted to let you know about an important update to ${property.title}.`;
        break;
    }
    
    form.setValue("message", defaultMessage);
  };

  // Mutation for sending notifications
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationForm) => {
      const response = await apiRequest("POST", "/api/properties/notifications", {
        propertyId: property.id,
        senderUserId: user?.id,
        ...data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send notifications");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications sent successfully",
        description: `Sent to ${data.recipientCount} recipient(s)`,
        variant: "default",
      });
      
      // Reset form
      form.reset({
        updateType: "custom",
        message: `Hi there! I wanted to let you know about an important update to ${property.title}.`,
        sendToApplicants: true,
        sendToTenants: false,
      });
      
      // Call the callback if provided
      if (onNotificationSent) {
        onNotificationSent();
      }
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${property.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send notifications",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: NotificationForm) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to send notifications",
        variant: "destructive",
      });
      return;
    }
    
    notificationMutation.mutate(data);
  };

  // Check if we have required WhatsApp integration credentials
  const [missingWhatsAppCredentials, setMissingWhatsAppCredentials] = useState(false);
  React.useEffect(() => {
    const checkWhatsAppCredentials = async () => {
      try {
        const response = await apiRequest("GET", "/api/whatsapp/status");
        const data = await response.json();
        setMissingWhatsAppCredentials(!data.configured);
      } catch (error) {
        setMissingWhatsAppCredentials(true);
      }
    };
    
    checkWhatsAppCredentials();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Property Update Notification</CardTitle>
        <CardDescription>
          Notify applicants or tenants about changes to this property via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        {missingWhatsAppCredentials && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>WhatsApp integration not configured</AlertTitle>
            <AlertDescription>
              WhatsApp integration requires additional configuration. Contact the administrator to set up WhatsApp credentials.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="updateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleUpdateTypeChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select update type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="price">Price Update</SelectItem>
                      <SelectItem value="availability">Availability Update</SelectItem>
                      <SelectItem value="description">Description Update</SelectItem>
                      <SelectItem value="features">Features Update</SelectItem>
                      <SelectItem value="photos">New Photos</SelectItem>
                      <SelectItem value="virtual_tour">Virtual Tour Update</SelectItem>
                      <SelectItem value="custom">Custom Update</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of update you're notifying about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("updateType") === "price" && (
              <>
                <FormField
                  control={form.control}
                  name="previousValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Price (£/week)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 100" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        The previous price of the property (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Price (£/week)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={`e.g. ${property.price}`} 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        The new price of the property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {form.watch("updateType") === "availability" && (
              <FormField
                control={form.control}
                name="newValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Availability Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The new availability status of the property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your notification message" 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be sent to the selected recipients
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-2">
              <FormField
                control={form.control}
                name="sendToApplicants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium leading-none">
                        Send to applicants
                      </FormLabel>
                      <FormDescription>
                        Notify people who have applied for this property
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sendToTenants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium leading-none">
                        Send to current tenants
                      </FormLabel>
                      <FormDescription>
                        Notify current tenants of this property
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={notificationMutation.isPending || missingWhatsAppCredentials}
            >
              {notificationMutation.isPending ? (
                <>Sending Notifications...</>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Notifications
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-start space-y-2 pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <BellRing className="mr-1 h-3 w-3" />
          <span>Notifications are sent via WhatsApp and require user opt-in</span>
        </div>
      </CardFooter>
    </Card>
  );
}