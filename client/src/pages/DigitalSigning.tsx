import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  PenTool, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  Upload,
  UserPlus,
  Calendar,
  Shield,
  Signature,
  Mail,
  Phone,
  MapPin,
  Building
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface DocumentTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  template: string;
  requiredFields: string[];
  signatoryRoles: string[];
}

interface SigningRequest {
  id: number;
  documentId: number;
  documentName: string;
  initiatorId: number;
  initiatorName: string;
  status: "draft" | "sent" | "in_progress" | "completed" | "declined" | "expired";
  createdAt: string;
  dueDate?: string;
  signatories: Signatory[];
  completedAt?: string;
}

interface Signatory {
  id: number;
  email: string;
  name: string;
  role: string;
  status: "pending" | "signed" | "declined";
  signedAt?: string;
  signature?: string;
  ipAddress?: string;
}

export default function DigitalSigning() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [signatories, setSignatories] = useState<Omit<Signatory, "id" | "status">[]>([]);
  const [documentData, setDocumentData] = useState<Record<string, string>>({});
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [currentSigningRequest, setCurrentSigningRequest] = useState<SigningRequest | null>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/document-templates"],
  });

  // Fetch signing requests
  const { data: signingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/signing-requests"],
  });

  // Create signing request mutation
  const createSigningRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/signing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create signing request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signing-requests"] });
      toast({ title: "Signing request created", description: "Document sent for signature" });
      setIsCreatingRequest(false);
      setSelectedTemplate(null);
      setSignatories([]);
      setDocumentData({});
    },
  });

  // Submit signature mutation
  const submitSignatureMutation = useMutation({
    mutationFn: async (data: { requestId: number; signature: string }) => {
      const response = await fetch(`/api/signing-requests/${data.requestId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: data.signature }),
      });
      if (!response.ok) throw new Error("Failed to submit signature");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signing-requests"] });
      toast({ title: "Document signed", description: "Your signature has been submitted" });
      setShowSignatureDialog(false);
      setCurrentSigningRequest(null);
    },
  });

  const addSignatory = () => {
    setSignatories([...signatories, { email: "", name: "", role: "tenant" }]);
  };

  const removeSignatory = (index: number) => {
    setSignatories(signatories.filter((_, i) => i !== index));
  };

  const updateSignatory = (index: number, field: string, value: string) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], [field]: value };
    setSignatories(updated);
  };

  const handleCreateRequest = () => {
    if (!selectedTemplate || signatories.length === 0) {
      toast({ title: "Error", description: "Please select a template and add signatories", variant: "destructive" });
      return;
    }

    const requestData = {
      documentId: selectedTemplate.id,
      signatories,
      documentData,
      dueDate: documentData.dueDate,
    };

    createSigningRequestMutation.mutate(requestData);
  };

  const handleSign = (request: SigningRequest) => {
    setCurrentSigningRequest(request);
    setShowSignatureDialog(true);
  };

  const submitSignature = () => {
    if (!signatureRef.current || !currentSigningRequest) return;
    
    const signature = signatureRef.current.toDataURL();
    submitSignatureMutation.mutate({
      requestId: currentSigningRequest.id,
      signature,
    });
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "declined": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "declined": return <XCircle className="h-4 w-4" />;
      case "expired": return <XCircle className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const calculateProgress = (request: SigningRequest) => {
    const signed = request.signatories.filter(s => s.status === "signed").length;
    return (signed / request.signatories.length) * 100;
  };

  // Mock templates for demonstration
  const mockTemplates: DocumentTemplate[] = [
    {
      id: 1,
      name: "Tenancy Agreement",
      type: "rental",
      description: "Standard Assured Shorthold Tenancy Agreement (AST)",
      template: "tenancy_agreement",
      requiredFields: ["propertyAddress", "rentAmount", "depositAmount", "tenancyStartDate", "tenancyEndDate"],
      signatoryRoles: ["landlord", "tenant"]
    },
    {
      id: 2,
      name: "Maintenance Request Authorization",
      type: "maintenance",
      description: "Authorization for maintenance work and cost approval",
      template: "maintenance_auth",
      requiredFields: ["propertyAddress", "workDescription", "estimatedCost", "urgency"],
      signatoryRoles: ["landlord", "agent", "contractor"]
    },
    {
      id: 3,
      name: "Deposit Protection Certificate",
      type: "deposit",
      description: "Deposit protection scheme registration document",
      template: "deposit_protection",
      requiredFields: ["tenantName", "depositAmount", "protectionScheme", "registrationDate"],
      signatoryRoles: ["landlord", "tenant"]
    },
    {
      id: 4,
      name: "Right to Rent Check",
      type: "compliance",
      description: "Right to Rent verification and check document",
      template: "right_to_rent",
      requiredFields: ["tenantName", "documentType", "checkDate", "checkedBy"],
      signatoryRoles: ["landlord", "agent", "tenant"]
    }
  ];

  // Mock signing requests for demonstration
  const mockSigningRequests: SigningRequest[] = [
    {
      id: 1,
      documentId: 1,
      documentName: "Tenancy Agreement - 123 Student Street",
      initiatorId: 1,
      initiatorName: "Robert Thompson",
      status: "in_progress",
      createdAt: "2025-06-17T06:00:00Z",
      dueDate: "2025-06-24T23:59:59Z",
      signatories: [
        {
          id: 1,
          email: "robert.thompson@example.com",
          name: "Robert Thompson",
          role: "landlord",
          status: "signed",
          signedAt: "2025-06-17T08:30:00Z",
          signature: "data:image/png;base64,signature1"
        },
        {
          id: 2,
          email: "student@university.ac.uk",
          name: "Alex Johnson",
          role: "tenant",
          status: "pending"
        }
      ]
    },
    {
      id: 2,
      documentId: 2,
      documentName: "Maintenance Authorization - Heating Repair",
      initiatorId: 2,
      initiatorName: "Sarah Johnson",
      status: "completed",
      createdAt: "2025-06-16T14:20:00Z",
      completedAt: "2025-06-17T10:15:00Z",
      signatories: [
        {
          id: 3,
          email: "robert.thompson@example.com",
          name: "Robert Thompson",
          role: "landlord",
          status: "signed",
          signedAt: "2025-06-16T16:45:00Z"
        },
        {
          id: 4,
          email: "agent@unirent.com",
          name: "Sarah Johnson",
          role: "agent",
          status: "signed",
          signedAt: "2025-06-17T10:15:00Z"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Signature className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Digital Document Signing</h1>
              <p className="text-gray-600">Secure electronic signature platform for property documents</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreatingRequest(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Create Signing Request
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="documents">Document Templates</TabsTrigger>
            <TabsTrigger value="requests">Signing Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending Signatures</TabsTrigger>
          </TabsList>

          {/* Document Upload */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document Upload & Conversion
                </CardTitle>
                <p className="text-gray-600">
                  Upload Word documents (.doc, .docx) or PDFs to automatically convert them into e-signature format.
                  Signature fields will be detected automatically based on document content.
                </p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Documents</h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, and DOCX files (max 10MB)
                  </p>
                  <Button className="mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Automatic Features:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Signature field detection based on keywords like "signature", "sign here", "date"</li>
                    <li>• Word document conversion to PDF format</li>
                    <li>• Template creation for reuse</li>
                    <li>• Multi-party signing workflow setup</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Templates */}
          <TabsContent value="documents">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Required Signatories:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.signatoryRoles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsCreatingRequest(true);
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Signing Requests */}
          <TabsContent value="requests">
            <div className="space-y-4">
              {mockSigningRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <CardTitle className="text-lg">{request.documentName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Initiated by {request.initiatorName} • {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Signing Progress</p>
                          <span className="text-sm text-gray-600">
                            {request.signatories.filter(s => s.status === "signed").length} of {request.signatories.length} signed
                          </span>
                        </div>
                        <Progress value={calculateProgress(request)} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {request.signatories.map((signatory) => (
                          <div key={signatory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{signatory.name}</p>
                              <p className="text-sm text-gray-600">{signatory.email}</p>
                              <Badge variant="outline" className="mt-1">
                                {signatory.role}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(signatory.status)}>
                                {signatory.status}
                              </Badge>
                              {signatory.signedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(signatory.signedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        {request.status === "in_progress" && (
                          <Button 
                            size="sm"
                            onClick={() => handleSign(request)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <PenTool className="h-4 w-4 mr-2" />
                            Sign Document
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pending Signatures */}
          <TabsContent value="pending">
            <div className="space-y-4">
              {mockSigningRequests
                .filter(r => r.status === "in_progress" || r.status === "sent")
                .map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.documentName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Waiting for your signature
                          </p>
                        </div>
                        {request.dueDate && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Due:</p>
                            <p className="text-sm font-medium">
                              {new Date(request.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleSign(request)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Sign Now
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Review Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Completed Documents */}
          <TabsContent value="completed">
            <div className="space-y-4">
              {mockSigningRequests
                .filter(r => r.status === "completed")
                .map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.documentName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            Completed on {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button variant="outline">
                          <Shield className="h-4 w-4 mr-2" />
                          Verify Signatures
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Signing Request Dialog */}
        <Dialog open={isCreatingRequest} onOpenChange={setIsCreatingRequest}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Signing Request</DialogTitle>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </CardHeader>
                </Card>

                {/* Document Fields */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Document Information</h3>
                  {selectedTemplate.requiredFields.map((field) => (
                    <div key={field}>
                      <Label htmlFor={field}>
                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Input
                        id={field}
                        value={documentData[field] || ""}
                        onChange={(e) => setDocumentData({...documentData, [field]: e.target.value})}
                        placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                      />
                    </div>
                  ))}
                  <div>
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={documentData.dueDate || ""}
                      onChange={(e) => setDocumentData({...documentData, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                {/* Signatories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Signatories</h3>
                    <Button onClick={addSignatory} variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Signatory
                    </Button>
                  </div>
                  
                  {signatories.map((signatory, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={signatory.name}
                              onChange={(e) => updateSignatory(index, "name", e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={signatory.email}
                              onChange={(e) => updateSignatory(index, "email", e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <select
                              className="w-full p-2 border border-gray-300 rounded-md"
                              value={signatory.role}
                              onChange={(e) => updateSignatory(index, "role", e.target.value)}
                            >
                              {selectedTemplate.signatoryRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeSignatory(index)}
                          variant="outline"
                          size="sm"
                          className="mt-3 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingRequest(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRequest}
                    disabled={createSigningRequestMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send for Signature
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Signature Dialog */}
        <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Digital Signature</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please sign in the box below using your mouse, finger, or stylus.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 400,
                    height: 200,
                    className: "signature-canvas w-full"
                  }}
                />
              </div>
              
              <div className="flex justify-between">
                <Button onClick={clearSignature} variant="outline">
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSignatureDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitSignature}
                    disabled={submitSignatureMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Submit Signature
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}