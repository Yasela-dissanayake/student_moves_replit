import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Bot, User, Sparkles, AlertCircle, Code, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  generatedCode?: string;
  implementationSteps?: string[];
}

interface ParsedMessage {
  text: string;
  codeBlocks: {
    language: string;
    code: string;
  }[];
}

interface AIWebsiteBuilderChatProps {
  onFeatureGenerated?: (feature: { name: string; description: string; implementation: { generatedCode: string; implementationSteps: string[] } }) => void;
}

/**
 * AIWebsiteBuilderChat Component
 * 
 * This component provides a chat interface for interacting with the AI website builder.
 * Users can describe features they want to build in natural language, and the AI will
 * respond with implementation details through conversation.
 */
export function AIWebsiteBuilderChat({ onFeatureGenerated }: AIWebsiteBuilderChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI website builder assistant. Describe the feature you want to build, and I'll help you implement it. You can ask me to create new components, add functionality, or enhance existing features.",
      timestamp: new Date(),
      status: "sent"
    }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState<{[key: string]: boolean}>({});
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Parse message content to separate text and code blocks
  const parseMessage = (content: string): ParsedMessage => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks: { language: string; code: string }[] = [];
    
    // Replace code blocks with placeholders and collect them
    const textWithoutCode = content.replace(codeBlockRegex, (match, language, code) => {
      codeBlocks.push({
        language: language || 'typescript',
        code: code.trim()
      });
      return `[CODE_BLOCK_${codeBlocks.length - 1}]`;
    });
    
    return { text: textWithoutCode, codeBlocks };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    
    // Add a loading message temporarily
    const loadingMessageId = Date.now().toString() + '-loading';
    setMessages(prev => [
      ...prev,
      {
        id: loadingMessageId,
        role: 'assistant',
        content: 'Thinking...',
        timestamp: new Date(),
        status: 'sending'
      }
    ]);
    
    try {
      // Prepare context from previous messages
      const context = messages
        .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.id !== 'welcome'))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the new user message
      context.push({
        role: 'user',
        content: input
      });
      
      // Make API call to backend with conversation context
      const response = await fetch("/api/website-builder/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: context,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get a response");
      }
      
      const data = await response.json();
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      // Check if the response contains generated code
      const generatedCode = data.generatedCode || null;
      const implementationSteps = data.implementationSteps || null;
      
      // Add the assistant's response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        status: 'sent',
        generatedCode,
        implementationSteps
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If code was generated and there's a callback, call it
      if (generatedCode && implementationSteps && onFeatureGenerated) {
        // Try to extract feature name and description from conversation
        const featureName = extractFeatureName(context);
        const featureDescription = input;
        
        onFeatureGenerated({
          name: featureName,
          description: featureDescription,
          implementation: {
            generatedCode,
            implementationSteps
          }
        });
        
        toast({
          title: "Feature generated successfully",
          description: "Your AI-powered feature implementation is ready.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error in chat:", error);
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I encountered an error: ${error.message || "Something went wrong"}. Please try again or rephrase your request.`,
          timestamp: new Date(),
          status: 'error'
        }
      ]);
      
      toast({
        title: "Error",
        description: error.message || "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Extract a feature name from conversation context
  const extractFeatureName = (context: Array<{role: string, content: string}>): string => {
    // Try to find explicit mentions of feature names
    const namePattern = /(?:feature|component|functionality|module|system)\s+(?:called|named)\s+["']?([\w\s-]+)["']?/i;
    
    for (const message of context.filter(msg => msg.role === 'user')) {
      const match = message.content.match(namePattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: take the first few words of the latest user message
    const latestUserMessage = [...context].reverse().find(msg => msg.role === 'user')?.content;
    if (latestUserMessage) {
      const words = latestUserMessage.split(/\s+/).filter(word => word.length > 2);
      const shortName = words.slice(0, 3).join(" ");
      return shortName.length > 5 ? shortName : "New Feature";
    }
    
    return "New Feature";
  };
  
  // Function to copy code to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(prev => ({ ...prev, [id]: true }));
    
    setTimeout(() => {
      setIsCopied(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Messages Container */}
      <ScrollArea className="flex-1 px-4 py-4 overflow-y-auto" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const parsedMessage = parseMessage(message.content);
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.status === "error"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-muted"
                  )}
                >
                  {message.status === "sending" ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm opacity-70">{message.content}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Split text by code block placeholders */}
                      {parsedMessage.text.split(/\[CODE_BLOCK_(\d+)\]/).map((part, index) => {
                        // Even indices are text, odd indices are code block references
                        if (index % 2 === 0) {
                          return part ? (
                            <p key={`text-${index}`} className="text-sm whitespace-pre-wrap">
                              {part}
                            </p>
                          ) : null;
                        } else {
                          const blockIndex = parseInt(part, 10);
                          const codeBlock = parsedMessage.codeBlocks[blockIndex];
                          
                          return (
                            <div key={`code-${index}`} className="relative">
                              <div className="absolute right-2 top-2 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 bg-background/50 hover:bg-background/80"
                                  onClick={() => copyToClipboard(codeBlock.code, `${message.id}-${index}`)}
                                >
                                  {isCopied[`${message.id}-${index}`] ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <SyntaxHighlighter
                                language={codeBlock.language}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                }}
                                showLineNumbers
                              >
                                {codeBlock.code}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                      })}
                      
                      {/* Show generated code separately if available */}
                      {message.generatedCode && !message.content.includes("```") && (
                        <Card className="mt-2 border-primary/20">
                          <CardContent className="p-3 pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Code className="h-3 w-3" />
                                <span>Generated Implementation</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(message.generatedCode!, `${message.id}-full-code`)}
                              >
                                {isCopied[`${message.id}-full-code`] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {message.implementationSteps && message.implementationSteps.length > 0 && (
                                <p className="mb-1">{message.implementationSteps.length} implementation steps available</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs gap-1 h-7"
                              onClick={() => {
                                if (message.generatedCode && message.implementationSteps && onFeatureGenerated) {
                                  const featureName = extractFeatureName(
                                    messages
                                      .filter(m => m.id !== "welcome")
                                      .map(m => ({ role: m.role, content: m.content }))
                                  );
                                  
                                  onFeatureGenerated({
                                    name: featureName,
                                    description: messages.find(m => m.role === 'user')?.content || "",
                                    implementation: {
                                      generatedCode: message.generatedCode,
                                      implementationSteps: message.implementationSteps
                                    }
                                  });
                                  
                                  toast({
                                    title: "Feature ready for implementation",
                                    description: "View the implementation details in the feature history tab.",
                                  });
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                              Use This Implementation
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>
      
      {/* Input Form */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the feature you want to build..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !input.trim()} className="h-auto">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>
            Tip: Be specific about what you want to build. You can ask for UI components, API endpoints, or complete features.
          </span>
        </div>
      </div>
    </div>
  );
}