import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeploymentDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePackage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/generate-deployment-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate deployment package');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      toast({
        title: "Package Generated",
        description: "Your deployment package is ready for download.",
      });
    } catch (error) {
      console.error('Error generating package:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the deployment package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `studentmoves-deployment-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your deployment package is being downloaded.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deployment Package</h1>
          <p className="text-gray-600">
            Generate and download a complete deployment package for your custom domain
          </p>
        </div>

        <div className="grid gap-6">
          {/* Package Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Deployment Package Contents
              </CardTitle>
              <CardDescription>
                Your package will include all necessary files for deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Frontend React application (built)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Backend Node.js server</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Database schema and migrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Environment configuration template</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Package.json and dependencies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Static assets and images</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Deployment instructions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Docker configuration (optional)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Package */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Generate Package
              </CardTitle>
              <CardDescription>
                Create a deployment-ready package of your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will create a complete copy of your application optimized for production deployment.
                    The package will be approximately 50-100MB in size.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleGeneratePackage}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Generate Package
                      </>
                    )}
                  </Button>

                  {downloadUrl && (
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Package
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deployment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deployment Instructions
              </CardTitle>
              <CardDescription>
                How to deploy your package to a custom domain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Prerequisites</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Node.js 18+ installed on your server</li>
                    <li>• PostgreSQL database setup</li>
                    <li>• Domain name with DNS configured</li>
                    <li>• SSL certificate (recommended)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Deployment Steps</h4>
                  <ol className="space-y-1 text-sm text-gray-600 list-decimal ml-4">
                    <li>Extract the downloaded ZIP file to your server</li>
                    <li>Configure environment variables (.env file included)</li>
                    <li>Install dependencies: <code className="bg-gray-200 px-1 rounded">npm install</code></li>
                    <li>Run database migrations: <code className="bg-gray-200 px-1 rounded">npm run db:push</code></li>
                    <li>Build the application: <code className="bg-gray-200 px-1 rounded">npm run build</code></li>
                    <li>Start the production server: <code className="bg-gray-200 px-1 rounded">npm start</code></li>
                  </ol>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Detailed deployment instructions will be included in the downloaded package as README.md
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}