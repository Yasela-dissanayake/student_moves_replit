import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format } from 'date-fns';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Loader2,
  Search,
  Building,
  Calendar as CalendarIcon,
  Calendar1,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from '@/lib/auth';

interface ApplicationsFilters {
  search: string;
  status: string;
  dateRange: string;
}

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

export function JobApplications() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('my-applications');
  const [filters, setFilters] = useState<ApplicationsFilters>({
    search: '',
    status: '',
    dateRange: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock applications data (in a real app, this would come from the API)
  const mockApplications = [
    {
      id: 1,
      jobId: 1,
      jobTitle: 'Marketing Assistant',
      company: 'Bright Media',
      location: 'London',
      status: 'interview_scheduled',
      appliedDate: '2025-04-02T14:30:00Z',
      updatedDate: '2025-04-05T09:15:00Z',
      interviewDate: '2025-04-10T13:00:00Z',
      notes: 'Interview scheduled with Marketing Director',
    },
    {
      id: 2,
      jobId: 3,
      jobTitle: 'Web Developer Intern',
      company: 'Tech Solutions',
      location: 'Manchester',
      status: 'reviewing',
      appliedDate: '2025-04-03T10:45:00Z',
      updatedDate: '2025-04-04T16:20:00Z',
      interviewDate: null,
      notes: 'Application under review by the hiring team',
    },
    {
      id: 3,
      jobId: 4,
      jobTitle: 'Student Support Assistant',
      company: 'Student Services',
      location: 'Birmingham',
      status: 'applied',
      appliedDate: '2025-04-05T11:30:00Z',
      updatedDate: '2025-04-05T11:30:00Z',
      interviewDate: null,
      notes: 'Application submitted successfully',
    },
    {
      id: 4,
      jobId: 2,
      jobTitle: 'Student Ambassador',
      company: 'London University',
      location: 'London',
      status: 'rejected',
      appliedDate: '2025-03-25T09:30:00Z',
      updatedDate: '2025-04-01T15:45:00Z',
      interviewDate: null,
      notes: 'Position filled with another candidate',
    },
  ];
  
  // Mock interviews data (in a real app, this would come from the API)
  const mockInterviews = [
    {
      id: 1,
      applicationId: 1,
      jobTitle: 'Marketing Assistant',
      company: 'Bright Media',
      type: 'video',
      status: 'scheduled',
      scheduledFor: '2025-04-10T13:00:00Z',
      duration: 45,
      location: null,
      meetingLink: 'https://meet.example.com/interview-12345',
      notes: 'Please prepare a brief presentation about your marketing experience',
    }
  ];
  
  // Mock offers data (in a real app, this would come from the API)
  const mockOffers = [];
  
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/applications', user?.id],
    enabled: isAuthenticated,
    initialData: mockApplications, // Using mock data for now
  });
  
  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ['/api/interviews', user?.id],
    enabled: isAuthenticated,
    initialData: mockInterviews, // Using mock data for now
  });
  
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['/api/offers', user?.id],
    enabled: isAuthenticated,
    initialData: mockOffers, // Using mock data for now
  });
  
  const handleFilterChange = (key: keyof ApplicationsFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateRange: '',
    });
  };
  
  // Filter applications based on search term and filters
  const filteredApplications = applications.filter(app => {
    const searchMatch = !filters.search || 
      app.jobTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.company.toLowerCase().includes(filters.search.toLowerCase());
      
    const statusMatch = !filters.status || app.status === filters.status;
    
    // Date range filtering would be implemented here
    
    return searchMatch && statusMatch;
  });
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">
            You need to be signed in to view your job applications.
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
  
  const isLoading = applicationsLoading || interviewsLoading || offersLoading;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">My Applications</h1>
        <Link href="/jobs">
          <Button variant="outline">
            Browse Jobs
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="my-applications" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="my-applications">Applications</TabsTrigger>
          <TabsTrigger value="my-interviews">Interviews</TabsTrigger>
          <TabsTrigger value="my-offers">Offers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-applications" className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search by job title or company"
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto w-full flex items-center gap-2"
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
            
            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status-filter">Application Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="offer_made">Offer Made</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-filter">Date Range</Label>
                  <Select 
                    value={filters.dateRange} 
                    onValueChange={(value) => handleFilterChange('dateRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:flex items-end hidden">
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X size={16} />
                    Clear Filters
                  </Button>
                </div>
                
                <div className="md:hidden flex justify-end">
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X size={16} />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Applications Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                <p className="mt-1 text-gray-500">
                  {filters.search || filters.status || filters.dateRange ? 
                    "Try adjusting your filters or clearing them to see all applications." : 
                    "You haven't applied to any jobs yet."}
                </p>
                {(filters.search || filters.status || filters.dateRange) && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear All Filters
                  </Button>
                )}
                <div className="mt-6">
                  <Link href="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        <Link href={`/jobs/${application.jobId}`}>
                          <span className="text-primary hover:underline cursor-pointer">
                            {application.jobTitle}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-gray-400" />
                          <span>{application.company}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{formatDate(application.appliedDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(application.updatedDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/jobs/applications/${application.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-interviews" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-medium text-gray-900">No interviews scheduled</h3>
                <p className="mt-1 text-gray-500">
                  You don't have any interviews scheduled at the moment.
                </p>
                <div className="mt-6">
                  <Link href="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{interview.jobTitle}</h3>
                      <p className="text-gray-600">{interview.company}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 capitalize">
                      {interview.type} Interview
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={18} className="text-gray-500" />
                      <span className="font-medium">
                        {formatDateTime(interview.scheduledFor)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-gray-500" />
                      <span>{interview.duration} minutes</span>
                    </div>
                    
                    {interview.meetingLink && (
                      <div className="mt-2">
                        <a 
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline flex items-center"
                        >
                          Join Meeting Link
                        </a>
                      </div>
                    )}
                    
                    {interview.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700">{interview.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t flex justify-between items-center">
                    <Link href={`/jobs/applications/${interview.applicationId}`}>
                      <Button variant="outline" size="sm">
                        View Application
                      </Button>
                    </Link>
                    
                    {interview.type === 'video' && interview.meetingLink && (
                      <Button size="sm">
                        Join Interview
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-offers" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-medium text-gray-900">No offers received</h3>
                <p className="mt-1 text-gray-500">
                  You haven't received any job offers yet. Keep applying and attending interviews!
                </p>
                <div className="mt-6">
                  <Link href="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Offers list would go here */}
              <p>Your received offers will appear here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}