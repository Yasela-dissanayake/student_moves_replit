import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image, MessageSquare, Sparkles, Braces, CheckCircle } from "lucide-react";
import { 
  customOpenaiCompletions, 
  customOpenaiChatCompletions, 
  customOpenaiImageGeneration, 
  customOpenaiEmbeddings, 
  getCustomOpenaiStatus,
  getCustomOpenaiModels
} from '@/lib/api';

export default function CustomAI() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{status: string, message: string} | null>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  // Check service status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Get service status
        const statusResponse = await getCustomOpenaiStatus();
        if (statusResponse) {
          setServiceStatus({
            status: statusResponse.status || 'unavailable',
            message: statusResponse.message || 'Custom AI service status unknown'
          });
        }
        
        // Get available models
        const modelsResponse = await getCustomOpenaiModels();
        if (modelsResponse && modelsResponse.data) {
          setAvailableModels(modelsResponse.data);
        }
      } catch (err) {
        console.error("Failed to check service status:", err);
        setServiceStatus({
          status: 'unavailable',
          message: 'Error connecting to AI service'
        });
      }
    };
    
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let data;

      switch (activeTab) {
        case 'text':
          data = await customOpenaiCompletions({
            model: 'custom-davinci-003',
            prompt,
            max_tokens: 250,
            temperature: 0.7
          });
          break;
        case 'chat':
          data = await customOpenaiChatCompletions({
            model: 'custom-gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant for a property rental platform.' },
              { role: 'user', content: prompt }
            ]
          });
          break;
        case 'image':
          data = await customOpenaiImageGeneration({
            prompt,
            n: 1,
            size: '1024x1024'
          });
          break;
        case 'embedding':
          data = await customOpenaiEmbeddings({
            model: 'custom-embedding-ada-002',
            input: prompt
          });
          break;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    switch (activeTab) {
      case 'text':
        return (
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md mt-4">
            {result.choices?.[0]?.text || 'No text generated'}
          </div>
        );
      case 'chat':
        return (
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md mt-4">
            {result.choices?.[0]?.message?.content || 'No message generated'}
          </div>
        );
      case 'image':
        return (
          <div className="mt-4">
            {result.data?.[0]?.url ? (
              <img 
                src={result.data[0].url} 
                alt="Generated image" 
                className="max-w-full h-auto rounded-md"
              />
            ) : (
              'No image generated'
            )}
          </div>
        );
      case 'embedding':
        return (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Embedding Vector (first 10 values):</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              <code>
                {result.data?.[0]?.embedding 
                  ? JSON.stringify(result.data[0].embedding.slice(0, 10)) + '...'
                  : 'No embedding generated'}
              </code>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Vector dimension: {result.data?.[0]?.embedding?.length || 0}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom AI Service</CardTitle>
            <CardDescription>Free, subscription-free AI generation with no external API dependencies</CardDescription>
          </div>
          {serviceStatus && (
            <div className="flex items-center text-sm">
              <div className={`flex items-center ${serviceStatus.status === 'available' ? 'text-green-600' : 'text-amber-600'}`}>
                {serviceStatus.status === 'available' ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                <span>{serviceStatus.status === 'available' ? 'Ready' : 'Initializing'}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {availableModels.length > 0 && (
          <div className="mb-4 bg-gray-50 p-3 rounded-md">
            <p className="text-xs font-medium text-gray-500 mb-1">Available Models:</p>
            <div className="flex flex-wrap gap-2">
              {availableModels.map((model: any) => (
                <div key={model.id} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                  {model.id}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Text
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="h-4 w-4" /> Image
            </TabsTrigger>
            <TabsTrigger value="embedding" className="flex items-center gap-1">
              <Braces className="h-4 w-4" /> Embedding
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {activeTab === 'image' ? 'Image Description' : 'Prompt'}
                </label>
                {activeTab === 'text' || activeTab === 'chat' ? (
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      activeTab === 'text'
                        ? 'Generate a description for a 2-bedroom apartment...'
                        : 'Can you help me find a student apartment near University College London?'
                    }
                    className="min-h-[100px]"
                  />
                ) : (
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      activeTab === 'image'
                        ? 'A modern student apartment in London with a view of the city'
                        : 'Text to convert to vector embedding'
                    }
                  />
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || !prompt.trim() || serviceStatus?.status !== 'available'} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Generate ${activeTab === 'image' ? 'Image' : activeTab === 'embedding' ? 'Embedding' : 'Response'}`
                )}
              </Button>
            </div>
          </form>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            Error: {error}
          </div>
        )}

        {renderResult()}
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between w-full">
          <div>No subscription required</div>
          <div>All processing done locally</div>
        </div>
        {serviceStatus?.message && (
          <div className="text-xs text-gray-600 italic">{serviceStatus.message}</div>
        )}
      </CardFooter>
    </Card>
  );
}