import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  Loader2, 
  Link as LinkIcon, 
  ExternalLink,
  RefreshCcw,
  Info,
  ArrowUp,
  BookOpen,
  PanelLeft,
  MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantResponse {
  answer: string;
  relatedTopics: string[];
  sources: string[];
}

interface ConversationProps {
  messages: Message[];
  isLoading: boolean;
  onScrollBottom: () => void;
}

const Conversation = ({ messages, isLoading, onScrollBottom }: ConversationProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      onScrollBottom();
    }
  }, [messages, isLoading, onScrollBottom]);
  
  return (
    <ScrollArea ref={scrollRef} className="h-[400px] pr-4">
      <div className="space-y-4 pt-4 pb-1">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                {message.role === 'user' ? (
                  <AvatarFallback>U</AvatarFallback>
                ) : (
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8 bg-muted">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">UniRent Assistant is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export function VirtualAssistant() {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your UniRent Assistant. How can I help you with your student accommodation needs today?'
    }
  ]);
  const [showRelatedTopics, setShowRelatedTopics] = useState<string[]>([]);
  const [showSources, setShowSources] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // API call for virtual assistant response
  const assistantMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/tenant/virtual-assistant', {
        query,
        conversationHistory: messages
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.response) {
        const assistantResponse = data.response as AssistantResponse;
        
        // Add assistant response to messages
        setMessages([
          ...messages,
          { role: 'user', content: input },
          { role: 'assistant', content: assistantResponse.answer }
        ]);
        
        // Update related topics and sources
        setShowRelatedTopics(assistantResponse.relatedTopics || []);
        setShowSources(assistantResponse.sources || []);
      } else {
        toast({
          title: "Response failed",
          description: "Failed to get a response. Please try asking differently.",
          variant: "destructive"
        });
        
        // Add error message
        setMessages([
          ...messages,
          { role: 'user', content: input },
          { 
            role: 'assistant', 
            content: "I'm sorry, I'm having trouble understanding that question. Could you try rephrasing it or asking something else about student accommodation?"
          }
        ]);
      }
      
      // Clear input field
      setInput('');
    },
    onError: (error: any) => {
      toast({
        title: "Response failed",
        description: error.message || "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      setMessages([
        ...messages,
        { role: 'user', content: input },
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error processing your request. Please try again in a moment."
        }
      ]);
      
      // Clear input field
      setInput('');
    }
  });
  
  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    assistantMutation.mutate(input);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleScroll = () => {
    // Additional scroll handling logic can be added here if needed
  };
  
  const handleClickTopic = (topic: string) => {
    setInput(topic);
  };
  
  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your UniRent Assistant. How can I help you with your student accommodation needs today?'
      }
    ]);
    setShowRelatedTopics([]);
    setShowSources([]);
    setInput('');
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Virtual Assistant
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Get answers to your questions about student accommodation and housing in the UK
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex space-x-4">
          <div className={`flex-1 ${!sidebarOpen ? 'w-full' : ''}`}>
            <Conversation 
              messages={messages} 
              isLoading={assistantMutation.isPending} 
              onScrollBottom={handleScroll}
            />
            
            <div className="flex items-center space-x-2 mt-4">
              <Input
                placeholder="Ask about student housing, tenancy agreements, etc..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={assistantMutation.isPending}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={input.trim() === '' || assistantMutation.isPending}
                size="icon"
              >
                {assistantMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {sidebarOpen && (
            <div className="w-64 border-l pl-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Related Topics
                  </h4>
                  {showRelatedTopics.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {showRelatedTopics.map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => handleClickTopic(topic)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Related topics will appear here as you chat
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    Sources
                  </h4>
                  {showSources.length > 0 ? (
                    <ul className="space-y-1">
                      {showSources.map((source, index) => (
                        <li key={index} className="text-xs flex items-center gap-1 text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          <span>{source}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sources will appear here as you chat
                    </p>
                  )}
                </div>
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    Suggested Questions
                  </h4>
                  <ul className="space-y-2">
                    <li>
                      <Button 
                        variant="ghost" 
                        className="text-xs w-full justify-start h-auto py-1.5 px-2"
                        onClick={() => setInput("What are my rights as a student tenant?")}
                      >
                        <ArrowUp className="h-3 w-3 mr-2 rotate-45" />
                        What are my rights as a student tenant?
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="text-xs w-full justify-start h-auto py-1.5 px-2"
                        onClick={() => setInput("How does the deposit protection scheme work?")}
                      >
                        <ArrowUp className="h-3 w-3 mr-2 rotate-45" />
                        How does the deposit protection scheme work?
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="text-xs w-full justify-start h-auto py-1.5 px-2"
                        onClick={() => setInput("What should I check before signing a tenancy agreement?")}
                      >
                        <ArrowUp className="h-3 w-3 mr-2 rotate-45" />
                        What should I check before signing a tenancy agreement?
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="ghost" 
                        className="text-xs w-full justify-start h-auto py-1.5 px-2"
                        onClick={() => setInput("Am I exempt from council tax as a student?")}
                      >
                        <ArrowUp className="h-3 w-3 mr-2 rotate-45" />
                        Am I exempt from council tax as a student?
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={handleReset} size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
        
        <Button variant="ghost" size="sm" asChild>
          <a href="https://www.gov.uk/private-renting" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            UK Renting Guide
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}