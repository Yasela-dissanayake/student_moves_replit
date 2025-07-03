import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Check, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface ProviderStatus {
  [key: string]: boolean;
}

interface TestResponse {
  success: boolean;
  message: string;
  providerStatus?: ProviderStatus;
  testResponse?: string;
  testMode?: string;
  operation?: string;
  simulationSettings?: {
    simulateGeminiFailure: boolean;
    simulateOpenAIFailure: boolean;
    simulateAllFailures: boolean;
  };
  error?: string;
  scenario?: string;
  result?: any;
}

export default function TestAIService() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);
  const [operation, setOperation] = useState('generateText');
  const [scenario, setScenario] = useState('gemini-to-openai');
  const [simulateGeminiFailure, setSimulateGeminiFailure] = useState(false);
  const [simulateOpenAIFailure, setSimulateOpenAIFailure] = useState(false);
  const [simulateAllFailures, setSimulateAllFailures] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/api/test-ai-service', {
        forceFailGemini: simulateGeminiFailure,
        forceFailOpenAI: simulateOpenAIFailure,
        forceFailAll: simulateAllFailures,
        operation,
        testMode: 'simulation'
      });
      
      setTestResults(data);
      
      toast({
        title: data.success ? 'Test Successful' : 'Test Failed',
        description: data.message || data.error || 'Test completed',
        variant: data.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Error testing AI service:', error);
      setTestResults({
        success: false,
        message: 'Error testing AI service',
        error: error.message || 'Unknown error'
      });
      
      toast({
        title: 'Test Failed',
        description: error.message || 'Error testing AI service',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runScenarioTest = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/api/test-ai-fallback-scenarios', {
        scenario,
        operation
      });
      
      setTestResults(data);
      
      toast({
        title: data.success ? 'Scenario Test Successful' : 'Scenario Test Failed',
        description: `Completed scenario: ${data.scenario}`,
        variant: data.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Error testing AI scenario:', error);
      setTestResults({
        success: false,
        message: 'Error testing AI scenario',
        error: error.message || 'Unknown error'
      });
      
      toast({
        title: 'Scenario Test Failed',
        description: error.message || 'Error testing AI scenario',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">AI Service Testing Dashboard</h1>
      <p className="text-gray-500 mb-8">
        This dashboard allows you to test the AI service fallback mechanism between Gemini and OpenAI
      </p>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="manual">Manual Test</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Tests</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual AI Service Test</CardTitle>
              <CardDescription>Customize which providers should fail and which operation to test</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Operation to Test</label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generateText">generateText</SelectItem>
                      <SelectItem value="generatePropertyDescription">generatePropertyDescription</SelectItem>
                      <SelectItem value="extractDocumentInfo">extractDocumentInfo</SelectItem>
                      <SelectItem value="analyzeDocument">analyzeDocument</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Failure Simulation</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="simulateGemini" 
                        checked={simulateGeminiFailure}
                        onChange={(e) => setSimulateGeminiFailure(e.target.checked)}
                        className="h-4 w-4 mr-2"
                      />
                      <label htmlFor="simulateGemini">Simulate Gemini Failure</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="simulateOpenAI" 
                        checked={simulateOpenAIFailure}
                        onChange={(e) => setSimulateOpenAIFailure(e.target.checked)}
                        className="h-4 w-4 mr-2"
                      />
                      <label htmlFor="simulateOpenAI">Simulate OpenAI Failure</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="simulateAll" 
                        checked={simulateAllFailures}
                        onChange={(e) => setSimulateAllFailures(e.target.checked)}
                        className="h-4 w-4 mr-2"
                      />
                      <label htmlFor="simulateAll">Simulate All Providers Failing</label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runTest} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : 'Run Test'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Scenario Tests</CardTitle>
              <CardDescription>Run predefined test scenarios to verify fallback behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Scenario</label>
                  <Select value={scenario} onValueChange={setScenario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-to-openai">Gemini Failure → OpenAI Fallback</SelectItem>
                      <SelectItem value="openai-failure">OpenAI Failure (Uses Gemini)</SelectItem>
                      <SelectItem value="all-fail">All Providers Fail</SelectItem>
                      <SelectItem value="normal">Normal Operation (No Failures)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Operation to Test</label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generateText">generateText</SelectItem>
                      <SelectItem value="generatePropertyDescription">generatePropertyDescription</SelectItem>
                      <SelectItem value="extractDocumentInfo">extractDocumentInfo</SelectItem>
                      <SelectItem value="analyzeDocument">analyzeDocument</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={runScenarioTest} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Scenario...
                  </>
                ) : 'Run Scenario Test'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>AI Service Test Results</CardTitle>
              <CardDescription>Detailed results from the last test execution</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">Status:</h3>
                    {testResults.success ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                        <Check className="w-4 h-4 mr-1" /> Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                        <X className="w-4 h-4 mr-1" /> Failed
                      </Badge>
                    )}
                  </div>
                  
                  {testResults.message && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Message:</h3>
                      <p className="text-gray-700">{testResults.message}</p>
                    </div>
                  )}
                  
                  {testResults.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <h3 className="text-lg text-red-700 font-semibold mb-2 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Error:
                      </h3>
                      <p className="text-red-700">{testResults.error}</p>
                    </div>
                  )}
                  
                  {testResults.operation && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Operation:</h3>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">{testResults.operation}</Badge>
                    </div>
                  )}
                  
                  {testResults.scenario && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Scenario:</h3>
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">{testResults.scenario}</Badge>
                    </div>
                  )}
                  
                  {testResults.providerStatus && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Provider Status:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(testResults.providerStatus).map(([provider, status]) => (
                          <div key={provider} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium capitalize">{provider}</span>
                            {status ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Unavailable</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {testResults.simulationSettings && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Simulation Settings:</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">Simulate Gemini Failure</span>
                          {testResults.simulationSettings.simulateGeminiFailure ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">Simulate OpenAI Failure</span>
                          {testResults.simulationSettings.simulateOpenAIFailure ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">Simulate All Failures</span>
                          {testResults.simulationSettings.simulateAllFailures ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {testResults.testResponse && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Test Response:</h3>
                      <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px] text-sm whitespace-pre-wrap">
                        {typeof testResults.testResponse === 'string' 
                          ? testResults.testResponse 
                          : JSON.stringify(testResults.testResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {testResults.result && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Result:</h3>
                      <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[300px] text-sm whitespace-pre-wrap">
                        {typeof testResults.result === 'string' 
                          ? testResults.result 
                          : JSON.stringify(testResults.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No test results available. Run a test first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}