import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DocumentTemplateEditor from '@/components/documents/DocumentTemplateEditor';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DocumentTemplates() {
  const [, setLocation] = useLocation();
  
  return (
    <DashboardLayout dashboardType="agent">
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/agent')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <DocumentTemplateEditor />
      </div>
    </DashboardLayout>
  );
}