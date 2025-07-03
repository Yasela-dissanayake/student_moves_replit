import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PaymentType, TenancyType } from "@/lib/types";
import { updatePaymentStatus, createPayment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CreditCard, AlertCircle, Calendar as CalendarIcon2, CheckCircle, XCircle, Plus } from "lucide-react";
import { format } from "date-fns";

interface PaymentManagementProps {
  tenancyId: number;
  userType: string;
}

export default function PaymentManagement({ tenancyId, userType }: PaymentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState("rent");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDueDate, setNewPaymentDueDate] = useState<Date | undefined>(undefined);

  // Get tenancy details
  const { data: tenancy } = useQuery<TenancyType>({
    queryKey: [`/api/tenancies/${tenancyId}`],
  });

  // Get payments for the tenancy
  const { data: payments, isLoading } = useQuery<PaymentType[]>({
    queryKey: [`/api/payments?tenancyId=${tenancyId}`],
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      updatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payments?tenancyId=${tenancyId}`] });
      toast({
        title: "Payment updated",
        description: "The payment status has been updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update payment",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (paymentData: any) => createPayment(paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payments?tenancyId=${tenancyId}`] });
      toast({
        title: "Payment created",
        description: "A new payment has been created successfully",
        variant: "success",
      });
      setIsAddPaymentOpen(false);
      resetNewPaymentForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to create payment",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle payment status update
  const handleUpdatePaymentStatus = (id: number, status: string) => {
    updatePaymentMutation.mutate({ id, status });
  };

  // Handle new payment submission
  const handleAddPayment = () => {
    if (!newPaymentType || !newPaymentAmount || !newPaymentDueDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      tenancyId,
      amount: parseFloat(newPaymentAmount),
      paymentType: newPaymentType,
      status: "pending",
      dueDate: newPaymentDueDate.toISOString(),
    });
  };

  // Reset new payment form
  const resetNewPaymentForm = () => {
    setNewPaymentType("rent");
    setNewPaymentAmount("");
    setNewPaymentDueDate(undefined);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Group payments by status
  const overduePending = payments?.filter(p => 
    p.status === 'pending' && new Date(p.dueDate!) < new Date()
  ) || [];
  
  const upcomingPending = payments?.filter(p => 
    p.status === 'pending' && new Date(p.dueDate!) >= new Date()
  ) || [];
  
  const completedPayments = payments?.filter(p => p.status === 'completed') || [];
  const failedPayments = payments?.filter(p => p.status === 'failed') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        {userType !== 'tenant' && (
          <Button onClick={() => setIsAddPaymentOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">Loading payment information...</div>
      ) : !payments || payments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No payments found for this tenancy</p>
            {userType !== 'tenant' && (
              <Button onClick={() => setIsAddPaymentOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Payment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Payments Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-red-100 p-3 rounded-full mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <h3 className="text-2xl font-bold text-red-600">{overduePending.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-amber-100 p-3 rounded-full mb-2">
                    <CalendarIcon2 className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="text-sm text-gray-500">Upcoming</p>
                  <h3 className="text-2xl font-bold">{upcomingPending.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <h3 className="text-2xl font-bold text-green-600">{completedPayments.length}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-2">
                    <XCircle className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <h3 className="text-2xl font-bold">{failedPayments.length}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Payments */}
          {overduePending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600">Overdue Payments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overduePending.map((payment) => (
                  <Card key={payment.id} className="border-red-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                        <Badge variant="destructive">Overdue</Badge>
                      </div>
                      <CardDescription>
                        Due on {formatDate(payment.dueDate!)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">£{Number(payment.amount).toFixed(2)}</p>
                    </CardContent>
                    <CardFooter>
                      {userType === 'tenant' ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                          disabled={updatePaymentMutation.isPending}
                        >
                          {updatePaymentMutation.isPending ? "Processing..." : "Make Payment"}
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                            disabled={updatePaymentMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                            disabled={updatePaymentMutation.isPending}
                          >
                            Mark as Failed
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Payments */}
          {upcomingPending.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Upcoming Payments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingPending.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{payment.paymentType}</CardTitle>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <CardDescription>
                        Due on {formatDate(payment.dueDate!)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">£{Number(payment.amount).toFixed(2)}</p>
                    </CardContent>
                    <CardFooter>
                      {userType === 'tenant' ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                          disabled={updatePaymentMutation.isPending}
                        >
                          {updatePaymentMutation.isPending ? "Processing..." : "Make Payment"}
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                            disabled={updatePaymentMutation.isPending}
                          >
                            Mark as Paid
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                            disabled={updatePaymentMutation.isPending}
                          >
                            Mark as Failed
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment History</h3>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Payment Type</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...completedPayments, ...failedPayments]
                        .sort((a, b) => new Date(b.paidDate || b.createdAt).getTime() - new Date(a.paidDate || a.createdAt).getTime())
                        .map(payment => (
                          <tr key={payment.id} className="border-b">
                            <td className="p-4">{payment.paymentType}</td>
                            <td className="p-4">{formatDate(payment.paidDate || payment.createdAt)}</td>
                            <td className="p-4">£{Number(payment.amount).toFixed(2)}</td>
                            <td className="p-4">
                              <Badge variant={payment.status === 'completed' ? 'success' : 'destructive'}>
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      {completedPayments.length === 0 && failedPayments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-gray-500">
                            No payment history yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
            <DialogDescription>
              Create a new payment for this tenancy
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select value={newPaymentType} onValueChange={setNewPaymentType}>
                <SelectTrigger id="paymentType">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="utility">Utility Bills</SelectItem>
                  <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPaymentAmount}
                onChange={(e) => setNewPaymentAmount(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {newPaymentDueDate ? (
                      format(newPaymentDueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newPaymentDueDate}
                    onSelect={setNewPaymentDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPayment}
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? "Creating..." : "Create Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
