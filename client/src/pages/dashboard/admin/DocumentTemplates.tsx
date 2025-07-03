import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DocumentTemplateEditor from '@/components/documents/DocumentTemplateEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function DocumentTemplates() {
  const [, setLocation] = useLocation();
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <DocumentTemplateEditor />
      </div>
    </DashboardLayout>
  );
}