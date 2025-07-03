import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FileText, Send, PenTool } from 'lucide-react';

export default function DigitalSigningTest() {
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateDocument = async () => {
    if (!documentTitle || !documentContent || !signerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/digital-signing/templates', {
        method: 'POST',
        body: JSON.stringify({
          title: documentTitle,
          content: documentContent
        })
      });

      if (response.ok) {
        const template = await response.json();
        
        // Create signing request
        const signingResponse = await apiRequest('/api/digital-signing/requests', {
          method: 'POST',
          body: JSON.stringify({
            templateId: template.id,
            signerEmail: signerEmail,
            signerName: signerEmail.split('@')[0]
          })
        });

        if (signingResponse.ok) {
          toast({
            title: "Success",
            description: "Document created and signing request sent!"
          });
          
          // Reset form
          setDocumentTitle('');
          setDocumentContent('');
          setSignerEmail('');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Digital Signing Test</h1>
          <p className="text-muted-foreground">Test the DocuSign-like digital signing functionality</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Document
            </CardTitle>
            <CardDescription>
              Create a document template and send it for digital signature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g., Rental Agreement"
              />
            </div>

            <div>
              <Label htmlFor="content">Document Content</Label>
              <Textarea
                id="content"
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Enter the document content here..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="email">Signer Email</Label>
              <Input
                id="email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="signer@example.com"
              />
            </div>

            <Button
              onClick={handleCreateDocument}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <PenTool className="h-4 w-4 mr-2 animate-spin" />
                  Creating Document...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create & Send for Signature
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            This test page verifies the digital signing system functionality independently
          </p>
        </div>
      </div>
    </div>
  );
}