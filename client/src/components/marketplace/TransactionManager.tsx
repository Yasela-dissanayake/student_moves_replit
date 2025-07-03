import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import {
  Camera,
  ChevronLeft,
  ShoppingBag,
  Package,
  Truck,
  ArrowRight,
  Send,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Image as ImageIcon,
  MessageSquare,
  FileText,
} from 'lucide-react';

// Type definitions
type TransactionStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'disputed';
type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
type DeliveryStatus = 'pending' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'failed';
type DeliveryMethod = 'pickup' | 'delivery';

interface Transaction {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  status: TransactionStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryTrackingNumber?: string;
  deliveryProofImages?: string[];
  amount: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sellerName: string;
  buyerName: string;
  item: {
    id: number;
    title: string;
    description: string;
    price: string;
    images: string[];
    category: string;
    condition: string;
  };
  messages: TransactionMessage[];
}

interface TransactionMessage {
  id: number;
  transactionId: number;
  senderId: number;
  senderType: 'buyer' | 'seller' | 'system';
  message: string;
  createdAt: string;
  readAt?: string;
}

interface Offer {
  id: number;
  itemId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  note?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  item: {
    id: number;
    title: string;
    price: string;
    images: string[];
  };
  sellerName: string;
  buyerName: string;
}

