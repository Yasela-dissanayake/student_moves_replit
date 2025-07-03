import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, differenceInDays, isBefore } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  CalendarIcon,
  FileText,
  Clock,
  Upload,
  Shield,
  ShieldAlert,
  AlertCircle,
  Info
} from "lucide-react";
import { Property } from '@shared/schema';

interface ComplianceItem {
  id: string;
  name: string;
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  expiryDate?: Date;
  lastUpdated?: Date;
  documentUrl?: string;
  required: boolean;
  description: string;
}

interface PropertyComplianceTrackerProps {
  property: Property;
  onUpdateCompliance: (propertyId: number, complianceType: string, data: any) => void;
}

export default function PropertyComplianceTracker({ property, onUpdateCompliance }: PropertyComplianceTrackerProps) {
  const [selectedTab, setSelectedTab] = useState('epc');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Generate compliance items from property data
  const complianceItems: ComplianceItem[] = [
    {
      id: 'epc',
      name: 'Energy Performance Certificate (EPC)',
      status: property.epcRating && property.epcExpiryDate && new Date(property.epcExpiryDate) > new Date() 
        ? (differenceInDays(new Date(property.epcExpiryDate), new Date()) < 90 ? 'expiring' : 'valid')
        : (property.epcRating ? 'expired' : 'missing'),
      expiryDate: property.epcExpiryDate ? new Date(property.epcExpiryDate) : undefined,
      required: true,
      description: 'An Energy Performance Certificate (EPC) is valid for 10 years. It rates a property\'s energy efficiency from A (most efficient) to G (least efficient).'
    },
    {
      id: 'gas',
      name: 'Gas Safety Certificate',
      status: property.gasChecked && property.gasCheckExpiryDate && new Date(property.gasCheckExpiryDate) > new Date()
        ? (differenceInDays(new Date(property.gasCheckExpiryDate), new Date()) < 30 ? 'expiring' : 'valid')
        : (property.gasChecked ? 'expired' : 'missing'),
      expiryDate: property.gasCheckExpiryDate ? new Date(property.gasCheckExpiryDate) : undefined,
      lastUpdated: property.gasCheckDate ? new Date(property.gasCheckDate) : undefined,
      required: true,
      description: 'A Gas Safety Certificate (CP12) is required annually for all properties with gas appliances or installations.'
    },
    {
      id: 'electrical',
      name: 'Electrical Installation Condition Report (EICR)',
      status: property.electricalChecked && property.electricalCheckExpiryDate && new Date(property.electricalCheckExpiryDate) > new Date()
        ? (differenceInDays(new Date(property.electricalCheckExpiryDate), new Date()) < 90 ? 'expiring' : 'valid')
        : (property.electricalChecked ? 'expired' : 'missing'),
      expiryDate: property.electricalCheckExpiryDate ? new Date(property.electricalCheckExpiryDate) : undefined,
      lastUpdated: property.electricalCheckDate ? new Date(property.electricalCheckDate) : undefined,
      required: true,
      description: 'An Electrical Installation Condition Report (EICR) is required every 5 years. It ensures all electrical installations in the property are safe.'
    },
    {
      id: 'hmo',
      name: 'HMO License',
      status: property.hmoLicensed && property.hmoLicenseExpiryDate && new Date(property.hmoLicenseExpiryDate) > new Date()
        ? (differenceInDays(new Date(property.hmoLicenseExpiryDate), new Date()) < 90 ? 'expiring' : 'valid')
        : (property.hmoLicensed ? 'expired' : 'missing'),
      expiryDate: property.hmoLicenseExpiryDate ? new Date(property.hmoLicenseExpiryDate) : undefined,
      required: property.bedrooms >= 3, // Generally required for 3+ bedroom properties shared by 5+ people
      description: 'Houses in Multiple Occupation (HMO) licenses are typically required for properties with 3+ bedrooms housing 5+ unrelated tenants sharing facilities.'
    }
  ];

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'expiring': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'expired': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'missing': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'expiring': return <Clock className="h-5 w-5 text-amber-600" />;
      case 'expired': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'missing': return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getComplianceStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'expiring': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'missing': return 'Not Available';
      default: return 'Unknown';
    }
  };

  const getExpiryText = (item: ComplianceItem) => {
    if (!item.expiryDate) return 'No expiry date available';
    
    const today = new Date();
    const daysRemaining = differenceInDays(item.expiryDate, today);
    
    if (daysRemaining < 0) {
      return `Expired ${Math.abs(daysRemaining)} days ago`;
    } else if (daysRemaining === 0) {
      return 'Expires today';
    } else if (daysRemaining === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${daysRemaining} days`;
    }
  };

  const getOverallComplianceStatus = () => {
    const requiredItems = complianceItems.filter(item => item.required);
    const validItems = requiredItems.filter(item => item.status === 'valid');
    
    return {
      percentage: Math.round((validItems.length / requiredItems.length) * 100),
      valid: validItems.length,
      total: requiredItems.length,
      isCompliant: requiredItems.every(item => item.status === 'valid'),
      hasExpiring: requiredItems.some(item => item.status === 'expiring'),
      hasExpired: requiredItems.some(item => item.status === 'expired'),
      hasMissing: requiredItems.some(item => item.status === 'missing')
    };
  };

  const complianceStatus = getOverallComplianceStatus();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
    
    if (date) {
      onUpdateCompliance(property.id, selectedTab, { 
        expiryDate: date,
        lastUpdated: new Date()
      });
    }
  };

  const handleUploadDocument = () => {
    // In a real app, this would open a file dialog and handle the upload
    const mockDocumentUrl = `https://example.com/documents/${property.id}/${selectedTab}-${Date.now()}.pdf`;
    
    onUpdateCompliance(property.id, selectedTab, {
      documentUrl: mockDocumentUrl,
      lastUpdated: new Date()
    });
  };

  const selectedCompliance = complianceItems.find(item => item.id === selectedTab);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Property Compliance Tracker</span>
          <Badge className={`ml-2 ${complianceStatus.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {complianceStatus.isCompliant ? 'Fully Compliant' : 'Compliance Issues'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage and track all legal compliance requirements for this property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Overall Compliance</h3>
            <span className="text-sm">{complianceStatus.valid}/{complianceStatus.total} Documents Valid</span>
          </div>
          <Progress value={complianceStatus.percentage} className="h-2" />
          
          {(complianceStatus.hasExpiring || complianceStatus.hasExpired || complianceStatus.hasMissing) && (
            <Alert className="mt-4" variant={complianceStatus.hasExpired || complianceStatus.hasMissing ? "destructive" : "warning"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                {complianceStatus.hasMissing && "Required compliance documents are missing. "}
                {complianceStatus.hasExpired && "Some documents have expired. "}
                {complianceStatus.hasExpiring && "Some documents are expiring soon. "}
                Please update them to maintain legal compliance.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full">
            {complianceItems.map(item => (
              <TabsTrigger key={item.id} value={item.id} className="flex-1">
                <div className="flex items-center">
                  {getComplianceIcon(item.status)}
                  <span className="ml-2 hidden md:inline">{item.name.split(' ')[0]}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {complianceItems.map(item => (
            <TabsContent key={item.id} value={item.id} className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <Badge className={getComplianceStatusColor(item.status)}>
                      {getComplianceStatusText(item.status)}
                    </Badge>
                    {item.required && (
                      <Badge variant="outline">Required</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {item.expiryDate && (
                    <div className="text-sm flex items-center mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{getExpiryText(item)}</span>
                    </div>
                  )}
                  
                  {item.lastUpdated && (
                    <div className="text-sm text-muted-foreground">
                      Last updated: {format(item.lastUpdated, 'PPP')}
                    </div>
                  )}
                  
                  {item.documentUrl && (
                    <div className="flex items-center text-sm text-primary mt-2">
                      <FileText className="h-4 w-4 mr-1" />
                      <a href={item.documentUrl} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Set Expiry Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        disabled={date => isBefore(date, new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button variant="outline" className="w-full justify-start" onClick={handleUploadDocument}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                  
                  <Button variant="default" className="w-full justify-start" disabled={!selectedDate}>
                    <Shield className="mr-2 h-4 w-4" />
                    Save Compliance Update
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}