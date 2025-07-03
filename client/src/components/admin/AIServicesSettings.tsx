import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkAIStatus, checkGeminiStatus } from '@/lib/api';

export function AIServicesSettings() {
  const [loading, setLoading] = useState(true);
  const [checkingService, setCheckingService] = useState<string | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<'success' | 'error' | 'unknown'>('unknown');
  const [statusMessage, setStatusMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    setLoading(true);
    try {
      const response = await checkAIStatus();
      if (response.services) {
        setGeminiStatus(response.services.gemini?.status || 'unknown');
        setStatusMessage(response.message);
        setErrorDetails({
          gemini: response.services.gemini?.message
        });
      }
    } catch (error) {
      toast({
        title: "Error checking AI services",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSingleService = async (service: 'gemini') => {
    setCheckingService(service);
    try {
      const response = await checkGeminiStatus();
      setGeminiStatus(response.status || 'unknown');
      setErrorDetails(prev => ({
        ...prev,
        gemini: response.message
      }));
      toast({
        title: `Gemini API Status: ${response.status === 'success' ? 'Working' : 'Error'}`,
        description: response.message,
        variant: response.status === 'success' ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Error checking Gemini API",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setCheckingService(null);
    }
  };

  const getStatusIcon = (status: 'success' | 'error' | 'unknown') => {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status: 'success' | 'error' | 'unknown') => {
    if (status === 'success') return <Badge variant="default" className="bg-green-500">Working</Badge>;
    if (status === 'error') return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Unknown</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Services Status</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={checkAllServices} 
            disabled={loading}
            title="Refresh status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Check the status of Google Gemini AI service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusMessage && (
          <Alert variant={geminiStatus === 'success' ? 'default' : 'destructive'}>
            <AlertTitle className="flex items-center gap-2">
              {getStatusIcon(geminiStatus === 'success' ? 'success' : 'error')}
              System Status
            </AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Google Gemini</h3>
              {getStatusBadge(geminiStatus)}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              AI service for property descriptions, document analysis, and ID verification
            </p>
            {errorDetails.gemini && (
              <p className={`text-sm ${geminiStatus === 'success' ? 'text-green-600' : 'text-red-500'} mb-3`}>
                {errorDetails.gemini}
              </p>
            )}
            <Button 
              onClick={() => checkSingleService('gemini')} 
              variant="outline" 
              size="sm"
              disabled={checkingService === 'gemini'}
            >
              {checkingService === 'gemini' && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Check Status
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 items-start">
        <h4 className="font-medium">AI Service Information</h4>
        <p className="text-sm text-gray-500">
          Google Gemini AI is used exclusively throughout the entire system for property descriptions, 
          content generation, document processing, and ID verification.
        </p>
        {geminiStatus === 'error' && (
          <Alert variant="destructive" className="mt-4 w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AI service is unavailable</AlertTitle>
            <AlertDescription>
              Please contact your administrator to check the API key and configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}