import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AIServicesSettings } from '@/components/admin/AIServicesSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIWebsiteBuilder } from '@/components/admin/AIWebsiteBuilder';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AISettingsPage() {
  const [, setLocation] = useLocation();
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">AI Services Management</h1>
          <p className="text-gray-500 mt-2">
            Manage and configure AI services used by the application
          </p>
        </div>
        
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="status">Service Status</TabsTrigger>
            <TabsTrigger value="website-builder">Website Builder</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-4">
            <AIServicesSettings />
          </TabsContent>
          
          <TabsContent value="website-builder" className="mt-4">
            <AIWebsiteBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}