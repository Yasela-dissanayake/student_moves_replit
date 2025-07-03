import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const registerSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens and apostrophes' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .refine(email => {
      // Check for common educational domains for tenant/student users
      if (email.endsWith('.edu') || email.endsWith('.ac.uk') || email.includes('student.')) {
        return true;
      }
      // Allow other emails for landlords and agents
      return true;
    }, { message: 'Student accounts require a valid educational email' }),
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .refine(
      (password) => {
        // Simpler password validation that's more user-friendly
        // Requires at least 6 characters with at least one letter and one number
        return /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password);
      },
      { message: 'Password must contain at least one letter and one number' }
    ),
  phone: z.string()
    .optional()
    .refine(val => !val || /^(\+\d{1,3})?\s?\d{10,14}$/.test(val), 
      { message: 'Please enter a valid phone number' }),
  userType: z.enum(['tenant', 'landlord', 'agent']),
  agreeToTerms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms and conditions' }),
});

export default function Register() {
  const [location, setLocation] = useLocation();
  const { register, error, loading } = useAuth();
  
  // Extract userType from URL query parameters if available
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') as 'tenant' | 'landlord' | 'agent' | null;
  const initialUserType = userTypeParam || 'tenant';
  
  const [userType, setUserType] = useState<'tenant' | 'landlord' | 'agent'>(initialUserType);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      userType: initialUserType,
      agreeToTerms: false,
    },
  });

  // Update the form value when the tab changes
  const handleUserTypeChange = (value: string) => {
    setUserType(value as 'tenant' | 'landlord' | 'agent');
    form.setValue('userType', value as 'tenant' | 'landlord' | 'agent');
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setRegisterError(null);
      await register(values);
      
      // Redirect to the appropriate dashboard
      setLocation(`/dashboard/${values.userType}`);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register. Please try again.');
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Register as a tenant, landlord, or agent to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={initialUserType} 
              onValueChange={handleUserTypeChange}
              className="w-full mb-6"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tenant">Tenant</TabsTrigger>
                <TabsTrigger value="landlord">Landlord</TabsTrigger>
                <TabsTrigger value="agent">Agent</TabsTrigger>
              </TabsList>
              <TabsContent value="tenant">
                <p className="text-sm text-gray-500 mt-2">
                  Register as a tenant to search for properties, apply for tenancies, and manage your rental experience.
                </p>
              </TabsContent>
              <TabsContent value="landlord">
                <p className="text-sm text-gray-500 mt-2">
                  Register as a landlord to list properties, manage tenants, and track your rental income.
                </p>
              </TabsContent>
              <TabsContent value="agent">
                <p className="text-sm text-gray-500 mt-2">
                  Register as an agent to manage properties on behalf of landlords and assist tenants in finding homes.
                </p>
              </TabsContent>
            </Tabs>

            {(registerError || error) && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {registerError || error?.message || 'An error occurred during registration'}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
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
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+44 7700 900123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input type="hidden" {...field} value={userType} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I agree to the <a href="/terms" className="text-primary hover:underline">Terms and Conditions</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. I understand that my information will be used to prevent fraud and ensure platform security.
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}