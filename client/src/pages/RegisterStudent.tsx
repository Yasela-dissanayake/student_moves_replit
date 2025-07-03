import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, BookOpen, User, Info, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

// Universities list
const universities = [
  "University of Leeds",
  "Leeds Beckett University",
  "University of Bradford",
  "University of Huddersfield",
  "Leeds Arts University",
  "Leeds Trinity University",
  "Leeds Conservatoire",
  "University of York",
  "Sheffield Hallam University",
  "University of Sheffield",
  "Manchester Metropolitan University",
  "University of Manchester",
  "Other"
];

const studentRegisterSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens and apostrophes' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
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
  userType: z.enum(['student', 'tenant']),
  university: z.string().optional(),
  universityEmail: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, { message: 'You must agree to the terms and conditions' }),
});

export default function RegisterStudent() {
  const [location, setLocation] = useLocation();
  const { register, error, loading } = useAuth();
  
  // Extract userType from URL query parameters if available
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') as 'student' | 'tenant' | null;
  const initialUserType = userTypeParam || 'student';
  
  const [userType, setUserType] = useState<'student' | 'tenant'>(initialUserType as 'student' | 'tenant');
  const [registerError, setRegisterError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof studentRegisterSchema>>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      userType: initialUserType as 'student' | 'tenant',
      university: '',
      universityEmail: '',
      agreeToTerms: false,
    },
  });

  // Update the form value when the tab changes
  const handleUserTypeChange = (value: string) => {
    setUserType(value as 'student' | 'tenant');
    form.setValue('userType', value as 'student' | 'tenant');
  };

  // Show university fields only for student registrations
  const watchedUserType = form.watch('userType');
  const isStudent = watchedUserType === 'student';

  async function onSubmit(values: z.infer<typeof studentRegisterSchema>) {
    try {
      setRegisterError(null);
      
      // Add student-specific fields if registering as a student
      const userData = {
        ...values,
        // For student registrations, set student-specific fields
        studentVerificationStatus: isStudent ? 'pending' : undefined,
        studentUniversityName: isStudent ? values.university : undefined,
        studentUniversityEmail: isStudent ? values.universityEmail : undefined,
      };
      
      await register(userData);
      
      // Redirect to the appropriate dashboard
      // For student users, always redirect to tenant dashboard since they share functionality
      const dashboardPath = values.userType === 'student' ? '/dashboard/tenant' : `/dashboard/${values.userType}`;
      setLocation(dashboardPath);
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register. Please try again.');
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-4 max-w-md mx-auto">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Student Registration</CardTitle>
            <CardDescription className="text-center">
              Register as a student or tenant to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={initialUserType} 
              onValueChange={handleUserTypeChange}
              className="w-full mb-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Student
                </TabsTrigger>
                <TabsTrigger value="tenant" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Tenant
                </TabsTrigger>
              </TabsList>
              <TabsContent value="student">
                <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-4">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                    <AlertDescription className="text-sm">
                      Register as a student to access exclusive student features, including student chat, marketplace, vouchers and discounts.
                      <br /><br />
                      <span className="font-semibold">Note:</span> You'll need to verify your student status with a university email and ID verification.
                    </AlertDescription>
                  </div>
                </Alert>
              </TabsContent>
              <TabsContent value="tenant">
                <p className="text-sm text-gray-500 mt-2">
                  Register as a tenant to search for properties, apply for tenancies, and manage your rental experience.
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

                {isStudent && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                      <h3 className="font-medium text-sm mb-2 flex items-center text-blue-800">
                        <BookOpen className="h-4 w-4 mr-1.5" />
                        Student Verification Information
                      </h3>
                      <p className="text-xs text-blue-700 mb-2">
                        Please provide your university details to verify your student status.
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="university"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your university" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {universities.map((uni) => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="universityEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            University Email
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground ml-1 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    This should be your official university email address (often ending in .ac.uk or .edu)
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="student@university.ac.uk" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            We'll send a verification link to this email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

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
            <div className="text-xs text-center text-gray-400">
              Looking to register as a landlord or agent?{' '}
              <a href="/register" className="text-primary hover:underline">
                Click here
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}