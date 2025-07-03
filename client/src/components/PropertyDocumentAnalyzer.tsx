import { useState, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, FileText, Upload, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PropertyDocumentAnalyzerProps {
  apiUrl: string;
  useEnhancedMode: boolean;
}

type AnalysisMode = 'lease-analysis' | 'compliance-check' | 'summarization' | 'risk-assessment' | 'custom';

const PropertyDocumentAnalyzer = ({ apiUrl, useEnhancedMode }: PropertyDocumentAnalyzerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [base64Document, setBase64Document] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('lease-analysis');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fileUploadError, setFileUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFileUploadError('');
    const selectedFile = e.target.files?.[0] || null;
    
    if (!selectedFile) {
      return;
    }
    
    // Validate file type (PDF, JPG, JPEG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setFileUploadError('Please upload a PDF or image file (JPG, JPEG, PNG)');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setFileUploadError('File is too large. Maximum size is 10MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview URL for the file
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    } else {
      // For PDF, just show the file name and icon
      setPreviewUrl('');
    }
    
    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        setBase64Document(base64);
      }
    };
  };

  const clearFile = () => {
    setFile(null);
    setBase64Document('');
    setPreviewUrl('');
    setAnalysis('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeDocument = async () => {
    if (!base64Document) {
      setError('Please upload a document first');
      return;
    }
    
    if (analysisMode === 'custom' && !customPrompt) {
      setError('Please enter a custom prompt');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setAnalysis('');
    
    try {
      const endpoint = useEnhancedMode 
        ? `${apiUrl}/openai-enhanced/analyze-document` 
        : `${apiUrl}/openai/analyze-document`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Document,
          analysisMode,
          customPrompt: analysisMode === 'custom' ? customPrompt : undefined,
          fileName: file?.name
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze document');
      }
      
      const data = await response.json();
      setAnalysis(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the document');
    } finally {
      setIsLoading(false);
    }
  };

  const modeDescriptions = {
    'lease-analysis': 'Identify key terms, obligations, potential issues, and important dates in a lease document.',
    'compliance-check': 'Review for compliance with typical rental regulations. Identify problematic clauses or missing required sections.',
    'summarization': 'Extract the most important information a tenant should know. Focus on financial obligations, key dates, and restrictions.',
    'risk-assessment': 'Identify financial, legal, or practical risks from a tenant\'s perspective. Includes severity categorization and recommendations.',
    'custom': 'Analyze the document based on your specific prompt.',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Property Document Analyzer
              {useEnhancedMode && (
                <Badge variant="outline" className="ml-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                  Enhanced
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Upload and analyze property documents such as leases, contracts, or agreements
              {useEnhancedMode && (
                <span className="ml-1 text-violet-500 font-medium">
                  with advanced AI capabilities
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <Label htmlFor="document-file">Upload Document</Label>
            <div className="flex items-center gap-4">
              <Input
                id="document-file"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              {file && (
                <Button variant="outline" onClick={clearFile} size="sm">
                  Clear
                </Button>
              )}
            </div>
            {fileUploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{fileUploadError}</AlertDescription>
              </Alert>
            )}
            {file && (
              <div className="p-4 border rounded-md">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                {previewUrl && (
                  <div className="mt-2">
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="max-h-64 rounded border object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <Label htmlFor="analysis-mode">Analysis Mode</Label>
            <Select
              value={analysisMode}
              onValueChange={(value) => setAnalysisMode(value as AnalysisMode)}
            >
              <SelectTrigger id="analysis-mode">
                <SelectValue placeholder="Select analysis mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lease-analysis">Lease Analysis</SelectItem>
                <SelectItem value="compliance-check">Compliance Check</SelectItem>
                <SelectItem value="summarization">Summarization</SelectItem>
                <SelectItem value="risk-assessment">Risk Assessment</SelectItem>
                <SelectItem value="custom">Custom Analysis</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {modeDescriptions[analysisMode]}
            </p>
          </div>

          {analysisMode === 'custom' && (
            <div className="grid gap-4">
              <Label htmlFor="custom-prompt">Custom Prompt</Label>
              <Textarea
                id="custom-prompt"
                placeholder="Enter your custom prompt for document analysis..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <Button
            onClick={analyzeDocument}
            disabled={!base64Document || isLoading || (analysisMode === 'custom' && !customPrompt)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysis && (
          <div className="mt-6 border rounded-md p-6">
            <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
            <div className="prose max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {analysis.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyDocumentAnalyzer;