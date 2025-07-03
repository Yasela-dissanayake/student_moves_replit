import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Building,
  User,
  Paperclip,
  Download,
  MessageSquare,
  FilePenLine,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Textarea
} from "@/components/ui/textarea";
import { useAuth } from '@/lib/auth';

// Function to get the appropriate badge for application status
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'applied':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600">Applied</Badge>;
    case 'reviewing':
      return <Badge variant="outline" className="bg-purple-50 text-purple-600">Reviewing</Badge>;
    case 'interview_scheduled':
      return <Badge variant="outline" className="bg-amber-50 text-amber-600">Interview Scheduled</Badge>;
    case 'offer_made':
      return <Badge variant="outline" className="bg-green-50 text-green-600">Offer Made</Badge>;
    case 'accepted':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-600">Rejected</Badge>;
    case 'declined':
      return <Badge variant="outline" className="bg-gray-100 text-gray-600">Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ApplicationDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const applicationId = parseInt(id as string);
  const [activeTab, setActiveTab] = useState('details');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  
  // Mock application data (in a real app, this would come from an API)
  const mockApplication = {
    id: 1,
    jobId: 1,
    jobTitle: 'Marketing Assistant',
    company: 'Bright Media',
    location: 'London',
    type: 'Part-Time',
    salary: '£12 hourly',
    status: 'interview_scheduled',
    appliedDate: '2025-04-02T14:30:00Z',
    updatedDate: '2025-04-05T09:15:00Z',
    interviewDate: '2025-04-10T13:00:00Z',
    resumeUrl: '#',
    coverLetterUrl: '#',
    questions: [
      {
        question: 'Why are you interested in this position?',
        answer: 'I am passionate about marketing and would love to apply the theoretical knowledge I have gained in my studies to a real-world setting. Bright Media\'s focus on helping small businesses is particularly appealing to me as I believe in supporting local entrepreneurs.'
      },
      {
        question: 'Describe your experience with social media marketing.',
        answer: 'I have managed social media accounts for student organizations, creating content calendars and analyzing engagement metrics. I also completed a digital marketing course where I developed campaigns using Facebook and Instagram ads.'
      }
    ],
    timeline: [
      {
        date: '2025-04-02T14:30:00Z',
        event: 'Application Submitted',
        details: 'Your application was successfully submitted.'
      },
      {
        date: '2025-04-03T10:15:00Z',
        event: 'Application Under Review',
        details: 'Your application is now being reviewed by the hiring team.'
      },
      {
        date: '2025-04-05T09:15:00Z',
        event: 'Interview Scheduled',
        details: 'You have been selected for an interview! Please check your email for details.'
      }
    ],
    notes: '',
    interview: {
      id: 1,
      type: 'video',
      scheduledFor: '2025-04-10T13:00:00Z',
      duration: 45,
      location: null,
      meetingLink: 'https://meet.example.com/interview-12345',
      instructions: 'Please prepare a brief 5-minute presentation about your marketing experience. Be ready to discuss your social media management skills.',
      interviewers: [
        {
          name: 'Sarah Johnson',
          position: 'Marketing Director'
        },
        {
          name: 'David Chen',
          position: 'HR Manager'
        }
      ]
    },
    messages: [
      {
        id: 1,
        sender: 'Bright Media',
        content: "Thank you for applying for the Marketing Assistant position. We'd like to invite you for an interview.",
        timestamp: '2025-04-04T15:30:00Z',
        isEmployer: true
      },
      {
        id: 2,
        sender: 'You',
        content: 'Thank you for the opportunity. I am looking forward to discussing my qualifications with you.',
        timestamp: '2025-04-04T16:45:00Z',
        isEmployer: false
      },
      {
        id: 3,
        sender: 'Bright Media',
        content: "Great! For the interview, please prepare a brief presentation about your marketing experience. The interview will be approximately 45 minutes.",
        timestamp: '2025-04-05T09:15:00Z',
        isEmployer: true
      }
    ]
  };
  
  const { data: application, isLoading, error } = useQuery({
    queryKey: [`/api/applications/${applicationId}`],
    enabled: !isNaN(applicationId) && isAuthenticated,
    initialData: mockApplication, // Using mock data for now
  });
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  const handleWithdrawSubmit = () => {
    // In a real app, this would make an API call to withdraw the application
    console.log('Withdrawing application with reason:', withdrawReason);
    setWithdrawDialogOpen(false);
    // You would typically invalidate the query cache and refetch here
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to view application details.
          </p>
          <Link href="/login">
            <Button>
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h2>
          <p className="text-gray-600 mb-6">
            The application you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/jobs/applications">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to My Applications
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const canWithdraw = ['applied', 'reviewing', 'interview_scheduled'].includes(application.status.toLowerCase());
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/jobs/applications">
            <Button variant="outline" size="sm" className="mb-2">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Application for {application.jobTitle}</h1>
          <div className="flex items-center mt-2">
            <Building className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-gray-700">{application.company}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {getStatusBadge(application.status)}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            Applied on {formatDate(application.appliedDate)}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 mb-8">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Job Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Position</h3>
                    <Link href={`/jobs/${application.jobId}`} className="text-primary hover:underline">
                      {application.jobTitle}
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Company</h3>
                      <p className="text-gray-700">{application.company}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Location</h3>
                      <p className="text-gray-700">{application.location}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Job Type</h3>
                      <p className="text-gray-700">{application.type}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Salary</h3>
                      <p className="text-gray-700">{application.salary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Application Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                      <span>Resume</span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                      <span>Cover Letter</span>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {application.questions && application.questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Application Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {application.questions.map((qa, index) => (
                      <div key={index} className="space-y-2">
                        <h3 className="font-medium text-gray-900">{qa.question}</h3>
                        <p className="text-gray-700 whitespace-pre-line">{qa.answer}</p>
                        {index < application.questions.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/jobs/${application.jobId}`}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Building className="h-4 w-4" />
                      View Job Details
                    </Button>
                  </Link>
                  
                  {application.status === 'interview_scheduled' && application.interview && (
                    <Button 
                      className="w-full justify-start gap-2"
                      onClick={() => setActiveTab('interview')}
                    >
                      <Calendar className="h-4 w-4" />
                      View Interview Details
                    </Button>
                  )}
                  
                  {application.status === 'offer_made' && (
                    <>
                      <Button variant="default" className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Accept Offer
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50">
                        <XCircle className="h-4 w-4" />
                        Decline Offer
                      </Button>
                    </>
                  )}
                  
                  {canWithdraw && (
                    <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Withdraw Application
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Withdraw Application</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to withdraw your application for the {application.jobTitle} position at {application.company}? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <label htmlFor="withdraw-reason" className="block text-sm font-medium mb-2">
                            Reason for withdrawal (optional)
                          </label>
                          <Textarea
                            id="withdraw-reason"
                            placeholder="Please tell us why you're withdrawing your application..."
                            value={withdrawReason}
                            onChange={(e) => setWithdrawReason(e.target.value)}
                            className="w-full min-h-[100px]"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleWithdrawSubmit}
                          >
                            Withdraw Application
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Private notes for your reference</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add your private notes about this application here..."
                    className="min-h-[100px]"
                    value={application.notes}
                    // This would typically update via API in a real app
                    onChange={(e) => console.log('Notes updated:', e.target.value)}
                  />
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline" className="ml-auto gap-2">
                    <FilePenLine className="h-4 w-4" />
                    Save Notes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="interview" className="space-y-6">
          {application.status !== 'interview_scheduled' || !application.interview ? (
            <Card>
              <CardContent className="py-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Interview Scheduled</h3>
                <p className="text-gray-600">
                  You don't have an interview scheduled for this application yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Details</CardTitle>
                    <CardDescription>
                      {format(new Date(application.interview.scheduledFor), 'EEEE, MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {formatDateTime(application.interview.scheduledFor)}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {application.interview.duration} minutes
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Interview Type</h3>
                        <p className="text-gray-900 capitalize">{application.interview.type}</p>
                      </div>
                      
                      {application.interview.location && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Location</h3>
                          <p className="text-gray-900">{application.interview.location}</p>
                        </div>
                      )}
                    </div>
                    
                    {application.interview.type === 'video' && application.interview.meetingLink && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Meeting Link</h3>
                        <Button className="gap-2">
                          Join Interview
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          The link will be active 10 minutes before your scheduled interview time.
                        </p>
                      </div>
                    )}
                    
                    {application.interview.instructions && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Instructions</h3>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                          <p className="text-sm">{application.interview.instructions}</p>
                        </div>
                      </div>
                    )}
                    
                    {application.interview.interviewers && application.interview.interviewers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Interviewers</h3>
                        <div className="space-y-3">
                          {application.interview.interviewers.map((interviewer, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{interviewer.name}</p>
                                <p className="text-sm text-gray-500">{interviewer.position}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Button variant="outline" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Request Reschedule
                      </Button>
                      
                      {application.interview.type === 'video' && application.interview.meetingLink && (
                        <Button>
                          Join Interview
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Preparation Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Research the Company</h3>
                      <p className="text-sm text-gray-700">Review the company's website, recent news, and social media to understand their culture and values.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Prepare for Common Questions</h3>
                      <p className="text-sm text-gray-700">Be ready to discuss your experience, strengths, and how they relate to the job requirements.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Test Your Equipment</h3>
                      <p className="text-sm text-gray-700">For video interviews, check your camera, microphone, and internet connection before the scheduled time.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Dress Professionally</h3>
                      <p className="text-sm text-gray-700">Dress appropriately for the role and company culture, even for virtual interviews.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Prepare Questions</h3>
                      <p className="text-sm text-gray-700">Have thoughtful questions ready to ask the interviewer about the role and company.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {application.timeline.map((event, index) => (
                  <div key={index} className="mb-8 relative pl-8">
                    {/* Timeline line */}
                    {index < application.timeline.length - 1 && (
                      <div className="absolute h-full w-px bg-gray-200 left-3 top-6 bottom-0"></div>
                    )}
                    
                    {/* Event dot */}
                    <div className="absolute w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center left-0 top-0">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(event.date)}
                      </p>
                      <h3 className="font-medium text-gray-900 mt-1">{event.event}</h3>
                      <p className="text-gray-700 mt-1">{event.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communication with {application.company}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                {application.messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.isEmployer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.isEmployer 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{message.sender}</p>
                        <p className="text-xs opacity-70 ml-4">
                          {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                <Textarea 
                  placeholder="Type your message here..." 
                  className="flex-1 min-h-[60px]"
                />
                <Button size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}