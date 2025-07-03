import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Grid2X2,
  Package,
  ShoppingBag,
  Tag,
  Clock,
  Heart,
  MessageCircle,
  CheckCircle2,
  XCircle,
  DollarSign,
  PlusCircle,
  Users,
  Eye,
  AlertTriangle,
  Star,
  ArrowUpRight,
  User,
} from 'lucide-react';

// Type definitions
type MarketplaceItem = {
  id: number;
  title: string;
  price: string;
  images: string[];
  listingStatus: string;
  category: string;
  createdAt: string;
  viewCount: number;
  savedCount: number;
};

type TransactionSummary = {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  status: string;
  amount: string;
  createdAt: string;
  item: {
    title: string;
    images: string[];
  };
  buyerName: string;
  sellerName: string;
};

type OfferSummary = {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  status: string;
  createdAt: string;
  item: {
    title: string;
    price: string;
    images: string[];
  };
  buyerName: string;
  sellerName: string;
};

type SavedItem = {
  id: number;
  itemId: number;
  createdAt: string;
  item: {
    id: number;
    title: string;
    price: string;
    images: string[];
    listingStatus: string;
  };
};

type MessageSummary = {
  id: number;
  itemId: number;
  senderId: number;
  receiverId: number;
  unreadCount: number;
  lastMessage: string;
  lastMessageDate: string;
  item: {
    title: string;
    images: string[]
  };
  senderName: string;
  receiverName: string;
};

