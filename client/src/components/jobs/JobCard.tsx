import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, ClockIcon, BriefcaseIcon } from 'lucide-react';

interface JobCardProps {
  job: {
    id: number;
    title: string;
    description: string;
    location: string;
    company?: string;
    employerId: number;
    salary?: number | { min: number; max: number };
    type: string;
    category: string;
    postedDate?: string | Date;
    applicationDeadline?: string | Date;
    status: string;
    aiVerified?: boolean;
  };
}

export function JobCard({ job }: JobCardProps) {
  const formatSalary = (salary?: number | { min: number; max: number }) => {
    if (!salary) return 'Competitive';
    if (typeof salary === 'number') return `£${salary.toLocaleString()}`;
    return `£${salary.min.toLocaleString()} - £${salary.max.toLocaleString()}`;
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-blue-100 text-blue-800';
      case 'filled': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return 'Active';
      case 'pending_approval': return 'Pending Approval';
      case 'paused': return 'Paused';
      case 'filled': return 'Position Filled';
      case 'expired': return 'Expired';
      case 'deleted': return 'Deleted';
      default: return status;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
          {job.aiVerified && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              AI Verified
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-gray-500">
          {job.company || `Employer ID: ${job.employerId}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4 line-clamp-2">
          {job.description}
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center">
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            <span>{job.type} · {job.category}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{formatSalary(job.salary)}</span>
          </div>
          {job.applicationDeadline && (
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>Apply by: {formatDate(job.applicationDeadline)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <Badge className={getStatusColor(job.status)}>
          {getStatusText(job.status)}
        </Badge>
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}