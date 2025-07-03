import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertCircle,
  Wand2,
  FileImage,
  Send,
  Save,
  ChevronRight,
  Trash2,
  Link,
  ExternalLink
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewsletterTemplateGeneratorProps {
  onTemplateSaved?: (template: any) => void;
  initialTemplate?: any;
  mode?: 'create' | 'edit';
}

interface ImageMap {
  [key: string]: string;
}

type NewsletterType = 'business' | 'property' | 'event' | 'update';

export default function NewsletterTemplateGenerator({
  onTemplateSaved,
  initialTemplate,
  mode = 'create'
}: NewsletterTemplateGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');
  
  // Form states
  const [name, setName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [type, setType] = useState<NewsletterType>('business');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [imageMap, setImageMap] = useState<ImageMap>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAIDialog, setShowAIDialog] = useState<boolean>(false);
  
  // AI generation states
  const [aiPrompt, setAIPrompt] = useState<string>('');
  const [aiType, setAIType] = useState<NewsletterType>('business');
  const [aiTone, setAITone] = useState<string>('professional');
  const [businessNames, setBusinessNames] = useState<string>('');
  const [eventDetails, setEventDetails] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Initialize form with initial template if provided (edit mode)
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setSubject(initialTemplate.subject || '');
      setContent(initialTemplate.content || '');
      setType(initialTemplate.type || 'business');
      setImageMap(initialTemplate.imageMap || {});
    }
  }, [initialTemplate]);
  
  // Update preview whenever content or images change
  useEffect(() => {
    let processedContent = content;
    
    // Replace image placeholders with actual images in preview
    Object.keys(imageMap).forEach(key => {
      const placeholder = `{{IMAGE:${key}}}`;
      if (processedContent.includes(placeholder)) {
        // Enhanced responsive email-friendly image
        processedContent = processedContent.replace(
          placeholder,
          `<div style="max-width: 100%; margin: 10px 0;">
            <img src="${imageMap[key]}" 
                 alt="${key}" 
                 title="${key}"
                 style="display: block; max-width: 100%; height: auto; border: 0; margin: 0 auto;" 
                 width="600" />
            <div style="color: #666; font-size: 12px; text-align: center; margin-top: 4px;">
              ${key}
            </div>
          </div>`
        );
      }
    });
    
    setPreviewContent(processedContent);
  }, [content, imageMap]);
  
  const handleTemplateTypeChange = (value: string) => {
    setType(value as NewsletterType);
  };
  
  const handleAITypeChange = (value: string) => {
    setAIType(value as NewsletterType);
  };
  
  const handleAIToneChange = (value: string) => {
    setAITone(value);
  };
  
  const [externalImageUrl, setExternalImageUrl] = useState<string>('');
  const [showExternalImageDialog, setShowExternalImageDialog] = useState<boolean>(false);
  
  const handleAddExternalImage = () => {
    if (!externalImageUrl.trim()) {
      toast({
        title: 'No URL provided',
        description: 'Please enter a valid image URL',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate URL format
    try {
      new URL(externalImageUrl);
    } catch (e) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL including http:// or https://',
        variant: 'destructive'
      });
      return;
    }
    
    // Generate a key for the image
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const imageKey = `external-image-${dateStr}-${Math.floor(Math.random() * 1000)}`;
    
    // Add to image map
    setImageMap(prev => ({
      ...prev,
      [imageKey]: externalImageUrl
    }));
    
    // Insert a placeholder at cursor position
    const placeholder = `{{IMAGE:${imageKey}}}`;
    insertAtCursor(placeholder);
    
    // Reset and close dialog
    setExternalImageUrl('');
    setShowExternalImageDialog(false);
    
    toast({
      title: 'External image added',
      description: 'External image has been added to the template',
    });
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/admin/newsletter/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const { imageUrl, imageKey } = data;
        
        // Add to image map
        setImageMap(prev => ({
          ...prev,
          [imageKey]: imageUrl
        }));
        
        // Insert a placeholder at cursor position
        const placeholder = `{{IMAGE:${imageKey}}}`;
        insertAtCursor(placeholder);
        
        toast({
          title: 'Image uploaded',
          description: 'Image has been uploaded and inserted into the template',
        });
      } else {
        throw new Error(data.error || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Image upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById('newsletter-content') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    const beforeText = content.substring(0, startPos);
    const afterText = content.substring(endPos);
    
    setContent(beforeText + text + afterText);
    
    // Set focus back to textarea and place cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + text.length;
      textarea.selectionEnd = startPos + text.length;
    }, 100);
  };
  
  const generateWithAI = async () => {
    try {
      setIsGenerating(true);
      
      // Prepare request based on selected newsletter type
      const payload: any = {
        type: aiType,
        topic: aiPrompt,
        tone: aiTone
      };
      
      // Add additional parameters based on newsletter type
      if (aiType === 'business' && businessNames.trim()) {
        payload.businessNames = businessNames.split(',').map(name => name.trim());
      }
      
      if (aiType === 'event' && eventDetails.trim()) {
        payload.eventDetails = eventDetails;
      }
      
      // Send AI generation request
      const response = await apiRequest("/api/admin/newsletter/ai-generate", {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (response.content) {
        // Update form with generated content
        setSubject(response.content.subject || '');
        setContent(response.content.content || '');
        setShowAIDialog(false);
        
        toast({
          title: 'Content generated',
          description: 'AI-generated content has been added to the template',
        });
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('AI Generation error:', error);
      toast({
        title: 'Content generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate content with AI',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const saveTemplate = async () => {
    try {
      if (!name.trim() || !subject.trim() || !content.trim()) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }
      
      setIsLoading(true);
      
      const templateData = {
        name,
        subject,
        content,
        type,
        imageMap
      };
      
      let response;
      
      if (mode === 'edit' && initialTemplate?.id) {
        // Update existing template
        response = await apiRequest(`/api/admin/newsletter/templates/${initialTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateData)
        });
      } else {
        // Create new template
        response = await apiRequest('/api/admin/newsletter/templates', {
          method: 'POST',
          body: JSON.stringify(templateData)
        });
      }
      
      if (response.success) {
        toast({
          title: mode === 'edit' ? 'Template updated' : 'Template created',
          description: mode === 'edit' ? 'Newsletter template has been updated' : 'Newsletter template has been created',
        });
        
        // Invalidate queries to refresh template list
        queryClient.invalidateQueries({ queryKey: ['/api/admin/newsletter/templates'] });
        
        // Notify parent component if callback is provided
        if (onTemplateSaved) {
          onTemplateSaved(response.template);
        }
      } else {
        throw new Error(response.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit Newsletter Template' : 'Create Newsletter Template'}</CardTitle>
          <CardDescription>
            Create a professional newsletter template to send to your audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a name for this template"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={type} onValueChange={handleTemplateTypeChange}>
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business Outreach</SelectItem>
                    <SelectItem value="property">Property Newsletter</SelectItem>
                    <SelectItem value="event">Event Announcement</SelectItem>
                    <SelectItem value="update">General Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Email Content</h3>
              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIDialog(true)}
                  disabled={isLoading}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <FileImage className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExternalImageDialog(true)}
                  disabled={isLoading}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  External Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="min-h-[300px]">
                <Textarea
                  id="newsletter-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your newsletter content here..."
                  className="min-h-[300px]"
                  required
                />
                {Object.keys(imageMap).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Inserted Images:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(imageMap).map(([key, url]) => (
                        <div key={key} className="flex items-center gap-1 bg-muted py-1 px-2 rounded-md text-xs">
                          <img src={url} alt={key} className="h-5 w-5 object-cover" />
                          <span className="truncate max-w-[100px]">{key}</span>
                          <button
                            type="button"
                            onClick={() => {
                              // Remove image from map
                              const newImageMap = { ...imageMap };
                              delete newImageMap[key];
                              setImageMap(newImageMap);
                              
                              // Remove placeholder from content
                              setContent(content.replace(`{{IMAGE:${key}}}`, ''));
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="preview" className="min-h-[300px] border rounded-md p-4">
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewContent }} />
              </TabsContent>
            </Tabs>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>HTML Tips</AlertTitle>
              <AlertDescription>
                You can use HTML tags for formatting such as <code>&lt;h1&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, etc.
                Use <code>{`{{IMAGE:key}}`}</code> placeholders to insert images.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onTemplateSaved?.(null)}>
            Cancel
          </Button>
          <Button onClick={saveTemplate} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Newsletter Content with AI</DialogTitle>
            <DialogDescription>
              Describe what you want to include in your newsletter and let AI help you create it
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-type">Newsletter Type</Label>
              <Select value={aiType} onValueChange={handleAITypeChange}>
                <SelectTrigger id="ai-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business Outreach</SelectItem>
                  <SelectItem value="property">Property Newsletter</SelectItem>
                  <SelectItem value="event">Event Announcement</SelectItem>
                  <SelectItem value="update">General Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Topic or Main Focus</Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                placeholder="E.g., Student benefits program, End-of-term housing options, etc."
                className="min-h-[100px]"
              />
            </div>
            
            {aiType === 'business' && (
              <div className="space-y-2">
                <Label htmlFor="business-names">Business Names (optional)</Label>
                <Input
                  id="business-names"
                  value={businessNames}
                  onChange={(e) => setBusinessNames(e.target.value)}
                  placeholder="Business names, comma separated"
                />
              </div>
            )}
            
            {aiType === 'event' && (
              <div className="space-y-2">
                <Label htmlFor="event-details">Event Details (optional)</Label>
                <Textarea
                  id="event-details"
                  value={eventDetails}
                  onChange={(e) => setEventDetails(e.target.value)}
                  placeholder="Date, time, location, and other details about the event"
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="ai-tone">Tone</Label>
              <Select value={aiTone} onValueChange={handleAIToneChange}>
                <SelectTrigger id="ai-tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generateWithAI} 
              disabled={!aiPrompt.trim() || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? 'Generating...' : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* External Image URL Dialog */}
      <Dialog open={showExternalImageDialog} onOpenChange={setShowExternalImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add External Image</DialogTitle>
            <DialogDescription>
              Enter the URL of an external image to include in your newsletter
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="external-image-url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="external-image-url"
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure the image is hosted on a reliable server and has appropriate permissions
              </p>
              
              {externalImageUrl && (
                <div className="mt-4 border rounded-md p-2">
                  <p className="text-xs mb-1 font-medium">Preview:</p>
                  <div className="bg-muted rounded-md flex items-center justify-center h-36">
                    <img 
                      src={externalImageUrl} 
                      alt="External image preview" 
                      className="max-h-full max-w-full h-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        toast({
                          title: 'Image preview failed',
                          description: 'Could not load the image from the provided URL',
                          variant: 'destructive'
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setExternalImageUrl('');
              setShowExternalImageDialog(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddExternalImage} 
              disabled={!externalImageUrl.trim()}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Add Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}