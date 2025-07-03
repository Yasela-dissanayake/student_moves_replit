import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  MapPin,
  Star,
  Wrench,
  Phone,
  Mail,
  Briefcase,
  Check,
  Clock,
  ThumbsUp,
  Search,
  Calendar,
  PoundSterling,
  Filter,
  CheckCheck,
  AlertCircle,
  Building2,
  UserCheck
} from "lucide-react";

// Define form schema
const formSchema = z.object({
  tradeType: z.string(),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  propertyId: z.string().optional(),
  radius: z.number().min(1).max(50),
  urgency: z.enum(["immediate", "within_week", "within_month", "not_urgent"]),
});

interface TradesmanFinderProps {
  userType: 'landlord' | 'agent';
  propertyData?: any;
  onTradesmanSelect?: (tradesman: any) => void;
}

interface Tradesman {
  id: string;
  name: string;
  company: string;
  trade: string;
  rating: number;
  reviews: number;
  distance: number;
  location: string;
  profileImage: string;
  availability: string;
  phone: string;
  email: string;
  website: string;
  yearsInBusiness: number;
  certifications: string[];
  estimatedCalloutFee: string;
  verified: boolean;
}

export default function TradesmanFinder({ userType, propertyData, onTradesmanSelect }: TradesmanFinderProps) {
  const { toast } = useToast();
  const [selectedTradesman, setSelectedTradesman] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  
  // Setup form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tradeType: "",
      location: propertyData?.postcode || "",
      propertyId: propertyData?.id?.toString() || "",
      radius: 10,
      urgency: "not_urgent",
    },
  });
  
  // Query to fetch tradespeople
  const { data: tradesmen, isLoading, refetch } = useQuery({
    queryKey: ['/api/tradesman-finder', form.watch()],
    enabled: false,
  });
  
  // Mutation to search for tradespeople
  const searchMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      return apiRequest('POST', '/api/tradesman-finder/search', values);
    },
    onSuccess: (data) => {
      refetch();
      setActiveTab('results');
      toast({
        title: "Search Complete",
        description: `Found ${data.length} tradespeople matching your criteria.`,
      });
    },
    onError: () => {
      toast({
        title: "Search Failed",
        description: "Unable to find tradespeople. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    searchMutation.mutate(values);
  };
  
  // Handle contact with tradesperson
  const handleContact = (tradesman: Tradesman) => {
    if (onTradesmanSelect) {
      onTradesmanSelect(tradesman);
    } else {
      toast({
        title: "Contact Information",
        description: `${tradesman.name}: ${tradesman.phone} | ${tradesman.email}`,
      });
    }
  };
  
  // Format certification badges
  const renderCertifications = (certifications: string[]) => {
    return certifications.map((cert, index) => (
      <Badge key={index} variant="outline" className="flex items-center gap-1 mr-1 mb-1">
        <CheckCheck className="h-3 w-3" />
        {cert}
      </Badge>
    ));
  };
  
  // Render star rating
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Find Local Tradespeople</h2>
        <p className="text-muted-foreground">
          AI-powered search for verified contractors via Checkatrade
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="search" className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1" disabled={!tradesmen}>
            <UserCheck className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Find a Tradesperson</CardTitle>
              <CardDescription>
                Search for qualified and vetted tradespeople near your property
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tradeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a trade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="plumber">Plumber</SelectItem>
                              <SelectItem value="electrician">Electrician</SelectItem>
                              <SelectItem value="carpenter">Carpenter</SelectItem>
                              <SelectItem value="builder">Builder</SelectItem>
                              <SelectItem value="locksmith">Locksmith</SelectItem>
                              <SelectItem value="painter">Painter & Decorator</SelectItem>
                              <SelectItem value="roofer">Roofer</SelectItem>
                              <SelectItem value="heating_engineer">Heating Engineer</SelectItem>
                              <SelectItem value="plasterer">Plasterer</SelectItem>
                              <SelectItem value="gardener">Gardener</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Postcode)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} placeholder="e.g. SW1A 1AA" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {propertyData?.id && (
                    <FormField
                      control={form.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={propertyData.id.toString()}>
                                {propertyData.address}
                              </SelectItem>
                              {/* Additional properties would be listed here */}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Link this search to a specific property
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="radius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Radius: {field.value} miles</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={50}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Adjust the search radius to find tradespeople in your area
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Emergency (Today)</SelectItem>
                            <SelectItem value="within_week">Urgent (Within a week)</SelectItem>
                            <SelectItem value="within_month">Standard (Within a month)</SelectItem>
                            <SelectItem value="not_urgent">Not Urgent (Flexible timing)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This helps match tradespeople with appropriate availability
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={searchMutation.isPending}
                  >
                    {searchMutation.isPending ? (
                      <>Searching...</>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Find Tradespeople
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col text-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Powered by Checkatrade's database of verified professionals
              </p>
              <div className="flex items-center justify-center mt-2">
                <img 
                  src="https://www.checkatrade.com/images/checkatrade-logo.svg" 
                  alt="Checkatrade"
                  className="h-5 opacity-75"
                />
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[125px] w-full rounded-lg" />
              <Skeleton className="h-[125px] w-full rounded-lg" />
              <Skeleton className="h-[125px] w-full rounded-lg" />
            </div>
          ) : tradesmen && tradesmen.length > 0 ? (
            <div className="space-y-4">
              {tradesmen.map((tradesman: Tradesman) => (
                <Card 
                  key={tradesman.id}
                  className={selectedTradesman === tradesman.id ? 'ring-2 ring-primary' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={tradesman.profileImage} alt={tradesman.name} />
                          <AvatarFallback>
                            {tradesman.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {tradesman.name}
                            {tradesman.verified && (
                              <Badge className="ml-2 gap-1 bg-blue-500">
                                <CheckCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5" />
                            {tradesman.company}
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {tradesman.trade}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {renderRating(tradesman.rating)}
                        <p className="text-xs text-muted-foreground">{tradesman.reviews} reviews</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3 pt-0">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {tradesman.distance} miles away
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {tradesman.availability}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Briefcase className="h-3 w-3" />
                        {tradesman.yearsInBusiness} years in business
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <PoundSterling className="h-3 w-3" />
                        {tradesman.estimatedCalloutFee} callout
                      </Badge>
                    </div>
                    
                    {selectedTradesman === tradesman.id && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Certifications & Qualifications</h4>
                          <div className="flex flex-wrap mt-1">
                            {renderCertifications(tradesman.certifications)}
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div>
                            <h4 className="text-xs text-muted-foreground mb-1">Phone</h4>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {tradesman.phone}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs text-muted-foreground mb-1">Email</h4>
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" />
                              {tradesman.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex gap-2 pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedTradesman(
                        selectedTradesman === tradesman.id ? null : tradesman.id
                      )}
                    >
                      {selectedTradesman === tradesman.id ? 'Less Details' : 'More Details'}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleContact(tradesman)}
                    >
                      Contact
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Tradespeople Found</h3>
                <p className="text-muted-foreground max-w-md mt-2 mb-4">
                  We couldn't find any tradespeople matching your criteria. Try adjusting your search parameters or expanding your search radius.
                </p>
                <Button onClick={() => setActiveTab('search')}>Modify Search</Button>
              </CardContent>
            </Card>
          )}
          
          {tradesmen && tradesmen.length > 0 && (
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-md">
                <ThumbsUp className="h-4 w-4" />
                <span>All professionals are verified through Checkatrade's rigorous vetting process</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}