import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Property } from '@shared/schema';

interface VoiceSearchProps {
  onSearchResults: (properties: Property[], searchParams: any) => void;
}

export function VoiceSearch({ onSearchResults }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [searchParams, setSearchParams] = useState<any>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Setup speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Search Unavailable",
        description: "Your browser doesn't support voice recognition. Try using Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-GB';
    
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setIsListening(false);
      searchMutation.mutate({ query: transcript });
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast({
        title: "Voice Recognition Error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive"
      });
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript('');
      setSearchParams(null);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsListening(true);
    }
  };
  
  const searchMutation = useMutation({
    mutationFn: async (data: { query: string }) => {
      const response = await apiRequest('POST', '/api/properties/voice-search', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchParams(data.extractedParams);
      onSearchResults(data.properties, data.extractedParams);
      toast({
        title: "Search Results Ready",
        description: `Found ${data.properties.length} properties matching your search.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to process your voice search. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleReset = () => {
    setTranscript('');
    setSearchParams(null);
  };
  
  // Format the search parameters for display
  const formatParamName = (param: string): string => {
    return param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1');
  };
  
  const formatParamValue = (param: string, value: any): string => {
    if (param === 'maxPrice' || param === 'minPrice') {
      return `£${value} per week`;
    }
    if (param === 'features' && Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };
  
  const generateSearchExample = () => {
    const examples = [
      "Find me a 3-bedroom house near University of Manchester with parking for less than £150 per week",
      "I'm looking for a studio flat in Leeds with bills included",
      "Show me properties in Birmingham with 4 bedrooms and en-suite bathrooms",
      "I need a furnished flat near University of Liverpool under £180 weekly",
      "Are there any shared houses in Nottingham with high-speed internet?"
    ];
    return examples[Math.floor(Math.random() * examples.length)];
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Voice Property Search
        </CardTitle>
        <CardDescription>
          Speak naturally to search for properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!transcript && !searchParams && (
          <Alert>
            <AlertTitle>Try saying something like:</AlertTitle>
            <AlertDescription className="italic text-muted-foreground">
              "{generateSearchExample()}"
            </AlertDescription>
          </Alert>
        )}
        
        {transcript && (
          <div className="rounded-md bg-muted p-3">
            <h3 className="text-sm font-medium mb-1">You said:</h3>
            <p className="text-sm">{transcript}</p>
          </div>
        )}
        
        {searchParams && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">We found these search criteria:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(searchParams).map(([param, value]) => (
                <Badge key={param} variant="outline" className="text-xs">
                  {formatParamName(param)}: {formatParamValue(param, value)}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-center pt-2">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className={`rounded-full w-16 h-16 ${isListening ? 'animate-pulse' : ''}`}
            disabled={searchMutation.isPending}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : searchMutation.isPending ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={!transcript && !searchParams}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button 
          onClick={() => searchMutation.mutate({ query: transcript })}
          disabled={!transcript || searchMutation.isPending || isListening}
        >
          {searchMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            'Search Again'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Add type definitions for browsers without TypeScript definitions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}