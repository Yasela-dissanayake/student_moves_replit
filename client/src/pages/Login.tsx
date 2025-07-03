import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuthLogin, UserType } from '@/hooks/use-auth-login';
import { Building, Building2, GraduationCap, Home, User } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginProps {
  userTypeParam?: UserType;
}

export default function Login({ userTypeParam }: LoginProps) {
  const [, setLocation] = useLocation();
  const { loginWithUserType, isLoading } = useAuthLogin();
  const [userType, setUserType] = useState<UserType>(userTypeParam || 'tenant');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Pass the userType to login
      const success = await loginWithUserType(data.email, data.password, userType);
      
      if (success) {
        toast({
          title: 'Login successful',
          description: 'You have been logged in successfully.',
          variant: 'default',
        });
        
        // Redirect based on user type
        const redirectMap: Record<UserType, string> = {
          tenant: '/dashboard/tenant',
          student: '/dashboard/tenant', // Students use the tenant dashboard
          landlord: '/dashboard/landlord',
          agent: '/dashboard/agent',
          admin: '/dashboard/admin',
        };
        
        setLocation(redirectMap[userType]);
      } else {
        toast({
          title: 'Login failed',
          description: 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get the icon based on user type
  const getUserIcon = (type: string) => {
    switch (type) {
      case 'tenant':
        return <Home className="h-5 w-5" />;
      case 'student':
        return <GraduationCap className="h-5 w-5" />;
      case 'landlord':
        return <Building className="h-5 w-5" />;
      case 'agent':
        return <Building2 className="h-5 w-5" />;
      case 'admin':
        return <User className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const userTypes: Array<{id: UserType, label: string}> = [
    { id: 'tenant', label: 'Tenant' },
    { id: 'student', label: 'Student' },
    { id: 'landlord', label: 'Landlord' },
    { id: 'agent', label: 'Agent' },
    { id: 'admin', label: 'Admin' }
  ];

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Login to StudentMoves</CardTitle>
          <CardDescription>Select your account type and login</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="tenant" value={userType} onValueChange={(value) => setUserType(value as UserType)}>
          <div className="px-6">
            <TabsList className="grid grid-cols-5 mb-6 w-full">
              {userTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="flex flex-col items-center space-y-1 py-2">
                  {getUserIcon(type.id)}
                  <span className="text-xs font-medium">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <CardContent>
            {userTypes.map((type) => (
              <TabsContent key={type.id} value={type.id}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
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
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : `Login as ${type.label}`}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
        
        <CardFooter className="flex flex-col space-y-3 pt-0">
          <div className="text-sm text-center text-gray-500 mt-4">
            Don't have an account?{' '}
            <a href="/register" className="text-primary font-medium hover:underline">Sign up</a>
          </div>
          <div className="text-xs text-center text-gray-400">
            <a href="/forgot-password" className="hover:underline">Forgot password?</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}