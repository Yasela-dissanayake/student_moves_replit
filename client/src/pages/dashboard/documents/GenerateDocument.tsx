import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from 'lucide-react';

export default function GenerateDocument() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('tenancy_agreement');
  
  // This is a stub component that will be fully implemented later
  // For now, it just shows a message that the feature is coming soon
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="gap-2 mb-4"
          onClick={() => setLocation('/dashboard/documents')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Documents
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generate Document</CardTitle>
          <CardDescription>Create legal documents from templates</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="tenancy_agreement">Tenancy Agreement</TabsTrigger>
              <TabsTrigger value="deposit_certificate">Deposit Certificate</TabsTrigger>
              <TabsTrigger value="right_to_rent">Right to Rent</TabsTrigger>
              <TabsTrigger value="property_inventory">Property Inventory</TabsTrigger>
              <TabsTrigger value="custom">Custom Document</TabsTrigger>
            </TabsList>
            
            {['tenancy_agreement', 'deposit_certificate', 'right_to_rent', 'property_inventory', 'custom'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-primary/10 p-6 mb-4">
                    <div className="h-12 w-12 text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Document Generation</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    This feature is under development and will be available soon. You'll be able to generate and customize 
                    {tab === 'tenancy_agreement' && ' tenancy agreements'}
                    {tab === 'deposit_certificate' && ' deposit certificates'}
                    {tab === 'right_to_rent' && ' right to rent documents'}
                    {tab === 'property_inventory' && ' property inventories'}
                    {tab === 'custom' && ' custom documents'}
                    {' '}with just a few clicks.
                  </p>
                  <Button disabled>Coming Soon</Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-muted-foreground">
            For assistance with document generation, please contact support.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}