import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Download,
  PenTool
} from 'lucide-react';

interface UploadedDocument {
  fileName: string;
  originalName: string;
  pageCount?: number;
  signatureFields: Array<{
    id: string;
    type: string;
    page: number;
    placeholder?: string;
  }>;
  template: any;
}

interface DocumentUploadProps {
  onDocumentUploaded?: (document: UploadedDocument) => void;
}

export default function DocumentUpload({ onDocumentUploaded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/digital-signing/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        const uploadedDoc: UploadedDocument = {
          fileName: result.metadata.fileName,
          originalName: result.metadata.originalName,
          pageCount: result.metadata.pageCount,
          signatureFields: result.metadata.signatureFields,
          template: result.template
        };

        setUploadedDocuments(prev => [...prev, uploadedDoc]);
        onDocumentUploaded?.(uploadedDoc);

        toast({
          title: "Document Converted Successfully",
          description: `${file.name} has been converted to e-signature format with ${result.metadata.signatureFields.length} signature fields detected.`
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onDocumentUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const removeDocument = (fileName: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.fileName !== fileName));
  };

  const downloadDocument = async (fileName: string, originalName: string) => {
    try {
      const response = await fetch(`/api/digital-signing/download/${fileName}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload Word documents (.doc, .docx) or PDFs to automatically convert them into e-signature format.
            Signature fields will be detected automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto">
                  <PenTool className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Converting document...</p>
                  <p className="text-xs text-muted-foreground">Detecting signature fields</p>
                </div>
                <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop your document here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOC, and DOCX files (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Converted Documents</CardTitle>
            <CardDescription>
              Documents ready for e-signature workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedDocuments.map((doc) => (
                <div key={doc.fileName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{doc.originalName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {doc.pageCount && <span>{doc.pageCount} pages</span>}
                        <Badge variant="secondary" className="text-xs">
                          {doc.signatureFields.length} signature fields
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc.fileName, doc.originalName)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocument(doc.fileName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}