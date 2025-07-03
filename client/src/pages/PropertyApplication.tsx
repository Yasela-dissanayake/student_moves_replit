import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Calendar, Home, Users, ChevronRight, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function PropertyApplication() {
  const { propertyId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loading: isLoadingAuth, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() + 1))
  );
  const [message, setMessage] = useState('');
  const [isGroupApplication, setIsGroupApplication] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Array<{ name: string; email: string; }>>(
    [{ name: '', email: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rightToRentConfirmed, setRightToRentConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: () => apiRequest('GET', `/api/properties/${propertyId}`).then(res => res.json()),
    enabled: !!propertyId,
  });

  // Guest applications are now supported
  // We don't need to redirect to login anymore
  // The application can be submitted by guests directly from the property detail page
  useEffect(() => {
    // This property application page is only for authenticated users
    // Guests should use the dialog on the property detail page
    if (!isLoadingAuth && !isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for properties using this form. Alternatively, you can apply as a guest from the property detail page.',
        variant: 'destructive'
      });
      navigate(`/login?redirect=/properties/${propertyId}/apply`);
    }
  }, [isLoadingAuth, isAuthenticated, navigate, propertyId, toast]);

  // Toggle group application based on property bedrooms
  useEffect(() => {
    if (property && property.bedrooms > 1) {
      setIsGroupApplication(true);
    }
  }, [property]);

  // Add a group member
  const addGroupMember = () => {
    if (property && groupMembers.length < property.bedrooms - 1) {
      setGroupMembers([...groupMembers, { name: '', email: '' }]);
    } else {
      toast({
        title: 'Maximum Group Size Reached',
        description: `This property can only accommodate ${property?.bedrooms} tenants.`,
        variant: 'destructive'
      });
    }
  };

  // Remove a group member
  const removeGroupMember = (index: number) => {
    const newGroupMembers = [...groupMembers];
    newGroupMembers.splice(index, 1);
    setGroupMembers(newGroupMembers);
  };

  // Update group member details
  const updateGroupMember = (index: number, field: 'name' | 'email', value: string) => {
    const newGroupMembers = [...groupMembers];
    newGroupMembers[index][field] = value;
    setGroupMembers(newGroupMembers);
  };

  // Submit application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) throw new Error('Property ID is missing');
      
      const endpoint = isGroupApplication 
        ? `/api/properties/${propertyId}/apply-group`
        : `/api/properties/${propertyId}/apply`;
      
      const payload = {
        message,
        moveInDate,
        ...(isGroupApplication && { groupMembers })
      };
      
      return apiRequest('POST', endpoint, payload).then(res => res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      
      toast({
        title: 'Application Submitted',
        description: isGroupApplication 
          ? 'Your group application has been submitted successfully. We will contact you soon.'
          : 'Your application has been submitted successfully. We will contact you soon.',
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!propertyId) {
      toast({
        title: 'Error',
        description: 'Property information is missing',
        variant: 'destructive'
      });
      return;
    }
    
    if (!moveInDate) {
      toast({
        title: 'Error',
        description: 'Please select a preferred move-in date',
        variant: 'destructive'
      });
      return;
    }
    
    if (!rightToRentConfirmed) {
      toast({
        title: 'Right to Rent Required',
        description: 'You must confirm your eligibility to rent in the UK',
        variant: 'destructive'
      });
      return;
    }
    
    if (!termsAccepted) {
      toast({
        title: 'Terms & Conditions',
        description: 'You must accept the terms and conditions to proceed',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate group members if it's a group application
    if (isGroupApplication) {
      const invalidMembers = groupMembers.filter(member => !member.name || !member.email);
      if (invalidMembers.length > 0) {
        toast({
          title: 'Incomplete Group Information',
          description: 'Please provide name and email for all group members',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate emails
      const invalidEmails = groupMembers.filter(member => {
        return !member.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
      
      if (invalidEmails.length > 0) {
        toast({
          title: 'Invalid Email Addresses',
          description: 'Please provide valid email addresses for all group members',
          variant: 'destructive'
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    submitApplicationMutation.mutate();
  };

  if (isLoadingAuth || isLoadingProperty) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold">Loading property information...</h2>
        </div>
      </div>
    );
  }

  if (!propertyId || !property) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
          <p className="mb-6">The property you are looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/properties')}>
            Browse Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <ChevronRight className="h-4 w-4" />
        <a href="/properties" className="hover:text-primary transition-colors">Properties</a>
        <ChevronRight className="h-4 w-4" />
        <a href={`/properties/${propertyId}`} className="hover:text-primary transition-colors">Property Details</a>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Apply</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Property Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="move-in-date">Preferred Move-in Date</Label>
                  <div className="flex">
                    <DatePicker
                      date={moveInDate}
                      onSelect={setMoveInDate}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred date to move in
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message to Landlord (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Introduce yourself and explain why you're interested in this property..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                
                {property.bedrooms > 1 && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Group Application</h3>
                        <p className="text-sm text-muted-foreground">
                          This is a {property.bedrooms} bedroom property suitable for group tenancy
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="group-application"
                          checked={isGroupApplication}
                          onCheckedChange={(checked) => setIsGroupApplication(checked as boolean)}
                        />
                        <Label htmlFor="group-application" className="font-normal">
                          Apply as a group
                        </Label>
                      </div>
                    </div>
                    
                    {isGroupApplication && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-md border">
                          <div className="font-medium flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4" />
                            <span>Group Member Details</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add details of other tenants who will be sharing this property with you.
                            They will be invited to create accounts and complete their profiles.
                          </p>
                          
                          {groupMembers.map((member, index) => (
                            <div key={index} className="border-t pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
                              <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">Group Member {index + 1}</span>
                                {index > 0 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeGroupMember(index)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`member-name-${index}`}>Name</Label>
                                  <Input
                                    id={`member-name-${index}`}
                                    value={member.name}
                                    onChange={(e) => updateGroupMember(index, 'name', e.target.value)}
                                    placeholder="Full name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`member-email-${index}`}>Email</Label>
                                  <Input
                                    id={`member-email-${index}`}
                                    type="email"
                                    value={member.email}
                                    onChange={(e) => updateGroupMember(index, 'email', e.target.value)}
                                    placeholder="Email address"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {groupMembers.length < property.bedrooms - 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-4 w-full"
                              onClick={addGroupMember}
                            >
                              Add Another Group Member
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="right-to-rent" 
                      checked={rightToRentConfirmed}
                      onCheckedChange={(checked) => setRightToRentConfirmed(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="right-to-rent"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Right to Rent Declaration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I confirm that I have the right to rent property in the UK as defined by the 
                        Immigration Act 2014, and agree to provide documentation as required.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Terms & Conditions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and 
                        <a href="#" className="text-primary hover:underline"> Privacy Policy</a>.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !rightToRentConfirmed || !termsAccepted}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={property.imageUrl || "https://placehold.co/600x400?text=Property+Image"} 
                  alt={property.title}
                  className="w-full h-40 object-cover"
                />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{property.title}</h3>
                <p className="text-muted-foreground">{property.address}, {property.city}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded flex flex-col items-center justify-center">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">£{property.price}/month</span>
                </div>
                <div className="bg-gray-50 p-2 rounded flex flex-col items-center justify-center">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-semibold">{property.propertyType}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded flex flex-col items-center justify-center">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-semibold">{property.bedrooms}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded flex flex-col items-center justify-center">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-semibold">{property.bathrooms}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">About this Property</h4>
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {property.description}
                </p>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => navigate(`/properties/${propertyId}`)}>
                <Home className="mr-2 h-4 w-4" />
                View Full Property Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}