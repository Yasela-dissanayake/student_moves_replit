import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Folder, Send, Code, Search, File, PlayCircle, 
  AlertCircle, BookOpen, Layers, RefreshCcw, Info 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessage } from "./ChatMessage";
import { CodeBlock } from "./CodeBlock";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface FileInfo {
  path: string;
  content: string;
  language: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  code: string;
  previewImage?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  dependencies?: string[];
}

export function EnhancedWebsiteBuilder() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isImplementDialogOpen, setIsImplementDialogOpen] = useState(false);
  const [implementationData, setImplementationData] = useState<{
    code: string;
    language: string;
    path?: string;
  } | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<FileInfo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateCategories, setTemplateCategories] = useState<string[]>([]);
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [searchTags, setSearchTags] = useState<string>("");
  const [templateMetadata, setTemplateMetadata] = useState<any>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [suggestedTemplates, setSuggestedTemplates] = useState<{templateId: string, score: number, reason: string}[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send first message if chat is empty
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        role: "assistant",
        content: "Welcome to UniRent WebCraft! I'm your AI assistant for website development. What would you like to build or modify today? You can ask me to:\n\n" +
          "- Develop new features\n" + 
          "- Find and explain existing code\n" + 
          "- Suggest improvements to your current implementation\n" + 
          "- Debug issues in your code\n\n" +
          "Just describe what you need in natural language, and I'll help you implement it!",
        createdAt: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, []);
  
  // Fetch templates from the API
  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      // Build query parameters based on selected filters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedComplexity !== 'all') {
        params.append('complexity', selectedComplexity);
      }
      if (searchTags) {
        params.append('tags', searchTags);
      }
      // Always request metadata for UI enhancements
      params.append('includeMetadata', 'true');
      
      const url = `/api/enhanced-website-builder/templates?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      
      const data = await response.json();
      setTemplates(data.templates || []);
      
      // Handle metadata if included
      if (data.metadata) {
        setTemplateMetadata(data.metadata);
        setTemplateCategories(data.metadata.categories || []);
        setTemplateTags(data.metadata.allTags || []);
      } else {
        // Fallback to extracting categories directly from templates
        const categories = [...new Set(data.templates.map((t: Template) => t.category))];
        setTemplateCategories(categories as string[]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Templates error",
        description: "Failed to load component templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  // Fetch personalized template suggestions based on user behavior
  const fetchSuggestedTemplates = async () => {
    setIsSuggestionsLoading(true);
    try {
      // Build query parameters for personalized suggestions
      const params = new URLSearchParams();
      params.append('limit', '4'); // Request 4 suggested templates
      params.append('includeComplexity', 'true');
      params.append('includeCategories', 'true');
      params.append('includeTags', 'true');
      
      const url = `/api/website-builder/suggestions?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch template suggestions");
      }
      
      const data = await response.json();
      setSuggestedTemplates(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching template suggestions:", error);
      // Silent failure - we'll just not show suggestions
      setSuggestedTemplates([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };
  
  // Fetch templates when templates tab is activated
  useEffect(() => {
    if (activeTab === "templates") {
      if (templates.length === 0) {
        fetchTemplates();
      }
      // Fetch personalized template suggestions
      fetchSuggestedTemplates();
    }
  }, [activeTab, templates.length]);
  
  // Add click outside handler to close tag suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTagSuggestions) {
        const target = event.target as HTMLElement;
        // Check if the click is outside the tag input and suggestions
        if (!target.closest('#template-tags') && !target.closest('.tag-suggestions')) {
          setShowTagSuggestions(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagSuggestions]);

  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: userPrompt,
      createdAt: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setUserPrompt("");
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, loadingMessage]);

    try {
      // Send request to API
      const response = await fetch("/api/enhanced-website-builder/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userPrompt,
          conversation: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();

      // Replace loading message with assistant response
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages.pop(); // Remove loading message

        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          createdAt: new Date(),
        };
        return [...updatedMessages, assistantMessage];
      });

      // If code files were generated, store them
      if (data.codeFiles && data.codeFiles.length > 0) {
        setGeneratedFiles(data.codeFiles);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Replace loading message with error message
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages.pop(); // Remove loading message

        const errorMessage: Message = {
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
          createdAt: new Date(),
        };
        return [...updatedMessages, errorMessage];
      });

      toast({
        title: "An error occurred",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImplementCode = async (code: string, language: string) => {
    setImplementationData({ code, language });
    setIsImplementDialogOpen(true);
  };

  const handleImplementationConfirm = async () => {
    if (!implementationData) return;

    const { code, language, path } = implementationData;
    setIsLoading(true);
    setIsImplementDialogOpen(false);

    try {
      const response = await fetch("/api/enhanced-website-builder/implement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          path: path || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to implement code");
      }

      const data = await response.json();

      // Add implementation message to chat
      const implementationMessage: Message = {
        role: "assistant",
        content: `✅ Code implemented successfully at \`${data.path}\`${data.message ? `\n\n${data.message}` : ""}`,
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, implementationMessage]);

      // Add new file to generated files if applicable
      if (data.files && data.files.length > 0) {
        const newFile: FileInfo = data.files[0];
        setGeneratedFiles((prev) => [...prev, newFile]);
      }

      toast({
        title: "Code implemented",
        description: `The code has been implemented at ${data.path}`,
      });
    } catch (error) {
      console.error("Error implementing code:", error);
      
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error while implementing the code. Please try again.",
        createdAt: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);

      toast({
        title: "An error occurred",
        description: "Failed to implement code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setImplementationData(null);
    }
  };

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    setIsFileDialogOpen(true);
  };

  const handleSearchCodebase = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/enhanced-website-builder/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search codebase");
      }

      const data = await response.json();
      
      setSearchResults(data.files || []);
      
      // Add search results message to chat
      if (activeTab === "chat") {
        const searchMessage: Message = {
          role: "assistant",
          content: `I searched the codebase for "${searchQuery}" and found ${data.files.length} results.${
            data.files.length > 0 
              ? "\n\nHere are the most relevant files:\n" + 
                data.files.slice(0, 5).map((file: FileInfo) => `- \`${file.path}\``).join("\n")
              : ""
          }`,
          createdAt: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, searchMessage]);
      }
    } catch (error) {
      console.error("Error searching codebase:", error);
      
      if (activeTab === "chat") {
        const noFilesMessage: Message = {
          role: "assistant",
          content: `I'm sorry, I encountered an error while searching the codebase. Please try again.`,
          createdAt: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, noFilesMessage]);
      }

      toast({
        title: "Search failed",
        description: "Failed to search the codebase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-120px)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
        <div className="flex items-center p-2 border-b">
          <TabsList>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>Generated Files</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search Codebase</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col h-full px-4 space-y-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                  onImplementCode={handleImplementCode}
                  isLoading={isLoading && index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-2">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message here..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                className="self-end"
                disabled={isLoading || !userPrompt.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="w-full h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {generatedFiles.length > 0 ? (
              generatedFiles.map((file, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleFileSelect(file)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <p className="font-medium text-sm truncate" title={file.path}>
                          {file.path.split("/").pop()}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.path}
                        </p>
                        <div className="text-xs px-1.5 py-0.5 rounded bg-muted inline-block">
                          {file.language}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No files generated yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-2">
                  Use the chat to ask the AI to generate code for you. The files generated will appear here.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="w-full h-full flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b">
            <Input
              placeholder="Search codebase (e.g., 'user authentication', 'database schema')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchCodebase();
                }
              }}
            />
            <Button 
              onClick={handleSearchCodebase} 
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {searchResults.length > 0 ? (
                searchResults.map((file, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleFileSelect(file)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <p className="font-medium text-sm truncate" title={file.path}>
                            {file.path.split("/").pop()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {file.path}
                          </p>
                          <div className="text-xs px-1.5 py-0.5 rounded bg-muted inline-block">
                            {file.language}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  {isSearching ? (
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="sr-only">Loading...</span>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">Searching codebase...</p>
                    </div>
                  ) : (
                    <>
                      <Search className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No search results</h3>
                      <p className="text-sm text-muted-foreground max-w-md mt-2">
                        Enter a search term and click 'Search' to find code in the codebase.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="w-full h-full flex flex-col">
          <div className="flex flex-col p-4 border-b space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="template-category" className="text-sm">Category:</Label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    fetchTemplates();
                  }}
                >
                  <SelectTrigger className="w-[180px]" id="template-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {templateCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="template-complexity" className="text-sm">Complexity:</Label>
                <Select 
                  value={selectedComplexity} 
                  onValueChange={(value) => {
                    setSelectedComplexity(value);
                    fetchTemplates();
                  }}
                >
                  <SelectTrigger className="w-[180px]" id="template-complexity">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="template-tags" className="text-sm">Tags:</Label>
                <div className="relative w-[220px]">
                  <Input
                    id="template-tags"
                    placeholder="e.g., form, table, responsive"
                    value={searchTags}
                    onChange={(e) => setSearchTags(e.target.value)}
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        fetchTemplates();
                      }
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                  />
                  
                  {/* Tag suggestions popover */}
                  {showTagSuggestions && templateTags.length > 0 && (
                    <div 
                      className="absolute w-full mt-1 max-h-[200px] overflow-y-auto z-10 bg-background rounded-md border shadow-md tag-suggestions" 
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="p-2 text-xs text-muted-foreground border-b">
                        Click a tag to add it
                      </div>
                      <div className="p-2 flex flex-wrap gap-1">
                        {templateTags
                          .filter(tag => !searchTags.includes(tag))
                          .slice(0, 20)
                          .map(tag => (
                            <Badge 
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => {
                                const newTags = searchTags ? `${searchTags},${tag}` : tag;
                                setSearchTags(newTags);
                              }}
                            >
                              {tag}
                            </Badge>
                          ))
                        }
                      </div>
                      <div className="p-2 border-t flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowTagSuggestions(false)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                onClick={fetchTemplates}
                disabled={isTemplatesLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedComplexity("all");
                  setSearchTags("");
                  // Reset to defaults, then fetch
                  setTimeout(() => fetchTemplates(), 0);
                }}
                disabled={isTemplatesLoading}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            
            {/* Stats Row */}
            {templateMetadata && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>Total templates: <span className="font-medium">{templateMetadata.total}</span></div>
                {templateMetadata.complexityStats && (
                  <>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                        {templateMetadata.complexityStats.beginner} beginner
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {templateMetadata.complexityStats.intermediate} intermediate
                      </span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                        {templateMetadata.complexityStats.advanced} advanced
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            {/* Personalized Recommendations Section */}
            {!isTemplatesLoading && suggestedTemplates.length > 0 && (
              <div className="border-b pb-6 mb-4">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="inline-block p-1 rounded-full bg-primary/10">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">
                        ✨
                      </span>
                    </span>
                    Recommended for You
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Smart suggestions based on your preferences and activity
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 pt-2">
                  {isSuggestionsLoading ? (
                    <div className="col-span-full flex justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
                        <span className="text-sm text-muted-foreground">Loading recommendations...</span>
                      </div>
                    </div>
                  ) : (
                    suggestedTemplates.map((suggestion) => {
                      // Find the full template data from templates array
                      const template = templates.find(t => t.id === suggestion.templateId);
                      
                      if (!template) {
                        return null; // Skip if template not found
                      }
                      
                      return (
                        <Card 
                          key={template.id}
                          className="cursor-pointer hover:border-primary transition-colors relative overflow-hidden"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsTemplateDialogOpen(true);
                          }}
                        >
                          {/* Recommendation badge */}
                          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">
                            {Math.round(suggestion.score * 100)}% match
                          </div>
                          
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-3">
                                <Layers className="h-5 w-5 shrink-0 text-primary" />
                                <div className="flex-1 space-y-1 overflow-hidden">
                                  <p className="font-medium text-sm">{template.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground italic flex items-center gap-1">
                                <span>"{suggestion.reason}"</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                                        <Info className="h-3 w-3" />
                                        <span className="sr-only">Why this recommendation?</span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>This template is recommended based on your recent usage patterns, coding style, and project history. This {Math.round(suggestion.score * 100)}% match score reflects compatibility with your development preferences.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        className={`text-xs ${
                                          template.complexity === 'beginner' 
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : template.complexity === 'intermediate'
                                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                        }`}
                                      >
                                        {template.complexity || 'beginner'}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>
                                        {template.complexity === 'beginner' 
                                          ? 'Easy to implement with minimal coding knowledge required'
                                          : template.complexity === 'intermediate'
                                            ? 'Requires basic understanding of React components'
                                            : 'Advanced implementation with state management and complex logic'
                                        }
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {template.tags.slice(0, 1).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
            {/* All Templates Section */}
            {isTemplatesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading templates...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {templates
                  .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
                  .map((template) => (
                    <Card 
                      key={template.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsTemplateDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-3">
                            <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 space-y-1 overflow-hidden">
                              <p className="font-medium text-sm">{template.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    {template.category}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Template category: {template.category}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {/* Complexity badge with appropriate colors */}
                            {template.complexity && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      className={`text-xs ${
                                        template.complexity === 'beginner' 
                                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                          : template.complexity === 'intermediate'
                                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                      }`}
                                    >
                                      {template.complexity}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>
                                      {template.complexity === 'beginner' 
                                        ? 'Easy to implement with minimal coding knowledge required'
                                        : template.complexity === 'intermediate'
                                          ? 'Requires basic understanding of React components'
                                          : 'Advanced implementation with state management and complex logic'
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Tags */}
                            {template.tags.slice(0, 2).map((tag) => (
                              <TooltipProvider key={tag}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Components with the "{tag}" functionality</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {template.tags.length > 2 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs">
                                      +{template.tags.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {template.tags.slice(2).join(", ")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                {templates.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <Layers className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No templates available</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2">
                      No component templates found. Try refreshing or check back later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* File View Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              {selectedFile?.path.split("/").pop()}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {selectedFile?.path}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4">
            {selectedFile && (
              <CodeBlock
                code={selectedFile.content}
                language={selectedFile.language}
                fileName={selectedFile.path.split("/").pop()}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsFileDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedFile) {
                  setImplementationData({
                    code: selectedFile.content,
                    language: selectedFile.language,
                    path: selectedFile.path,
                  });
                  setIsFileDialogOpen(false);
                  setIsImplementDialogOpen(true);
                }
              }}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Implement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Implementation Dialog */}
      <Dialog open={isImplementDialogOpen} onOpenChange={setIsImplementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Implement Code</DialogTitle>
            <DialogDescription>
              Specify the file path where you want to save this code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-path">File Path</Label>
              <Input
                id="file-path"
                placeholder="e.g., client/src/components/MyComponent.tsx"
                value={implementationData?.path || ""}
                onChange={(e) => setImplementationData(prev => prev ? { ...prev, path: e.target.value } : null)}
              />
              <p className="text-xs text-muted-foreground">
                The path where the file will be created or updated
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImplementDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImplementationConfirm}>
              <Code className="h-4 w-4 mr-2" />
              Implement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedTemplate?.description}
            </DialogDescription>
            {selectedTemplate && (
              <div className="flex flex-wrap gap-1 mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{selectedTemplate.category}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Template category: {selectedTemplate.category}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Complexity badge with appropriate colors */}
                {selectedTemplate.complexity && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className={`text-xs ${
                            selectedTemplate.complexity === 'beginner' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : selectedTemplate.complexity === 'intermediate'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                        >
                          {selectedTemplate.complexity}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {selectedTemplate.complexity === 'beginner' 
                            ? 'Easy to implement with minimal coding knowledge required'
                            : selectedTemplate.complexity === 'intermediate'
                              ? 'Requires basic understanding of React components'
                              : 'Advanced implementation with state management and complex logic'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Tags */}
                {selectedTemplate.tags.map((tag) => (
                  <TooltipProvider key={tag}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Components with the "{tag}" functionality</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {/* Show dependencies if available */}
                {selectedTemplate.dependencies && selectedTemplate.dependencies.length > 0 && (
                  <div className="w-full mt-1 text-xs text-muted-foreground">
                    <span className="font-semibold">Dependencies:</span> {selectedTemplate.dependencies.join(', ')}
                  </div>
                )}
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto mt-4">
            {selectedTemplate && (
              <CodeBlock
                code={selectedTemplate.code}
                language={selectedTemplate.code.includes('import React') || selectedTemplate.code.includes('from "react"') ? 'tsx' : 'jsx'}
                fileName={`${selectedTemplate.name}.tsx`}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  setImplementationData({
                    code: selectedTemplate.code,
                    language: selectedTemplate.code.includes('import React') || selectedTemplate.code.includes('from "react"') ? 'tsx' : 'jsx',
                    path: `client/src/components/${selectedTemplate.name.replace(/\s+/g, '')}.tsx`,
                  });
                  setIsTemplateDialogOpen(false);
                  setIsImplementDialogOpen(true);
                }
              }}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Implement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}