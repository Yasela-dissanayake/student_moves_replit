import React, { useState } from 'react';
import { Download, FileSpreadsheet, File, Check } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { FavoriteJob } from '@/hooks/use-favorite-jobs';

interface ExportJobsButtonProps {
  jobs: FavoriteJob[];
  filename?: string;
}

export function ExportJobsButton({ jobs, filename = 'job-search-results' }: ExportJobsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Helper to clean up job data for export
  const prepareJobsForExport = () => {
    return jobs.map(job => ({
      'Job Title': job.title,
      'Company': job.company,
      'Location': job.location,
      'Type': job.type,
      'Category': job.category,
      'Work Arrangement': job.workArrangement,
      'Salary': `£${job.salary} ${job.salaryPeriod}`,
      'Posted Date': new Date(job.postedDate).toLocaleDateString(),
      'Application Deadline': new Date(job.applicationDeadline).toLocaleDateString(),
      'Required Skills': job.requiredSkills.join(', '),
      'Description': job.description
    }));
  };

  // Export as CSV
  const exportToCsv = () => {
    setIsExporting(true);
    
    try {
      const jobData = prepareJobsForExport();
      
      // Get headers
      const headers = Object.keys(jobData[0]);
      
      // Format data as CSV
      const csvContent = [
        headers.join(','),
        ...jobData.map(row => 
          headers.map(header => {
            // Wrap values with commas in quotes
            const value = row[header as keyof typeof row].toString();
            return value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('Error exporting to CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export as JSON
  const exportToJson = () => {
    setIsExporting(true);
    
    try {
      const jobData = prepareJobsForExport();
      
      // Format data as JSON
      const jsonContent = JSON.stringify(jobData, null, 2);
      
      // Create download
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (err) {
      console.error('Error exporting to JSON:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={jobs.length === 0 || isExporting}
        >
          {exportSuccess ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export {jobs.length} job{jobs.length !== 1 ? 's' : ''}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCsv} disabled={isExporting || jobs.length === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJson} disabled={isExporting || jobs.length === 0}>
          <File className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}