import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OpenAIIntegrationTest from '@/components/OpenAIIntegrationTest';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

const OpenAITestPage = () => {
  const [isMockMode, setIsMockMode] = useState(false);
  
  // Check if we're using the mock implementation when the component mounts
  useEffect(() => {
    const checkMockStatus = async () => {
      try {
        const response = await fetch('/api/openai/status');
        const data = await response.json();
        setIsMockMode(data.usingMock === true);
      } catch (error) {
        console.error("Error checking OpenAI mock status:", error);
      }
    };
    
    checkMockStatus();
  }, []);
  
  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-4">
        <Link href="/admin/test-ai-service">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to AI Service Tests
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">OpenAI Integration Test</h1>
            {isMockMode && (
              <Badge variant="outline" className="text-amber-600 border-amber-600 font-semibold">
                MOCK IMPLEMENTATION
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            {isMockMode 
              ? "Test AI capabilities without using OpenAI API credits. All responses are generated locally."
              : "Configure and test the OpenAI integration for AI-powered features."}
          </p>
        </div>
        
        <div className="grid gap-8">
          <OpenAIIntegrationTest />
        </div>
      </div>
    </div>
  );
};

export default OpenAITestPage;