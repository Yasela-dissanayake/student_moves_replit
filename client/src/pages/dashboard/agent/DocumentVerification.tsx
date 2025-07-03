import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, FileText, Upload, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AgentPageTemplate from "./AgentPageTemplate";

interface VerificationData {
  status: "pending" | "in_progress" | "approved" | "rejected" | "not_submitted";
  idDocumentPath?: string;
  selfiePath?: string;
  verificationConfidence?: number;
  faceMatchScore?: number;
  documentValidityScore?: number;
  rejectionReason?: string;
  verifiedAt?: string | null;
  submittedAt?: string;
}

export default function DocumentVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "in_progress" | "approved" | "rejected" | "not_submitted">("not_submitted");

  // Fetch current verification status from the API
  const { data: verificationData, isLoading } = useQuery<VerificationData>({
    queryKey: ['/api/agent/verification/status']
  });
  
  // Update local status when verification data changes
  useEffect(() => {
    if (verificationData) {
      setVerificationStatus(verificationData.status);
    }
  }, [verificationData]);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest("POST", "/api/agent/verification/documents", formData);
    },
    onSuccess: () => {
      toast({
        title: "Documents uploaded",
        description: "Your documents have been uploaded and are pending verification.",
        variant: "default",
      });
      setVerificationStatus("pending");
      setUploadProgress(100);
      
      // Invalidate the status query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/agent/verification/status'] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your documents. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  });

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdDocumentFile(e.target.files[0]);
    }
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelfieFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!idDocumentFile || !selfieFile) {
      toast({
        title: "Missing files",
        description: "Please upload both an ID document and a selfie",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("idDocument", idDocumentFile);
    formData.append("selfie", selfieFile);

    // Simulate upload progress
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    uploadMutation.mutate(formData);
  };

  const renderVerificationStatus = () => {
    if (isLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
          <div className="animate-pulse w-full flex space-x-4">
            <div className="rounded-full bg-blue-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-2 bg-blue-200 rounded w-3/4"></div>
              <div className="h-2 bg-blue-200 rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    switch (verificationStatus) {
      case "approved":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">Verification Approved</p>
              <p className="text-sm text-green-700">
                Your identity has been verified successfully.
                {verificationData?.verifiedAt && (
                  <span className="block mt-1 text-xs text-green-600">
                    Verified on {new Date(verificationData.verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      case "rejected":
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <X className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">Verification Rejected</p>
              <p className="text-sm text-red-700">
                {verificationData?.rejectionReason || "Your documents could not be verified. Please upload new documents."}
              </p>
              {verificationData?.verifiedAt && (
                <span className="block mt-1 text-xs text-red-600">
                  Reviewed on {new Date(verificationData.verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        );
      case "pending":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-blue-800">Verification Pending</p>
              <p className="text-sm text-blue-700">
                Your documents are being reviewed. This usually takes 1-2 business days.
              </p>
              {verificationData?.submittedAt && (
                <span className="block mt-1 text-xs text-blue-600">
                  Submitted on {new Date(verificationData.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        );
      case "in_progress":
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">Verification In Progress</p>
              <p className="text-sm text-yellow-700">
                Your documents are currently being reviewed by our verification team.
              </p>
              {verificationData?.submittedAt && (
                <span className="block mt-1 text-xs text-yellow-600">
                  Submitted on {new Date(verificationData.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-6 w-6 text-gray-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Verification Required</p>
              <p className="text-sm text-gray-700">
                Please upload your identity documents and a selfie for verification.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <AgentPageTemplate
      title="Document Verification"
      description="Upload your identity documents for verification"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Verification Documents</CardTitle>
              <CardDescription>
                We require two types of documents to verify your identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderVerificationStatus()}

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">ID Document</h3>
                  <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50 relative overflow-hidden">
                    {idDocumentFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">{idDocumentFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(idDocumentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setIdDocumentFile(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload your passport, driver's license, or ID card
                        </p>
                        <label>
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Select File
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={handleIdDocumentChange}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Selfie</h3>
                  <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/50 relative overflow-hidden">
                    {selfieFile ? (
                      <div className="flex flex-col items-center">
                        <User className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">{selfieFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selfieFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSelfieFile(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <User className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a clear photo of your face
                        </p>
                        <label>
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Select File
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png"
                            onChange={handleSelfieChange}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Uploading documents...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpload}
                disabled={!idDocumentFile || !selfieFile || uploadMutation.isPending || verificationStatus === "approved" || verificationStatus === "pending"}
                className="w-full"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Documents"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Verification Guide</CardTitle>
              <CardDescription>
                Follow these guidelines for successful verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">ID Document</h3>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                  <li>Upload a clear, color photo or scan</li>
                  <li>All four corners must be visible</li>
                  <li>Information must be clearly legible</li>
                  <li>Accepted formats: JPG, PNG, PDF</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium">Selfie</h3>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc pl-4">
                  <li>Face must be clearly visible</li>
                  <li>No sunglasses or head coverings</li>
                  <li>Neutral expression, looking at camera</li>
                  <li>Good lighting, plain background</li>
                  <li>Accepted formats: JPG, PNG</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium">Verification Process</h3>
                <ol className="text-sm text-muted-foreground mt-1 space-y-1 list-decimal pl-4">
                  <li>Upload required documents</li>
                  <li>AI-powered verification checks</li>
                  <li>Human review if needed</li>
                  <li>Receive verification status</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Verification typically takes 1-2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentPageTemplate>
  );
}