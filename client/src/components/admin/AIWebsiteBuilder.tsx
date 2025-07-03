import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, AlertCircle, Code, PanelRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FeatureImplementation {
  generatedCode: string;
  implementationSteps: string[];
}

interface GeneratedFeature {
  name: string;
  description: string;
  implementation: FeatureImplementation;
}

interface AIWebsiteBuilderProps {
  onFeatureGenerated?: (feature: { name: string; description: string }) => void;
}

/**
 * AIWebsiteBuilder Component
 * 
 * This component provides an interface for generating website features using AI.
 * It allows users to specify details about the feature they want to create and uses
 * the OpenAI API to generate the implementation code and steps.
 */
export function AIWebsiteBuilder({ onFeatureGenerated }: AIWebsiteBuilderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [targetComponent, setTargetComponent] = useState("");
  const [featureType, setFeatureType] = useState("full-stack");
  const [generatedFeature, setGeneratedFeature] = useState<GeneratedFeature | null>(null);
  const [currentTab, setCurrentTab] = useState("code");

  const handleGenerateFeature = async () => {
    if (!featureName.trim() || !featureDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a feature name and description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare feature description with additional context
      const fullDescription = `
Feature Name: ${featureName}
Feature Type: ${featureType === "full-stack" ? "Full Stack (UI + API)" : 
               featureType === "frontend" ? "Frontend UI Only" : 
               "Backend API Only"}
${targetComponent ? `Target Component: ${targetComponent}` : ""}

Description:
${featureDescription}
      `.trim();

      // Make API call to backend
      const response = await fetch("/api/website-builder/generate-feature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureDescription: fullDescription,
          targetComponent: targetComponent || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate feature");
      }

      const data = await response.json();
      
      // Set the generated feature
      setGeneratedFeature({
        name: featureName,
        description: featureDescription,
        implementation: data,
      });

      // Notify parent component if callback provided
      if (onFeatureGenerated) {
        onFeatureGenerated({
          name: featureName,
          description: featureDescription,
        });
      }

      toast({
        title: "Feature generated successfully",
        description: "Your AI-powered feature implementation is ready for review.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error generating feature:", error);
      
      toast({
        title: "Generation failed",
        description: error.message || "There was an error generating your feature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFeatureName("");
    setFeatureDescription("");
    setTargetComponent("");
    setFeatureType("full-stack");
    setGeneratedFeature(null);
  };

  return (
    <div className="space-y-8">
      {/* Feature Input Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="feature-name">Feature Name</Label>
            <Input
              id="feature-name"
              placeholder="e.g., Student Roommate Finder"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="target-component">Target Component (Optional)</Label>
            <Input
              id="target-component"
              placeholder="e.g., PropertyCard"
              value={targetComponent}
              onChange={(e) => setTargetComponent(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="feature-type">Feature Type</Label>
          <Select
            value={featureType}
            onValueChange={setFeatureType}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select feature type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-stack">Full Stack (UI + API)</SelectItem>
              <SelectItem value="frontend">Frontend UI Only</SelectItem>
              <SelectItem value="backend">Backend API Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="feature-description">Feature Description</Label>
          <Textarea
            id="feature-description"
            placeholder="Describe the feature you want to implement in detail..."
            className="h-32"
            value={featureDescription}
            onChange={(e) => setFeatureDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || (!featureName && !featureDescription && !targetComponent)}
          >
            Reset
          </Button>
          <Button
            onClick={handleGenerateFeature}
            disabled={loading || !featureName || !featureDescription}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Feature"
            )}
          </Button>
        </div>
      </div>

      {/* Generated Feature Output */}
      {generatedFeature && (
        <Card className="border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 rounded-full bg-green-100 text-green-600 p-1" />
                <h3 className="font-medium text-lg">{generatedFeature.name}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                New Feature
              </Button>
            </div>

            <Tabs
              defaultValue="code"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span>Implementation Code</span>
                </TabsTrigger>
                <TabsTrigger value="steps" className="flex items-center gap-2">
                  <PanelRight className="h-4 w-4" />
                  <span>Implementation Steps</span>
                </TabsTrigger>
              </TabsList>

              {/* Code Tab */}
              <TabsContent value="code" className="mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
                  <SyntaxHighlighter
                    language="typescript"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                    }}
                    showLineNumbers
                  >
                    {generatedFeature.implementation.generatedCode}
                  </SyntaxHighlighter>
                </div>
              </TabsContent>

              {/* Steps Tab */}
              <TabsContent value="steps" className="mt-4">
                <div className="space-y-6">
                  {generatedFeature.implementation.implementationSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm">{step}</p>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-4 items-center mt-4 py-4 border-t">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <p className="text-sm text-muted-foreground">
                      Review the implementation steps carefully before proceeding. Some steps may require manual intervention.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}