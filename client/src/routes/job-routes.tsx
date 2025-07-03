import React from 'react';
import { Route, Switch, Link } from 'wouter';
import { JobListings } from '@/components/jobs/JobListings';
import { JobDetail } from '@/components/jobs/JobDetail';
import { CreateJobForm } from '@/components/jobs/CreateJobForm';
import { JobApplications } from '@/components/jobs/JobApplications';
import { ApplicationDetail } from '@/components/jobs/ApplicationDetail';
import { JobRecommendations } from '@/components/jobs/JobRecommendations';

export function JobRoutes() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Jobs Platform</h1>
        <div>
          <Link href="/jobs/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Post a Job
          </Link>
        </div>
      </div>
      
      {/* Display the component directly based on the current route */}
      {window.location.pathname === "/jobs" && <JobListings />}
      {window.location.pathname === "/jobs/new" && <CreateJobForm />}
      {window.location.pathname === "/jobs/applications" && <JobApplications />}
      {window.location.pathname.startsWith("/jobs/applications/") && <ApplicationDetail />}
      {window.location.pathname === "/jobs/recommendations" && <JobRecommendations />}
      {window.location.pathname.match(/^\/jobs\/\d+$/) && <JobDetail />}
    </div>
  );
}