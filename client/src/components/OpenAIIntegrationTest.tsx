import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface OpenAIKeyInputProps {
  onSuccess: () => void;
}

export const OpenAIKeyInput = ({ onSuccess }: OpenAIKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/openai/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess(true);
        onSuccess();
      } else {
        setError(data.message || 'Failed to set API key');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Configure OpenAI API Key</CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable AI-powered features. Your key will be securely stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>API key configured successfully!</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading || success}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Configuring...' : success ? 'Configured' : 'Save API Key'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const OpenAIIntegrationTest = () => {
  const [openaiStatus, setOpenaiStatus] = useState<'unchecked' | 'checking' | 'available' | 'unavailable'>('unchecked');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState('generateText');
  const [isMockImplementation, setIsMockImplementation] = useState(false);

  const checkOpenAIStatus = useCallback(async () => {
    setOpenaiStatus('checking');
    try {
      const response = await fetch('/api/openai/status');
      const data = await response.json();
      
      if (data.status === 'success') {
        setOpenaiStatus('available');
        // Check if we're using the mock implementation
        setIsMockImplementation(data.usingMock === true);
      } else {
        setOpenaiStatus('unavailable');
        setIsMockImplementation(false);
      }
    } catch (err) {
      setOpenaiStatus('unavailable');
      setIsMockImplementation(false);
      console.error('Error checking OpenAI status:', err);
    }
  }, []);
  
  // Check OpenAI status on component mount only when specifically loaded on the OpenAI test page
  useEffect(() => {
    // Only initialize if we're on the OpenAI test page, not when this component is imported elsewhere
    const isOpenAITestPage = window.location.pathname === '/openai-test'; // Using exact path match
    
    if (isOpenAITestPage) {
      // Use custom AI provider instead of trying to check OpenAI status
      setIsMockImplementation(true);
      setOpenaiStatus('available');
    } else {
      // Don't render anything if we're not on the OpenAI test page
      // This prevents the component from running on marketplace or other pages
      setOpenaiStatus('unchecked');
      return; // Exit early to prevent any API calls
    }
  }, []);

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const response = await fetch('/api/openai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: selectedOperation,
          prompt,
          maxTokens: 500,
        }),
      });

      const data = await response.json();

      if (data.status === 'error' || data.error) {
        setError(data.error || data.message || 'An error occurred');
      } else {
        setResult(data.result);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating text');
    } finally {
      setLoading(false);
    }
  };

  // Skip rendering this component if not on the OpenAI test page
  if (window.location.pathname !== '/openai-test') {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OpenAI Integration Test</CardTitle>
          <CardDescription>
            Test your OpenAI integration by generating text using different operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openaiStatus === 'unchecked' && (
            <Button onClick={checkOpenAIStatus}>Check OpenAI Status</Button>
          )}
          
          {openaiStatus === 'checking' && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking OpenAI status...</span>
            </div>
          )}
          
          {openaiStatus === 'unavailable' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTitle>OpenAI API Not Available</AlertTitle>
                <AlertDescription>
                  You need to configure your OpenAI API key before you can use AI features.
                </AlertDescription>
              </Alert>
              <OpenAIKeyInput onSuccess={checkOpenAIStatus} />
            </div>
          )}
          
          {openaiStatus === 'available' && (
            <div className="space-y-4">
              <Alert className={isMockImplementation ? "border-2 border-yellow-500" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <AlertTitle className="flex items-center gap-2">
                      OpenAI API Available
                      {isMockImplementation && (
                        <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600 font-semibold">
                          MOCK MODE ENABLED
                        </Badge>
                      )}
                    </AlertTitle>
                    <AlertDescription>
                      {isMockImplementation 
                        ? 'Using a simulated OpenAI service to eliminate API costs. All responses are generated locally without using the OpenAI API.'
                        : 'Your OpenAI integration is working properly! You can now use AI-powered features.'}
                    </AlertDescription>
                  </div>
                  <CheckCircle2 className={isMockImplementation ? "h-5 w-5 text-amber-600" : "h-5 w-5 text-green-600"} />
                </div>
              </Alert>
              
              {isMockImplementation && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                  <h3 className="text-amber-800 font-semibold text-sm mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Mock OpenAI Implementation Active
                  </h3>
                  <p className="text-amber-700 text-sm">
                    You are using a cost-free simulation of the OpenAI API. No actual API calls will be made, saving on subscription costs.
                    All responses are simulated but follow realistic patterns. This is perfect for testing and development.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <Label>Select Operation</Label>
                  <RadioGroup
                    value={selectedOperation}
                    onValueChange={setSelectedOperation}
                    className="mt-2 flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="generateText" id="generateText" />
                      <Label htmlFor="generateText">Generate Text</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="generatePropertyDescription" id="propertyDescription" />
                      <Label htmlFor="propertyDescription">Property Description</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="resize-y"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateText} 
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Text'
                  )}
                </Button>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {result && (
                  <div className="space-y-2">
                    <Label>Result</Label>
                    <div className="rounded-md border p-4 whitespace-pre-wrap">
                      {result}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenAIIntegrationTest;