import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import RegisteredUtilitiesView from '@/components/utility/RegisteredUtilitiesView';
import UtilitySetupWizard from '@/components/utility/UtilitySetupWizard';
import {
  CheckCircle2,
  Zap,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  Plus
} from 'lucide-react';

export default function UtilityDashboard() {
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [registeredUtilities, setRegisteredUtilities] = useState([
    {
      id: 'octopus-energy-1',
      type: 'dual_fuel' as const,
      provider: 'Octopus Energy',
      status: 'active' as const,
      accountNumber: 'OE99371077',
      referenceNumber: 'REFEPDHTV3I',
      registrationDate: '2025-06-24',
      startDate: '2025-07-01',
      monthlyCost: 85,
      nextSteps: [
        'You will receive a welcome email within 24 hours',
        'Smart meter installation will be scheduled within 2 weeks',
        'Your first bill will be sent after your first month',
        'Download the Octopus Energy app for account management'
      ],
      contactInfo: {
        phone: '0808 164 1088',
        email: 'hello@octopus.energy',
        website: 'https://octopus.energy'
      }
    },
    {
      id: 'tv-licensing-1',
      type: 'tv' as const,
      provider: 'TV Licensing',
      status: 'active' as const,
      accountNumber: 'TV99396047',
      referenceNumber: 'TV99396047',
      registrationDate: '2025-06-24',
      startDate: '2025-06-24',
      monthlyCost: 13,
      nextSteps: [
        'Your TV license is now active',
        'Keep your license number safe: TV99396047',
        'Set up direct debit for automatic renewals',
        'You can watch live TV and BBC iPlayer'
      ],
      contactInfo: {
        phone: '0300 790 6165',
        website: 'https://www.tvlicensing.co.uk'
      }
    },
    {
      id: 'thames-water-1',
      type: 'water' as const,
      provider: 'Thames Water',
      status: 'failed' as const,
      registrationDate: '2025-06-24',
      monthlyCost: 35,
      nextSteps: [
        'Visit https://www.thameswater.co.uk/help/account-and-billing/moving-home to register manually',
        'Call customer service: 0800 316 9800',
        'Have your property details and identification ready',
        'Set up direct debit for automatic payments'
      ],
      contactInfo: {
        phone: '0800 316 9800',
        website: 'https://www.thameswater.co.uk/help/account-and-billing/moving-home'
      }
    }
  ]);
  
  const { toast } = useToast();

  const activeUtilities = registeredUtilities.filter(u => u.status === 'active');
  const pendingUtilities = registeredUtilities.filter(u => u.status === 'pending');
  const failedUtilities = registeredUtilities.filter(u => u.status === 'failed');
  const totalMonthlyCost = registeredUtilities.reduce((sum, utility) => sum + (utility.monthlyCost || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Utility Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your utility services and view registration details
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                  <p className="text-2xl font-bold text-green-600">{activeUtilities.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Setup</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingUtilities.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manual Setup Required</p>
                  <p className="text-2xl font-bold text-red-600">{failedUtilities.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                  <p className="text-2xl font-bold text-blue-600">£{totalMonthlyCost}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="active">Active Services</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setIsSetupWizardOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Register New Utility
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <RegisteredUtilitiesView 
              utilities={registeredUtilities}
              onRegisterMore={() => setIsSetupWizardOpen(true)}
              onViewDetails={(utility) => {
                toast({
                  title: 'Service Details',
                  description: `Viewing details for ${utility.provider}`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <RegisteredUtilitiesView 
              utilities={activeUtilities}
              onRegisterMore={() => setIsSetupWizardOpen(true)}
              onViewDetails={(utility) => {
                toast({
                  title: 'Service Details',
                  description: `Viewing details for ${utility.provider}`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <RegisteredUtilitiesView 
              utilities={pendingUtilities}
              onRegisterMore={() => setIsSetupWizardOpen(true)}
              onViewDetails={(utility) => {
                toast({
                  title: 'Service Details',
                  description: `Viewing details for ${utility.provider}`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <RegisteredUtilitiesView 
              utilities={failedUtilities}
              onRegisterMore={() => setIsSetupWizardOpen(true)}
              onViewDetails={(utility) => {
                toast({
                  title: 'Service Details',
                  description: `Viewing details for ${utility.provider}`,
                });
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Setup Wizard Dialog */}
        {isSetupWizardOpen && (
          <Dialog open={isSetupWizardOpen} onOpenChange={setIsSetupWizardOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Register Utility Services</DialogTitle>
                <DialogDescription>
                  Register with utility providers using real account details and automatic setup
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto">
                <UtilitySetupWizard
                  tenancyId={1}
                  namedPersonId={1}
                  property={{
                    address: "123 Student House",
                    postcode: "SW1A 1AA",
                    city: "London"
                  }}
                  onComplete={() => {
                    setIsSetupWizardOpen(false);
                    toast({
                      title: "Registration Complete",
                      description: "Utility services have been registered successfully!",
                    });
                  }}
                  onCancel={() => setIsSetupWizardOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}