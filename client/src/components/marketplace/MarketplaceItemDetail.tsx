import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Carousel,
} from '@/components/ui/carousel';
import { apiRequest } from '@/lib/queryClient';
import {
  ChevronLeft,
  ShoppingBag,
  MapPin,
  Calendar,
  User,
  MessageCircle,
  Heart,
  Share2,
  Flag,
  AlertCircle,
  CheckCircle2,
  Shield,
  Truck,
  Clock,
  Info,
  Eye,
  XCircle,
  Image as ImageIcon,
  CreditCard,
  BookOpen,
  Coffee,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';

// Type definitions
type MarketplaceItem = {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: string[];
  location: string;
  createdAt: string;
  userId: number;
  sellerName: string;
  aiVerified: boolean;
  meetInPerson: boolean;
  canDeliver: boolean;
  tags: string[];
  listingStatus: string;
  viewCount: number;
  savedCount: number;
  distance?: number;
};

type SimilarItem = {
  id: number;
  title: string;
  price: string;
  images: string[];
  location: string;
  distance?: number;
};

export function MarketplaceItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  
  // Format the price
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(parseFloat(price));
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else {
      return `${distance.toFixed(1)} km away`;
    }
  };
  
  // Fetch item details
  const {
    data: item,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [`/api/marketplace/items/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/items/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      const data = await response.json();
      return data.item as MarketplaceItem;
    },
  });
  
  // Fetch similar items
  const {
    data: similarItems,
    isLoading: isSimilarItemsLoading,
  } = useQuery({
    queryKey: [`/api/marketplace/items/${id}/similar`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/items/${id}/similar`);
      if (!response.ok) throw new Error('Failed to fetch similar items');
      const data = await response.json();
      return data.items as SimilarItem[];
    },
    enabled: !!item,
  });
  
  // Make an offer
  const makeOfferMutation = useMutation({
    mutationFn: async (data: { amount: string; note: string }) => {
      return apiRequest(`/api/marketplace/items/${id}/offer`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Offer sent',
        description: 'Your offer has been sent to the seller',
      });
      setIsOfferModalOpen(false);
      setOfferAmount('');
      setOfferNote('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to send offer',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Buy item directly
  const buyItemMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/marketplace/items/${id}/buy`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Purchase successful',
        description: 'You have successfully purchased this item',
      });
      
      // Redirect to transaction page
      if (data && data.transactionId) {
        setLocation(`/marketplace/transactions/${data.transactionId}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Save/Unsave item
  const toggleSaveMutation = useMutation({
    mutationFn: async (isSaved: boolean) => {
      console.log('Client - toggleSaveMutation called with isSaved =', isSaved);
      console.log('Client - Will send { saved:', !isSaved, '} to server');
      return apiRequest(`/api/marketplace/items/${id}/save`, {
        method: 'POST',
        body: JSON.stringify({ saved: !isSaved }),
      });
    },
    onSuccess: (data, variables) => {
      console.log('Client - Save mutation success, received data:', data);
      console.log('Client - Original isSaved value was:', variables);
      toast({
        title: variables ? 'Item removed from saved' : 'Item saved',
        description: variables
          ? 'This item has been removed from your saved items'
          : 'This item has been saved to your profile',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/items/${id}`] });
    },
    onError: (error) => {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Report item
  const reportItemMutation = useMutation({
    mutationFn: async (data: { reason: string; description: string }) => {
      return apiRequest(`/api/marketplace/items/${id}/report`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: 'Thank you for your report. We will review it shortly.',
      });
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit report',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Send message to seller
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return apiRequest(`/api/marketplace/items/${id}/message`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Your message has been sent to the seller',
      });
      setIsMessageModalOpen(false);
      setMessageContent('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle offer submission
  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offerAmount) {
      toast({
        title: 'Offer amount required',
        description: 'Please enter an offer amount',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if offer amount is valid
    const numericAmount = parseFloat(offerAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid offer amount',
        description: 'Please enter a valid offer amount',
        variant: 'destructive',
      });
      return;
    }
    
    // Don't allow offers higher than the listing price
    if (item && numericAmount >= parseFloat(item.price)) {
      toast({
        title: 'Offer too high',
        description: 'Your offer should be less than the listing price. Consider using Buy Now instead.',
        variant: 'destructive',
      });
      return;
    }
    
    makeOfferMutation.mutate({
      amount: offerAmount,
      note: offerNote,
    });
  };
  
  // Handle report submission
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason) {
      toast({
        title: 'Reason required',
        description: 'Please select a reason for your report',
        variant: 'destructive',
      });
      return;
    }
    
    if (!reportDescription.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide details about your report',
        variant: 'destructive',
      });
      return;
    }
    
    reportItemMutation.mutate({
      reason: reportReason,
      description: reportDescription,
    });
  };
  
  // Handle message submission
  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessageMutation.mutate({
      message: messageContent,
    });
  };
  
  // Handle buy now
  const handleBuyNow = () => {
    buyItemMutation.mutate();
  };
  
  // Handle save/unsave
  const handleToggleSave = () => {
    if (item) {
      console.log('Client - handleToggleSave called for item:', item.id);
      console.log('Client - item.savedByCurrentUser before toggle:', item.savedByCurrentUser);
      console.log('Client - Passing to mutation:', !!item.savedByCurrentUser);
      toggleSaveMutation.mutate(!!item.savedByCurrentUser);
    } else {
      console.error('Client - handleToggleSave called but item is undefined');
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/marketplace')}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="h-6 bg-gray-200 animate-pulse rounded w-40"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-square bg-gray-200 animate-pulse rounded-md"></div>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-md"></div>
              ))}
            </div>
            <div className="h-8 bg-gray-200 animate-pulse rounded w-full max-w-md"></div>
            <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 bg-gray-200 animate-pulse rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError || !item) {
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
        
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-6">
            The item you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation('/marketplace')}>
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }
  
  // Determine if the item is sold/unavailable
  const isItemAvailable = item.listingStatus === 'active';
  
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
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Images and Description */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image Carousel */}
          <div className="bg-gray-100 rounded-md overflow-hidden">
            {item.images && item.images.length > 0 ? (
              <Carousel>
                <CarouselContent>
                  {item.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square relative">
                        <img 
                          src={image} 
                          alt={`${item.title} - Image ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        
                        {item.aiVerified && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              AI Verified
                            </div>
                          </div>
                        )}
                        
                        {!isItemAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-red-600 text-white px-4 py-2 rounded-md text-lg font-bold">
                              SOLD
                            </div>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            ) : (
              <div className="aspect-square flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {item.images.map((image, index) => (
                <div 
                  key={index}
                  className={`aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer border-2 ${
                    currentImageIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${item.title} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Item Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="student-lifestyle">Student Lifestyle</TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Listed on {formatDate(item.createdAt)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{item.viewCount} views</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>{item.savedCount} saves</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Description</h3>
                    <p className="whitespace-pre-line">{item.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Category</h3>
                      <p className="capitalize">{item.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Condition</h3>
                      <p className="capitalize">{item.condition.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="capitalize">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Student Lifestyle Tab */}
            <TabsContent value="student-lifestyle">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2 text-blue-800">Why this matters for students</h3>
                  <p className="text-blue-700 mb-4">Here's how this item can help your student life:</p>
                  
                  {/* Dynamic content based on category */}
                  {item.category === 'textbooks' && (
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Save on textbook costs</h4>
                          <p className="text-blue-700">Textbooks can cost hundreds of pounds new. Buying used can save you 50-70% off retail prices.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Verified course materials</h4>
                          <p className="text-blue-700">This book has been used by other students for the same courses you're taking.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {item.category === 'electronics' && (
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Budget-friendly tech</h4>
                          <p className="text-blue-700">Get the tech you need for your studies without paying full retail price.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Pre-tested by students</h4>
                          <p className="text-blue-700">This item has been used by other students and is known to be reliable for student needs.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {item.category === 'furniture' && (
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Coffee className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Make your space comfortable</h4>
                          <p className="text-blue-700">Create a comfortable study and living environment without spending a fortune on new furniture.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Local pickup available</h4>
                          <p className="text-blue-700">No need to worry about expensive shipping or delivery fees. This item is available for local pickup.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Default content for other categories */}
                  {!['textbooks', 'electronics', 'furniture'].includes(item.category) && (
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Student budget friendly</h4>
                          <p className="text-blue-700">Save money by buying from fellow students at better prices than retail.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-800">Near your campus</h4>
                          <p className="text-blue-700">This item is being sold near your university, making pickup easy and convenient.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Student Reviews or Use Cases */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Student Reviews</h3>
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">Emma J.</p>
                            <p className="text-sm text-gray-500">2nd Year, Computer Science</p>
                            <p className="mt-2">
                              {item.category === 'textbooks' 
                                ? "This textbook was exactly what I needed for my course. Saved me a ton of money!"
                                : item.category === 'electronics'
                                ? "Works perfectly for completing assignments and attending zoom lectures."
                                : "Really useful for my student accommodation. Good value for money."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">Alex M.</p>
                            <p className="text-sm text-gray-500">3rd Year, Business Studies</p>
                            <p className="mt-2">
                              {item.category === 'textbooks' 
                                ? "All the highlights and notes were actually helpful for my revision!"
                                : item.category === 'electronics'
                                ? "Battery life is still good, perfect for library study sessions when outlets are scarce."
                                : "Just what I needed for my new room this semester."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column: Price, Actions, and Seller Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price and Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-primary">
                {formatPrice(item.price)}
              </h2>
              {!isItemAvailable && (
                <Badge variant="destructive" className="text-md px-3 py-1">
                  SOLD
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{item.location}</span>
              </div>
              {item.distance && (
                <>
                  <span>•</span>
                  <span>{formatDistance(item.distance)}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {isItemAvailable && (
            <div className="space-y-3">
              <Button
                className="w-full h-12 text-lg"
                onClick={handleBuyNow}
                disabled={buyItemMutation.isPending}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {buyItemMutation.isPending ? 'Processing...' : 'Buy Now'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={() => setIsOfferModalOpen(true)}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Make an Offer
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleToggleSave}
                  disabled={toggleSaveMutation.isPending}
                >
                  <Heart className={`mr-2 h-4 w-4 ${item.savedByCurrentUser ? 'fill-red-500 text-red-500' : ''}`} />
                  {item.savedByCurrentUser ? 'Saved' : 'Save'}
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsMessageModalOpen(true)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>
            </div>
          )}
          
          {/* Sold Out Warning */}
          {!isItemAvailable && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center text-gray-500 mb-2">
                  <XCircle className="h-5 w-5 mr-2 text-gray-400" />
                  <span>This item has been sold</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  This item is no longer available for purchase. Browse similar items below or check out other listings.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation('/marketplace')}
                >
                  Browse More Items
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">{item.sellerName}</p>
                  <p className="text-sm text-gray-500">Member since {new Date(item.sellerJoinDate || Date.now()).getFullYear()}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {item.meetInPerson && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span className="text-sm">Meets in person</span>
                  </div>
                )}
                
                {item.canDeliver && (
                  <div className="flex items-center text-green-600">
                    <Truck className="h-4 w-4 mr-2" />
                    <span className="text-sm">Offers delivery</span>
                  </div>
                )}
                
                {item.aiVerified && (
                  <div className="flex items-center text-blue-600">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm">AI verified listing</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Listing Safety */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Marketplace Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-4 w-4 text-gray-500" />
                </div>
                <p className="ml-2 text-sm text-gray-600">
                  Meet in public places and inspect items before payment. Be cautious when making high-value transactions.
                </p>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-4 w-4 text-gray-500" />
                </div>
                <p className="ml-2 text-sm text-gray-600">
                  Use our built-in payment system for purchase protection and to avoid payment scams.
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 pl-1"
                onClick={() => setIsReportModalOpen(true)}
              >
                <Flag className="h-4 w-4 mr-1" />
                Report this listing
              </Button>
            </CardContent>
          </Card>
          
          {/* Similar Items */}
          {similarItems && similarItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Similar Items Nearby</h3>
              <div className="grid grid-cols-2 gap-3">
                {similarItems.map((similarItem) => (
                  <Card 
                    key={similarItem.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (similarItem.id !== Number(id)) {
                        setLocation(`/marketplace/${similarItem.id}`);
                      }
                    }}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {similarItem.images && similarItem.images.length > 0 ? (
                        <img 
                          src={similarItem.images[0]} 
                          alt={similarItem.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <div className="line-clamp-1 text-sm font-medium">{similarItem.title}</div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="font-semibold text-primary">{formatPrice(similarItem.price)}</div>
                        <div className="text-xs text-gray-500">{formatDistance(similarItem.distance)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Make an Offer Modal */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Submit your offer to the seller. They can accept, decline, or counter.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitOffer} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="offer-amount" className="text-sm font-medium">
                Your Offer
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">£</span>
                <Input
                  id="offer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Listing price: {formatPrice(item.price)}
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="offer-note" className="text-sm font-medium">
                Add a Note (Optional)
              </label>
              <Textarea
                id="offer-note"
                placeholder="Is there anything you'd like the seller to know about your offer?"
                rows={3}
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOfferModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={makeOfferMutation.isPending}>
                {makeOfferMutation.isPending ? 'Sending...' : 'Send Offer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Report Listing Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Listing</DialogTitle>
            <DialogDescription>
              If you believe this listing violates our policies, please let us know.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReport} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="report-reason" className="text-sm font-medium">
                Reason for Report
              </label>
              <select
                id="report-reason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="prohibited">Prohibited item</option>
                <option value="counterfeit">Counterfeit or fake item</option>
                <option value="scam">Suspected scam</option>
                <option value="offensive">Offensive content</option>
                <option value="inappropriate">Inappropriate listing</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="report-description" className="text-sm font-medium">
                Details
              </label>
              <Textarea
                id="report-description"
                placeholder="Please provide specific details about why you're reporting this listing"
                rows={4}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive"
                disabled={reportItemMutation.isPending}
              >
                {reportItemMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Message Seller Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message Seller</DialogTitle>
            <DialogDescription>
              Send a message to {item.sellerName} about this listing.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitMessage} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="message-content" className="text-sm font-medium">
                Your Message
              </label>
              <Textarea
                id="message-content"
                placeholder="Ask questions about the item, arrange pickup, etc."
                rows={5}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsMessageModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendMessageMutation.isPending}>
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}