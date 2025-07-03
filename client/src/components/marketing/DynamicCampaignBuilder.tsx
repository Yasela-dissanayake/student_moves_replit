import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Target, MessageSquare, Image, BarChart3, ArrowRight, Save, Zap } from "lucide-react";

// Import interfaces from api.ts
import { CampaignContent, CampaignInsights } from "@/lib/api";

// Local interfaces
interface AudienceInsight {
  segment: string;
  interests: string[];
  activity: string;
  engagementRate: number;
  recommendedApproach: string;
}

interface DynamicCampaignBuilderProps {
  campaignData: {
    name: string;
    description: string;
    targetDemographic: string;
    targetUniversities: string[];
    studentInterests: string[];
    socialMediaPlatforms: string[];
  };
  onContentGenerated: (content: CampaignContent[], insights: CampaignInsights) => void;
  onSaveDraft: (content: CampaignContent[]) => void;
}

const DynamicCampaignBuilder: React.FC<DynamicCampaignBuilderProps> = ({
  campaignData,
  onContentGenerated,
  onSaveDraft,
}) => {
  const [activeTab, setActiveTab] = useState("audience");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [audienceRefinements, setAudienceRefinements] = useState({
    ageRange: [18, 25],
    interestLevel: "medium", // low, medium, high
    activityLevel: "medium", // low, medium, high
    devicePreference: "mobile", // mobile, desktop, both
  });
  const [campaignInsights, setCampaignInsights] = useState<CampaignInsights | null>(null);
  const [campaignContent, setCampaignContent] = useState<CampaignContent[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    campaignData.socialMediaPlatforms[0] || "instagram"
  );
  const [contentTone, setContentTone] = useState("casual");
  const [includeImages, setIncludeImages] = useState(true);
  const { toast } = useToast();

  // Platform-specific content templates
  const contentTemplates = {
    instagram: {
      postLength: "medium",
      hashtagCount: 5,
      imageRequired: true,
    },
    facebook: {
      postLength: "long",
      hashtagCount: 3,
      imageRequired: true,
    },
    twitter: {
      postLength: "short",
      hashtagCount: 2,
      imageRequired: false,
    },
    tiktok: {
      postLength: "very short",
      hashtagCount: 4,
      imageRequired: false,
    },
    linkedin: {
      postLength: "long",
      hashtagCount: 1,
      imageRequired: true,
    },
  };

  // Load saved content if available
  useEffect(() => {
    // This would load from a server-side saved draft if implemented
    // For now, we'll initialize with empty content for each platform
    if (campaignData.socialMediaPlatforms.length > 0 && campaignContent.length === 0) {
      const initialContent = campaignData.socialMediaPlatforms.map(platform => ({
        postText: "",
        hashtags: [],
        callToAction: "",
        platform,
      }));
      setCampaignContent(initialContent);
    }
  }, [campaignData]);

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    
    try {
      // Import and use the API function
      const { generateCampaignInsights } = await import('@/lib/api');
      
      const response = await generateCampaignInsights({
        campaign: {
          name: campaignData.name,
          description: campaignData.description,
          targetDemographic: campaignData.targetDemographic,
          targetUniversities: campaignData.targetUniversities,
          studentInterests: campaignData.studentInterests,
          audienceRefinements: audienceRefinements
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate insights');
      }
      
      setCampaignInsights(data.insights);
      
      toast({
        title: "Insights Generated",
        description: "AI has analyzed your campaign and generated audience insights.",
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error Generating Insights",
        description: "There was a problem generating insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!campaignInsights) {
      toast({
        title: "Generate Insights First",
        description: "Please generate audience insights before creating content.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingContent(true);
    
    try {
      // Import and use the API function
      const { generateCampaignContent } = await import('@/lib/api');
      
      const response = await generateCampaignContent({
        campaign: {
          name: campaignData.name,
          description: campaignData.description,
          targetDemographic: campaignData.targetDemographic,
          targetUniversities: campaignData.targetUniversities,
          studentInterests: campaignData.studentInterests,
          platforms: campaignData.socialMediaPlatforms,
          contentTone,
          includeImages,
          insights: campaignInsights
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate content');
      }
      
      setCampaignContent(data.content);
      onContentGenerated(data.content, campaignInsights);
      
      toast({
        title: "Content Generated",
        description: `Created content for ${campaignData.socialMediaPlatforms.length} platform(s).`,
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error Generating Content",
        description: "There was a problem generating content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Import and use the API function
      const { saveCampaignDraft } = await import('@/lib/api');
      
      const response = await saveCampaignDraft({
        campaign: {
          name: campaignData.name,
          description: campaignData.description,
          targetDemographic: campaignData.targetDemographic,
          targetUniversities: campaignData.targetUniversities,
          studentInterests: campaignData.studentInterests,
          content: campaignContent
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to save draft');
      }
      
      onSaveDraft(campaignContent);
      
      toast({
        title: "Draft Saved",
        description: "Your campaign content draft has been saved.",
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error Saving Draft",
        description: "There was a problem saving your draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateContentForPlatform = (platform: string, field: keyof CampaignContent, value: any) => {
    setCampaignContent(prevContent => 
      prevContent.map(content => 
        content.platform === platform ? {...content, [field]: value} : content
      )
    );
  };

  const renderAudienceTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audience Refinement</CardTitle>
          <CardDescription>
            Fine-tune your audience targeting to improve campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Age Range</Label>
              <div className="text-sm text-muted-foreground">
                {audienceRefinements.ageRange[0]} - {audienceRefinements.ageRange[1]}
              </div>
            </div>
            <Slider
              defaultValue={audienceRefinements.ageRange}
              max={35}
              min={16}
              step={1}
              onValueChange={(value: number[]) => 
                setAudienceRefinements(prev => ({...prev, ageRange: value}))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Interest Level</Label>
              <Select 
                value={audienceRefinements.interestLevel}
                onValueChange={(value) => 
                  setAudienceRefinements(prev => ({...prev, interestLevel: value}))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interest level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Interest</SelectItem>
                  <SelectItem value="medium">Medium Interest</SelectItem>
                  <SelectItem value="high">High Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select 
                value={audienceRefinements.activityLevel}
                onValueChange={(value) => 
                  setAudienceRefinements(prev => ({...prev, activityLevel: value}))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Occasional Browsers</SelectItem>
                  <SelectItem value="medium">Regular Browsers</SelectItem>
                  <SelectItem value="high">Daily Active Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Device Preference</Label>
            <Select 
              value={audienceRefinements.devicePreference}
              onValueChange={(value) => 
                setAudienceRefinements(prev => ({...prev, devicePreference: value}))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile (Optimize for phones/tablets)</SelectItem>
                <SelectItem value="desktop">Desktop (Optimize for computers)</SelectItem>
                <SelectItem value="both">Both (Optimize for all devices)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights}
            className="w-full"
          >
            {isGeneratingInsights ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate AI Audience Insights
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {campaignInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Audience Insights
            </CardTitle>
            <CardDescription>
              AI-powered insights for your campaign audience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Target Audience Segments</h4>
              <ScrollArea className="h-48 rounded-md border p-4">
                {campaignInsights.targetAudience.map((segment, i) => (
                  <div key={i} className="mb-4 pb-4 border-b last:border-b-0">
                    <h5 className="font-semibold text-sm">{segment.segment}</h5>
                    <div className="flex flex-wrap gap-1 my-1">
                      {segment.interests.map((interest, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Activity:</span> {segment.activity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Engagement Rate:</span> {segment.engagementRate}%
                    </p>
                    <p className="text-xs mt-1">
                      <span className="font-medium">Recommended Approach:</span> {segment.recommendedApproach}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Recommended Hashtags</h4>
                <Badge 
                  variant="outline" 
                  className="text-xs font-normal"
                >
                  AI Recommended
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {campaignInsights.recommendedHashtags.map((hashtag, i) => (
                  <Badge key={i} className="text-xs">
                    {hashtag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Best Times to Post</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(campaignInsights.bestTimeToPost).map(([platform, times]) => (
                  <div key={platform} className="rounded-md border p-2">
                    <p className="text-sm font-medium capitalize">{platform}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {times.map((time, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Performance Prediction</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-md border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Est. Reach</p>
                  <p className="text-xl font-semibold">
                    {campaignInsights.performancePrediction.estimatedReach.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Est. Engagement</p>
                  <p className="text-xl font-semibold">
                    {campaignInsights.performancePrediction.estimatedEngagement.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-sm text-muted-foreground">Est. Conversions</p>
                  <p className="text-xl font-semibold">
                    {campaignInsights.performancePrediction.estimatedConversion.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => setActiveTab("content")}
              className="w-full"
            >
              Continue to Content Creation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Creation</CardTitle>
          <CardDescription>
            Generate engaging content for your social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Content Tone</Label>
              <Select 
                value={contentTone}
                onValueChange={setContentTone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="professional">Professional & Informative</SelectItem>
                  <SelectItem value="energetic">Energetic & Exciting</SelectItem>
                  <SelectItem value="informative">Educational & Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select 
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {campaignData.socialMediaPlatforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="include-images"
              checked={includeImages}
              onCheckedChange={setIncludeImages}
            />
            <Label htmlFor="include-images">Generate image prompts for AI image creation</Label>
          </div>

          {campaignInsights && (
            <div className="rounded-md bg-muted p-3">
              <h4 className="text-sm font-medium mb-2">Content Suggestions</h4>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {campaignInsights.contentSuggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleGenerateContent}
            disabled={isGeneratingContent || !campaignInsights}
            className="w-full"
          >
            {isGeneratingContent ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate AI Content for All Platforms
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {campaignContent.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Platform Content
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
            <CardDescription>
              Review and edit generated content for each platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={campaignContent[0]?.platform || "instagram"}
              value={selectedPlatform}
              onValueChange={setSelectedPlatform}
            >
              <TabsList className="mb-4">
                {campaignContent.map(content => (
                  <TabsTrigger key={content.platform} value={content.platform}>
                    {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {campaignContent.map(content => (
                <TabsContent key={content.platform} value={content.platform} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Post Text</Label>
                    <Textarea
                      placeholder="Enter post text"
                      value={content.postText}
                      onChange={(e) => updateContentForPlatform(content.platform, 'postText', e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  {includeImages && (
                    <div className="space-y-2">
                      <Label>Image Prompt for AI Generation</Label>
                      <Textarea
                        placeholder="Describe the image you want to generate"
                        value={content.imagePrompt}
                        onChange={(e) => updateContentForPlatform(content.platform, 'imagePrompt', e.target.value)}
                        className="min-h-[80px]"
                      />
                      {content.imageUrl && (
                        <div className="mt-2 rounded-md border p-2 text-center text-sm text-muted-foreground">
                          Image will be generated when campaign is launched
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {content.hashtags.map((hashtag, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                    <Input
                      placeholder="Add more hashtags (comma separated)"
                      onChange={(e) => {
                        const newHashtags = e.target.value.split(',').map(h => h.trim()).filter(h => h);
                        if (newHashtags.length > 0) {
                          updateContentForPlatform(
                            content.platform,
                            'hashtags',
                            [...content.hashtags, ...newHashtags]
                          );
                          e.target.value = '';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const newHashtags = input.value.split(',').map(h => h.trim()).filter(h => h);
                          if (newHashtags.length > 0) {
                            updateContentForPlatform(
                              content.platform,
                              'hashtags',
                              [...content.hashtags, ...newHashtags]
                            );
                            input.value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Call to Action</Label>
                    <Input
                      placeholder="Enter call to action"
                      value={content.callToAction}
                      onChange={(e) => updateContentForPlatform(content.platform, 'callToAction', e.target.value)}
                    />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Preview</h4>
                    <div className="rounded-md border p-4 space-y-3">
                      <p className="text-sm">{content.postText}</p>
                      
                      {includeImages && content.imageUrl && (
                        <div className="rounded-md bg-muted h-32 flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Image Preview</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1">
                        {content.hashtags.map((hashtag, i) => (
                          <span key={i} className="text-xs text-blue-500">{hashtag} </span>
                        ))}
                      </div>
                      
                      <p className="text-sm font-medium">{content.callToAction}</p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("audience")}>
              Back to Audience Insights
            </Button>
            <Button onClick={handleSaveDraft}>
              <Zap className="mr-2 h-4 w-4" />
              Save Campaign Content
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{campaignData.name}</h2>
          <p className="text-muted-foreground">{campaignData.description}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {campaignData.targetDemographic}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audience">
            <Target className="mr-2 h-4 w-4" />
            Audience Insights
          </TabsTrigger>
          <TabsTrigger value="content">
            <MessageSquare className="mr-2 h-4 w-4" />
            Content Creation
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="audience" className="mt-0">
            {renderAudienceTab()}
          </TabsContent>
          <TabsContent value="content" className="mt-0">
            {renderContentTab()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DynamicCampaignBuilder;