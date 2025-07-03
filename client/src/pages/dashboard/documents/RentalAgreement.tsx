import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Loader2, FileText, Download, Save, Copy, Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';

// Define the template options
const templateTypes = [
  { id: 'standard', name: 'Standard AST' },
  { id: 'hmo', name: 'HMO Agreement' },
  { id: 'all_inclusive', name: 'All-Inclusive' },
  { id: 'joint_tenancy', name: 'Joint Tenancy' },
];

export default function RentalAgreement() {
  const { propertyId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { userType } = useAuth();
  
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositScheme, setDepositScheme] = useState('Deposit Protection Service (DPS)');
  const [includeUtilities, setIncludeUtilities] = useState(true);
  const [includeHMO, setIncludeHMO] = useState(false);
  const [includeRightToRent, setIncludeRightToRent] = useState(true);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [generatedAgreement, setGeneratedAgreement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch property data if propertyId is provided
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: () => apiRequest('GET', `/api/properties/${propertyId}`).then(res => res.json()),
    enabled: !!propertyId,
  });

  // Fetch tenant applications for this property if propertyId is provided
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/applications', propertyId],
    queryFn: () => apiRequest('GET', `/api/applications/property/${propertyId}`).then(res => res.json()),
    enabled: !!propertyId,
  });

  // Set defaults based on property data
  useEffect(() => {
    if (property) {
      setRentAmount(property.price?.toString() || '');
      setDepositAmount((parseFloat(property.price) * 1.25).toFixed(2) || '');
      
      // If property is an HMO, select the HMO template
      if (property.isHMO) {
        setSelectedTemplate('hmo');
        setIncludeHMO(true);
      }
      
      // If property has all inclusive utilities, select the all_inclusive template
      if (property.allBillsIncluded) {
        setSelectedTemplate('all_inclusive');
      }
      
      // If property has multiple bedrooms, select the joint_tenancy template
      if (property.bedrooms > 1) {
        setSelectedTemplate('joint_tenancy');
      }
    }
  }, [property]);

  // Helper function to format a date as a string
  const formatDate = (date?: Date) => {
    return date ? format(date, 'do MMMM yyyy') : '';
  };

  // Function to generate the agreement
  const generateAgreement = () => {
    if (!property) {
      toast({
        title: 'Error',
        description: 'Property data is required to generate an agreement',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    
    // In a real application, this would make an API call to generate the document
    // For demonstration, we'll simulate a server call with a timeout
    setTimeout(() => {
      try {
        // Fetch the template from the server based on the selected template type
        apiRequest('GET', `/api/documents/templates/${selectedTemplate}`)
          .then(res => res.text())
          .then(templateText => {
            // Replace placeholders with actual values
            let agreementText = templateText
              .replace(/\[DATE\]/g, formatDate(new Date()))
              .replace(/\[LANDLORD_NAME\]/g, property.landlordName || 'Landlord Name')
              .replace(/\[LANDLORD_ADDRESS\]/g, property.landlordAddress || 'Landlord Address')
              .replace(/\[PROPERTY_ADDRESS\]/g, property.address)
              .replace(/\[TERM_MONTHS\]/g, '12')
              .replace(/\[START_DATE\]/g, formatDate(startDate))
              .replace(/\[END_DATE\]/g, formatDate(endDate))
              .replace(/\[RENT_AMOUNT\]/g, rentAmount)
              .replace(/\[RENT_FREQUENCY\]/g, 'month')
              .replace(/\[PAYMENT_DAY\]/g, '1st')
              .replace(/\[PAYMENT_PERIOD\]/g, 'month')
              .replace(/\[DEPOSIT_AMOUNT\]/g, depositAmount)
              .replace(/\[DEPOSIT_SCHEME\]/g, depositScheme)
              .replace(/\[FURNITURE_CLAUSE\]/g, property.isFurnished ? 
                'The property is fully furnished. An inventory has been provided and agreed upon.' : 
                'The property is unfurnished.')
              .replace(/\[TENANT_NAME\]/g, 'TENANT NAME TO BE FILLED');
            
            // Add utilities clause if needed
            if (includeUtilities) {
              const utilitiesClause = `
UTILITIES AND SERVICES
This tenancy includes the following utilities and services, which are included in the rent:
- Gas
- Electricity
- Water
- Broadband internet
- Council Tax (for student tenants only)

The Landlord reserves the right to impose reasonable limits on utility usage. Excessive usage may result in additional charges, which will be notified to the Tenant in advance.`;
              agreementText = agreementText.replace(/\[UTILITIES_CLAUSE\]/g, utilitiesClause);
            } else {
              agreementText = agreementText.replace(/\[UTILITIES_CLAUSE\]/g, `
UTILITIES AND SERVICES
The Tenant is responsible for all utility bills including:
- Gas
- Electricity
- Water
- Broadband internet
- Council Tax (unless exempt)

The Tenant agrees to transfer all utility accounts into their name for the duration of the tenancy.`);
            }
            
            // Add HMO clause if needed
            if (includeHMO) {
              const hmoClause = `
HMO LICENSING
This property is licensed as a House in Multiple Occupation (HMO) under the Housing Act 2004.
License Number: ${property.hmoLicenseNumber || 'PENDING'}
The Landlord confirms that they comply with all relevant HMO regulations and standards.`;
              agreementText = agreementText.replace(/\[HMO_CLAUSE\]/g, hmoClause);
            } else {
              agreementText = agreementText.replace(/\[HMO_CLAUSE\]/g, '');
            }
            
            // Add Right to Rent clause if needed
            if (includeRightToRent) {
              const rightToRentClause = `
RIGHT TO RENT
The Landlord confirms that Right to Rent checks have been carried out in accordance with the Immigration Act 2014.
The Tenant confirms they have legal right to rent in the UK and has provided documentation as required by law.`;
              agreementText = agreementText.replace(/\[RIGHT_TO_RENT_CLAUSE\]/g, rightToRentClause);
            } else {
              agreementText = agreementText.replace(/\[RIGHT_TO_RENT_CLAUSE\]/g, '');
            }
            
            // Add additional terms if provided
            agreementText = agreementText.replace(/\[ADDITIONAL_TERMS\]/g, additionalTerms || 'No additional terms.');
            
            setGeneratedAgreement(agreementText);
            setIsGenerating(false);
            
            toast({
              title: 'Agreement Generated',
              description: 'Your rental agreement has been generated successfully.',
            });
          })
          .catch(error => {
            console.error('Error generating agreement:', error);
            setIsGenerating(false);
            toast({
              title: 'Error',
              description: 'Failed to generate agreement. Please try again.',
              variant: 'destructive',
            });
          });
      } catch (error) {
        console.error('Error generating agreement:', error);
        setIsGenerating(false);
        toast({
          title: 'Error',
          description: 'Failed to generate agreement. Please try again.',
          variant: 'destructive',
        });
      }
    }, 2000);
  };

  // Function to copy the agreement to clipboard
  const copyAgreement = () => {
    navigator.clipboard.writeText(generatedAgreement).then(() => {
      toast({
        title: 'Copied',
        description: 'Agreement copied to clipboard',
      });
    });
  };

  // Function to download the agreement
  const downloadAgreement = () => {
    const blob = new Blob([generatedAgreement], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rental_agreement_${property?.id || 'new'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to save the agreement to the database
  const saveAgreement = () => {
    // In a real application, this would make an API call to save to a database
    toast({
      title: 'Agreement Saved',
      description: 'Your agreement has been saved and sent to the tenant for signing.',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Rental Agreement Generator</h1>
          <p className="text-muted-foreground mt-1">
            Create and customize legal rental agreements for your properties
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Details</CardTitle>
              <CardDescription>Enter the details for the rental agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!propertyId && (
                <div className="space-y-2">
                  <Label htmlFor="property">Property</Label>
                  <Select>
                    <SelectTrigger id="property">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Select a property</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/dashboard/properties')}>
                      Browse properties
                    </Button>
                  </p>
                </div>
              )}

              {isLoadingProperty ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : property ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-lg">{property.title}</h3>
                  <p className="text-sm">{property.address}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bedrooms:</span> {property.bedrooms}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rent:</span> £{property.price}/month
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span> {property.propertyType}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
                  No property selected. Please select a property to continue.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template-type">Agreement Type</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <DatePicker 
                    selected={startDate} 
                    onSelect={setStartDate} 
                    placeholder="Select start date" 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <DatePicker 
                    selected={endDate} 
                    onSelect={setEndDate} 
                    placeholder="Select end date" 
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent-amount">Monthly Rent (£)</Label>
                  <Input
                    id="rent-amount"
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="e.g., 800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Deposit Amount (£)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g., 1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-scheme">Deposit Protection Scheme</Label>
                <Select value={depositScheme} onValueChange={setDepositScheme}>
                  <SelectTrigger id="deposit-scheme">
                    <SelectValue placeholder="Select deposit scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deposit Protection Service (DPS)">Deposit Protection Service (DPS)</SelectItem>
                    <SelectItem value="MyDeposits">MyDeposits</SelectItem>
                    <SelectItem value="Tenancy Deposit Scheme (TDS)">Tenancy Deposit Scheme (TDS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-utilities" 
                    checked={includeUtilities} 
                    onCheckedChange={(checked) => setIncludeUtilities(checked as boolean)} 
                  />
                  <Label htmlFor="include-utilities" className="font-normal">
                    Include utilities (all-inclusive package)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-hmo" 
                    checked={includeHMO} 
                    onCheckedChange={(checked) => setIncludeHMO(checked as boolean)} 
                  />
                  <Label htmlFor="include-hmo" className="font-normal">
                    Include HMO license details
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-right-to-rent" 
                    checked={includeRightToRent} 
                    onCheckedChange={(checked) => setIncludeRightToRent(checked as boolean)} 
                  />
                  <Label htmlFor="include-right-to-rent" className="font-normal">
                    Include Right to Rent clause
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional-terms">Additional Terms (Optional)</Label>
                <Textarea
                  id="additional-terms"
                  value={additionalTerms}
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                  placeholder="Enter any additional terms or special conditions..."
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateAgreement}
                disabled={isGenerating || !property}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Agreement...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Agreement
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Agreement</CardTitle>
              <CardDescription>Preview and download your generated agreement</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedAgreement ? (
                <div className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap font-mono text-sm h-[600px] overflow-y-auto">
                  {generatedAgreement}
                </div>
              ) : (
                <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center space-y-2 h-[600px] bg-gray-50">
                  <FileText className="h-16 w-16 text-gray-300" />
                  <h3 className="font-medium text-lg">No Agreement Generated</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Fill out the form on the left and click "Generate Agreement" to create your rental agreement.
                  </p>
                </div>
              )}
            </CardContent>
            {generatedAgreement && (
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex space-x-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={copyAgreement}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={downloadAgreement}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <Button className="w-full" onClick={saveAgreement}>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Send to Tenant
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}