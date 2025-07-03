import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { 
  Zap,
  Droplet,
  Wifi,
  Tv,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function UtilityDashboardAccess() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Access Utility Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            View your registered utility services and account details
          </p>
        </div>

        {/* Quick Access Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-blue-600" />
              Utility Management Dashboard
            </CardTitle>
            <CardDescription>
              Access your comprehensive utility service dashboard with real account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Active Services (2)
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Octopus Energy - Account: OE99371077</li>
                    <li>• TV Licensing - License: TV99396047</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Manual Setup Required (1)
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Thames Water - Manual registration needed</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-4">
                  Total estimated monthly cost: <span className="font-semibold text-blue-600">£133</span>
                </p>
                
                <Link href="/tenant/utility-dashboard">
                  <Button className="gap-2">
                    <Zap className="h-4 w-4" />
                    Open Utility Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center p-4">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-sm font-medium">Energy</p>
            <p className="text-xs text-muted-foreground">Octopus Energy</p>
          </Card>
          
          <Card className="text-center p-4">
            <Tv className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">TV License</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </Card>
          
          <Card className="text-center p-4">
            <Droplet className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-sm font-medium">Water</p>
            <p className="text-xs text-muted-foreground">Manual Setup</p>
          </Card>
          
          <Card className="text-center p-4">
            <Wifi className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">Broadband</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </Card>
        </div>

        {/* Navigation Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Access</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the "Open Utility Dashboard" button above, or</li>
              <li>Navigate directly to: <code className="bg-muted px-2 py-1 rounded">/tenant/utility-dashboard</code></li>
              <li>View detailed account information, contact details, and next steps</li>
              <li>Access individual and bulk utility registration options</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}