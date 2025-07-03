import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { CheckCircle2 } from 'lucide-react';

// Validation schema for rental data submission
const rentalDataSchema = z.object({
  postcode: z.string()
    .min(5, 'Please enter a valid UK postcode')
    .max(8, 'Please enter a valid UK postcode'),
  propertyType: z.enum(['flat', 'terraced', 'semi-detached', 'detached', 'other']),
  bedrooms: z.coerce.number()
    .min(0, 'Number of bedrooms must be 0 or greater')
    .max(10, 'Number of bedrooms must be 10 or less'),
  monthlyRent: z.coerce.number()
    .min(1, 'Monthly rent must be greater than 0'),
  isAnonymous: z.boolean().default(true),
  billsIncluded: z.boolean().default(false),
  includedBills: z.array(z.string()).optional(),
  propertyFeatures: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof rentalDataSchema>;

export function ContributeRentalDataForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(rentalDataSchema),
    defaultValues: {
      postcode: '',
      propertyType: 'flat',
      bedrooms: 1,
      monthlyRent: 0,
      isAnonymous: true,
      billsIncluded: false,
      includedBills: [],
      propertyFeatures: [],
      notes: '',
    },
  });
  
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('/api/market-intelligence/contribute-rental-data', {
        method: 'POST',
        data: values
      });
      
      if (response.success) {
        toast({
          title: "Thank you for your contribution!",
          description: "Your rental data has been added to our market intelligence database.",
          variant: "default",
        });
        
        // Invalidate the dashboard data to refresh it
        queryClient.invalidateQueries({ queryKey: ['/api/market-intelligence/dashboard-data'] });
        
        // Show success message and reset form
        setIsSuccess(true);
        form.reset();
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        throw new Error(response.error || 'Failed to submit data');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-green-100 p-3 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p className="text-center text-muted-foreground mb-6">
          Your contribution helps improve market insights for all landlords.
        </p>
        <Button onClick={() => setIsSuccess(false)} variant="outline">
          Submit Another
        </Button>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="postcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Postcode</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. SW1A 1AA" {...field} />
                </FormControl>
                <FormDescription>
                  Full or partial UK postcode (e.g. SW1A or SW1A 1AA)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="flat">Flat/Apartment</SelectItem>
                    <SelectItem value="terraced">Terraced</SelectItem>
                    <SelectItem value="semi-detached">Semi-Detached</SelectItem>
                    <SelectItem value="detached">Detached</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Bedrooms</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="monthlyRent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Rent (£)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1}
                    placeholder="e.g. 1200"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="billsIncluded"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Bills Included in Rent</FormLabel>
                  <FormDescription>
                    Are utility bills included in the monthly rent?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Anonymous Contribution</FormLabel>
                  <FormDescription>
                    Your data will be anonymized and only used for aggregate statistics
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional details about the property or rental terms..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any special conditions or additional information about the property
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Rental Data"}
        </Button>
      </form>
    </Form>
  );
}