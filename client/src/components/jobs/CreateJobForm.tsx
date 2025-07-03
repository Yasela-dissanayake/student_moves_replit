import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect } from '../../components/shared/MultiSelect';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

// Define form schema
const jobFormSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  salary: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
  }).optional(),
  type: z.string().min(1, 'Job type is required'),
  category: z.string().min(1, 'Job category is required'),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  workSchedule: z.object({
    totalHoursPerWeek: z.string().optional(),
    preferredDays: z.array(z.string()).optional(),
    preferredTimeOfDay: z.array(z.string()).optional(),
  }).optional(),
  applicationDeadline: z.string().optional(),
  startDate: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export function CreateJobForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Define form with react-hook-form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      salary: {
        min: '',
        max: '',
      },
      type: '',
      category: '',
      requiredSkills: [],
      preferredSkills: [],
      workSchedule: {
        totalHoursPerWeek: '',
        preferredDays: [],
        preferredTimeOfDay: [],
      },
      applicationDeadline: '',
      startDate: '',
    },
  });

  // Fetch authentication state
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/session-test'],
    queryFn: async () => {
      const response = await fetch('/api/session-test');
      if (!response.ok) {
        throw new Error('Failed to fetch auth state');
      }
      return response.json();
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      // Preprocess the data
      const processedData = {
        ...data,
        // Convert string to number for salary
        salary: data.salary && (data.salary.min || data.salary.max) ? {
          min: data.salary.min ? parseInt(data.salary.min) : undefined,
          max: data.salary.max ? parseInt(data.salary.max) : undefined,
        } : undefined,
        // Convert string to number for workSchedule
        workSchedule: data.workSchedule ? {
          ...data.workSchedule,
          totalHoursPerWeek: data.workSchedule.totalHoursPerWeek ? 
            parseInt(data.workSchedule.totalHoursPerWeek) : undefined,
        } : undefined,
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Job Posted Successfully',
        description: 'Your job posting has been submitted and is pending approval.',
      });
      
      // Navigate to the job detail page
      navigate(`${data.id}`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Post Job',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: JobFormValues) => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
      return;
    }
    
    createJobMutation.mutate(values);
  };

  // Job types and categories
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Internship',
    'Contract',
    'Temporary',
    'Volunteer',
  ];

  const jobCategories = [
    'Technology',
    'Marketing',
    'Customer Service',
    'Hospitality',
    'Retail',
    'Administrative',
    'Education',
    'Healthcare',
    'Finance',
    'Engineering',
    'Creative',
    'Other',
  ];

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const timesOfDay = [
    'Morning',
    'Afternoon',
    'Evening',
    'Night',
    'Flexible',
  ];

  // Get current form values for preview
  const currentValues = form.getValues();

  // Check if user is authenticated and is an employer
  const canCreateJob = authData?.authenticated && 
    (authData?.userType === 'employer' || authData?.userType === 'admin');

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canCreateJob) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employer Account Required</CardTitle>
          <CardDescription>
            Only employers can post job listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in as an employer to post jobs.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/login/employer')}>
              Log in as Employer
            </Button>
            <Button variant="outline" onClick={() => navigate('')}>
              Back to Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="outline" onClick={() => navigate('/jobs')} className="mb-4">
        Back to Jobs
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Post a New Job</CardTitle>
          <CardDescription>
            Create a job listing for students to apply
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="form" value={isPreviewMode ? 'preview' : 'form'}>
            <TabsList className="mb-4">
              <TabsTrigger 
                value="form" 
                onClick={() => setIsPreviewMode(false)}
              >
                Job Form
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                onClick={() => setIsPreviewMode(true)}
                disabled={!form.formState.isValid}
              >
                Preview Listing
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Marketing Assistant" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Type*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {jobTypes.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {jobCategories.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. London, Remote, Cambridge" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="salary.min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Salary (£)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 20000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="salary.max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Salary (£)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 30000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Job Description</h3>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the responsibilities, requirements, and other details of the job..."
                              className="min-h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Skills */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Skills & Requirements</h3>
                    
                    <FormField
                      control={form.control}
                      name="requiredSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Skills</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Add required skills..."
                              selected={field.value || []}
                              options={[]}
                              onChange={field.onChange}
                              creatable
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="preferredSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Skills</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Add preferred skills..."
                              selected={field.value || []}
                              options={[]}
                              onChange={field.onChange}
                              creatable
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Work Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Work Schedule</h3>
                    
                    <FormField
                      control={form.control}
                      name="workSchedule.totalHoursPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours Per Week</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="workSchedule.preferredDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Days</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Select working days..."
                              selected={field.value || []}
                              options={daysOfWeek.map(day => ({ label: day, value: day }))}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="workSchedule.preferredTimeOfDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Times</FormLabel>
                          <FormControl>
                            <MultiSelect
                              placeholder="Select working times..."
                              selected={field.value || []}
                              options={timesOfDay.map(time => ({ label: time, value: time }))}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Dates */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Dates</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="applicationDeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => navigate('/jobs')}>
                      Cancel
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsPreviewMode(true)}
                        disabled={!form.formState.isValid}
                      >
                        Preview
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!form.formState.isValid || createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="border rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">{currentValues.title}</h2>
                  <p className="text-gray-500">{authData?.name || 'Your Company'}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{currentValues.type}</Badge>
                  <Badge variant="outline">{currentValues.category}</Badge>
                  <Badge variant="outline">{currentValues.location}</Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-lg font-medium mb-1">Job Description</h3>
                    <p className="whitespace-pre-line">{currentValues.description}</p>
                  </div>
                  
                  {currentValues.salary && (currentValues.salary.min || currentValues.salary.max) && (
                    <div>
                      <h3 className="text-lg font-medium mb-1">Salary</h3>
                      <p>
                        {currentValues.salary.min && !currentValues.salary.max && `From £${currentValues.salary.min}`}
                        {!currentValues.salary.min && currentValues.salary.max && `Up to £${currentValues.salary.max}`}
                        {currentValues.salary.min && currentValues.salary.max && `£${currentValues.salary.min} - £${currentValues.salary.max}`}
                      </p>
                    </div>
                  )}
                  
                  {currentValues.requiredSkills && currentValues.requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-1">Required Skills</h3>
                      <ul className="list-disc pl-5">
                        {currentValues.requiredSkills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentValues.preferredSkills && currentValues.preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-1">Preferred Skills</h3>
                      <ul className="list-disc pl-5">
                        {currentValues.preferredSkills.map((skill, index) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentValues.workSchedule && (
                    <div>
                      <h3 className="text-lg font-medium mb-1">Work Schedule</h3>
                      {currentValues.workSchedule.totalHoursPerWeek && (
                        <p>Hours per week: {currentValues.workSchedule.totalHoursPerWeek}</p>
                      )}
                      {currentValues.workSchedule.preferredDays && currentValues.workSchedule.preferredDays.length > 0 && (
                        <p>Days: {currentValues.workSchedule.preferredDays.join(', ')}</p>
                      )}
                      {currentValues.workSchedule.preferredTimeOfDay && currentValues.workSchedule.preferredTimeOfDay.length > 0 && (
                        <p>Times: {currentValues.workSchedule.preferredTimeOfDay.join(', ')}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-4">
                    {currentValues.applicationDeadline && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Application Deadline</h3>
                        <p>{new Date(currentValues.applicationDeadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {currentValues.startDate && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Start Date</h3>
                        <p>{new Date(currentValues.startDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-between">
                  <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
                    Edit Job
                  </Button>
                  
                  <Button onClick={form.handleSubmit(onSubmit)}>
                    {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
                  </Button>
                </div>
              </div>
              
              <Alert className="mb-4 bg-blue-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Preview Mode</AlertTitle>
                <AlertDescription>
                  This is a preview of how your job listing will appear. Make any final edits before posting.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}