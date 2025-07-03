import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Send, Calendar, MapPin, RefreshCw, Clock, Download, Upload, Trash2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import Papa from 'papaparse';

// Types
type BusinessCategory = 'restaurant' | 'retail' | 'entertainment' | 'education' | 'health' | 'services' | 'other';

type BusinessContact = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  businessType: BusinessCategory;
  website?: string;
  description?: string;
  matchScore?: number;
  status: 'new' | 'scheduled' | 'contacted' | 'responded' | 'converted' | 'rejected';
  lastContactDate?: Date | null;
  scheduledDate?: Date | null;
  notes?: string;
  isEmailValid?: boolean;
};

type EmailCampaign = {
  id: string;
  name: string;
  subject: string;
  template: string;
  businessTypes: BusinessCategory[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  businessCount: number;
};

export default function BusinessOutreachDatabase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterType, setFilterType] = useState<BusinessCategory | "all">("all");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessContact | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [campaignName, setCampaignName] = useState<string>("");
  
  // CSV file import reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Query for business contacts
  const {
    data: businesses,
    isLoading: isLoadingBusinesses,
    refetch: refetchBusinesses,
  } = useQuery<BusinessContact[]>({
    queryKey: ['/api/admin/business-outreach/contacts', filterCity, filterType, filterStatus],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterCity) params.append('city', filterCity);
        if (filterType !== 'all') params.append('businessType', filterType);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        
        const response = await apiRequest(`/api/admin/business-outreach/contacts?${params.toString()}`, { method: 'GET' });
        return response.contacts || [];
      } catch (error) {
        console.error('Error fetching business contacts:', error);
        return [];
      }
    },
  });

  // Query for email campaigns
  const {
    data: campaigns,
    isLoading: isLoadingCampaigns,
  } = useQuery<EmailCampaign[]>({
    queryKey: ['/api/admin/business-outreach/campaigns'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/business-outreach/campaigns', { method: 'GET' });
        return response.campaigns || [];
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }
    },
  });

  // Mutation for updating a business contact
  const updateBusinessMutation = useMutation({
    mutationFn: async (data: BusinessContact) => {
      return apiRequest('/api/admin/business-outreach/update-contact', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Business Updated",
        description: "The business contact has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/business-outreach/contacts'] });
      setSelectedBusiness(null);
      setScheduledDate(null);
      setNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update business contact. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating business:', error);
    },
  });

  // Mutation for importing businesses
  const importBusinessesMutation = useMutation({
    mutationFn: async (data: { businesses: BusinessContact[] }) => {
      return apiRequest('/api/admin/business-outreach/import-contacts', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Import Successful",
        description: "Business contacts have been imported successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/business-outreach/contacts'] });
      setIsImporting(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import business contacts. Please check your file format.",
        variant: "destructive",
      });
      console.error('Error importing businesses:', error);
      setIsImporting(false);
    },
  });

  // Mutation for creating a new campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (data: { 
      name: string;
      businessTypes: BusinessCategory[];
      scheduledDate: Date;
    }) => {
      return apiRequest('/api/admin/business-outreach/create-campaign', {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Email campaign has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/business-outreach/campaigns'] });
      setCampaignName("");
      setScheduledDate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating campaign:', error);
    },
  });

  // Handle file upload for CSV import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const businesses = results.data.map((row: any) => ({
            name: row.name || row.business_name || row.businessName || '',
            email: row.email || row.email_address || row.emailAddress || '',
            phone: row.phone || row.phoneNumber || row.phone_number || '',
            address: row.address || row.location || '',
            city: row.city || row.town || row.location || '',
            businessType: (row.businessType || row.business_type || row.category || 'other').toLowerCase() as BusinessCategory,
            website: row.website || row.url || row.web || '',
            description: row.description || row.about || '',
            status: 'new' as const,
            matchScore: 70 // Default match score
          }));

          // Filter out invalid entries
          const validBusinesses = businesses.filter(b => b.name && b.email && b.city);
          
          if (validBusinesses.length === 0) {
            toast({
              title: "Invalid Format",
              description: "No valid business contacts found in the file. Please check the format.",
              variant: "destructive",
            });
            setIsImporting(false);
            return;
          }

          importBusinessesMutation.mutate({ businesses: validBusinesses });
        } catch (error) {
          console.error('Error processing CSV:', error);
          toast({
            title: "Error",
            description: "Failed to process the CSV file. Please check the format.",
            variant: "destructive",
          });
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast({
          title: "Error",
          description: "Failed to parse the CSV file. Please check the format.",
          variant: "destructive",
        });
        setIsImporting(false);
      }
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle export of businesses to CSV
  const handleExport = () => {
    if (!businesses || businesses.length === 0) {
      toast({
        title: "No Data",
        description: "There are no business contacts to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const csvData = Papa.unparse(businesses.map(b => ({
        name: b.name,
        email: b.email,
        phone: b.phone || '',
        address: b.address || '',
        city: b.city,
        businessType: b.businessType,
        website: b.website || '',
        description: b.description || '',
        status: b.status,
        lastContactDate: b.lastContactDate ? new Date(b.lastContactDate).toISOString() : '',
        scheduledDate: b.scheduledDate ? new Date(b.scheduledDate).toISOString() : '',
        notes: b.notes || ''
      })));

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `business_contacts_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "Business contacts have been exported successfully.",
      });

      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export business contacts.",
        variant: "destructive",
      });
      setIsExporting(false);
    }
  };

  // Handle business status update
  const handleUpdateBusiness = () => {
    if (!selectedBusiness) {
      toast({
        title: "No Business Selected",
        description: "Please select a business to update.",
        variant: "destructive",
      });
      return;
    }

    const updatedBusiness = {
      ...selectedBusiness,
      scheduledDate,
      notes,
      // If scheduled date is set and status is 'new', update status to 'scheduled'
      status: scheduledDate && selectedBusiness.status === 'new' ? 'scheduled' as const : selectedBusiness.status
    };

    updateBusinessMutation.mutate(updatedBusiness);
  };

  // Handle campaign creation
  const handleCreateCampaign = () => {
    if (!campaignName) {
      toast({
        title: "Campaign Name Required",
        description: "Please enter a name for your campaign.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledDate) {
      toast({
        title: "Schedule Date Required",
        description: "Please select a date to schedule your campaign.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      businessTypes: filterType !== 'all' ? [filterType] : ['restaurant', 'retail', 'entertainment', 'education', 'health', 'services', 'other'],
      scheduledDate
    });
  };

  // Format date for display
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline" = "default";
    let label = status;

    switch (status) {
      case 'new':
        variant = "outline";
        label = "New";
        break;
      case 'scheduled':
        variant = "secondary";
        label = "Scheduled";
        break;
      case 'contacted':
        variant = "default";
        label = "Contacted";
        break;
      case 'responded':
        variant = "default";
        label = "Responded";
        break;
      case 'converted':
        variant = "default";
        label = "Converted";
        break;
      case 'rejected':
        variant = "destructive";
        label = "Rejected";
        break;
      default:
        variant = "outline";
    }

    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Outreach Database</h1>
          <p className="text-muted-foreground">
            Manage local business contacts and schedule email campaigns for your voucher platform.
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/newsletter-generator">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Newsletter Generator
            </Button>
          </Link>
          <Link href="/dashboard/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="contacts">Business Contacts</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
        </TabsList>

        {/* Business Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Contact Database</CardTitle>
              <CardDescription>
                Filter and manage your database of local business contacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-city">Filter by City</Label>
                  <Input
                    id="filter-city"
                    placeholder="e.g., London"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-type">Filter by Business Type</Label>
                  <Select
                    value={filterType}
                    onValueChange={(value: any) => setFilterType(value)}
                  >
                    <SelectTrigger id="filter-type">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="restaurant">Restaurants</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="health">Health & Wellness</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Filter by Status</Label>
                  <Select
                    value={filterStatus}
                    onValueChange={(value: any) => setFilterStatus(value)}
                  >
                    <SelectTrigger id="filter-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={() => refetchBusinesses()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Business Contacts</CardTitle>
                  <CardDescription>
                    Select a business to view details and schedule outreach.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBusinesses ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !businesses || businesses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No business contacts found. Try importing some businesses or adjusting your filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Business Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead>Last Contact</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {businesses.map((business) => (
                            <TableRow 
                              key={business.id || business.email} 
                              className={selectedBusiness?.email === business.email ? "bg-muted" : ""}
                              onClick={() => {
                                setSelectedBusiness(business);
                                setScheduledDate(business.scheduledDate || null);
                                setNotes(business.notes || "");
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <TableCell className="font-medium">{business.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{business.businessType}</Badge>
                              </TableCell>
                              <TableCell>{business.city}</TableCell>
                              <TableCell>
                                <StatusBadge status={business.status} />
                              </TableCell>
                              <TableCell>{formatDate(business.scheduledDate)}</TableCell>
                              <TableCell>{formatDate(business.lastContactDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">
                    {businesses ? `Showing ${businesses.length} contacts` : 'No contacts to display'}
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Business Details & Scheduling */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                  <CardDescription>
                    View details and schedule outreach for the selected business.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedBusiness ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Select a business from the list to view details.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <p className="text-lg font-medium">{selectedBusiness.name}</p>
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{selectedBusiness.city}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email</Label>
                          <p className="text-sm">{selectedBusiness.email}</p>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <p className="text-sm">{selectedBusiness.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label>Business Type</Label>
                          <p className="text-sm capitalize">{selectedBusiness.businessType}</p>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <div className="mt-1">
                            <StatusBadge status={selectedBusiness.status} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Address</Label>
                        <p className="text-sm">{selectedBusiness.address || 'Not provided'}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Website</Label>
                        <p className="text-sm">
                          {selectedBusiness.website ? (
                            <a 
                              href={selectedBusiness.website.startsWith('http') ? selectedBusiness.website : `http://${selectedBusiness.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {selectedBusiness.website}
                            </a>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <p className="text-sm">{selectedBusiness.description || 'No description available'}</p>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="scheduled-date">Schedule Contact Date</Label>
                        <SimpleDatePicker
                          date={scheduledDate}
                          setDate={setScheduledDate}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about this business contact"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBusiness(null);
                      setScheduledDate(null);
                      setNotes("");
                    }}
                    disabled={!selectedBusiness}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateBusiness}
                    disabled={!selectedBusiness || updateBusinessMutation.isPending}
                  >
                    {updateBusinessMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Contact'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Email Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>
                Schedule and manage email campaigns to reach out to businesses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Summer Outreach"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-date">Schedule Date</Label>
                  <SimpleDatePicker
                    date={scheduledDate}
                    setDate={setScheduledDate}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleCreateCampaign}
                    disabled={createCampaignMutation.isPending}
                  >
                    {createCampaignMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-medium mb-4">Scheduled Campaigns</h3>
                {isLoadingCampaigns ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !campaigns || campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No campaigns scheduled yet. Create your first campaign above.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Target Businesses</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>{campaign.businessCount} businesses</TableCell>
                          <TableCell>{formatDate(campaign.scheduledDate)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                campaign.status === 'draft' ? "outline" :
                                campaign.status === 'scheduled' ? "secondary" :
                                campaign.status === 'sent' ? "default" :
                                "default"
                              }
                            >
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import/Export Business Data</CardTitle>
              <CardDescription>
                Import business contacts from CSV or export your database for backup.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Import Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Import Business Contacts</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with business contact information. The file should include columns for name, email, phone, address, city, and business type.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="csv-file"
                      className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">CSV files only</p>
                      </div>
                      <input 
                        id="csv-file" 
                        type="file" 
                        accept=".csv" 
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                  
                  <Button
                    className="w-full"
                    disabled={isImporting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import from CSV
                      </>
                    )}
                  </Button>
                </div>

                {/* Export Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Export Business Contacts</h3>
                    <p className="text-sm text-muted-foreground">
                      Export your business contact database to a CSV file for backup or analysis in spreadsheet software.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Download className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          Export your current database
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {businesses ? `${businesses.length} contacts available` : 'No contacts available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleExport}
                    disabled={isExporting || !businesses || businesses.length === 0}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export to CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Sample CSV Format</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre className="text-xs">
                    name,email,phone,address,city,businessType,website,description{'\n'}
                    "Pizza Palace","contact@pizzapalace.com","+1234567890","123 Main St","London","restaurant","www.pizzapalace.com","Local pizzeria with student-friendly prices"{'\n'}
                    "Book Haven","info@bookhaven.com","+1987654321","456 High St","Manchester","retail","www.bookhaven.com","Independent bookstore with textbooks and leisure reading"{'\n'}
                    "Fitness First","hello@fitnessfirst.com","+1122334455","789 Gym Lane","Leeds","health","www.fitnessfirst.com","Modern gym with student discount programs"
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function component for SimpleDatePicker
// This is a simplified version - you would need to implement or import an actual date picker
function SimpleDatePicker({ date, setDate, className = "" }: { 
  date: Date | null; 
  setDate: (date: Date | null) => void;
  className?: string;
}) {
  // For simplicity in this example, just using a basic date input
  // In a real implementation, you'd want to use a proper date picker component
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Calendar className="h-4 w-4 text-gray-500" />
      </div>
      <Input
        type="date"
        className="pl-10"
        value={date ? date.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            setDate(new Date(value));
          } else {
            setDate(null);
          }
        }}
      />
    </div>
  );
}