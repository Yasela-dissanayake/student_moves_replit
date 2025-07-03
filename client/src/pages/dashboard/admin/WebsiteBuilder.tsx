import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIWebsiteBuilder } from "@/components/admin/AIWebsiteBuilder";
import { AIWebsiteBuilderChat } from "@/components/admin/AIWebsiteBuilderChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Code2, Rocket, AlertTriangle, MessageCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Admin WebsiteBuilder Page Component
 * Provides tools and features for website building and feature generation.
 */
export default function WebsiteBuilder() {
  const [, setLocation] = useLocation();
  // State for selected tab
  const [activeTab, setActiveTab] = useState("ai-builder");

  // State for feature history
  const [featuresHistory, setFeaturesHistory] = useState<Array<{
    date: Date;
    name: string;
    description: string;
    status: "completed" | "in-progress" | "failed";
  }>>([
    {
      date: new Date("2025-03-15"),
      name: "Virtual Property Tour",
      description: "360° virtual tour integration for property listings",
      status: "completed"
    },
    {
      date: new Date("2025-03-20"),
      name: "Student Reviews",
      description: "Add university-verified student reviews for properties",
      status: "completed"
    },
    {
      date: new Date("2025-03-28"),
      name: "Roommate Finder",
      description: "Automated roommate matching based on preferences",
      status: "in-progress"
    }
  ]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Website Builder</h1>
            <p className="text-muted-foreground">
              Build and enhance the platform with AI-powered feature generation
            </p>
          </div>
        </div>

        <Tabs defaultValue="ai-builder" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="ai-builder" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Builder</span>
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center gap-2 hidden md:flex">
              <Rocket className="h-4 w-4" />
              <span>Deploy</span>
            </TabsTrigger>
          </TabsList>

          {/* AI Builder Tab */}
          <TabsContent value="ai-builder">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Feature Generator
                  </CardTitle>
                  <CardDescription>
                    Describe the feature you want to add to the platform, and our AI will generate the implementation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIWebsiteBuilder
                    onFeatureGenerated={(feature: { name: string; description: string }) => {
                      // Add the generated feature to history
                      setFeaturesHistory(prev => [
                        {
                          date: new Date(),
                          name: feature.name || "New Feature",
                          description: feature.description || "",
                          status: "completed"
                        },
                        ...prev
                      ]);

                      // Switch to history tab
                      setActiveTab("history");
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="ai-chat">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    AI Chat Interface
                  </CardTitle>
                  <CardDescription>
                    Have a conversation with our AI assistant to build and implement new features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIWebsiteBuilderChat 
                    onFeatureGenerated={(feature) => {
                      // Add the generated feature to history
                      setFeaturesHistory(prev => [
                        {
                          date: new Date(),
                          name: feature.name || "New Feature",
                          description: feature.description || "",
                          status: "completed"
                        },
                        ...prev
                      ]);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feature History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Feature Implementation History</CardTitle>
                <CardDescription>
                  View and manage previously generated features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuresHistory.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      No features have been generated yet
                    </div>
                  ) : (
                    featuresHistory.map((feature, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{feature.name}</h3>
                            {feature.status === "in-progress" && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                In Progress
                              </span>
                            )}
                            {feature.status === "completed" && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Completed
                              </span>
                            )}
                            {feature.status === "failed" && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Failed
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {feature.date.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">View Code</Button>
                          <Button variant="outline" size="sm">Deploy</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Deployment Manager
                </CardTitle>
                <CardDescription>
                  Deploy your features to production or staging environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Production Deployment</h4>
                      <p className="text-sm mt-1">
                        Deploying code to production requires admin approval. Contact the development team to schedule a deployment.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-3 font-medium">
                      Staging Environment
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Deploy your changes to the staging environment for testing before production.
                      </p>
                      <Button>
                        Deploy to Staging
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}