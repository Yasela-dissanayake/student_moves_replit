import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface SuggestedAction {
  action: string;
  description: string;
}

export interface AssistantResponse {
  response: string;
  relevant_links?: string[];
  maintenance_suggested?: boolean;
  suggested_actions?: SuggestedAction[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export function useVirtualAssistant(propertyId?: number) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch FAQs
  const { data: faqs } = useQuery<FAQ[]>({
    queryKey: ['/api/assistant/faq'],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Send query to assistant
  const assistantMutation = useMutation({
    mutationFn: async (question: string) => {
      // Add user message to the conversation
      const conversationHistory = messages.slice(-6); // Only include the last 6 messages for context
      
      const response = await apiRequest('POST', '/api/assistant/query', {
        question,
        propertyId,
        conversation: conversationHistory,
      });
      
      return response.json() as Promise<AssistantResponse>;
    },
    onMutate: (question) => {
      // Add user message immediately to UI
      const newUserMessage: AssistantMessage = {
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newUserMessage]);
    },
    onSuccess: (data) => {
      // Add assistant response to messages
      const newAssistantMessage: AssistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newAssistantMessage]);
      
      // Invalidate queries if maintenance was suggested
      if (data.maintenance_suggested) {
        queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      }
    },
    onError: (error) => {
      console.error('Assistant query failed:', error);
      toast({
        title: 'Assistant Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      });
      
      // Add error message to conversation
      const errorMessage: AssistantMessage = {
        role: 'assistant',
        content: 'I apologize, but I was unable to process your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const sendMessage = useCallback((question: string) => {
    assistantMutation.mutate(question);
  }, [assistantMutation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: assistantMutation.isPending,
    faqs,
    isOpen,
    toggleAssistant,
  };
}