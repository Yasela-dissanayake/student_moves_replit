import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  SplitPane, 
  SplitPaneLeft, 
  SplitPaneRight, 
  SplitPaneResizer 
} from '../../components/ui/split-pane';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { RefreshCw, CheckIcon, AlertCircleIcon } from 'lucide-react';
import { 
  Code, 
  FileCode, 
  FileText, 
  FolderIcon, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Terminal, 
  Eye, 
  Play, 
  Save, 
  FileIcon, 
  PanelLeft, 
  PanelRight, 
  Maximize, 
  Minimize, 
  PlusCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
// Remove unused fetcher import

// Define necessary types
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

interface FileInfo {
  path: string;
  content: string;
  language: string;
  isDirectory?: boolean;
}

interface DirectoryTree {
  name: string;
  path: string;
  isDirectory: boolean;
  children: DirectoryTree[];
  level: number;
}

interface ExecutionResult {
  output: string;
  success: boolean;
  timestamp: Date;
}

// Use GitHub-style syntax highlighting colors
const SyntaxHighlightStyles = {
  base: 'font-mono text-sm p-3 overflow-auto bg-slate-950 text-slate-50 rounded-md',
  keyword: 'text-purple-400',
  string: 'text-green-400',
  comment: 'text-slate-500',
  number: 'text-blue-400',
  function: 'text-yellow-400',
  operator: 'text-pink-400',
  variable: 'text-blue-300',
  property: 'text-blue-300',
  tag: 'text-red-400',
  attribute: 'text-yellow-300'
};

// Helper function to determine file icon based on file path
const getFileIcon = (filePath: string): LucideIcon => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return FileCode;
    case 'json':
      return FileText;
    case 'html':
      return FileText;
    case 'css':
    case 'scss':
      return FileText;
    case 'md':
      return FileText;
    default:
      return FileIcon;
  }
};

// Simple code highlighting component - will be basic
const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  return (
    <pre className={SyntaxHighlightStyles.base}>
      <code>
        {code}
      </code>
    </pre>
  );
};

