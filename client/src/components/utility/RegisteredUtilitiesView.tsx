import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Zap,
  Droplet,
  Wifi,
  Tv,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface UtilityService {
  id: string;
  type: 'dual_fuel' | 'water' | 'broadband' | 'tv';
  provider: string;
  status: 'active' | 'pending' | 'failed';
  accountNumber?: string;
  referenceNumber?: string;
  registrationDate: string;
  startDate?: string;
  monthlyCost?: number;
  nextSteps?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  setupDetails?: any;
}

interface RegisteredUtilitiesViewProps {
  utilities: UtilityService[];
  onRegisterMore?: () => void;
  onViewDetails?: (utility: UtilityService) => void;
}

const getUtilityIcon = (type: string) => {
  switch (type) {
    case 'dual_fuel':
      return <Zap className="h-5 w-5 text-yellow-600" />;
    case 'water':
      return <Droplet className="h-5 w-5 text-blue-600" />;
    case 'broadband':
      return <Wifi className="h-5 w-5 text-purple-600" />;
    case 'tv':
      return <Tv className="h-5 w-5 text-green-600" />;
    default:
      return <Globe className="h-5 w-5 text-gray-600" />;
  }
};

const getUtilityName = (type: string) => {
  switch (type) {
    case 'dual_fuel':
      return 'Energy (Gas & Electricity)';
    case 'water':
      return 'Water Supply';
    case 'broadband':
      return 'Broadband Internet';
    case 'tv':
      return 'TV License';
    default:
      return 'Utility Service';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Calendar className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Manual Setup Required
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      );
  }
};

export default function RegisteredUtilitiesView({ 
  utilities, 
  onRegisterMore = () => {}, 
  onViewDetails = () => {} 
}: RegisteredUtilitiesViewProps) {
  const activeUtilities = utilities.filter(u => u.status === 'active');
  const pendingUtilities = utilities.filter(u => u.status === 'pending');
  const failedUtilities = utilities.filter(u => u.status === 'failed');

  const totalMonthlyCost = utilities.reduce((sum, utility) => {
    return sum + (utility.monthlyCost || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Registered Utility Services
              </CardTitle>
              <CardDescription>
                Overview of your registered utility accounts and services
              </CardDescription>
            </div>
            <Button onClick={onRegisterMore} variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              Register More Services
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{activeUtilities.length}</div>
              <div className="text-sm text-green-600">Active Services</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{pendingUtilities.length}</div>
              <div className="text-sm text-yellow-600">Pending Setup</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{failedUtilities.length}</div>
              <div className="text-sm text-red-600">Manual Setup Required</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">£{totalMonthlyCost}</div>
              <div className="text-sm text-blue-600">Est. Monthly Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Services */}
      {activeUtilities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Active Services</h3>
          </div>
          <div className="grid gap-4">
            {activeUtilities.map((utility) => (
              <Card key={utility.id} className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getUtilityIcon(utility.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{utility.provider}</h4>
                          {getStatusBadge(utility.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getUtilityName(utility.type)}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {utility.accountNumber && (
                            <div>
                              <span className="font-medium text-gray-600">Account Number:</span>
                              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-1">
                                {utility.accountNumber}
                              </div>
                            </div>
                          )}
                          
                          {utility.startDate && (
                            <div>
                              <span className="font-medium text-gray-600">Service Start:</span>
                              <div className="mt-1">{new Date(utility.startDate).toLocaleDateString()}</div>
                            </div>
                          )}
                          
                          {utility.monthlyCost && (
                            <div>
                              <span className="font-medium text-gray-600">Monthly Cost:</span>
                              <div className="mt-1 font-semibold text-green-600">£{utility.monthlyCost}</div>
                            </div>
                          )}
                        </div>

                        {utility.nextSteps && utility.nextSteps.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-600 text-sm">Next Steps:</span>
                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                              {utility.nextSteps.slice(0, 2).map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {utility.contactInfo?.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={utility.contactInfo.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Manage Account
                          </a>
                        </Button>
                      )}
                      
                      {utility.contactInfo?.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${utility.contactInfo.phone}`}>
                            <Phone className="h-3 w-3 mr-1" />
                            {utility.contactInfo.phone}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Services */}
      {pendingUtilities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Pending Setup</h3>
          </div>
          <div className="grid gap-4">
            {pendingUtilities.map((utility) => (
              <Card key={utility.id} className="border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getUtilityIcon(utility.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{utility.provider}</h4>
                          {getStatusBadge(utility.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getUtilityName(utility.type)}
                        </p>
                        <p className="text-sm text-yellow-700">
                          Registration in progress. You'll receive confirmation within 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Failed/Manual Setup Required */}
      {failedUtilities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold">Manual Setup Required</h3>
          </div>
          <div className="grid gap-4">
            {failedUtilities.map((utility) => (
              <Card key={utility.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getUtilityIcon(utility.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{utility.provider}</h4>
                          {getStatusBadge(utility.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getUtilityName(utility.type)}
                        </p>
                        
                        {utility.nextSteps && utility.nextSteps.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-600 text-sm">Manual Setup Steps:</span>
                            <ul className="text-sm text-gray-600 mt-1 space-y-1">
                              {utility.nextSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {utility.contactInfo?.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={utility.contactInfo.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Register Manually
                          </a>
                        </Button>
                      )}
                      
                      {utility.contactInfo?.phone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${utility.contactInfo.phone}`}>
                            <Phone className="h-3 w-3 mr-1" />
                            Call Support
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {utilities.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Utilities Registered</h3>
            <p className="text-gray-500 mb-4">
              Get started by registering your utility services for automatic account setup.
            </p>
            <Button onClick={onRegisterMore} className="gap-2">
              <Zap className="h-4 w-4" />
              Register Your First Utility
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}