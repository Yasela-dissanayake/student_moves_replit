import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import NewsletterTemplateGenerator from '@/components/newsletter/NewsletterTemplateGenerator';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Calendar
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Define types
interface NewsletterTemplate {
  id: number;
  name: string;
  subject: string;
  content: string;
  type: 'business' | 'property' | 'event' | 'update';
  imageMap?: Record<string, string>;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface SentEmail {
  id: number;
  template_id: number;
  recipients: string; // JSON string of recipients
  sent_at: string;
  created_by: number;
  status: 'sent' | 'failed';
  test_mode: boolean;
  provider?: string; // Email service provider used
  name?: string; // Template name (joined)
  subject?: string; // Template subject (joined)
  type?: string; // Template type (joined)
}

interface ScheduledEmail {
  id: number;
  template_id: number;
  recipients: string; // JSON string of recipients
  scheduled_time: string;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  status: 'scheduled' | 'sent' | 'cancelled';
  name?: string; // Template name (joined)
  subject?: string; // Template subject (joined)
  type?: string; // Template type (joined)
}

// Form validation schema for sending newsletters
const sendNewsletterSchema = z.object({
  recipients: z.string().min(1, 'Recipients are required'),
  scheduled: z.boolean().optional(),
  scheduledTime: z.string().optional(),
  testMode: z.boolean().optional(),
});

export default function NewsletterGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [activeTab, setActiveTab] = useState<string>('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<NewsletterTemplate | null>(null);
  const [showSendDialog, setShowSendDialog] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NewsletterTemplate | null>(null);
  const [emailServiceStatus, setEmailServiceStatus] = useState<{ 
    configured: boolean; 
    provider: string | null; 
    providers?: {
      sendgrid: boolean;
      custom: boolean;
    }
  }>({
    configured: false,
    provider: null
  });
  
  // Form for sending newsletters
  const sendForm = useForm<z.infer<typeof sendNewsletterSchema>>({
    resolver: zodResolver(sendNewsletterSchema),
    defaultValues: {
      recipients: '',
      scheduled: false,
      scheduledTime: '',
      testMode: false,
    },
  });
  
  // Fetch email service configuration status
  useEffect(() => {
    const checkEmailConfig = async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/newsletter/email-config-status');
        
        if (response.success) {
          setEmailServiceStatus({
            configured: response.emailConfigured,
            provider: response.provider,
            providers: response.providers
          });
        }
      } catch (error) {
        console.error('Error checking email configuration:', error);
      }
    };
    
    checkEmailConfig();
  }, []);
  
  // Queries
  const templatesQuery = useQuery({
    queryKey: ['/api/admin/newsletter/templates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/newsletter/templates');
      return response.templates || [];
    }
  });
  
  const historyQuery = useQuery({
    queryKey: ['/api/admin/newsletter/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/newsletter/history');
      return response.history || [];
    }
  });
  
  const scheduledQuery = useQuery({
    queryKey: ['/api/admin/newsletter/scheduled'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/newsletter/scheduled');
      return response.scheduled || [];
    }
  });
  
  // Mutations
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest('DELETE', `/api/admin/newsletter/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/templates'] });
      toast({
        title: 'Template deleted',
        description: 'The newsletter template has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive'
      });
    }
  });
  
  const sendNewsletterMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/admin/newsletter/send', data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/scheduled'] });
      
      const isScheduled = response.scheduledTime !== undefined;
      
      toast({
        title: isScheduled ? 'Newsletter scheduled' : 'Newsletter sent',
        description: isScheduled 
          ? `The newsletter has been scheduled for ${format(new Date(response.scheduledTime), 'PPpp')}` 
          : 'The newsletter has been sent successfully',
      });
      
      setShowSendDialog(false);
      sendForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Send failed',
        description: error instanceof Error ? error.message : 'Failed to send newsletter',
        variant: 'destructive'
      });
    }
  });
  
  const cancelScheduledMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      return await apiRequest('DELETE', `/api/admin/newsletter/scheduled/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/scheduled'] });
      toast({
        title: 'Scheduled newsletter cancelled',
        description: 'The scheduled newsletter has been cancelled',
      });
    },
    onError: (error) => {
      toast({
        title: 'Cancellation failed',
        description: error instanceof Error ? error.message : 'Failed to cancel scheduled newsletter',
        variant: 'destructive'
      });
    }
  });
  
  // Handle template creation/editing
  const handleTemplateSaved = (template: any) => {
    setShowCreateTemplate(false);
    setEditingTemplate(null);
    
    if (template) {
      // Template was saved successfully
      const action = editingTemplate ? 'updated' : 'created';
      toast({
        title: `Template ${action}`,
        description: `The newsletter template has been ${action} successfully`,
      });
    }
  };
  
  // Handle template deletion
  const handleDeleteTemplate = (template: NewsletterTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };
  
  // Handle sending newsletter
  const handleSendNewsletter = (template: NewsletterTemplate) => {
    setSelectedTemplate(template);
    setShowSendDialog(true);
    sendForm.reset();
  };
  
  // Handle send form submission
  const onSendFormSubmit = (values: z.infer<typeof sendNewsletterSchema>) => {
    if (!selectedTemplate) return;
    
    const recipientList = values.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email !== '');
    
    if (recipientList.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please enter at least one recipient email address',
        variant: 'destructive'
      });
      return;
    }
    
    // Define a proper type for the payload
    type NewsletterPayload = {
      templateId: number;
      recipients: string[];
      testMode: boolean | undefined;
      scheduledTime?: string;
    };

    const payload: NewsletterPayload = {
      templateId: selectedTemplate.id,
      recipients: recipientList,
      testMode: values.testMode
    };
    
    if (values.scheduled && values.scheduledTime) {
      payload.scheduledTime = values.scheduledTime;
    }
    
    sendNewsletterMutation.mutate(payload);
  };
  
  // Handle cancelling a scheduled newsletter
  const handleCancelScheduled = (scheduled: ScheduledEmail) => {
    if (window.confirm('Are you sure you want to cancel this scheduled newsletter?')) {
      cancelScheduledMutation.mutate(scheduled.id);
    }
  };
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Parse recipients helper function
  const parseRecipients = (recipientsJson: string): string[] => {
    try {
      return JSON.parse(recipientsJson);
    } catch (error) {
      return [];
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Generator</h1>
          <p className="text-muted-foreground">
            Create and manage newsletter templates to communicate with your audience
          </p>
        </div>
        <Button onClick={() => setShowCreateTemplate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
      
      {/* Email Service Status */}
      {!emailServiceStatus.configured ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Email Service Not Configured</AlertTitle>
          <AlertDescription>
            Email service is not configured. Please add SENDGRID_API_KEY to the environment variables to enable sending newsletters.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Email Service Status: Active</AlertTitle>
          <AlertDescription className="space-y-2">
            <div>
              <span className="font-medium">Primary Provider:</span> {emailServiceStatus.provider === 'sendgrid' ? 'SendGrid' : emailServiceStatus.provider === 'custom' ? 'Custom SMTP' : 'Test Mode'}
            </div>
            
            {emailServiceStatus.providers && (
              <div className="flex flex-wrap gap-3 mt-1">
                <Badge variant={emailServiceStatus.providers.sendgrid ? "outline" : "secondary"} className={emailServiceStatus.providers.sendgrid ? "border-green-400 text-green-600" : "opacity-60"}>
                  SendGrid: {emailServiceStatus.providers.sendgrid ? "Available" : "Not Configured"}
                </Badge>
                
                <Badge variant={emailServiceStatus.providers.custom ? "outline" : "secondary"} className={emailServiceStatus.providers.custom ? "border-green-400 text-green-600" : "opacity-60"}>
                  Custom SMTP: {emailServiceStatus.providers.custom ? "Available" : "Not Configured"}
                </Badge>
                
                {emailServiceStatus.providers.sendgrid && emailServiceStatus.providers.custom && (
                  <Badge variant="outline" className="border-blue-400 text-blue-600">
                    Fallback Ready
                  </Badge>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Newsletter Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Newsletters</TabsTrigger>
          <TabsTrigger value="history">Sent History</TabsTrigger>
        </TabsList>
        
        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Templates</CardTitle>
              <CardDescription>
                Create and manage your newsletter templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesQuery.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : templatesQuery.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load templates. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (templatesQuery.data as NewsletterTemplate[]).length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No templates found</p>
                    <Button onClick={() => setShowCreateTemplate(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Template
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(templatesQuery.data as NewsletterTemplate[]).map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{template.subject}</TableCell>
                        <TableCell>{formatDate(template.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingTemplate(template);
                                setShowCreateTemplate(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNewsletter(template)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Newsletters</CardTitle>
              <CardDescription>
                View and manage newsletters scheduled for future delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledQuery.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scheduledQuery.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load scheduled newsletters. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (scheduledQuery.data as ScheduledEmail[]).length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No scheduled newsletters found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(scheduledQuery.data as ScheduledEmail[]).map((scheduled) => (
                      <TableRow key={scheduled.id}>
                        <TableCell className="font-medium">{scheduled.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {scheduled.type || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {parseRecipients(scheduled.recipients).length} recipient(s)
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDate(scheduled.scheduled_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-destructive"
                            onClick={() => handleCancelScheduled(scheduled)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sent History</CardTitle>
              <CardDescription>
                View history of sent newsletters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : historyQuery.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load email history. Please try again.
                  </AlertDescription>
                </Alert>
              ) : (historyQuery.data as SentEmail[]).length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground">No sent newsletters found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(historyQuery.data as SentEmail[]).map((sent) => (
                      <TableRow key={sent.id}>
                        <TableCell className="font-medium">{sent.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {sent.type || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {parseRecipients(sent.recipients).length} recipient(s)
                          {sent.test_mode && (
                            <Badge variant="secondary" className="ml-2">Test</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(sent.sent_at)}</TableCell>
                        <TableCell>
                          {sent.status === 'sent' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {sent.provider ? (
                            <Badge variant="outline" className={sent.provider === 'sendgrid' ? 'border-blue-400 text-blue-600' : 'border-green-400 text-green-600'}>
                              {sent.provider === 'sendgrid' ? 'SendGrid' : 
                               sent.provider === 'custom' ? 'Custom SMTP' : 
                               sent.provider === 'test' ? 'Test Mode' : sent.provider}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not available</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create/Edit Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="sm:max-w-5xl p-0">
          <NewsletterTemplateGenerator 
            onTemplateSaved={handleTemplateSaved}
            initialTemplate={editingTemplate}
            mode={editingTemplate ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
      
      {/* Send Newsletter Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
            <DialogDescription>
              {selectedTemplate && `Prepare to send "${selectedTemplate.name}"`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(onSendFormSubmit)} className="space-y-6">
              <FormField
                control={sendForm.control}
                name="recipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email1@example.com, email2@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter recipient email addresses, separated by commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sendForm.control}
                name="scheduled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Schedule for later</FormLabel>
                      <FormDescription>
                        Choose whether to send now or schedule for later
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {sendForm.watch('scheduled') && (
                <FormField
                  control={sendForm.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Date and Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={sendForm.control}
                name="testMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Test Mode</FormLabel>
                      <FormDescription>
                        In test mode, emails will not be sent but will be logged
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSendDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={
                    !emailServiceStatus.configured || 
                    sendNewsletterMutation.isPending
                  }
                >
                  {sendNewsletterMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {sendForm.watch('scheduled') ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {sendForm.watch('scheduled') ? 'Schedule' : 'Send Now'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Custom Switch component for form fields
function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean | undefined;
  onCheckedChange: (checked: boolean) => void;
}) {
  const isChecked = checked || false;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked ? "bg-primary" : "bg-input"
      }`}
      onClick={() => onCheckedChange(!isChecked)}
    >
      <span
        data-state={isChecked ? "checked" : "unchecked"}
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          isChecked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}