// File Explorer Component - Displays the directory structure
const FileExplorer = ({ 
  files, 
  onSelectFile, 
  currentFile,
  onRefreshFiles
}: { 
  files: DirectoryTree[], 
  onSelectFile: (file: FileInfo) => void,
  currentFile?: FileInfo,
  onRefreshFiles: () => void
}) => {
  const renderTree = (node: DirectoryTree, index: number) => {
    const isSelected = currentFile?.path === node.path;
    const FileTypeIcon = node.isDirectory ? FolderIcon : getFileIcon(node.name);
    const ChevronIcon = node.isDirectory ? ChevronRight : null;
    
    return (
      <div key={node.path + index}>
        <div 
          className={`flex items-center py-1 px-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${isSelected ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
          style={{ paddingLeft: `${(node.level * 12) + 8}px` }}
          onClick={async () => {
            if (!node.isDirectory) {
              try {
                const response = await fetch(`/api/website-builder/file?path=${encodeURIComponent(node.path)}`);
                if (!response.ok) throw new Error('Failed to fetch file');
                const data = await response.json();
                
                if (data.success) {
                  onSelectFile({
                    path: data.path,
                    content: data.content,
                    language: data.language
                  });
                } else {
                  throw new Error(data.message || 'Failed to load file');
                }
              } catch (error) {
                toast({
                  title: 'Error',
                  description: `Failed to load file: ${error instanceof Error ? error.message : String(error)}`,
                  variant: 'destructive'
                });
              }
            }
          }}
        >
          {ChevronIcon && <ChevronIcon className="h-4 w-4 mr-1" />}
          <FileTypeIcon className="h-4 w-4 mr-1" />
          <span>{node.name}</span>
        </div>
        
        {node.isDirectory && node.children.map((child, idx) => renderTree(child, idx))}
      </div>
    );
  };
  
  return (
    <div className="h-full border rounded-md overflow-hidden">
      <div className="flex justify-between items-center border-b p-2 bg-slate-50 dark:bg-slate-900">
        <h3 className="text-sm font-medium">Explorer</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefreshFiles}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-full max-h-[calc(100vh-220px)]">
        {files.map((file, index) => renderTree(file, index))}
      </ScrollArea>
    </div>
  );
};

// Search component
const FileSearch = ({ onSearchResults }: { onSearchResults: (files: FileInfo[]) => void }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/website-builder/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        onSearchResults(data.files);
      } else {
        toast({
          title: 'Search failed',
          description: data.message || 'Failed to perform search',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Search failed: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  return (
    <div className="flex space-x-2 p-2 border-b">
      <Input 
        placeholder="Search files..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch();
          }
        }}
      />
      <Button variant="outline" size="sm" onClick={handleSearch} disabled={isSearching}>
        {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>}
      </Button>
    </div>
  );
};

// Editor component
const Editor = ({ 
  file, 
  onContentChange,
  onSave,
  readOnly = false
}: { 
  file?: FileInfo, 
  onContentChange: (content: string) => void,
  onSave: () => void,
  readOnly?: boolean
}) => {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-4" />
          <p>Select a file to edit or create a new file</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 border-b">
        <div className="flex items-center">
          {React.createElement(getFileIcon(file.path), { className: "h-4 w-4 mr-2" })}
          <span className="text-sm font-medium truncate max-w-[200px]">{file.path}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            disabled={readOnly}
            onClick={onSave}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Textarea
        className="flex-1 font-mono resize-none p-3 text-sm h-full rounded-none border-0 focus-visible:ring-0"
        value={file.content}
        onChange={(e) => onContentChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};

// Console component
const Console = ({ output }: { output: ExecutionResult[] }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);
  
  if (output.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Terminal className="h-12 w-12 mx-auto mb-4" />
          <p>Run your code to see output</p>
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-3 font-mono text-sm">
        {output.map((result, index) => (
          <div key={index} className="mb-3">
            <div className="flex items-center text-xs text-slate-500 mb-1">
              <span>{result.timestamp.toLocaleTimeString()}</span>
              <Badge variant={result.success ? "default" : "destructive"} className="ml-2">
                {result.success ? "Success" : "Error"}
              </Badge>
            </div>
            <pre className="whitespace-pre-wrap bg-slate-100 dark:bg-slate-900 p-2 rounded-md">{result.output}</pre>
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>
    </ScrollArea>
  );
};

// Chat message component
const ChatMessage = ({ message }: { message: Message }) => {
  return (
    <div className={`mb-4 ${message.role === 'assistant' ? 'pl-6' : 'pr-6'}`}>
      <div className={`flex ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
        <div
          className={`rounded-lg p-3 max-w-[85%] ${
            message.role === 'assistant'
              ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100'
              : 'bg-blue-500 text-white'
          }`}
        >
          <div className="prose dark:prose-invert prose-sm break-words">
            {message.content.split('```').map((part, index) => {
              if (index % 2 === 0) {
                // Regular text (not code)
                return (
                  <div key={index} className="whitespace-pre-wrap">
                    {part}
                  </div>
                );
              } else {
                // Code block
                const languageMatch = part.match(/^([a-zA-Z0-9_]+)\n/);
                let code = part;
                let language = 'plaintext';
                
                if (languageMatch) {
                  language = languageMatch[1];
                  code = part.slice(languageMatch[0].length);
                }
                
                return (
                  <div key={index} className="my-3">
                    <CodeBlock
                      code={code}
                      language={language}
                    />
                  </div>
                );
              }
            })}
          </div>
          <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
            {message.createdAt.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Preview component
const Preview = ({ file, onRefresh }: { file?: FileInfo, onRefresh: () => void }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (file && iframeRef.current) {
      const iframe = iframeRef.current;
      const isHtml = file.path.endsWith('.html');
      
      if (isHtml) {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(file.content);
          iframeDoc.close();
        }
      }
    }
  }, [file]);
  
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto mb-4" />
          <p>Select an HTML file to preview</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 border-b">
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Preview</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

// Main component
export function ReplitLikeWebsiteBuilder() {
  // State for chat
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for file system and editor
  const [fileTree, setFileTree] = useState<DirectoryTree[]>([]);
  const [currentFile, setCurrentFile] = useState<FileInfo | undefined>();
  const [editedContent, setEditedContent] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<ExecutionResult[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [leftPanelTab, setLeftPanelTab] = useState<string>('files');
  const [rightPanelTab, setRightPanelTab] = useState<string>('console');
  const [codeDialogOpen, setCodeDialogOpen] = useState<boolean>(false);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch file tree query
  const {
    data: fileTreeData,
    isLoading: isLoadingFileTree,
    refetch: refetchFileTree
  } = useQuery({
    queryKey: ['/api/website-builder/files'],
    queryFn: async () => {
      const response = await fetch('/api/website-builder/files');
      if (!response.ok) throw new Error('Failed to fetch file tree');
      return response.json();
    }
  });
  
  // Execute code mutation
  const executeMutation = useMutation({
    mutationFn: async ({ code, path, language }: { code?: string; path?: string; language?: string }) => {
      const body = {
        ...(code && { code }),
        ...(path && { path }),
        ...(language && { language })
      };
      
      const response = await fetch('/api/website-builder/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Execution failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const newOutput: ExecutionResult = {
        output: data.output,
        success: data.executionSuccess,
        timestamp: new Date()
      };
      
      setConsoleOutput(prev => [...prev, newOutput]);
      setRightPanelTab('console');
    },
    onError: (error) => {
      const newOutput: ExecutionResult = {
        output: `Error: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
        timestamp: new Date()
      };
      
      setConsoleOutput(prev => [...prev, newOutput]);
      setRightPanelTab('console');
    }
  });
  
  // Implement code mutation
  const implementMutation = useMutation({
    mutationFn: async ({ code, path, language }: { code: string; path: string; language: string }) => {
      const response = await fetch('/api/website-builder/implement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, path, language })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Implementation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Code implemented',
        description: data.message || 'Code was successfully implemented',
      });
      
      // Refresh the file tree to show new files
      refetchFileTree();
    },
    onError: (error) => {
      toast({
        title: 'Implementation failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    }
  });
  
  // Fetch AI response for chat
  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Prepare the messages for the API
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the current file context if available
      const contextData = {
        messages: [
          ...messageHistory,
          { role: 'user', content: userMessage }
        ],
        ...(currentFile && { currentFile })
      };
      
      const response = await fetch('/api/website-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Chat request failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add the assistant's response to the messages
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If the response includes code files, show them in the dialog
      if (data.codeFiles && data.codeFiles.length > 0) {
        setSearchResults(data.codeFiles);
        setCodeDialogOpen(true);
      }
      
      // Scroll to the bottom
      setTimeout(() => {
        scrollToBottomOfChat();
      }, 100);
    },
    onError: (error) => {
      // Add an error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Chat error',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });
  
  // Initialization effect
  useEffect(() => {
    // Set up initial message
    const initialMessage: Message = {
      role: 'assistant',
      content: 'Welcome to UniRent WebCraft! I\'m your AI assistant to help you build and modify your website. You can ask me to create new features, modify existing code, or provide guidance on web development. Let me know what you\'d like to work on today.',
      createdAt: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Check if dark mode is enabled
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);
  
  // Update file tree when data is loaded
  useEffect(() => {
    if (fileTreeData?.success && fileTreeData.tree) {
      setFileTree(fileTreeData.tree);
    }
  }, [fileTreeData]);
  
  // Update edited content when current file changes
  useEffect(() => {
    if (currentFile) {
      setEditedContent(currentFile.content);
    }
  }, [currentFile]);
  
  // Scroll to the bottom of the chat when new messages are added
  const scrollToBottomOfChat = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Handle chat form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Create user message object
    const userMessage: Message = {
      role: 'user',
      content: input,
      createdAt: new Date()
    };
    
    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setInput('');
    
    // Show loading state
    setIsLoading(true);
    const loadingMessage: Message = {
      role: 'assistant',
      content: '...',
      createdAt: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    // Scroll to bottom
    setTimeout(scrollToBottomOfChat, 100);
    
    // Send to API and remove loading message
    chatMutation.mutate(userMessage.content);
    setMessages(prev => prev.slice(0, -1));
  };
  
  // Handle implementing code from the dialog
  const handleImplementCode = (file: FileInfo) => {
    implementMutation.mutate({
      code: file.content,
      path: file.path,
      language: file.language
    });
    setCodeDialogOpen(false);
  };
  
  // Handle saving the current file
  const handleSaveFile = () => {
    if (!currentFile) return;
    
    const updatedFile = {
      ...currentFile,
      content: editedContent
    };
    
    implementMutation.mutate({
      code: updatedFile.content,
      path: updatedFile.path,
      language: updatedFile.language
    });
    
    // Update the current file with the edited content
    setCurrentFile(updatedFile);
    
    // Add an implementation message
    const implementationMessage: Message = {
      role: 'assistant',
      content: `File saved: \`${updatedFile.path}\``,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, implementationMessage]);
  };
  
  // Handle searching for files
  const handleSearchResults = (files: FileInfo[]) => {
    setSearchResults(files);
    
    if (files.length > 0) {
      // Add a search result message
      const searchMessage: Message = {
        role: 'assistant',
        content: `Found ${files.length} file(s) matching your search:
        
${files.slice(0, 5).map((file: FileInfo) => `- \`${file.path}\``).join("\n")}
`,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, searchMessage]);
    } else {
      // Add a "no results" message
      const noFilesMessage: Message = {
        role: 'assistant',
        content: 'No files found matching your search.',
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, noFilesMessage]);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (file: FileInfo) => {
    setCurrentFile(file);
    setActiveTab('editor');
  };
  
  // Handle running the current file
  const handleRunCode = () => {
    if (!currentFile) return;
    
    executeMutation.mutate({
      path: currentFile.path
    });
  };
  
  // Render the component
  return (
    <div className="flex flex-col h-screen">
      {/* Main header */}
      <header className="bg-slate-900 text-white p-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <h1 className="text-lg font-bold">UniRent WebCraft</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchFileTree()}
            disabled={isLoadingFileTree}
          >
            {isLoadingFileTree ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
      </header>
      
      {/* Replit-like main area */}
      <div className="flex-1 flex">
        {/* Left sidebar */}
        <div className="w-[300px] border-r flex flex-col">
          <Tabs defaultValue="files" value={leftPanelTab} onValueChange={setLeftPanelTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="flex-1 flex flex-col h-[calc(100vh-110px)]">
              <FileSearch onSearchResults={handleSearchResults} />
              <div className="flex-1 overflow-hidden">
                {isLoadingFileTree ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <FileExplorer 
                    files={fileTree} 
                    onSelectFile={handleFileSelect}
                    currentFile={currentFile}
                    onRefreshFiles={refetchFileTree}
                  />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="chat" className="flex-1 flex flex-col h-[calc(100vh-110px)]">
              <div className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                  ))}
                  <div ref={chatEndRef} />
                </ScrollArea>
                
                <form 
                  className="p-4 border-t flex items-end"
                  onSubmit={handleSubmit}
                >
                  <Textarea
                    className="flex-1 resize-none"
                    placeholder="Ask me anything about building your website..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="ml-2 self-end"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="editor" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b px-3">
              <TabsList>
                <TabsTrigger value="editor" className="flex items-center">
                  <FileCode className="h-4 w-4 mr-2" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              {currentFile && (
                <div className="flex items-center space-x-2 ml-auto absolute right-4 top-[10px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRunCode}
                          disabled={!currentFile}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Run the current file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            
            <TabsContent value="editor" className="flex-1 p-0">
              <Editor 
                file={currentFile}
                onContentChange={setEditedContent}
                onSave={handleSaveFile}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 p-0">
              <Preview 
                file={currentFile}
                onRefresh={() => {
                  // Refresh the preview by re-running the file
                  if (currentFile) {
                    executeMutation.mutate({
                      path: currentFile.path
                    });
                  }
                }} 
              />
            </TabsContent>
          </Tabs>
          
          {/* Console/output area */}
          <div className="h-[200px] border-t">
            <Tabs defaultValue="console" value={rightPanelTab} onValueChange={setRightPanelTab}>
              <TabsList>
                <TabsTrigger value="console" className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Console
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Suggestions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="console" className="p-0 h-[160px]">
                <Console output={consoleOutput} />
              </TabsContent>
              
              <TabsContent value="suggestions" className="p-3 overflow-auto h-[160px]">
                <div className="grid grid-cols-3 gap-3">
                  {['Create login page', 'Add image gallery', 'Build contact form'].map((suggestion, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{suggestion}</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-3 pt-0">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setInput(suggestion);
                            setLeftPanelTab('chat');
                          }}
                        >
                          Try this
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Dialog for implementing code */}
      <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Code Implementation</DialogTitle>
            <DialogDescription>
              The AI assistant has generated the following code. Would you like to implement it?
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            <Accordion type="single" collapsible className="w-full">
              {searchResults.map((file, index) => (
                <AccordionItem value={`file-${index}`} key={index}>
                  <AccordionTrigger className="hover:bg-slate-50 dark:hover:bg-slate-900 px-3">
                    <div className="flex items-center">
                      {React.createElement(getFileIcon(file.path), { className: "h-4 w-4 mr-2" })}
                      <span className="font-mono text-sm">{file.path}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <CodeBlock 
                      code={file.content} 
                      language={file.language} 
                    />
                    <div className="mt-3 flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFileSelect(file)}
                      >
                        <FileCode className="h-4 w-4 mr-2" />
                        Open in Editor
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleImplementCode(file)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Implement
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
          
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setCodeDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}