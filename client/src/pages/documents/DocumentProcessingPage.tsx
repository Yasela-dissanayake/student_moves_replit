import React, { useState } from 'react';
import { FileText, BookText, Upload, Zap, Loader2, ImageIcon } from 'lucide-react';
import DocumentProcessing from '@/components/documents/DocumentProcessing';
import DocumentImageAnalysis from '@/components/documents/DocumentImageAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

export default function DocumentProcessingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  
  // No need to check isLoading since we're not using it
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  // Only allow landlord, agent, and admin access
  if (!['landlord', 'agent', 'admin'].includes(user.userType)) {
    navigate('/dashboard');
    return null;
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Processing</h1>
            <p className="text-muted-foreground mt-2">
              Extract, process, and structure documents with AI assistance
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
            <Zap className="w-3.5 h-3.5 mr-1" />
            AI-Powered
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
                Step 1: Upload Document
              </CardTitle>
              <CardDescription>
                Upload any document for AI extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload PDF, Word documents, or text files for processing.
                For image analysis of documents, use the dedicated Image Analysis tab.
                Our AI system will extract the content and identify key information.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-muted-foreground" />
                Step 2: Review & Edit
              </CardTitle>
              <CardDescription>
                Review extracted information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                After extraction, you can review the identified document type, 
                key details, and extracted text. Make any necessary edits.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookText className="w-5 h-5 mr-2 text-muted-foreground" />
                Step 3: Save Structured Document
              </CardTitle>
              <CardDescription>
                Generate a structured document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The AI will convert your document into a properly formatted structure,
                organizing the information in a clean, professional format.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="processing" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="processing">Document Processing</TabsTrigger>
            <TabsTrigger value="image-analysis">Image Analysis</TabsTrigger>
            <TabsTrigger value="history">Processing History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="processing" className="mt-0">
            <DocumentProcessing 
              onDocumentSaved={(documentId) => setSavedDocumentId(documentId)}
            />
          </TabsContent>
          
          <TabsContent value="image-analysis" className="mt-0">
            <DocumentImageAnalysis />
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Recently Processed Documents</CardTitle>
                <CardDescription>
                  View and manage documents you've recently processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedDocumentId ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-slate-50">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">Document processed successfully</h3>
                          <p className="text-sm text-muted-foreground">
                            Your document has been processed and saved.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => 
                          window.open(`/api/documents/${savedDocumentId}/download`, '_blank')
                        }>
                          View Document
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      A complete history of your processed documents is available
                      in the Documents section of your dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                    <h3 className="mt-4 text-lg font-medium">No recently processed documents</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                      Process a document using the Document Processing tab to see it appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}