export function TransactionManager() {
  const params = useParams();
  const { id: transactionId } = params;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [activeTab, setActiveTab] = useState('transactions');
  const [messageText, setMessageText] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [deliveryProofFile, setDeliveryProofFile] = useState<File | null>(null);
  const [isDeliveryProofModalOpen, setIsDeliveryProofModalOpen] = useState(false);
  
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Fetch transactions
  const {
    data: transactions,
    isLoading: isTransactionsLoading,
  } = useQuery({
    queryKey: ['/api/marketplace/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      return data.transactions as Transaction[];
    },
  });
  
  // Fetch offers
  const {
    data: offers,
    isLoading: isOffersLoading,
  } = useQuery({
    queryKey: ['/api/marketplace/offers'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      return data.offers as Offer[];
    },
  });
  
  // Fetch single transaction if ID is provided
  const {
    data: transaction,
    isLoading: isTransactionLoading,
  } = useQuery({
    queryKey: [`/api/marketplace/transactions/${transactionId}`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/transactions/${transactionId}`);
      if (!response.ok) throw new Error('Failed to fetch transaction');
      const data = await response.json();
      return data.transaction as Transaction;
    },
    enabled: !!transactionId,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully',
      });
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Upload receipt mutation
  const uploadReceiptMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/receipt`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Receipt uploaded',
        description: 'Your payment receipt has been uploaded successfully',
      });
      setReceiptFile(null);
      setIsReceiptModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload receipt',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Upload delivery proof mutation
  const uploadDeliveryProofMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/delivery-proof`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Delivery proof uploaded',
        description: 'Your delivery proof has been uploaded successfully',
      });
      setDeliveryProofFile(null);
      setIsDeliveryProofModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload delivery proof',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Delete delivery proof mutation
  const deleteDeliveryProofMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/delivery-proof`, {
        method: 'DELETE',
        body: JSON.stringify({ imageUrl }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Delivery proof deleted',
        description: 'The delivery proof image has been deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete delivery proof',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Update tracking info mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (data: { trackingNumber: string }) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/tracking`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Tracking information updated',
        description: 'The tracking information has been updated successfully',
      });
      setTrackingNumber('');
      setIsTrackingModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update tracking',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessageMutation.mutate({ message: messageText });
  };
  
  // Cancel transaction mutation
  const cancelTransactionMutation = useMutation({
    mutationFn: async (data: { reason: string }) => {
      return apiRequest(`/api/marketplace/transactions/${selectedTransactionId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Transaction cancelled',
        description: 'The transaction has been cancelled successfully',
      });
      setCancelReason('');
      setIsCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/transactions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${selectedTransactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to cancel transaction',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Respond to offer mutation
  const respondToOfferMutation = useMutation({
    mutationFn: async (data: { action: 'accept' | 'reject' }) => {
      return apiRequest(`/api/marketplace/offers/${selectedOfferId}/respond`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: confirmAction === 'accept' ? 'Offer accepted' : 'Offer rejected',
        description: confirmAction === 'accept' 
          ? 'The offer has been accepted and a transaction has been created' 
          : 'The offer has been rejected',
      });
      
      setIsConfirmModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/offers'] });
      
      // If offer was accepted, redirect to the new transaction
      if (confirmAction === 'accept' && data.transactionId) {
        setLocation(`/marketplace/transactions/${data.transactionId}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to respond to offer',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Update delivery status mutation
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async (data: { status: DeliveryStatus }) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/delivery-status`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Delivery status updated',
        description: 'The delivery status has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Report problem mutation
  const reportProblemMutation = useMutation({
    mutationFn: async (data: { description: string }) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/problem`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Problem reported',
        description: 'Your problem has been reported and we will review it shortly',
      });
      setProblemDescription('');
      setIsProblemModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to report problem',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Update delivery address mutation
  const updateDeliveryAddressMutation = useMutation({
    mutationFn: async (data: { address: string }) => {
      return apiRequest(`/api/marketplace/transactions/${transactionId}/address`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Delivery address updated',
        description: 'Your delivery address has been updated successfully',
      });
      setDeliveryAddress('');
      setIsAddressModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/transactions/${transactionId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update address',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle delivery status update
  const handleDeliveryStatusUpdate = (status: DeliveryStatus) => {
    updateDeliveryStatusMutation.mutate({ status });
  };
  
  // Handle receipt upload
  const handleReceiptUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiptFile) {
      toast({
        title: 'Receipt required',
        description: 'Please select a receipt file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    
    uploadReceiptMutation.mutate(formData);
  };
  
  // Handle delivery proof upload
  const handleDeliveryProofUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryProofFile) {
      toast({
        title: 'Delivery proof required',
        description: 'Please select a proof of delivery image to upload',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('proof', deliveryProofFile);
    
    uploadDeliveryProofMutation.mutate(formData);
  };
  
  // Handle delivery proof deletion
  const handleDeleteDeliveryProof = (imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this delivery proof image?')) {
      deleteDeliveryProofMutation.mutate(imageUrl);
    }
  };
  
  // Get status color
  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      case 'disputed':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get payment status color
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get delivery status color
  const getDeliveryStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format delivery status
  const formatDeliveryStatus = (status: DeliveryStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Render transaction details
  const renderTransactionDetails = () => {
    if (isTransactionLoading || !transaction) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Loading transaction details...</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Transaction #{transaction.id}</h2>
            <p className="text-gray-500">Created on {formatDate(transaction.createdAt)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-md overflow-hidden">
                {transaction.item.images && transaction.item.images.length > 0 ? (
                  <img 
                    src={transaction.item.images[0]} 
                    alt={transaction.item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-lg mb-1">{transaction.item.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="capitalize">
                    {transaction.item.category.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {transaction.item.condition.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-gray-700 mb-3 line-clamp-2">{transaction.item.description}</p>
                <p className="font-bold text-lg text-primary">{formatPrice(transaction.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                  {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">{formatPrice(transaction.amount)}</span>
              </div>
              {transaction.paymentStatus === 'pending' && (
                <div className="mt-4">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsReceiptModalOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Payment Receipt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="capitalize font-medium">{transaction.deliveryMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(transaction.deliveryStatus)}`}>
                  {formatDeliveryStatus(transaction.deliveryStatus)}
                </span>
              </div>
              {transaction.deliveryMethod === 'delivery' && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-medium text-right">
                    {transaction.deliveryAddress || 'Not provided'}
                  </span>
                </div>
              )}
              {transaction.deliveryTrackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tracking #:</span>
                  <span className="font-medium">{transaction.deliveryTrackingNumber}</span>
                </div>
              )}
              
              {transaction.deliveryProofImages && transaction.deliveryProofImages.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500">Delivery Proof:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {transaction.deliveryProofImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <a 
                          href={img} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img 
                            src={img} 
                            alt={`Delivery proof ${index + 1}`} 
                            className="w-full h-16 object-cover rounded-md border hover:opacity-90 transition-opacity"
                          />
                        </a>
                        {/* Only show delete button for sellers */}
                        {transaction.sellerId === 123 && (
                          <button
                            onClick={() => handleDeleteDeliveryProof(img)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete image"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-4">
                {transaction.deliveryMethod === 'delivery' && !transaction.deliveryAddress && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Add Delivery Address
                  </Button>
                )}
                
                {transaction.status === 'paid' && transaction.sellerId === 123 && !transaction.deliveryTrackingNumber && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsTrackingModalOpen(true)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Add Tracking Information
                  </Button>
                )}
                
                {transaction.status === 'paid' && transaction.sellerId === 123 && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsDeliveryProofModalOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Delivery Proof
                  </Button>
                )}
              </div>
              
              {transaction.sellerId === 123 && transaction.status === 'paid' && (
                <div className="space-y-2 mt-4">
                  <Label>Update Delivery Status:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeliveryStatusUpdate('ready_for_pickup')}
                      disabled={transaction.deliveryStatus === 'ready_for_pickup'}
                      className={transaction.deliveryStatus === 'ready_for_pickup' ? 'bg-blue-50' : ''}
                    >
                      Ready for Pickup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeliveryStatusUpdate('in_transit')}
                      disabled={transaction.deliveryStatus === 'in_transit'}
                      className={transaction.deliveryStatus === 'in_transit' ? 'bg-blue-50' : ''}
                    >
                      In Transit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeliveryStatusUpdate('delivered')}
                      disabled={transaction.deliveryStatus === 'delivered'}
                      className={transaction.deliveryStatus === 'delivered' ? 'bg-blue-50' : ''}
                    >
                      Delivered
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeliveryStatusUpdate('failed')}
                      disabled={transaction.deliveryStatus === 'failed'}
                      className={transaction.deliveryStatus === 'failed' ? 'bg-blue-50' : ''}
                    >
                      Failed
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Communication</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full pr-4">
              {transaction.messages && transaction.messages.length > 0 ? (
                <div className="space-y-4">
                  {transaction.messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.senderType === 'system' ? 'justify-center' : (msg.senderType === 'buyer' ? 'justify-end' : 'justify-start')}`}
                    >
                      {msg.senderType === 'system' ? (
                        <div className="bg-gray-100 px-3 py-2 rounded-md text-gray-500 text-sm max-w-xs text-center">
                          {msg.message}
                          <div className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</div>
                        </div>
                      ) : (
                        <div className={`${msg.senderType === 'buyer' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'} px-4 py-3 rounded-lg max-w-md`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-500" />
                            </div>
                            <span className="text-xs font-medium">{msg.senderType === 'buyer' ? transaction.buyerName : transaction.sellerName}</span>
                          </div>
                          {msg.message}
                          <div className={`text-xs ${msg.senderType === 'buyer' ? 'text-primary-foreground/70' : 'text-gray-400'} mt-1 text-right`}>
                            {formatDate(msg.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
              <Textarea 
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" size="icon" disabled={sendMessageMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {transaction.status !== 'cancelled' && transaction.status !== 'completed' && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedTransactionId(transaction.id);
                  setIsCancelModalOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Transaction
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => setIsProblemModalOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report a Problem
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Render transactions list
  const renderTransactionsList = () => {
    if (isTransactionsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      );
    }
    
    if (!transactions || transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
          <p className="text-center max-w-md mb-6">
            You haven't made any purchases or sales yet. Browse the marketplace to find items to buy or list your own items for sale.
          </p>
          <Button onClick={() => setLocation('/marketplace')}>
            Browse Marketplace
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {transactions.map((t: Transaction) => (
          <Card key={t.id} className="overflow-hidden transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row cursor-pointer" onClick={() => setLocation(`/marketplace/transactions/${t.id}`)}>
              <div className="w-full sm:w-32 h-32 bg-gray-100 flex-shrink-0">
                {t.item.images && t.item.images.length > 0 ? (
                  <img 
                    src={t.item.images[0]} 
                    alt={t.item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium line-clamp-1">{t.item.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {123 === t.sellerId ? `Sold to ${t.buyerName}` : `Purchased from ${t.sellerName}`}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center justify-between mt-2">
                  <p className="font-bold text-primary">{formatPrice(t.amount)}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render offers list
  const renderOffersList = () => {
    if (isOffersLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Loading offers...</p>
        </div>
      );
    }
    
    if (!offers || offers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <DollarSign className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Offers Yet</h3>
          <p className="text-center max-w-md mb-6">
            You haven't made or received any offers yet. When browsing items, click "Make an Offer" to negotiate a price with the seller.
          </p>
          <Button onClick={() => setLocation('/marketplace')}>
            Browse Marketplace
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="sent-offers">
            <AccordionTrigger>Offers You've Made</AccordionTrigger>
            <AccordionContent>
              {offers.filter(offer => offer.buyerId === 123).length > 0 ? (
                <div className="space-y-4 mt-2">
                  {offers.filter(offer => offer.buyerId === 123).map((offer: Offer) => (
                    <Card key={offer.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-24 h-24 bg-gray-100 flex-shrink-0">
                          {offer.item.images && offer.item.images.length > 0 ? (
                            <img 
                              src={offer.item.images[0]} 
                              alt={offer.item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">{offer.item.title}</h3>
                              <p className="text-sm text-gray-500 mb-2">
                                Offered to {offer.sellerName}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                offer.status === 'pending' ? 'outline' :
                                offer.status === 'accepted' ? 'default' :
                                'destructive'
                              }
                            >
                              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="font-medium">Your offer: <span className="text-primary font-bold">{formatPrice(offer.amount)}</span></p>
                            <span className="text-xs text-gray-500">•</span>
                            <p className="text-sm text-gray-500">Original price: {formatPrice(offer.item.price)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Offered on {formatDate(offer.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {offer.status === 'pending' && (
                        <div className="px-4 pb-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOfferId(offer.id);
                              setConfirmAction('cancel');
                              setIsConfirmModalOpen(true);
                            }}
                          >
                            Cancel Offer
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>You haven't made any offers yet.</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="received-offers">
            <AccordionTrigger>Offers You've Received</AccordionTrigger>
            <AccordionContent>
              {offers.filter(offer => offer.sellerId === 123).length > 0 ? (
                <div className="space-y-4 mt-2">
                  {offers.filter(offer => offer.sellerId === 123).map((offer: Offer) => (
                    <Card key={offer.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-24 h-24 bg-gray-100 flex-shrink-0">
                          {offer.item.images && offer.item.images.length > 0 ? (
                            <img 
                              src={offer.item.images[0]} 
                              alt={offer.item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium line-clamp-1">{offer.item.title}</h3>
                              <p className="text-sm text-gray-500 mb-2">
                                Offer from {offer.buyerName}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                offer.status === 'pending' ? 'outline' :
                                offer.status === 'accepted' ? 'default' :
                                'destructive'
                              }
                            >
                              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="font-medium">Offer amount: <span className="text-primary font-bold">{formatPrice(offer.amount)}</span></p>
                            <span className="text-xs text-gray-500">•</span>
                            <p className="text-sm text-gray-500">Your price: {formatPrice(offer.item.price)}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Received on {formatDate(offer.createdAt)}
                          </p>
                          {offer.note && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                              <p className="font-medium text-xs text-gray-500 mb-1">Note from buyer:</p>
                              <p className="text-gray-700">{offer.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {offer.status === 'pending' && (
                        <div className="px-4 pb-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOfferId(offer.id);
                              setConfirmAction('reject');
                              setIsConfirmModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOfferId(offer.id);
                              setConfirmAction('accept');
                              setIsConfirmModalOpen(true);
                            }}
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>You haven't received any offers yet.</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Back button */}
      <Button 
        variant="ghost" 
        onClick={() => setLocation('/marketplace')}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Marketplace
      </Button>
      
      {transactionId ? (
        // Single transaction view
        renderTransactionDetails()
      ) : (
        // Transactions and offers list view
        <div>
          <h1 className="text-2xl font-bold mb-6">Your Marketplace Activity</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-6">
              {renderTransactionsList()}
            </TabsContent>
            
            <TabsContent value="offers" className="mt-6">
              {renderOffersList()}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Upload Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Payment Receipt</DialogTitle>
            <DialogDescription>
              Upload a receipt or confirmation of your payment to help us process your order faster.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleReceiptUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt File</Label>
              <Input
                id="receipt"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReceiptFile(e.target.files[0]);
                  }
                }}
                accept="image/*,application/pdf"
              />
              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG, PDF. Max size: 5MB
              </p>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={uploadReceiptMutation.isPending || !receiptFile}
              >
                {uploadReceiptMutation.isPending ? 'Uploading...' : 'Upload Receipt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Upload Delivery Proof Modal */}
      <Dialog open={isDeliveryProofModalOpen} onOpenChange={setIsDeliveryProofModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Delivery Proof</DialogTitle>
            <DialogDescription>
              Upload proof of delivery such as a delivery confirmation photo or signed receipt.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDeliveryProofUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryProof">Delivery Proof Image</Label>
              <Input
                id="deliveryProof"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDeliveryProofFile(e.target.files[0]);
                  }
                }}
                accept="image/*"
              />
              <p className="text-xs text-gray-500">
                Accepted formats: JPG, PNG. Max size: 5MB
              </p>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeliveryProofModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={uploadDeliveryProofMutation.isPending || !deliveryProofFile}
              >
                {uploadDeliveryProofMutation.isPending ? 'Uploading...' : 'Upload Proof'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Tracking Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tracking Information</DialogTitle>
            <DialogDescription>
              Enter the tracking number for this shipment so the buyer can track their purchase.
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateTrackingMutation.mutate({ trackingNumber });
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTrackingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateTrackingMutation.isPending || !trackingNumber.trim()}
              >
                {updateTrackingMutation.isPending ? 'Saving...' : 'Save Tracking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Delivery Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Address</DialogTitle>
            <DialogDescription>
              Enter your delivery address for this purchase.
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateDeliveryAddressMutation.mutate({ address: deliveryAddress });
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your full delivery address"
                rows={4}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateDeliveryAddressMutation.isPending || !deliveryAddress.trim()}
              >
                {updateDeliveryAddressMutation.isPending ? 'Saving...' : 'Save Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Report Problem Modal */}
      <Dialog open={isProblemModalOpen} onOpenChange={setIsProblemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
            <DialogDescription>
              Let us know about any issues with this transaction, and we'll help resolve it.
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              reportProblemMutation.mutate({ description: problemDescription });
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="problem">Describe the Problem</Label>
              <Textarea
                id="problem"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Please describe the issue in detail"
                rows={4}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProblemModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={reportProblemMutation.isPending || !problemDescription.trim()}
              >
                {reportProblemMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Transaction Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              cancelTransactionMutation.mutate({ reason: cancelReason });
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Go Back
              </Button>
              <Button 
                type="submit"
                variant="destructive"
                disabled={cancelTransactionMutation.isPending || !cancelReason.trim()}
              >
                {cancelTransactionMutation.isPending ? 'Cancelling...' : 'Cancel Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Action Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'accept' ? 'Accept Offer' : 
               confirmAction === 'reject' ? 'Reject Offer' : 'Cancel Offer'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'accept' ? 'Are you sure you want to accept this offer? This will create a new transaction.' : 
               confirmAction === 'reject' ? 'Are you sure you want to reject this offer? This cannot be undone.' : 
               'Are you sure you want to cancel this offer? This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              No, Go Back
            </Button>
            <Button 
              variant={confirmAction === 'accept' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmAction === 'accept' || confirmAction === 'reject') {
                  respondToOfferMutation.mutate({ action: confirmAction === 'accept' ? 'accept' : 'reject' });
                } else {
                  // Handle cancel offer
                }
              }}
              disabled={respondToOfferMutation.isPending}
            >
              {respondToOfferMutation.isPending ? 'Processing...' : 
               `Yes, ${confirmAction === 'accept' ? 'Accept' : 
                        confirmAction === 'reject' ? 'Reject' : 'Cancel'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}