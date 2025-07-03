import { useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import SignatureCanvas from 'react-signature-canvas';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle, Download, ArrowLeft } from 'lucide-react';

interface Document {
  id: number;
  title: string;
  content: string;
  documentType: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: number | null;
  landlordId: number | null;
  agentId: number | null;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  signedByAgent: boolean;
  tenancyId: number | null;
  propertyId: number | null;
  status: string;
  format: string;
  storagePath: string | null;
  aiGenerated: boolean;
  dateSigned: Date | null;
  tenantSignatureData?: string;
  landlordSignatureData?: string;
  agentSignatureData?: string;
}

export default function SignDocument() {
  const { documentId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const { data: document, isLoading, error } = useQuery<Document>({
    queryKey: [`/api/documents/${documentId}`],
    queryFn: async ({ queryKey }) => {
      const res = await apiRequest('GET', queryKey[0] as string);
      if (!res.ok) {
        throw new Error('Failed to fetch document');
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const { toast } = useToast();
  const signDocumentMutation = useMutation({
    mutationFn: async ({ documentId, signatureData }: { documentId: string, signatureData: string }) => {
      const res = await apiRequest(
        'POST', 
        `/api/documents/${documentId}/sign`,
        { signatureData }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Could not sign document');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Document signed successfully",
        description: "The document has been signed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
      setSignatureData(null);
      setSuccessDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to sign document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generatePdfMutation = useMutation({
    mutationFn: async (documentId: string) => {
      setIsPdfGenerating(true);
      const res = await apiRequest('GET', `/api/documents/${documentId}/pdf`, null);
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Could not generate PDF');
      }
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsPdfGenerating(false);
      
      // Automatically trigger download
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: "Document PDF has been generated and downloaded.",
      });
    },
    onError: (error: Error) => {
      setIsPdfGenerating(false);
      toast({
        title: "Failed to generate PDF",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataURL = sigCanvasRef.current.toDataURL('image/png');
      setSignatureData(dataURL);
      setIsSignatureDialogOpen(false);
      
      // Sign the document immediately after saving signature
      if (documentId && dataURL) {
        signDocumentMutation.mutate({ documentId, signatureData: dataURL });
      }
    } else {
      toast({
        title: "Signature required",
        description: "Please provide your signature before proceeding.",
        variant: "destructive",
      });
    }
  };

  const userHasSigned = () => {
    if (!document || !user) return false;
    
    if (user.userType === 'tenant' && document.signedByTenant) return true;
    if (user.userType === 'landlord' && document.signedByLandlord) return true;
    if (user.userType === 'agent' && document.signedByAgent) return true;
    
    return false;
  };

  const allPartiesSigned = () => {
    if (!document) return false;
    
    const requiredParties = [];
    if (document.tenantId) requiredParties.push('tenant');
    if (document.landlordId) requiredParties.push('landlord'); 
    if (document.agentId) requiredParties.push('agent');
    
    const signedStatus = {
      tenant: document.tenantId ? document.signedByTenant : true,
      landlord: document.landlordId ? document.signedByLandlord : true,
      agent: document.agentId ? document.signedByAgent : true
    };
    
    return requiredParties.every(party => signedStatus[party as keyof typeof signedStatus]);
  };

  const canUserSign = () => {
    if (!document || !user) return false;
    
    if (userHasSigned()) return false;
    
    if (user.userType === 'tenant' && document.tenantId === user.id) return true;
    if (user.userType === 'landlord' && document.landlordId === user.id) return true;
    if (user.userType === 'agent' && document.agentId === user.id) return true;
    
    return false;
  };

  const downloadPdf = () => {
    if (documentId) {
      generatePdfMutation.mutate(documentId);
    }
  };

  const goBack = () => {
    setLocation('/dashboard/documents');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Error Loading Document</h2>
        <p>{error instanceof Error ? error.message : 'Failed to load document'}</p>
        <Button onClick={goBack}>Back to Documents</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={goBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">{document.title}</CardTitle>
          <CardDescription>
            {document.documentType === 'rental_agreement' ? 'Tenancy Agreement' : 
             document.documentType === 'inventory' ? 'Property Inventory' : 
             document.documentType === 'right_to_rent' ? 'Right to Rent Document' : 
             'Document'}
            {document.aiGenerated && ' (AI Generated)'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: document.content }} />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 items-start">
          <div className="w-full">
            <h3 className="text-lg font-medium mb-2">Document Details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="font-medium">Created</div>
              <div>{new Date(document.createdAt).toLocaleDateString()}</div>
              
              {document.dateSigned && (
                <>
                  <div className="font-medium">Date Signed</div>
                  <div>{new Date(document.dateSigned).toLocaleDateString()}</div>
                </>
              )}
              
              <div className="font-medium">Document Type</div>
              <div className="capitalize">{document.documentType.replace(/_/g, ' ')}</div>
              
              {document.aiGenerated && (
                <>
                  <div className="font-medium">Generation</div>
                  <div>AI Generated</div>
                </>
              )}
            </div>
          </div>
          
          <div className="w-full pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {document.tenantId && (
                <div className="border rounded-md p-4">
                  <div className="font-medium">Tenant</div>
                  {document.signedByTenant ? (
                    <>
                      <div className="flex items-center text-green-600 mt-2">
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                        <span>Signed</span>
                      </div>
                      {document.tenantSignatureData && (
                        <div className="mt-2">
                          <img 
                            src={document.tenantSignatureData} 
                            alt="Tenant Signature" 
                            className="max-h-20 border rounded-md p-1"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-yellow-600 mt-2">Awaiting signature</div>
                  )}
                </div>
              )}
              
              {document.landlordId && (
                <div className="border rounded-md p-4">
                  <div className="font-medium">Landlord</div>
                  {document.signedByLandlord ? (
                    <>
                      <div className="flex items-center text-green-600 mt-2">
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                        <span>Signed</span>
                      </div>
                      {document.landlordSignatureData && (
                        <div className="mt-2">
                          <img 
                            src={document.landlordSignatureData} 
                            alt="Landlord Signature" 
                            className="max-h-20 border rounded-md p-1"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-yellow-600 mt-2">Awaiting signature</div>
                  )}
                </div>
              )}
              
              {document.agentId && (
                <div className="border rounded-md p-4">
                  <div className="font-medium">Agent</div>
                  {document.signedByAgent ? (
                    <>
                      <div className="flex items-center text-green-600 mt-2">
                        <CheckCircle2 className="w-5 h-5 mr-1" />
                        <span>Signed</span>
                      </div>
                      {document.agentSignatureData && (
                        <div className="mt-2">
                          <img 
                            src={document.agentSignatureData} 
                            alt="Agent Signature" 
                            className="max-h-20 border rounded-md p-1"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-yellow-600 mt-2">Awaiting signature</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Button 
          onClick={downloadPdf}
          disabled={isPdfGenerating}
          className="flex-1"
        >
          {isPdfGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isPdfGenerating ? 'Generating PDF...' : 'Download Document'}
        </Button>
        
        {canUserSign() && (
          <Button 
            onClick={() => setIsSignatureDialogOpen(true)}
            className="flex-1 bg-primary"
            disabled={signDocumentMutation.isPending}
          >
            {signDocumentMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Sign Document"
            )}
          </Button>
        )}
      </div>
      
      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Your Signature</DialogTitle>
            <DialogDescription>
              Use your mouse or touch screen to sign below. This will be added to the document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border-2 border-gray-300 rounded-md overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas',
              }}
              backgroundColor="white"
            />
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-4">
            <Button type="button" variant="outline" onClick={clearSignature}>
              Clear
            </Button>
            <Button type="button" onClick={saveSignature}>
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle2 className="text-green-500 mr-2 h-6 w-6" />
              Document Signed Successfully
            </DialogTitle>
            <DialogDescription>
              {allPartiesSigned() 
                ? "All required parties have signed this document. The document is now complete."
                : "Your signature has been added to the document. The document will be fully executed once all required parties have signed."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setSuccessDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={downloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}