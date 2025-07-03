import React, { useRef, useEffect, useState } from 'react';
import { 
  MessageCircle, 
  X, 
  ChevronUp, 
  Send, 
  Loader2, 
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVirtualAssistant, type AssistantMessage, type FAQ } from '@/hooks/use-virtual-assistant';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';

interface VirtualAssistantProps {
  propertyId?: number;
}

export function VirtualAssistant({ propertyId }: VirtualAssistantProps) {
  const { isOpen, toggleAssistant, messages, sendMessage, clearMessages, isLoading, faqs } = useVirtualAssistant(propertyId);
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
  const [, navigate] = useLocation();

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when assistant is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      sendMessage(question);
      setQuestion('');
    }
  };

  const handleFaqClick = (faq: FAQ) => {
    sendMessage(faq.question);
    setActiveTab('chat');
  };

  const handleLinkClick = (link: string) => {
    const [, path] = link.split('|');
    if (path) {
      navigate(path);
    }
  };

  // Extract links and actions from the last assistant message
  const lastAssistantMessage = messages.findLast(msg => msg.role === 'assistant');
  const relevantLinks: string[] = [];
  const suggestedActions: Array<{ action: string; description: string }> = [];

  // Try to parse the message to extract links and actions
  if (lastAssistantMessage) {
    try {
      // Check for JSON format with links and actions
      const jsonMatch = lastAssistantMessage.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        if (jsonData.relevant_links) {
          relevantLinks.push(...jsonData.relevant_links);
        }
        if (jsonData.suggested_actions) {
          suggestedActions.push(...jsonData.suggested_actions);
        }
      }
    } catch (error) {
      // If JSON parsing fails, check for formatted links in text
      const linkMatches = lastAssistantMessage.content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (linkMatches) {
        linkMatches.forEach(match => {
          const parts = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (parts && parts.length === 3) {
            relevantLinks.push(`${parts[1]}|${parts[2]}`);
          }
        });
      }
    }
  }

  return (
    <>
      {/* Floating button to toggle assistant */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleAssistant}
          className="h-12 w-12 rounded-full shadow-lg"
          variant="default"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Assistant dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-full max-w-sm"
          >
            <Card className="border shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/logo.png" alt="StudentMoves Assistant" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg font-medium">StudentMoves Assistant</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={clearMessages} 
                      title="New conversation"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={toggleAssistant}
                      title="Minimize"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <Tabs 
                value={activeTab} 
                onValueChange={(val) => setActiveTab(val as 'chat' | 'faq')} 
                className="w-full"
              >
                <div className="px-4">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="faq">FAQs</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="chat" className="mt-0">
                  <CardContent className="px-4 pt-2 pb-3">
                    <div className="h-80 overflow-y-auto pr-2">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-500">
                          <HelpCircle className="h-12 w-12 opacity-20" />
                          <div>
                            <p className="font-medium">How can I help you today?</p>
                            <p className="text-sm">Ask me anything about your accommodation.</p>
                          </div>
                          {faqs && faqs.length > 0 && (
                            <div className="w-full max-w-xs mt-4">
                              <p className="text-sm font-medium mb-2">Try asking:</p>
                              <div className="space-y-1">
                                {faqs.slice(0, 3).map((faq, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-left h-auto py-1.5 font-normal text-xs"
                                    onClick={() => handleFaqClick(faq)}
                                  >
                                    {faq.question}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[80%] px-3 py-2 rounded-lg ${
                                  msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                {msg.timestamp && (
                                  <div className="text-xs opacity-70 mt-1 text-right">
                                    {msg.timestamp.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Display relevant links and actions */}
                          {(relevantLinks.length > 0 || suggestedActions.length > 0) && (
                            <div className="pl-2 space-y-3">
                              {relevantLinks.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500">Relevant Links:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {relevantLinks.map((link, i) => {
                                      const [label, path] = link.split('|');
                                      return (
                                        <Button
                                          key={i}
                                          variant="outline"
                                          size="sm"
                                          className="h-7 text-xs"
                                          onClick={() => handleLinkClick(link)}
                                        >
                                          {label} <ExternalLink className="ml-1 h-3 w-3" />
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {suggestedActions.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-500">Suggested Actions:</p>
                                  <div className="space-y-1">
                                    {suggestedActions.map((action, i) => (
                                      <div key={i} className="text-xs p-2 bg-gray-100 rounded-md">
                                        <p className="font-medium">{action.action}</p>
                                        <p className="text-gray-600">{action.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {isLoading && (
                            <div className="flex justify-start">
                              <div className="bg-muted px-3 py-2 rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <Separator />

                  <CardFooter className="p-3">
                    <form onSubmit={handleSendMessage} className="w-full flex space-x-2">
                      <Input
                        placeholder="Ask a question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="flex-1"
                        ref={inputRef}
                        disabled={isLoading}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!question.trim() || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </CardFooter>
                </TabsContent>
                
                <TabsContent value="faq" className="mt-0">
                  <CardContent className="px-4 py-2">
                    <div className="h-80 overflow-y-auto space-y-3 pr-2">
                      {!faqs ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : faqs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No FAQs available at the moment.
                        </div>
                      ) : (
                        faqs.map((faq, i) => (
                          <div
                            key={i}
                            className="bg-muted rounded-lg p-3 cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => handleFaqClick(faq)}
                          >
                            <p className="font-medium mb-1">{faq.question}</p>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default VirtualAssistant;