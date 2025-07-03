import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User, Mail, Phone, Calendar as CalendarLucide } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CustomerDetailsSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  moveInDate: z.date({ required_error: 'Move-in date is required' })
});

type CustomerDetailsFormData = z.infer<typeof CustomerDetailsSchema>;

interface CustomerDetailsFormProps {
  onSubmit: (data: CustomerDetailsFormData) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export default function CustomerDetailsForm({ onSubmit, onSkip, isLoading }: CustomerDetailsFormProps) {
  const form = useForm<CustomerDetailsFormData>({
    resolver: zodResolver(CustomerDetailsSchema),
    defaultValues: {
      title: 'Mr',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    }
  });

  const handleSubmit = (data: CustomerDetailsFormData) => {
    // Convert dates to ISO strings for API
    const formattedData = {
      ...data,
      dateOfBirth: data.dateOfBirth.toISOString().split('T')[0],
      moveInDate: data.moveInDate.toISOString().split('T')[0]
    };
    onSubmit(formattedData as any);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Customer Details
        </CardTitle>
        <CardDescription>
          Provide your details for automatic utility registration with Octopus Energy and other providers
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Miss">Miss</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Prof">Prof</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter email address" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="07123456789" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-10 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarLucide className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Move-in Date */}
              <FormField
                control={form.control}
                name="moveInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-in Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-10 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarLucide className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              {onSkip && (
                <Button type="button" variant="outline" onClick={onSkip}>
                  Use Demo Data
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="ml-auto">
                {isLoading ? 'Processing...' : 'Continue with Real Registration'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}