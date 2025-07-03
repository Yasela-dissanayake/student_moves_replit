import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Mic, MicOff, Loader2, Volume2, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';

// Define types for the Web Speech API since TypeScript doesn't include them
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceSearchProps {
  onClose?: () => void;
  className?: string;
}

export default function VoiceSearch({ onClose, className }: VoiceSearchProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [searchSuccess, setSearchSuccess] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  
  // Setup audio visualization
  useEffect(() => {
    if (isListening) {
      const setupAudioVisualization = async () => {
        try {
          // Get microphone access
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          microphoneStreamRef.current = stream;
          
          // Create audio context
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;
          
          // Create analyser
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
          
          // Connect microphone to analyser
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          
          // Setup audio level monitoring
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateAudioLevel = () => {
            if (analyserRef.current && isListening) {
              analyserRef.current.getByteFrequencyData(dataArray);
              
              // Calculate average volume
              let sum = 0;
              for (const amplitude of dataArray) {
                sum += amplitude;
              }
              const average = sum / dataArray.length;
              
              // Scale to 0-100 range
              setAudioLevel(Math.min(100, Math.max(0, average * 1.5)));
              
              requestAnimationFrame(updateAudioLevel);
            }
          };
          
          updateAudioLevel();
        } catch (err) {
          console.error('Failed to access microphone for visualization:', err);
        }
      };
      
      setupAudioVisualization();
    } else {
      // Clean up audio context when not listening
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      
      analyserRef.current = null;
      setAudioLevel(0);
    }
    
    return () => {
      // Clean up audio visualization
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [isListening]);
  
  // Set up speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Use the appropriate constructor
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || 
                                          (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      
      // Ensure we have a valid recognition object
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-GB';
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const currentTranscript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          
          setTranscript(currentTranscript);
        };
        
        recognitionRef.current.onerror = (event: SpeechRecognitionError) => {
          console.error('Speech recognition error', event.error);
          let errorMessage = 'Error with speech recognition. Please try again.';
          
          if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please speak louder or check your microphone.';
          } else if (event.error === 'audio-capture') {
            errorMessage = 'Unable to access your microphone. Please check your device permissions.';
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access is blocked. Please allow microphone permissions.';
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          if (isListening && recognitionRef.current) {
            // If we're supposed to be listening but recognition stopped, restart it
            recognitionRef.current.start();
          }
        };
      }
    } else {
      setError('Speech recognition is not supported in your browser.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        if (isListening) {
          recognitionRef.current.stop();
        }
      }
    };
  }, [isListening]);
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      setSearchSuccess(false);
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };
  
  const processVoiceCommand = async () => {
    if (!transcript.trim()) {
      setError('Please speak to search for properties.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/properties/voice-search', { transcript });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Extract the search response from the API result
      const searchResponse = data.searchResponse;
      
      if (!searchResponse) {
        throw new Error('Invalid response from voice search API');
      }
      
      setSearchSuccess(true);
      
      // Wait a moment before navigating to show success state
      setTimeout(() => {
        if (searchResponse.action === 'search') {
          // Navigate to properties page with search parameters
          if (searchResponse.searchParams) {
            const params = new URLSearchParams();
            Object.entries(searchResponse.searchParams).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                params.append(key, String(value));
              }
            });
            navigate(`/properties?${params.toString()}`);
          }
          
          toast({
            title: 'Search completed',
            description: searchResponse.resultCount 
              ? `Found ${searchResponse.resultCount} matching properties.` 
              : 'Processing your search.',
          });
        } else if (searchResponse.action === 'navigate' && searchResponse.path) {
          // Direct navigation
          navigate(searchResponse.path);
          toast({
            title: 'Navigating',
            description: searchResponse.message,
          });
        } else {
          // Display the response for informational commands
          toast({
            title: 'Voice command processed',
            description: searchResponse.message,
          });
        }
        
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Error processing voice command:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your request.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to process your request.',
      });
    } finally {
      setIsProcessing(false);
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }
  };
  
  const examples = [
    "Find student houses in Leeds with 3 bedrooms",
    "Show me properties near University of Manchester",
    "I need a furnished flat with all bills included",
    "Houses with garden under £400 per week",
    "Show me exactly 4 bedroom properties in Leeds",
    "I want exactly 5 bedroom houses",
    "Find exactly 3 bedroom flats with bills included"
  ];
  
  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg ${className}`}>
      <CardContent className="p-6 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Voice Search</h2>
          {isListening && (
            <Badge variant="outline" className="bg-red-100 text-red-700 animate-pulse">
              <Volume2 className="w-3 h-3 mr-1" /> Listening...
            </Badge>
          )}
        </div>
        
        {/* Audio level visualization */}
        {isListening && (
          <div className="mb-3">
            <Progress value={audioLevel} className="h-2" />
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className={`mb-6 min-h-[100px] ${searchSuccess ? 'bg-green-50' : 'bg-gray-50'} rounded-md p-4 relative transition-colors duration-300`}>
          {searchSuccess ? (
            <div className="flex items-center text-green-700">
              <Check className="w-6 h-6 mr-2" />
              <p>Search processed successfully!</p>
            </div>
          ) : transcript ? (
            <p className="text-gray-700">{transcript}</p>
          ) : (
            <div className="text-gray-400 space-y-1">
              <p>
                {isListening ? "Speak now..." : "Press the microphone button and speak your property search criteria"}
              </p>
              {isListening && (
                <p className="text-xs">
                  Speaking clearly will improve results. You can also try one of the example phrases below.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className={`w-14 h-14 rounded-full flex items-center justify-center p-0 ${isListening ? 'animate-pulse' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing || searchSuccess}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
          
          <Button 
            className="flex-1"
            disabled={!transcript || isProcessing || searchSuccess}
            onClick={processVoiceCommand}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : searchSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Success
              </>
            ) : (
              <>
                Search Properties
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0 border-t-0">
        <div className="w-full">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Try saying:</h3>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <Badge 
                key={index} 
                variant={example.includes("exactly") ? "outline" : "secondary"}
                className={`cursor-pointer text-xs ${example.includes("exactly") ? "bg-primary/20 font-medium border-primary/30" : ""}`}
                onClick={() => {
                  setTranscript(example);
                  setSearchSuccess(false);
                  setError(null);
                }}
              >
                {example.includes("exactly") && <span className="mr-1 text-primary font-bold">New!</span>}
                "{example}"
              </Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

// TypeScript needs these type declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}