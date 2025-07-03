import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { FileText, Save, FileSignature, Download, Loader2, Check, Clock, UserCheck, User, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import SignatureCanvas from 'react-signature-canvas';

interface DocumentGeneratorProps {
  propertyId?: number;
  tenantId?: number;
  tenancyId?: number;
  templateType?: string;
  onComplete?: (documentId: string) => void;
}

export default function DocumentGenerator({
  propertyId,
  tenantId,
  tenancyId,
  templateType = 'standard',
  onComplete
}: DocumentGeneratorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templateType);
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [isAllInclusive, setIsAllInclusive] = useState(true);
  const [isHmo, setIsHmo] = useState(false);
  const [isJointTenancy, setIsJointTenancy] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() + 12))
  );
  const [rentAmount, setRentAmount] = useState('500');
  const [depositAmount, setDepositAmount] = useState('575');
  const [depositScheme, setDepositScheme] = useState('Deposit Protection Service (DPS)');
  const [signingMode, setSigningMode] = useState(false);
  const [hasLandlordSigned, setHasLandlordSigned] = useState(false);
  const [hasTenantSigned, setHasTenantSigned] = useState(false);
  const [hasAgentSigned, setHasAgentSigned] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  
  const signatureRef = useRef<SignatureCanvas>(null);

  // Fetch template options
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/document-templates'],
    queryFn: () => apiRequest('GET', '/api/document-templates').then(res => res.json()),
  });
  
  // Fetch property details if propertyId is provided
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties', propertyId],
    queryFn: () => apiRequest('GET', `/api/properties/${propertyId}`).then(res => res.json()),
    enabled: !!propertyId,
  });
  
  // Fetch tenant details if tenantId is provided
  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['/api/users', tenantId],
    queryFn: () => apiRequest('GET', `/api/users/${tenantId}`).then(res => res.json()),
    enabled: !!tenantId,
  });
  
  // Fetch tenancy details if tenancyId is provided
  const { data: tenancy, isLoading: isLoadingTenancy } = useQuery({
    queryKey: ['/api/tenancies', tenancyId],
    queryFn: () => apiRequest('GET', `/api/tenancies/${tenancyId}`).then(res => res.json()),
    enabled: !!tenancyId,
  });
  
  // Mutation for generating a document
  const generateDocumentMutation = useMutation({
    mutationFn: (documentData: any) => 
      apiRequest('POST', '/api/documents/generate', documentData).then(res => res.json()),
    onSuccess: (data) => {
      setDocument(data.document);
      setActiveTab('preview');
      toast({
        title: 'Document generated successfully',
        description: 'Your document is ready for review and signatures',
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating document',
        description: error.message || 'There was an error generating your document. Please try again.',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  });
  
  // Mutation for saving a signature
  const saveSignatureMutation = useMutation({
    mutationFn: (signatureData: any) => 
      apiRequest('POST', `/api/documents/${document?.id}/signature`, signatureData).then(res => res.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', document?.id] });
      
      if (user?.role === 'landlord') {
        setHasLandlordSigned(true);
      } else if (user?.role === 'tenant') {
        setHasTenantSigned(true);
      } else if (user?.role === 'agent') {
        setHasAgentSigned(true);
      }
      
      toast({
        title: 'Document signed successfully',
        description: 'Your signature has been added to the document',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error signing document',
        description: error.message || 'There was an error adding your signature. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Set default document title based on template and property
  useEffect(() => {
    if (property && templates) {
      let title = '';
      
      if (selectedTemplate === 'standard') {
        title = `Tenancy Agreement - ${property.address}`;
      } else if (selectedTemplate === 'hmo') {
        title = `HMO Tenancy Agreement - ${property.address}`;
      } else if (selectedTemplate === 'all_inclusive') {
        title = `All-Inclusive Tenancy Agreement - ${property.address}`;
      } else if (selectedTemplate === 'joint_tenancy') {
        title = `Joint Tenancy Agreement - ${property.address}`;
      }
      
      setDocumentTitle(title);
    }
  }, [property, selectedTemplate, templates]);
  
  // Update document content based on selected template
  useEffect(() => {
    if (templates && templates.templates) {
      const templateContent = templates.templates[selectedTemplate] || '';
      setDocumentContent(templateContent);
    }
  }, [selectedTemplate, templates]);
  
  // Load document data if tenancy is loaded
  useEffect(() => {
    if (tenancy) {
      setStartDate(new Date(tenancy.startDate));
      setEndDate(new Date(tenancy.endDate));
      setRentAmount(tenancy.rent.toString());
      setDepositAmount(tenancy.deposit.toString());
      setIsAllInclusive(!!tenancy.billsIncluded);
      
      // If multiple tenants, set joint tenancy
      if (tenancy.tenantIds && tenancy.tenantIds.length > 1) {
        setIsJointTenancy(true);
        setSelectedTemplate('joint_tenancy');
      }
    }
  }, [tenancy]);
  
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };
  
  const handleGenerateDocument = () => {
    if (!documentTitle) {
      toast({
        title: 'Document title required',
        description: 'Please enter a title for your document',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    
    let processedContent = documentContent;
    
    // Replace placeholders with actual values
    if (property) {
      processedContent = processedContent
        .replace(/\[PROPERTY_ADDRESS\]/g, property.address)
        .replace(/\[FURNITURE_CLAUSE\]/g, property.furnished
          ? 'The Property is let furnished. A detailed inventory is attached to this agreement.'
          : 'The Property is let unfurnished.');
    }
    
    processedContent = processedContent
      .replace(/\[DATE\]/g, formatDate(new Date()))
      .replace(/\[START_DATE\]/g, formatDate(startDate))
      .replace(/\[END_DATE\]/g, formatDate(endDate))
      .replace(/\[TERM_MONTHS\]/g, '12')
      .replace(/\[RENT_AMOUNT\]/g, rentAmount)
      .replace(/\[RENT_FREQUENCY\]/g, 'month')
      .replace(/\[PAYMENT_DAY\]/g, '1st')
      .replace(/\[PAYMENT_PERIOD\]/g, 'month')
      .replace(/\[DEPOSIT_AMOUNT\]/g, depositAmount)
      .replace(/\[DEPOSIT_SCHEME\]/g, depositScheme);
    
    // Replace user-specific placeholders
    if (user?.role === 'landlord' && user.name) {
      processedContent = processedContent
        .replace(/\[LANDLORD_NAME\]/g, user.name)
        .replace(/\[LANDLORD_ADDRESS\]/g, user.address || 'Not provided');
    }
    
    if (tenant) {
      processedContent = processedContent
        .replace(/\[TENANT_NAME\]/g, tenant.name);
    }
    
    // Handle utilities clause
    if (isAllInclusive) {
      processedContent = processedContent.replace(/\[UTILITIES_CLAUSE\]/g, 
        `13. UTILITIES AND SERVICES\nThis is an all-inclusive tenancy. The following utilities and services are included in the rent:\na) Gas\nb) Electricity\nc) Water\nd) Broadband internet\n\nThe Landlord reserves the right to impose reasonable limits on utility usage. Excessive usage may result in additional charges.`);
    } else {
      processedContent = processedContent.replace(/\[UTILITIES_CLAUSE\]/g, 
        `13. UTILITIES AND SERVICES\nThe Tenant is responsible for all utility bills including:\na) Gas\nb) Electricity\nc) Water\nd) Broadband internet\ne) Council Tax\n\nThe Tenant agrees to transfer all utility accounts into their name for the duration of the tenancy.`);
    }
    
    // Handle HMO clause
    if (isHmo) {
      processedContent = processedContent.replace(/\[HMO_CLAUSE\]/g, 
        `14. HMO LICENSING\nThis property is licensed as a House in Multiple Occupation (HMO) under the Housing Act 2004. The Landlord confirms that they comply with all relevant HMO regulations and standards.`);
    } else {
      processedContent = processedContent.replace(/\[HMO_CLAUSE\]/g, '');
    }
    
    // Handle right to rent clause
    processedContent = processedContent.replace(/\[RIGHT_TO_RENT_CLAUSE\]/g, 
      `15. RIGHT TO RENT\nThe Landlord confirms that Right to Rent checks have been carried out in accordance with the Immigration Act 2014. The Tenant confirms they have legal right to rent in the UK and has provided documentation as required by law.`);
    
    // Add additional terms
    processedContent = processedContent.replace(/\[ADDITIONAL_TERMS\]/g, additionalTerms);
    
    // Generate the document
    generateDocumentMutation.mutate({
      title: documentTitle,
      content: processedContent,
      propertyId,
      tenantId,
      tenancyId,
      documentType: selectedTemplate,
      isAllInclusive,
      isHmo,
      isJointTenancy
    });
  };
  
  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };
  
  const handleSaveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureDataUrl = signatureRef.current.toDataURL('image/png');
      setSignatureData(signatureDataUrl);
      
      saveSignatureMutation.mutate({
        documentId: document.id,
        signature: signatureDataUrl,
        userType: user?.role,
        userId: user?.id
      });
    } else {
      toast({
        title: 'Signature required',
        description: 'Please sign the document before saving',
        variant: 'destructive',
      });
    }
  };
  
  const handleDownloadDocument = () => {
    if (document) {
      // Create a download link for the document
      const link = document.downloadUrl || `/api/documents/${document.id}/download`;
      const a = document.createElement('a');
      a.href = link;
      a.download = `${documentTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  if (isLoadingTemplates || isLoadingProperty || isLoadingTenant || isLoadingTenancy) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Document Generator
          </CardTitle>
          <CardDescription>
            Create and manage legal documents for your properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="edit">Edit Document</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="sign" disabled={!document}>E-Sign</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="documentTitle">Document Title</Label>
                  <Input
                    id="documentTitle"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Enter document title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="templateType">Template Type</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select template type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Tenancy Agreement</SelectItem>
                      <SelectItem value="hmo">HMO Tenancy Agreement</SelectItem>
                      <SelectItem value="all_inclusive">All-Inclusive Tenancy Agreement</SelectItem>
                      <SelectItem value="joint_tenancy">Joint Tenancy Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate.toISOString().substring(0, 10)}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate.toISOString().substring(0, 10)}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rentAmount">Monthly Rent (£)</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="depositAmount">Deposit Amount (£)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="depositScheme">Deposit Protection Scheme</Label>
                  <Select value={depositScheme} onValueChange={setDepositScheme}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select deposit scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deposit Protection Service (DPS)">Deposit Protection Service (DPS)</SelectItem>
                      <SelectItem value="MyDeposits">MyDeposits</SelectItem>
                      <SelectItem value="Tenancy Deposit Scheme (TDS)">Tenancy Deposit Scheme (TDS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAllInclusive"
                      checked={isAllInclusive}
                      onCheckedChange={setIsAllInclusive}
                    />
                    <Label htmlFor="isAllInclusive">All-Inclusive Tenancy (includes bills)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isHmo"
                      checked={isHmo}
                      onCheckedChange={setIsHmo}
                    />
                    <Label htmlFor="isHmo">HMO Property</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isJointTenancy"
                      checked={isJointTenancy}
                      onCheckedChange={(checked) => {
                        setIsJointTenancy(checked);
                        if (checked) {
                          setSelectedTemplate('joint_tenancy');
                        }
                      }}
                    />
                    <Label htmlFor="isJointTenancy">Joint Tenancy (multiple tenants)</Label>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="additionalTerms">Additional Terms (optional)</Label>
                  <Textarea
                    id="additionalTerms"
                    value={additionalTerms}
                    onChange={(e) => setAdditionalTerms(e.target.value)}
                    placeholder="Enter any additional terms or clauses you want to include in the agreement"
                    className="h-32 mt-1"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleGenerateDocument}
                disabled={isGenerating}
                className="mt-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Document
                  </>
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4 py-4">
              {document ? (
                <>
                  <Alert className="mb-4">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Document Generated</AlertTitle>
                    <AlertDescription>
                      Your document has been generated successfully. You can now preview, edit, or proceed to the signing step.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">{document.title}</h3>
                    <div className="space-x-2">
                      <Badge variant="outline">
                        {document.documentType === 'standard' && 'Standard Tenancy'}
                        {document.documentType === 'hmo' && 'HMO Tenancy'}
                        {document.documentType === 'all_inclusive' && 'All-Inclusive'}
                        {document.documentType === 'joint_tenancy' && 'Joint Tenancy'}
                      </Badge>
                      {document.status === 'draft' && <Badge variant="outline">Draft</Badge>}
                      {document.status === 'active' && <Badge variant="default">Active</Badge>}
                      {document.status === 'signed' && <Badge variant="default">Signed</Badge>}
                      {document.status === 'expired' && <Badge variant="destructive">Expired</Badge>}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{document.content}</pre>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={() => setActiveTab('edit')}>
                        Edit Document
                      </Button>
                      <Button variant="outline" onClick={handleDownloadDocument}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                    <Button onClick={() => setActiveTab('sign')}>
                      <FileSignature className="mr-2 h-4 w-4" />
                      Proceed to Signing
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No Document Generated</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please go to the Edit Document tab and generate a document first.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('edit')}
                    className="mt-4"
                  >
                    Go to Edit Document
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="sign" className="space-y-4 py-4">
              {document ? (
                <>
                  <Alert className="mb-4">
                    <FileSignature className="h-4 w-4" />
                    <AlertTitle>E-Signature Required</AlertTitle>
                    <AlertDescription>
                      Please review the document and add your electronic signature to make it legally binding.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-4">
                      <div className="flex items-center mb-2">
                        <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                        <h3 className="font-medium">Landlord Signature</h3>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        {hasLandlordSigned ? (
                          <Badge variant="default" className="flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center mb-2">
                        <User className="h-5 w-5 mr-2 text-blue-500" />
                        <h3 className="font-medium">Tenant Signature</h3>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        {hasTenantSigned ? (
                          <Badge variant="default" className="flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </Card>
                    
                    {(user?.role === 'agent' || hasAgentSigned) && (
                      <Card className="p-4">
                        <div className="flex items-center mb-2">
                          <Users className="h-5 w-5 mr-2 text-blue-500" />
                          <h3 className="font-medium">Agent Signature</h3>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          {hasAgentSigned ? (
                            <Badge variant="default" className="flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                  
                  {/* Signature pad */}
                  {!((user?.role === 'landlord' && hasLandlordSigned) || 
                     (user?.role === 'tenant' && hasTenantSigned) || 
                     (user?.role === 'agent' && hasAgentSigned)) && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-4">Add Your Signature</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-2 bg-white">
                        <SignatureCanvas
                          ref={signatureRef}
                          penColor="black"
                          canvasProps={{ 
                            width: 600, 
                            height: 150, 
                            className: 'signature-canvas w-full'
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="outline" onClick={handleClearSignature}>
                          Clear Signature
                        </Button>
                        <Button onClick={handleSaveSignature}>
                          <FileSignature className="mr-2 h-4 w-4" />
                          Sign Document
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Signature complete message */}
                  {((user?.role === 'landlord' && hasLandlordSigned) || 
                    (user?.role === 'tenant' && hasTenantSigned) || 
                    (user?.role === 'agent' && hasAgentSigned)) && (
                    <Alert className="bg-green-50 border-green-200">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertTitle>Document Signed</AlertTitle>
                      <AlertDescription>
                        You have successfully signed this document. Once all parties have signed, the document will be finalized.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex justify-between items-center mt-6">
                    <Button variant="outline" onClick={() => setActiveTab('preview')}>
                      Back to Preview
                    </Button>
                    <Button variant="outline" onClick={handleDownloadDocument}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Document
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No Document Generated</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please go to the Edit Document tab and generate a document first.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('edit')}
                    className="mt-4"
                  >
                    Go to Edit Document
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}