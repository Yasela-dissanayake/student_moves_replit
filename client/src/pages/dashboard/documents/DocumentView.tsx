import { useState, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Download,
  FileCheck,
  FileClock,
  FileText,
  ChevronLeft,
  Check,
  PenSquare,
  Calendar,
  Home,
  User,
  Clock,
  XCircle,
  AlertTriangle,
  Tag,
  CheckCircle2,
  FileWarning,
  Info,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';

// Importing the SignatureCanvas component with type workaround for TS
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';

interface DocumentDetails {
  id: string;
  title: string;
  content: string;
  documentType: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  signedByAgent: boolean;
  dateSigned: Date | null;
  propertyAddress?: string;
  tenantName?: string;
  landlordName?: string;
  agentName?: string;
  isAllInclusive: boolean;
  isHmo: boolean;
  isJointTenancy: boolean;
  createdBy: string;
}

export default function DocumentView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('document');
  const [signingDialogOpen, setSigningDialogOpen] = useState(false);
  const [signingType, setSigningType] = useState<'tenant' | 'landlord' | 'agent'>('tenant');
  const sigCanvasRef = useRef<any>(null);
  
  // Fetch document details
  const { data: document, isLoading, refetch } = useQuery({
    queryKey: [`/api/documents/${id}`],
    enabled: !!id && !!user
  });
  
  // Determine if the current user can sign
  const canSign = () => {
    if (!user || !document) return false;
    
    if (user.userType === 'tenant' && !document.signedByTenant) {
      return true;
    } else if (user.userType === 'landlord' && !document.signedByLandlord) {
      return true;
    } else if (user.userType === 'agent' && !document.signedByAgent) {
      return true;
    }
    
    return false;
  };
  
  // Handle document signing mutation
  const signDocumentMutation = useMutation({
    mutationFn: async (signatureDataUrl: string) => {
      return apiRequest('POST', `/api/documents/${id}/sign`, {
        signatureType: signingType,
        signatureImage: signatureDataUrl
      });
    },
    onSuccess: () => {
      toast({
        title: "Document Signed",
        description: "The document has been successfully signed.",
        variant: "default",
      });
      setSigningDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error Signing Document",
        description: error.message || "There was an error signing the document.",
        variant: "destructive",
        action: <ToastAction altText="Try Again">Try Again</ToastAction>,
      });
    }
  });
  
  const handleSignDocument = () => {
    if (!user) return;
    
    // Set the appropriate signing type based on user type
    if (user.userType === 'tenant') {
      setSigningType('tenant');
    } else if (user.userType === 'landlord') {
      setSigningType('landlord');
    } else if (user.userType === 'agent') {
      setSigningType('agent');
    }
    
    setSigningDialogOpen(true);
  };
  
  const handleConfirmSign = () => {
    if (!sigCanvasRef.current) return;
    
    if (sigCanvasRef.current.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide your signature before confirming.",
        variant: "destructive",
      });
      return;
    }
    
    const signatureDataUrl = sigCanvasRef.current.toDataURL();
    signDocumentMutation.mutate(signatureDataUrl);
  };
  
  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };
  
  const downloadDocument = () => {
    if (!id) return;
    window.open(`/api/documents/${id}/download`, '_blank');
  };
  
  // Render the signature status for the document
  const renderSignatureStatus = () => {
    if (!document) return null;
    
    return (
      <div className="flex flex-col gap-4 mt-6">
        <h3 className="text-lg font-semibold">Signature Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <div className={`rounded-full p-2 ${document.signedByTenant ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Tenant</p>
              <div className="flex items-center mt-1">
                {document.signedByTenant ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-muted-foreground">Signed</span>
                  </>
                ) : (
                  <>
                    <FileWarning className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-lg border">
            <div className={`rounded-full p-2 ${document.signedByLandlord ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Landlord</p>
              <div className="flex items-center mt-1">
                {document.signedByLandlord ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-muted-foreground">Signed</span>
                  </>
                ) : (
                  <>
                    <FileWarning className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {document.agentId && (
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className={`rounded-full p-2 ${document.signedByAgent ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Agent</p>
                <div className="flex items-center mt-1">
                  {document.signedByAgent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-muted-foreground">Signed</span>
                    </>
                  ) : (
                    <>
                      <FileWarning className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm text-muted-foreground">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending_signature':
        return <Badge variant="secondary" className="text-amber-600">Pending Signatures</Badge>;
      case 'signed':
        return <Badge className="bg-green-500">Signed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5" />;
      case 'pending_signature':
        return <FileClock className="h-5 w-5 text-amber-500" />;
      case 'signed':
        return <FileCheck className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
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
        
        {!isLoading && document && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(document.status)}
              <h1 className="text-3xl font-bold">{document.title}</h1>
              {getStatusBadge(document.status)}
            </div>
            
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={downloadDocument}>
                      <Download className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download Document</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {canSign() && (
                <Button className="gap-2" onClick={handleSignDocument}>
                  <PenSquare className="h-4 w-4" />
                  Sign Document
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : document ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="document">Document</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="document" className="mt-0">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>
                            {document.documentType.charAt(0).toUpperCase() + document.documentType.slice(1).replace(/_/g, ' ')}
                          </CardTitle>
                          <CardDescription>
                            {document.propertyAddress ? (
                              <>Property: {document.propertyAddress}</>
                            ) : (
                              <>Created on {format(new Date(document.createdAt), 'MMM dd, yyyy')}</>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {document.isAllInclusive && <Badge variant="outline">All-Inclusive</Badge>}
                          {document.isHmo && <Badge variant="outline">HMO</Badge>}
                          {document.isJointTenancy && <Badge variant="outline">Joint Tenancy</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: document.content }} />
                    </CardContent>
                    
                    <CardFooter className="flex-col items-start border-t pt-6">
                      <div className="text-sm text-muted-foreground">
                        Created by {document.createdBy} on {format(new Date(document.createdAt), 'MMMM dd, yyyy')}
                        {document.dateSigned && (
                          <> • Signed on {format(new Date(document.dateSigned), 'MMMM dd, yyyy')}</>
                        )}
                      </div>
                      
                      {document.status === 'pending_signature' && (
                        <div className="flex items-center gap-2 mt-4 p-3 rounded-md bg-amber-50 text-amber-700 w-full">
                          <AlertTriangle className="h-5 w-5" />
                          <span>This document requires signatures before it becomes legally binding.</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {renderSignatureStatus()}
                </TabsContent>
                
                <TabsContent value="details" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Details</CardTitle>
                      <CardDescription>
                        Information about this document and its contents
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Document ID</dt>
                          <dd className="mt-1 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span>{document.id}</span>
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                          <dd className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(document.createdAt), 'MMMM dd, yyyy')}</span>
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Updated</dt>
                          <dd className="mt-1 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(document.updatedAt), 'MMMM dd, yyyy')}</span>
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                          <dd className="mt-1 flex items-center gap-2">
                            {getStatusIcon(document.status)}
                            <span>{document.status.charAt(0).toUpperCase() + document.status.slice(1).replace(/_/g, ' ')}</span>
                          </dd>
                        </div>
                        
                        {document.dateSigned && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Date Signed</dt>
                            <dd className="mt-1 flex items-center gap-2">
                              <PenSquare className="h-4 w-4" />
                              <span>{format(new Date(document.dateSigned), 'MMMM dd, yyyy')}</span>
                            </dd>
                          </div>
                        )}
                        
                        {document.dateSigned && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">Legally Binding</dt>
                            <dd className="mt-1 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>Yes - All required parties have signed</span>
                            </dd>
                          </div>
                        )}
                      </dl>
                      
                      <Separator className="my-6" />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Parties Involved</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          {document.landlordName && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Landlord</dt>
                              <dd className="mt-1 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                <span>{document.landlordName}</span>
                              </dd>
                            </div>
                          )}
                          
                          {document.tenantName && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Tenant</dt>
                              <dd className="mt-1 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{document.tenantName}</span>
                              </dd>
                            </div>
                          )}
                          
                          {document.agentName && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Agent</dt>
                              <dd className="mt-1 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{document.agentName}</span>
                              </dd>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document History</CardTitle>
                      <CardDescription>
                        Timeline of activities and changes
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="w-0.5 h-full bg-muted mt-2 mb-2 ml-5 -mb-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Document Created</h4>
                            <time className="text-sm text-muted-foreground">
                              {format(new Date(document.createdAt), 'MMMM dd, yyyy - h:mm a')}
                            </time>
                            <p className="mt-1 text-sm">
                              Document created by {document.createdBy}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                              <FileClock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="w-0.5 h-full bg-muted mt-2 mb-2 ml-5 -mb-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">Pending Signatures</h4>
                            <time className="text-sm text-muted-foreground">
                              {format(new Date(document.updatedAt), 'MMMM dd, yyyy - h:mm a')}
                            </time>
                            <p className="mt-1 text-sm">
                              Document sent for signatures
                            </p>
                          </div>
                        </div>
                        
                        {document.dateSigned && (
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                                <FileCheck className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Document Signed</h4>
                              <time className="text-sm text-muted-foreground">
                                {format(new Date(document.dateSigned), 'MMMM dd, yyyy - h:mm a')}
                              </time>
                              <p className="mt-1 text-sm">
                                All parties have signed the document
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Document Actions</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button className="w-full gap-2 justify-start" onClick={downloadDocument}>
                    <Download className="h-4 w-4" />
                    Download Document
                  </Button>
                  
                  {canSign() && (
                    <Button className="w-full gap-2 justify-start" onClick={handleSignDocument}>
                      <PenSquare className="h-4 w-4" />
                      Sign Document
                    </Button>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Document Type:</span>
                      <span className="font-medium">
                        {document.documentType.charAt(0).toUpperCase() + document.documentType.slice(1).replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(document.status)}
                        <span className="font-medium">
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1).replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    {document.propertyAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Property:</span>
                        <span className="font-medium text-right max-w-[200px]">{document.propertyAddress}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Need Help?</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For questions about this document or if you need assistance with signing, please contact support.
                    </p>
                    <Button variant="outline" className="w-full gap-2 justify-center">
                      <Settings className="h-4 w-4" />
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Dialog open={signingDialogOpen} onOpenChange={setSigningDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sign Document</DialogTitle>
                <DialogDescription>
                  Draw your signature below. This will be used to sign the document.
                </DialogDescription>
              </DialogHeader>
              
              <div className="border-2 border-dashed rounded-md p-1 my-4">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{ 
                    className: "w-full h-[200px] bg-white cursor-crosshair",
                    style: { width: '100%', height: '200px' }
                  }}
                />
              </div>
              
              <div className="text-sm text-center text-muted-foreground mt-2">
                Draw your signature above
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={clearSignature}>
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSign}
                  disabled={signDocumentMutation.isPending}
                >
                  {signDocumentMutation.isPending && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                  Sign Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The document you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => setLocation('/dashboard/documents')}>
              Return to Documents
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}