export function MarketplaceDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('myListings');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Fetch current user info when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/current');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.id) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Use fallback ID only if needed
        setCurrentUserId(123);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Format the price
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(parseFloat(price));
  };
  
  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // difference in seconds
    
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    }
  };
  
  // Fetch user's listings
  const {
    data: myListings = [],
    isLoading: isListingsLoading,
    isError: isListingsError,
  } = useQuery<MarketplaceItem[]>({
    queryKey: ['/api/marketplace/dashboard/listings'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard/listings');
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      return data.items;
    },
  });
  
  // Fetch active transactions (as buyer and seller)
  const {
    data: myTransactions = [],
    isLoading: isTransactionsLoading,
    isError: isTransactionsError,
  } = useQuery<TransactionSummary[]>({
    queryKey: ['/api/marketplace/dashboard/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      return data.transactions;
    },
  });
  
  // Fetch active offers (sent and received)
  const {
    data: myOffers = [],
    isLoading: isOffersLoading,
    isError: isOffersError,
  } = useQuery<OfferSummary[]>({
    queryKey: ['/api/marketplace/dashboard/offers'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.offers;
    },
  });
  
  // Fetch saved items
  const {
    data: savedItems = [],
    isLoading: isSavedItemsLoading,
    isError: isSavedItemsError,
  } = useQuery<SavedItem[]>({
    queryKey: ['/api/marketplace/dashboard/saved'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard/saved');
      if (!response.ok) throw new Error('Failed to fetch saved items');
      const data = await response.json();
      return data.items;
    },
  });
  
  // Fetch messages
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
  } = useQuery<MessageSummary[]>({
    queryKey: ['/api/marketplace/dashboard/messages'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/dashboard/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages;
    },
  });
  
  // Count unread messages
  const unreadMessagesCount = messages.reduce((count, message) => count + message.unreadCount, 0);
  
  // Separate transactions as buyer and seller
  const purchasedItems = myTransactions.filter(t => currentUserId && t.buyerId === currentUserId);
  const soldItems = myTransactions.filter(t => currentUserId && t.sellerId === currentUserId);
  
  // Separate offers - sent by me and received
  const mySentOffers = myOffers.filter(o => currentUserId && o.buyerId === currentUserId);
  const myReceivedOffers = myOffers.filter(o => currentUserId && o.sellerId === currentUserId);
  
  // Get transaction status badge color
  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-orange-100 text-orange-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get offer status badge color
  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get listing status badge color
  const getListingStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format listing status
  const formatListingStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Marketplace Dashboard</h1>
        <p className="text-gray-500">Manage your listings, transactions, offers, and more</p>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-2xl font-bold">
                {myListings.filter(item => item.listingStatus === 'active').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-yellow-600" />
              <span className="text-2xl font-bold">
                {myTransactions.filter(t => 
                  ['pending', 'paid', 'shipped'].includes(t.status)
                ).length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-2xl font-bold">
                {myOffers.filter(o => o.status === 'pending').length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-2 text-purple-600" />
              <span className="text-2xl font-bold">
                {messages.length}
                {unreadMessagesCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadMessagesCount} new
                  </Badge>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="myListings" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="myListings" className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Saved Items
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
            {unreadMessagesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* My Listings Tab */}
        <TabsContent value="myListings">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Listings</h2>
            <Button onClick={() => setLocation('/marketplace/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create New Listing
            </Button>
          </div>
          
          {isListingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isListingsError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load listings</h3>
              <p className="text-gray-500 mb-4">There was an error loading your listings.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No listings yet</h3>
              <p className="text-gray-500 mb-4">You haven't created any listings yet.</p>
              <Button onClick={() => setLocation('/marketplace/new')}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div 
                    className="h-40 bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: item.images.length > 0 
                        ? `url(${item.images[0]})` 
                        : 'none',
                      backgroundColor: item.images.length > 0 ? 'transparent' : '#f1f5f9'
                    }}
                  >
                    {item.images.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tag className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getListingStatusColor(item.listingStatus)}`}>
                        {formatListingStatus(item.listingStatus)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg mb-1 truncate">{item.title}</h3>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                      <span className="text-gray-500 text-sm">{formatRelativeDate(item.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>{item.viewCount}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-3.5 w-3.5 mr-1" />
                          <span>{item.savedCount}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 p-0" onClick={() => setLocation(`/marketplace/${item.id}`)}>
                        View 
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <div className="space-y-6">
            {/* Purchases Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">My Purchases</h2>
              
              {isTransactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                            <div className="flex justify-between">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isTransactionsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load transactions</h3>
                  <p className="text-gray-500 mb-4">There was an error loading your purchase history.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : purchasedItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No purchases yet</h3>
                  <p className="text-gray-500 mb-4">You haven't purchased any items yet.</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchasedItems.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-16 w-16 bg-cover bg-center rounded"
                            style={{
                              backgroundImage: transaction.item.images.length > 0 
                                ? `url(${transaction.item.images[0]})`
                                : 'none',
                              backgroundColor: transaction.item.images.length > 0 ? 'transparent' : '#f1f5f9'
                            }}
                          >
                            {transaction.item.images.length === 0 && (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{transaction.item.title}</h3>
                              <Badge className={getTransactionStatusColor(transaction.status)}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-gray-500 mb-1 text-sm">Seller: {transaction.sellerName}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-bold">{formatPrice(transaction.amount)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 p-0"
                                onClick={() => setLocation(`/marketplace/transactions/${transaction.id}`)}
                              >
                                View Details
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Sales Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">My Sales</h2>
              
              {isTransactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                            <div className="flex justify-between">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isTransactionsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load transactions</h3>
                  <p className="text-gray-500 mb-4">There was an error loading your sales history.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : soldItems.length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sales yet</h3>
                  <p className="text-gray-500 mb-4">You haven't sold any items yet.</p>
                  <Button onClick={() => setLocation('/marketplace/new')}>
                    Create a Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {soldItems.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-16 w-16 bg-cover bg-center rounded"
                            style={{
                              backgroundImage: transaction.item.images.length > 0 
                                ? `url(${transaction.item.images[0]})`
                                : 'none',
                              backgroundColor: transaction.item.images.length > 0 ? 'transparent' : '#f1f5f9'
                            }}
                          >
                            {transaction.item.images.length === 0 && (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{transaction.item.title}</h3>
                              <Badge className={getTransactionStatusColor(transaction.status)}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-gray-500 mb-1 text-sm">Buyer: {transaction.buyerName}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-bold">{formatPrice(transaction.amount)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 p-0"
                                onClick={() => setLocation(`/marketplace/transactions/${transaction.id}`)}
                              >
                                View Details
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Offers Tab */}
        <TabsContent value="offers">
          <div className="space-y-6">
            {/* Offers I've Sent */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Offers I've Sent</h2>
              
              {isOffersLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                            <div className="flex justify-between">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isOffersError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load offers</h3>
                  <p className="text-gray-500 mb-4">There was an error loading your sent offers.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : mySentOffers.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No offers sent</h3>
                  <p className="text-gray-500 mb-4">You haven't made any offers yet.</p>
                  <Button onClick={() => setLocation('/marketplace')}>
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mySentOffers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-16 w-16 bg-cover bg-center rounded"
                            style={{
                              backgroundImage: offer.item.images.length > 0 
                                ? `url(${offer.item.images[0]})`
                                : 'none',
                              backgroundColor: offer.item.images.length > 0 ? 'transparent' : '#f1f5f9'
                            }}
                          >
                            {offer.item.images.length === 0 && (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{offer.item.title}</h3>
                              <Badge className={getOfferStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-gray-500 mb-1 text-sm">Seller: {offer.sellerName}</p>
                            <div className="flex justify-between items-center mt-2">
                              <div className="space-x-2">
                                <span className="font-bold text-green-600">{formatPrice(offer.amount)}</span>
                                <span className="text-gray-500 text-sm">
                                  (List: {formatPrice(offer.item.price)})
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 p-0"
                                onClick={() => setLocation(`/marketplace/${offer.itemId}`)}
                              >
                                View Item
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Offers I've Received */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Offers I've Received</h2>
              
              {isOffersLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                            <div className="flex justify-between">
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : isOffersError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load offers</h3>
                  <p className="text-gray-500 mb-4">There was an error loading your received offers.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : myReceivedOffers.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No offers received</h3>
                  <p className="text-gray-500 mb-4">You haven't received any offers yet.</p>
                  <Button onClick={() => setLocation('/marketplace/new')}>
                    Create a Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReceivedOffers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div 
                            className="h-16 w-16 bg-cover bg-center rounded"
                            style={{
                              backgroundImage: offer.item.images.length > 0 
                                ? `url(${offer.item.images[0]})`
                                : 'none',
                              backgroundColor: offer.item.images.length > 0 ? 'transparent' : '#f1f5f9'
                            }}
                          >
                            {offer.item.images.length === 0 && (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium truncate">{offer.item.title}</h3>
                              <Badge className={getOfferStatusColor(offer.status)}>
                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-gray-500 mb-1 text-sm">From: {offer.buyerName}</p>
                            <div className="flex justify-between items-center mt-2">
                              <div className="space-x-2">
                                <span className="font-bold text-green-600">{formatPrice(offer.amount)}</span>
                                <span className="text-gray-500 text-sm">
                                  (List: {formatPrice(offer.item.price)})
                                </span>
                              </div>
                              {offer.status === 'pending' && (
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    onClick={() => console.log('Accept offer', offer.id)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => console.log('Reject offer', offer.id)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Saved Items Tab */}
        <TabsContent value="saved">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Items</h2>
          </div>
          
          {isSavedItemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isSavedItemsError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load saved items</h3>
              <p className="text-gray-500 mb-4">There was an error loading your saved items.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : savedItems.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No saved items</h3>
              <p className="text-gray-500 mb-4">You haven't saved any items yet.</p>
              <Button onClick={() => setLocation('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedItems.map((saved) => (
                <Card key={saved.id} className="overflow-hidden">
                  <div 
                    className="h-40 bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: saved.item.images.length > 0 
                        ? `url(${saved.item.images[0]})` 
                        : 'none',
                      backgroundColor: saved.item.images.length > 0 ? 'transparent' : '#f1f5f9'
                    }}
                  >
                    {saved.item.images.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Tag className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getListingStatusColor(saved.item.listingStatus)}`}>
                        {formatListingStatus(saved.item.listingStatus)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 text-red-500 hover:bg-white hover:text-red-600"
                      onClick={() => console.log('Unsave item', saved.itemId)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg mb-1 truncate">{saved.item.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{formatPrice(saved.item.price)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800 p-0"
                        onClick={() => setLocation(`/marketplace/${saved.item.id}`)}
                      >
                        View Item
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          
          {isMessagesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isMessagesError ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to load messages</h3>
              <p className="text-gray-500 mb-4">There was an error loading your messages.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages</h3>
              <p className="text-gray-500 mb-4">You don't have any messages yet.</p>
              <Button onClick={() => setLocation('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`hover:shadow-md transition-shadow ${message.unreadCount > 0 ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="h-10 w-10 bg-cover bg-center rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {message.senderId === 123 ? message.receiverName : message.senderName}
                            </h3>
                            <p className="text-gray-500 text-sm">Re: {message.item.title}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm">{formatRelativeDate(message.lastMessageDate)}</span>
                            {message.unreadCount > 0 && (
                              <Badge className="bg-blue-500 ml-2">{message.unreadCount}</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mt-2 line-clamp-2">
                          {message.lastMessage}
                        </p>
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800 p-0"
                            onClick={() => setLocation(`/marketplace/messages/${message.id}`)}
                          >
                            View Conversation
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}