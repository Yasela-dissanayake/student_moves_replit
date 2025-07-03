import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Megaphone, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Share2,
  Plus,
  BarChart3,
  MessageSquare,
  Clock,
  Target,
  Zap,
  Mail,
  Image,
  FileText,
  TrendingDown,
  Sparkles,
  CheckCircle,
  DollarSign,
  Settings
} from "lucide-react";
import AgentPageTemplate from "./AgentPageTemplate";

interface MarketingCampaign {
  id: number;
  name: string;
  type: 'social_media' | 'email' | 'property_listing' | 'advertisement';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string;
  budget: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  properties: number[];
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  totalBudget: number;
}

export default function Marketing() {
  console.log("Marketing component loaded with AI Generator tabs");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [openaiDialogOpen, setOpenaiDialogOpen] = useState(false);
  const [generationType, setGenerationType] = useState<'campaign' | 'social' | 'email' | 'description'>('campaign');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const [campaignData, setCampaignData] = useState({
    name: '',
    type: 'social_media' as const,
    targetAudience: '',
    budget: '',
    description: '',
    properties: [] as number[]
  });

  const [openaiData, setOpenaiData] = useState({
    targetAudience: 'students',
    propertyType: '',
    location: '',
    tone: 'professional',
    callToAction: '',
    uniqueSellingPoint: ''
  });

  // Data queries
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/agent/marketing/campaigns'],
    queryFn: () => apiRequest('GET', '/api/agent/marketing/campaigns'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/agent/marketing/stats'],
    queryFn: () => apiRequest('GET', '/api/agent/marketing/stats'),
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties/agent'],
    queryFn: () => apiRequest('GET', '/api/properties/agent'),
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: typeof campaignData) => 
      apiRequest('POST', '/api/agent/marketing/campaigns', data),
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your marketing campaign has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/marketing/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/marketing/stats'] });
      setIsCreateDialogOpen(false);
      setCampaignData({
        name: '',
        type: 'social_media',
        targetAudience: '',
        budget: '',
        description: '',
        properties: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  // OpenAI Generation Mutations
  const generateCampaignMutation = useMutation({
    mutationFn: (data: typeof openaiData) => 
      apiRequest('POST', '/api/marketing/generate-campaign', data),
    onSuccess: (result) => {
      setGeneratedContent(result.campaign);
      setIsGenerating(false);
      toast({
        title: "Campaign Generated Successfully",
        description: `Professional campaign created. ${result.costSavings}`,
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate campaign",
        variant: "destructive",
      });
    },
  });

  const generateSocialPostMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/marketing/generate-social-post', data),
    onSuccess: (result) => {
      setGeneratedContent(result.socialPost);
      setIsGenerating(false);
      toast({
        title: "Social Post Generated",
        description: "Professional social media content created",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate social post",
        variant: "destructive",
      });
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/marketing/generate-email-campaign', data),
    onSuccess: (result) => {
      setGeneratedContent(result.email);
      setIsGenerating(false);
      toast({
        title: "Email Campaign Generated",
        description: "Professional email campaign created",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email campaign",
        variant: "destructive",
      });
    },
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/marketing/generate-property-description', data),
    onSuccess: (result) => {
      setGeneratedContent(result.description);
      setIsGenerating(false);
      toast({
        title: "Property Description Generated",
        description: "Professional property description created",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate property description",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleInputChange = (field: string, value: any) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOpenAIInputChange = (field: string, value: any) => {
    setOpenaiData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(campaignData);
  };

  const handleCreateCampaign = () => {
    setIsCreateDialogOpen(true);
  };

  const handleGenerateContent = (type: 'campaign' | 'social' | 'email' | 'description') => {
    setGenerationType(type);
    setIsGenerating(true);
    setGeneratedContent(null);

    // Generate content based on type
    if (type === 'campaign') {
      generateCampaignMutation.mutate(openaiData);
    } else if (type === 'social') {
      generateSocialPostMutation.mutate({
        platform: 'instagram',
        purpose: 'promotional',
        propertyType: openaiData.propertyType,
        targetAudience: openaiData.targetAudience,
        tone: openaiData.tone,
        callToAction: openaiData.callToAction
      });
    } else if (type === 'email') {
      generateEmailMutation.mutate({
        purpose: 'promotional',
        recipientType: openaiData.targetAudience,
        subject: `Amazing Student Properties in ${openaiData.location}`,
        callToAction: openaiData.callToAction,
        brandVoice: openaiData.tone
      });
    } else if (type === 'description') {
      generateDescriptionMutation.mutate({
        title: `Student Property in ${openaiData.location}`,
        propertyType: openaiData.propertyType,
        location: openaiData.location,
        tone: openaiData.tone,
        targetAudience: openaiData.targetAudience
      });
    }
  };

  // Calculate campaign stats with fallback values
  const campaignStats: CampaignStats = stats || {
    totalCampaigns: campaigns.length || 0,
    activeCampaigns: campaigns.filter((c: MarketingCampaign) => c.status === 'active').length || 0,
    totalImpressions: campaigns.reduce((sum: number, c: MarketingCampaign) => sum + (c.impressions || 0), 0),
    totalClicks: campaigns.reduce((sum: number, c: MarketingCampaign) => sum + (c.clicks || 0), 0),
    totalConversions: campaigns.reduce((sum: number, c: MarketingCampaign) => sum + (c.conversions || 0), 0),
    averageCTR: 0,
    totalBudget: campaigns.reduce((sum: number, c: MarketingCampaign) => sum + (c.budget || 0), 0)
  };

  // Calculate CTR
  if (campaignStats.totalImpressions > 0) {
    campaignStats.averageCTR = (campaignStats.totalClicks / campaignStats.totalImpressions) * 100;
  }

  return (
    <AgentPageTemplate title="Marketing">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {campaignStats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.averageCTR.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {campaignStats.totalClicks} total clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{campaignStats.totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {campaignStats.totalConversions} conversions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Credentials & AI Generator Notice */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-900">AI Marketing Generator Active</h3>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Click the tabs below to access Overview, Campaigns, and AI Generator with £33,600-99,600 annual savings
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-900">Connect Social Accounts</h3>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Link Instagram, Facebook, Twitter & email accounts for automated publishing
                </p>
              </div>
              <Button 
                onClick={() => window.open('/dashboard/agent/social-media-credentials', '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Manage Accounts
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md bg-white border-2 border-blue-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
              📊 Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
              📢 Campaigns
            </TabsTrigger>
            <TabsTrigger value="openai-generator" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">
              ✨ AI Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Impression Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Click Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${Math.min(campaignStats.averageCTR * 10, 100)}%` }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{campaignStats.averageCTR.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Conversion Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">4.5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5 text-orange-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Student Campaign launched</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Property listing promoted</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Email campaign completed</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Marketing Campaigns</h3>
              <Button onClick={handleCreateCampaign}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>

            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((campaign: MarketingCampaign) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardDescription>{campaign.type.replace('_', ' ')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">£{campaign.budget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Impressions:</span>
                          <span className="font-medium">{campaign.impressions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clicks:</span>
                          <span className="font-medium">{campaign.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Properties:</span>
                          <span className="font-medium">{campaign.properties?.length || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Megaphone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Marketing Campaigns</h3>
                  <p className="text-muted-foreground mb-4">
                    Start promoting your properties with targeted marketing campaigns
                  </p>
                  <Button onClick={handleCreateCampaign}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="openai-generator" className="space-y-4">
            {/* Cost Comparison Header */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-green-800">OpenAI Marketing Generator</h3>
                  <p className="text-green-600">Save 95-98% on marketing costs vs traditional agencies</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-700">£33,600-99,600</div>
                  <div className="text-sm text-green-600">Annual Savings</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-red-700 mb-2">Traditional Agency</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Campaign Creation:</span>
                      <span className="font-medium">£500-2000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Social Media Posts:</span>
                      <span className="font-medium">£50-200 each</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Campaigns:</span>
                      <span className="font-medium">£200-800</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Retainer:</span>
                      <span className="font-medium">£2000-5000</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-red-700">
                        <span>Monthly Total:</span>
                        <span>£2850-8500</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-green-700 mb-2">OpenAI Powered</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Campaign Creation:</span>
                      <span className="font-medium">£2-8</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Social Media Posts:</span>
                      <span className="font-medium">£0.50-2 each</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Campaigns:</span>
                      <span className="font-medium">£1-4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly API Cost:</span>
                      <span className="font-medium">£50-200</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Monthly Total:</span>
                        <span>£54-217</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                  Campaign Configuration
                </CardTitle>
                <CardDescription>Configure your marketing campaign parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={openaiData.targetAudience}
                      onValueChange={(value) => handleOpenAIInputChange('targetAudience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="graduates">Graduates</SelectItem>
                        <SelectItem value="professionals">Young Professionals</SelectItem>
                        <SelectItem value="international">International Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    <Input
                      value={openaiData.propertyType}
                      onChange={(e) => handleOpenAIInputChange('propertyType', e.target.value)}
                      placeholder="e.g., House Share, Studio, 1-bed flat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      value={openaiData.location}
                      onChange={(e) => handleOpenAIInputChange('location', e.target.value)}
                      placeholder="e.g., Manchester, London, Birmingham"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Campaign Tone</Label>
                    <Select
                      value={openaiData.tone}
                      onValueChange={(value) => handleOpenAIInputChange('tone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="informative">Informative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="callToAction">Call to Action</Label>
                    <Input
                      value={openaiData.callToAction}
                      onChange={(e) => handleOpenAIInputChange('callToAction', e.target.value)}
                      placeholder="e.g., Book a viewing today"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uniqueSellingPoint">Unique Selling Point</Label>
                    <Input
                      value={openaiData.uniqueSellingPoint}
                      onChange={(e) => handleOpenAIInputChange('uniqueSellingPoint', e.target.value)}
                      placeholder="e.g., Near university, Bills included"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Tools - Enhanced Visual Design */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
                🚀 Click Any Button Below to Generate Content Instantly
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Campaign Generator */}
                <div 
                  className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleGenerateContent('campaign')}
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-xl shadow-lg hover:shadow-2xl border-4 border-blue-300 hover:border-blue-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full mr-4">
                          <Zap className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">Full Campaign Generator</h4>
                          <p className="text-blue-100">Complete multi-channel campaigns</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg mb-4">
                      <p className="text-white text-sm mb-2">
                        ✅ Email campaigns ✅ Social media posts ✅ SMS content ✅ Landing pages
                      </p>
                      <div className="text-green-300 font-bold">💰 Save £500-2000 per campaign</div>
                    </div>
                    <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 text-lg">
                      🎯 GENERATE CAMPAIGN NOW
                    </Button>
                  </div>
                </div>

                {/* Social Posts Generator */}
                <div 
                  className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleGenerateContent('social')}
                >
                  <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-xl shadow-lg hover:shadow-2xl border-4 border-purple-300 hover:border-purple-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full mr-4">
                          <Share2 className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">Social Media Posts</h4>
                          <p className="text-purple-100">Instagram, Facebook, TikTok content</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-800 bg-opacity-50 p-4 rounded-lg mb-4">
                      <p className="text-white text-sm mb-2">
                        📱 Platform optimized ✨ Trending hashtags 🎨 Visual content ideas
                      </p>
                      <div className="text-green-300 font-bold">💰 Save £50-200 per post</div>
                    </div>
                    <Button className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold py-3 text-lg">
                      📱 CREATE SOCIAL POSTS
                    </Button>
                  </div>
                </div>

                {/* Email Campaign Generator */}
                <div 
                  className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleGenerateContent('email')}
                >
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-xl shadow-lg hover:shadow-2xl border-4 border-orange-300 hover:border-orange-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full mr-4">
                          <Mail className="h-8 w-8 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">Email Campaigns</h4>
                          <p className="text-orange-100">Professional email marketing</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-800 bg-opacity-50 p-4 rounded-lg mb-4">
                      <p className="text-white text-sm mb-2">
                        📧 Subject lines 📈 A/B test variants 🎯 High conversion copy
                      </p>
                      <div className="text-green-300 font-bold">💰 Save £200-800 per campaign</div>
                    </div>
                    <Button className="w-full bg-white text-orange-700 hover:bg-orange-50 font-bold py-3 text-lg">
                      📧 GENERATE EMAIL CAMPAIGN
                    </Button>
                  </div>
                </div>

                {/* Property Descriptions Generator */}
                <div 
                  className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  onClick={() => handleGenerateContent('description')}
                >
                  <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-xl shadow-lg hover:shadow-2xl border-4 border-green-300 hover:border-green-400">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-full mr-4">
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white">Property Descriptions</h4>
                          <p className="text-green-100">SEO-optimized listings</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-800 bg-opacity-50 p-4 rounded-lg mb-4">
                      <p className="text-white text-sm mb-2">
                        🔍 SEO optimized 💡 Compelling copy ⭐ High conversion rates
                      </p>
                      <div className="text-green-300 font-bold">💰 Save £100-500 per description</div>
                    </div>
                    <Button className="w-full bg-white text-green-700 hover:bg-green-50 font-bold py-3 text-lg">
                      📄 CREATE DESCRIPTION NOW
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Loading State Indicator */}
              {isGenerating && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                    <span className="text-yellow-800 font-medium text-lg">
                      🤖 AI is generating your {generationType} content...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Content Display */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    Generated Content - {generationType.charAt(0).toUpperCase() + generationType.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(generatedContent, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline">
                      Copy Content
                    </Button>
                    <Button variant="outline">
                      Save as Template
                    </Button>
                    <Button>
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Campaign Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
              <DialogDescription>
                Set up a new marketing campaign for your properties
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCampaign} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={campaignData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter campaign name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <Select
                  value={campaignData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="property_listing">Property Listing</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={campaignData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="e.g., Students in Manchester"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (£)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={campaignData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="Enter budget amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your campaign goals and strategy"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaignMutation.isPending}>
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AgentPageTemplate>
  );
}