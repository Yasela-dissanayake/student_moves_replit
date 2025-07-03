import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Zap, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function UtilityDashboardLink() {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Zap className="h-5 w-5" />
          Your Registered Utility Services
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Active Services (2)
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-5">
              <li>• Octopus Energy - OE99371077</li>
              <li>• TV Licensing - TV99396047</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Manual Setup (1)
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-5">
              <li>• Thames Water - Registration required</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Total monthly cost: <span className="font-semibold text-blue-600">£133</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                View account details, contact info, and next steps
              </p>
            </div>
            
            <Link href="/tenant/utility-dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Zap className="h-4 w-4 mr-2" />
                View Dashboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}