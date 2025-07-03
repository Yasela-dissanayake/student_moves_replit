import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Upload, 
  Palette, 
  Type, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Contrast,
  Accessibility,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'notice';
  severity: 'critical' | 'high' | 'medium' | 'low';
  wcagRule: string;
  element: string;
  message: string;
  suggestion: string;
  codeExample?: string;
}

interface AuditResult {
  score: number;
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  warnings: number;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
}

interface AccessibilityToken {
  id: number;
  name: string;
  category: string;
  value: string;
  wcagCompliant: boolean;
  contrastRatio?: string;
  description: string;
  usage: string;
}

const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
</head>
<body>
  <header>
    <nav>
      <h1>My Website</h1>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section>
      <h2>Welcome to Our Website</h2>
      <p>This is a sample page for accessibility testing.</p>
      
      <form>
        <div>
          <input type="email" placeholder="Enter your email">
          <button type="submit">Subscribe</button>
        </div>
      </form>
      
      <img src="sample-image.jpg">
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 My Website. All rights reserved.</p>
  </footer>
</body>
</html>`;

const sampleCss = `body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

h1, h2 {
  color: #2c3e50;
}

nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
}

nav a {
  color: #3498db;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}

.btn {
  background-color: #e74c3c;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn:focus {
  outline: 2px solid #3498db;
}

input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}`;

export default function AccessibilityToolkit() {
  const { toast } = useToast();
  const [htmlContent, setHtmlContent] = useState(sampleHtml);
  const [cssContent, setCssContent] = useState(sampleCss);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePreview, setActivePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewSettings, setPreviewSettings] = useState({
    highContrast: false,
    darkMode: false,
    fontSize: 16,
    focusVisible: true,
    reduceMotion: false
  });
  
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Fetch accessibility design tokens
  const { data: tokensData } = useQuery({
    queryKey: ['/api/accessibility/tokens'],
  });

  // Fetch accessibility guidelines
  const { data: guidelinesData } = useQuery({
    queryKey: ['/api/accessibility/guidelines'],
  });

  // Analyze accessibility mutation
  const analyzeMutation = useMutation({
    mutationFn: async ({ htmlContent, cssContent }: { htmlContent: string; cssContent: string }) => {
      return await apiRequest('/api/accessibility/analyze', {
        method: 'POST',
        body: { htmlContent, cssContent }
      });
    },
    onSuccess: (data) => {
      setAuditResult(data.auditResult);
      toast({
        title: "Analysis Complete",
        description: `Accessibility score: ${data.auditResult.score}/100`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze accessibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeMutation.mutate({ htmlContent, cssContent });
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  const updatePreview = () => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        const modifiedCss = `
          ${cssContent}
          ${previewSettings.highContrast ? `
            * { 
              background-color: black !important; 
              color: white !important; 
              border-color: white !important; 
            }
            a { color: yellow !important; }
          ` : ''}
          ${previewSettings.darkMode ? `
            body { background-color: #1a1a1a !important; color: #e0e0e0 !important; }
          ` : ''}
          ${previewSettings.focusVisible ? `
            *:focus { 
              outline: 3px solid #4A90E2 !important; 
              outline-offset: 2px !important; 
            }
          ` : ''}
          ${previewSettings.reduceMotion ? `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          ` : ''}
          body { font-size: ${previewSettings.fontSize}px !important; }
        `;
        
        const fullHtml = htmlContent.replace(
          '</head>',
          `<style>${modifiedCss}</style></head>`
        );
        
        doc.open();
        doc.write(fullHtml);
        doc.close();
      }
    }
  };

  useEffect(() => {
    updatePreview();
  }, [htmlContent, cssContent, previewSettings]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return 'bg-green-100 text-green-800';
      case 'AA':
        return 'bg-blue-100 text-blue-800';
      case 'A':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Accessibility className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Accessibility Design Language Toolkit</h1>
          </div>
          <p className="text-gray-600">
            Comprehensive accessibility testing and design system with real-time preview and WCAG compliance checking.
          </p>
        </div>

        <Tabs defaultValue="analyzer" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
            <TabsTrigger value="tokens">Design Tokens</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
          </TabsList>

          {/* Accessibility Analyzer */}
          <TabsContent value="analyzer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    HTML & CSS Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="html-input">HTML Content</Label>
                    <Textarea
                      id="html-input"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Enter your HTML content..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="css-input">CSS Content (Optional)</Label>
                    <Textarea
                      id="css-input"
                      value={cssContent}
                      onChange={(e) => setCssContent(e.target.value)}
                      placeholder="Enter your CSS content..."
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>

                  <Button 
                    onClick={handleAnalyze} 
                    disabled={!htmlContent.trim() || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Analyze Accessibility
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditResult ? (
                    <div className="space-y-4">
                      {/* Score Overview */}
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className={`text-4xl font-bold ${getScoreColor(auditResult.score)}`}>
                          {auditResult.score}/100
                        </div>
                        <p className="text-gray-600 mt-2">Accessibility Score</p>
                        <Badge className={`mt-2 ${getComplianceColor(auditResult.complianceLevel)}`}>
                          WCAG {auditResult.complianceLevel}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{auditResult.passed}</div>
                          <p className="text-sm text-gray-600">Passed</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{auditResult.failed}</div>
                          <p className="text-sm text-gray-600">Failed</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{auditResult.warnings}</div>
                          <p className="text-sm text-gray-600">Warnings</p>
                        </div>
                      </div>

                      <Progress value={auditResult.score} className="w-full" />

                      {/* Issues List */}
                      {auditResult.issues.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Issues Found:</h4>
                          <ScrollArea className="h-[300px] w-full">
                            <div className="space-y-3">
                              {auditResult.issues.map((issue) => (
                                <div key={issue.id} className="border rounded-lg p-3 bg-white">
                                  <div className="flex items-start gap-2">
                                    {getSeverityIcon(issue.severity)}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{issue.message}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {issue.wcagRule}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{issue.suggestion}</p>
                                      {issue.codeExample && (
                                        <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                                          {issue.codeExample}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Accessibility className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Run an accessibility analysis to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Design Tokens */}
          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Accessibility Design Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tokensData?.tokens ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tokensData.tokens.map((token: AccessibilityToken) => (
                      <div key={token.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{token.name}</h4>
                          <Badge variant={token.wcagCompliant ? "default" : "destructive"}>
                            {token.wcagCompliant ? "WCAG ✓" : "Non-compliant"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Category:</span> {token.category}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Value:</span>
                            <code className="ml-1 px-1 bg-gray-100 rounded">{token.value}</code>
                          </div>
                          {token.contrastRatio && (
                            <div className="text-sm">
                              <span className="font-medium">Contrast:</span> {token.contrastRatio}
                            </div>
                          )}
                          <p className="text-sm text-gray-600">{token.description}</p>
                          <div className="text-xs text-gray-500 italic">{token.usage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4" />
                    <p>Loading design tokens...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guidelines */}
          <TabsContent value="guidelines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  WCAG Guidelines & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guidelinesData?.guidelines ? (
                  <div className="space-y-4">
                    {guidelinesData.guidelines.map((guideline: any) => (
                      <div key={guideline.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-lg">{guideline.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">WCAG {guideline.wcagLevel}</Badge>
                            <Badge variant={
                              guideline.priority === 'critical' ? 'destructive' :
                              guideline.priority === 'high' ? 'default' :
                              guideline.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {guideline.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{guideline.description}</p>
                        <div className="space-y-2">
                          <h5 className="font-medium">Implementation:</h5>
                          <p className="text-sm text-gray-600">{guideline.implementation}</p>
                        </div>
                        {guideline.examples && (
                          <div className="mt-3">
                            <h5 className="font-medium mb-2">Examples:</h5>
                            <div className="space-y-2">
                              {guideline.examples.map((example: any, index: number) => (
                                <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                                  {example.good && (
                                    <div className="text-green-700">
                                      <span className="font-medium">✓ Good:</span> {example.good}
                                    </div>
                                  )}
                                  {example.bad && (
                                    <div className="text-red-700">
                                      <span className="font-medium">✗ Bad:</span> {example.bad}
                                    </div>
                                  )}
                                  {example.decorative && (
                                    <div className="text-blue-700">
                                      <span className="font-medium">→ Decorative:</span> {example.decorative}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4" />
                    <p>Loading guidelines...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Preview */}
          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Preview Controls */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Preview Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Device Selection */}
                  <div>
                    <Label className="text-sm font-medium">Device Preview</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={activePreview === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActivePreview('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activePreview === 'tablet' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActivePreview('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={activePreview === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActivePreview('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Accessibility Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="high-contrast" className="text-sm">High Contrast</Label>
                      <Switch
                        id="high-contrast"
                        checked={previewSettings.highContrast}
                        onCheckedChange={(checked) => 
                          setPreviewSettings(prev => ({ ...prev, highContrast: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode" className="text-sm">Dark Mode</Label>
                      <Switch
                        id="dark-mode"
                        checked={previewSettings.darkMode}
                        onCheckedChange={(checked) => 
                          setPreviewSettings(prev => ({ ...prev, darkMode: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="focus-visible" className="text-sm">Focus Indicators</Label>
                      <Switch
                        id="focus-visible"
                        checked={previewSettings.focusVisible}
                        onCheckedChange={(checked) => 
                          setPreviewSettings(prev => ({ ...prev, focusVisible: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="reduce-motion" className="text-sm">Reduce Motion</Label>
                      <Switch
                        id="reduce-motion"
                        checked={previewSettings.reduceMotion}
                        onCheckedChange={(checked) => 
                          setPreviewSettings(prev => ({ ...prev, reduceMotion: checked }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="font-size" className="text-sm">Font Size: {previewSettings.fontSize}px</Label>
                      <Input
                        id="font-size"
                        type="range"
                        min="12"
                        max="24"
                        value={previewSettings.fontSize}
                        onChange={(e) => 
                          setPreviewSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <iframe
                      ref={previewRef}
                      className={`w-full border rounded-lg ${
                        activePreview === 'desktop' ? 'h-[600px]' :
                        activePreview === 'tablet' ? 'h-[500px] max-w-[768px] mx-auto' :
                        'h-[600px] max-w-[375px] mx-auto'
                      }`}
                      title="Accessibility Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}