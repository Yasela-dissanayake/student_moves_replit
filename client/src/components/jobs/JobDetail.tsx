import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { 
  MapPin, 
  Building, 
  Clock, 
  Calendar, 
  Briefcase, 
  ChevronLeft, 
  Send, 
  Share2, 
  ArrowRight, 
  ArrowUpRight, 
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function JobDetail() {
  const { id } = useParams();
  const jobId = parseInt(id as string);
  
  const { data: job, isLoading, error } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !isNaN(jobId)
  });
  
  // Mock job data for now
  const mockJob = {
    id: 1,
    title: 'Marketing Assistant',
    company: 'Bright Media',
    companyDescription: 'Bright Media is a leading digital marketing agency with a focus on helping small businesses grow their online presence.',
    website: 'https://brightmedia.example.com',
    logoUrl: null,
    location: 'London',
    type: 'Part-Time',
    category: 'Marketing',
    salary: 12,
    salaryPeriod: 'hourly',
    description: 'We are looking for a creative marketing assistant to join our team. Help with social media campaigns and content creation. This role is perfect for students who are studying marketing or related disciplines and want to get hands-on experience.',
    responsibilities: [
      'Assist in creating content for social media channels',
      'Help manage social media accounts and respond to comments',
      'Conduct market research and competitor analysis',
      'Support the marketing team with campaign reporting and analytics',
      'Contribute ideas for marketing campaigns and content strategy'
    ],
    qualifications: [
      'Currently studying towards a degree in Marketing, Communications, or a related field',
      'Strong written and verbal communication skills',
      'Basic understanding of digital marketing principles',
      'Proficient in Microsoft Office and Google Workspace',
      'Ability to work 15-20 hours per week'
    ],
    benefits: [
      'Flexible working hours to fit around your studies',
      'Remote work options available',
      'Mentorship from experienced marketing professionals',
      'Opportunity to work on real client projects',
      'Potential for permanent position upon graduation'
    ],
    requiredSkills: ['Social Media', 'Content Writing', 'Adobe Creative Suite'],
    preferredSkills: ['Video Editing', 'Photography'],
    postedDate: '2025-04-01T12:00:00Z',
    applicationDeadline: '2025-04-30T23:59:59Z',
    contactEmail: 'jobs@brightmedia.example.com',
    contactPhone: '+44 20 1234 5678',
    status: 'active',
    workSchedule: {
      hours: '15-20',
      days: ['Monday', 'Wednesday', 'Friday'],
      shifts: 'Flexible'
    },
    workEnvironment: 'Hybrid',
    interviewProcess: [
      'Initial application review',
      'Phone screening (15-20 minutes)',
      'In-person or video interview (45 minutes)',
      'Final decision within 1 week'
    ]
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  // In a real application, this would use the data from the API
  const jobData = mockJob;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !jobData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/jobs">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Job Listings
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/jobs">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
      
      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{jobData.title}</h1>
            <div className="flex items-center mt-2">
              <Building className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700 font-medium">{jobData.company}</span>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {jobData.location}
              </span>
              <span className="flex items-center text-gray-600">
                <Briefcase className="h-4 w-4 mr-1" />
                {jobData.type}
              </span>
              <span className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {jobData.workSchedule.hours} hrs/week
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">{jobData.category}</Badge>
              <Badge variant="outline" className="bg-green-50">£{jobData.salary} {jobData.salaryPeriod}</Badge>
              <Badge variant="outline" className="bg-blue-50">{jobData.workEnvironment}</Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-4 md:mt-0">
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Apply Now
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            Posted: {formatDate(jobData.postedDate)}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            Apply by: {formatDate(jobData.applicationDeadline)}
          </div>
        </div>
      </div>
      
      {/* Job Description */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line mb-6">{jobData.description}</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Responsibilities</h3>
                  <ul className="space-y-2">
                    {jobData.responsibilities.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-primary/10 rounded-full p-1 mr-2 mt-1">
                          <ArrowRight className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Qualifications</h3>
                  <ul className="space-y-2">
                    {jobData.qualifications.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-primary/10 rounded-full p-1 mr-2 mt-1">
                          <ArrowRight className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                  <ul className="space-y-2">
                    {jobData.benefits.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-primary/10 rounded-full p-1 mr-2 mt-1">
                          <ArrowRight className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">{skill}</Badge>
                  ))}
                </div>
              </div>
              
              {jobData.preferredSkills.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">Preferred Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobData.preferredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Interview Process</h3>
                <ol className="space-y-2 list-decimal pl-5">
                  {jobData.interviewProcess.map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ol>
              </div>
              
              <Separator className="my-8" />
              
              <div className="flex justify-between items-center">
                <div>
                  <Link href={`/jobs/${jobData.id}/apply`}>
                    <Button size="lg" className="gap-2">
                      Apply for this Position
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Back to top
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <p className="text-gray-700 mb-4">{jobData.companyDescription}</p>
              
              {jobData.website && (
                <a
                  href={jobData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center hover:underline"
                >
                  Visit Website
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </a>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Work Schedule</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Hours per Week</p>
                  <p className="text-gray-700">{jobData.workSchedule.hours} hours</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Working Days</p>
                  <p className="text-gray-700">{jobData.workSchedule.days.join(', ')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Shifts</p>
                  <p className="text-gray-700">{jobData.workSchedule.shifts}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Work Environment</p>
                  <p className="text-gray-700">{jobData.workEnvironment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${jobData.contactEmail}`} className="text-primary hover:underline">
                    {jobData.contactEmail}
                  </a>
                </div>
                
                {jobData.contactPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${jobData.contactPhone}`} className="text-primary hover:underline">
                      {jobData.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Link href="/jobs/recommendations">
                <Button variant="outline" className="w-full">
                  Similar Job Recommendations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}