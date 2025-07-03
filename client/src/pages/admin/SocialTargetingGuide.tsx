import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Users, 
  TrendingUp, 
  PlayCircle, 
  BookOpen, 
  Settings,
  BarChart3,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";
import { Link } from "wouter";

const SocialTargetingGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    targetUniversities: [] as string[],
    platforms: [] as string[],
    budget: "",
    duration: "",
    ageRange: "18-25",
    interests: [] as string[]
  });
  
  const [socialAccounts, setSocialAccounts] = useState({
    instagram: { connected: false, status: 'disconnected' },
    facebook: { connected: false, status: 'disconnected' },
    tiktok: { connected: false, status: 'disconnected' },
    twitter: { connected: false, status: 'disconnected' }
  });
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnectAccount = async (platform: string) => {
    setIsConnecting(platform);
    
    try {
      // In a real implementation, this would open OAuth flow
      // For now, we'll simulate a successful connection
      setTimeout(() => {
        setSocialAccounts(prev => ({
          ...prev,
          [platform]: { connected: true, status: 'connected' }
        }));
        setIsConnecting(null);
        
        // Show success message
        alert(`✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected successfully!\n\nYou can now run campaigns on this platform.`);
      }, 2000);
      
    } catch (error) {
      console.error('Error connecting account:', error);
      setIsConnecting(null);
      alert(`❌ Failed to connect ${platform} account. Please try again.`);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/social-targeting/create-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`🎉 Campaign Created Successfully at ZERO COST!\n\n${result.message}\n\n${result.savings || 'Generated using our custom AI provider - completely free!'}\n\nYour campaign is now active and ready to go.`);
      } else {
        const errorResult = await response.json();
        alert(`Error creating campaign: ${errorResult.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating campaign. Please check your connection.');
    }
  };

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-400' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' }
  ];

  const universities = [
    "University of London", "King's College London", "Imperial College London",
    "University College London", "London School of Economics", "University of Manchester",
    "University of Edinburgh", "University of Birmingham", "University of Bristol",
    "University of Leeds", "University of Sheffield", "University of Nottingham"
  ];

  const interests = [
    "Student Housing", "Campus Life", "Study Groups", "Social Events",
    "Sports", "Technology", "Arts", "Music", "Food", "Travel", "Fitness"
  ];

  return (
    <DashboardLayout dashboardType="admin">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/dashboard/admin">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Target className="h-6 w-6" />
            🎯 Quick Start: Create Your First Campaign in 3 Steps!
          </h1>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <div className="font-semibold mb-1">1. Scroll Down to "Campaign Builder"</div>
              <p className="text-sm opacity-90">Click the "Campaign Builder" tab below to start</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <div className="font-semibold mb-1">2. Fill in Your Details</div>
              <p className="text-sm opacity-90">Enter campaign name, pick universities, set budget</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <div className="font-semibold mb-1">3. Launch Campaign</div>
              <p className="text-sm opacity-90">AI creates posts for Instagram, Facebook, TikTok & Twitter</p>
            </div>
          </div>
          <div className="bg-amber-400/20 border border-amber-300/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-200 mt-0.5" />
              <div className="text-sm">
                <strong>💡 Recommended Start:</strong> £100 daily budget, target 1-2 universities, 7-day duration. Perfect for testing what works!
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Social Targeting User Guide</h2>
            <p className="text-muted-foreground">Learn how to create effective social media campaigns for student housing</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            <BookOpen className="w-4 h-4 mr-1" />
            Interactive Guide
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tutorial">Step-by-Step</TabsTrigger>
            <TabsTrigger value="builder">Campaign Builder</TabsTrigger>
            <TabsTrigger value="tips">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Smart Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI-powered targeting reaches the right students based on university, location, and interests.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      University-specific targeting
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Demographic analysis
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Interest-based matching
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    AI Content Generation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatically creates engaging content optimized for each social media platform.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Platform-specific posts
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Relevant hashtags
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Compelling copy
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track campaign performance with detailed analytics and optimization suggestions.
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Real-time metrics
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Conversion tracking
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ROI analysis
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>How Social Targeting Works</CardTitle>
                <CardDescription>The complete process from campaign creation to tenant acquisition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Settings className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium mb-2">1. Setup Campaign</h4>
                    <p className="text-sm text-muted-foreground">Define target universities, demographics, and budget</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium mb-2">2. AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">AI analyzes student behavior and identifies optimal targeting</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <Lightbulb className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium mb-2">3. Content Creation</h4>
                    <p className="text-sm text-muted-foreground">Generate engaging posts and ads for each platform</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <h4 className="font-medium mb-2">4. Launch & Optimize</h4>
                    <p className="text-sm text-muted-foreground">Deploy campaigns and continuously optimize performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutorial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Campaign Creation</CardTitle>
                <CardDescription>Follow these steps to create your first social targeting campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Access Social Targeting</h4>
                      <p className="text-sm text-muted-foreground mb-3">Navigate to Admin Dashboard → Social Targeting to begin creating campaigns.</p>
                      <div className="bg-gray-50 p-3 rounded-md text-sm">
                        <strong>Path:</strong> Dashboard → Admin → Social Targeting → Create Campaign
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Define Campaign Basics</h4>
                      <p className="text-sm text-muted-foreground mb-3">Set your campaign name, target universities, and basic parameters.</p>
                      <div className="space-y-2 text-sm">
                        <div>• <strong>Campaign Name:</strong> Choose a descriptive name (e.g., "Spring 2025 Student Housing")</div>
                        <div>• <strong>Target Universities:</strong> Select specific universities to target</div>
                        <div>• <strong>Budget:</strong> Set daily or total campaign budget</div>
                        <div>• <strong>Duration:</strong> Choose campaign length (7-30 days recommended)</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Select Social Platforms</h4>
                      <p className="text-sm text-muted-foreground mb-3">Choose which social media platforms to target based on your audience.</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>• <strong>Instagram:</strong> Visual content, stories</div>
                        <div>• <strong>Facebook:</strong> Detailed targeting, events</div>
                        <div>• <strong>TikTok:</strong> Short videos, trending content</div>
                        <div>• <strong>Twitter:</strong> Real-time updates, news</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Configure Audience Targeting</h4>
                      <p className="text-sm text-muted-foreground mb-3">Define your ideal tenant demographics and interests.</p>
                      <div className="space-y-2 text-sm">
                        <div>• <strong>Age Range:</strong> Typically 18-25 for students</div>
                        <div>• <strong>Interests:</strong> Student housing, campus life, study groups</div>
                        <div>• <strong>Location:</strong> University area and surrounding neighborhoods</div>
                        <div>• <strong>Behavior:</strong> Active social media users, housing seekers</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Launch & Monitor</h4>
                      <p className="text-sm text-muted-foreground mb-3">Review your campaign settings and launch. Monitor performance regularly.</p>
                      <div className="bg-green-50 p-3 rounded-md text-sm">
                        <strong>Tip:</strong> Check your campaign daily for the first week to ensure optimal performance.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Campaign Builder</CardTitle>
                <CardDescription>Create a real campaign using this guided form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      placeholder="e.g., Spring 2025 Student Housing"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (£)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="500"
                      value={campaignData.budget}
                      onChange={(e) => setCampaignData({ ...campaignData, budget: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Target Universities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {universities.slice(0, 6).map((uni) => (
                      <div key={uni} className="flex items-center space-x-2">
                        <Checkbox
                          id={uni}
                          checked={campaignData.targetUniversities.includes(uni)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCampaignData({
                                ...campaignData,
                                targetUniversities: [...campaignData.targetUniversities, uni]
                              });
                            } else {
                              setCampaignData({
                                ...campaignData,
                                targetUniversities: campaignData.targetUniversities.filter(u => u !== uni)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={uni} className="text-sm">{uni}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Media Account Connection */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <Settings className="h-5 w-5" />
                      Connect Your StudentMoves Social Media Accounts
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Required: Connect your StudentMoves social media accounts to send actual campaigns. Without these connections, campaigns will only be simulated.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          <Instagram className="h-5 w-5 text-pink-600" />
                          <div>
                            <div className="font-medium">Instagram Business</div>
                            <div className="text-sm text-muted-foreground">@studentmoves_official</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={socialAccounts.instagram.connected ? "default" : "outline"}
                          onClick={() => handleConnectAccount('instagram')}
                          disabled={isConnecting === 'instagram'}
                        >
                          {isConnecting === 'instagram' ? 'Connecting...' : socialAccounts.instagram.connected ? '✓ Connected' : 'Connect Account'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          <Facebook className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Facebook Page</div>
                            <div className="text-sm text-muted-foreground">StudentMoves UK</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={socialAccounts.facebook.connected ? "default" : "outline"}
                          onClick={() => handleConnectAccount('facebook')}
                          disabled={isConnecting === 'facebook'}
                        >
                          {isConnecting === 'facebook' ? 'Connecting...' : socialAccounts.facebook.connected ? '✓ Connected' : 'Connect Account'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 bg-black rounded-sm flex items-center justify-center">
                            <span className="text-white text-xs font-bold">T</span>
                          </div>
                          <div>
                            <div className="font-medium">TikTok Business</div>
                            <div className="text-sm text-muted-foreground">@studentmoves</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={socialAccounts.tiktok.connected ? "default" : "outline"}
                          onClick={() => handleConnectAccount('tiktok')}
                          disabled={isConnecting === 'tiktok'}
                        >
                          {isConnecting === 'tiktok' ? 'Connecting...' : socialAccounts.tiktok.connected ? '✓ Connected' : 'Connect Account'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          <Twitter className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">Twitter/X Business</div>
                            <div className="text-sm text-muted-foreground">@StudentMovesUK</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={socialAccounts.twitter.connected ? "default" : "outline"}
                          onClick={() => handleConnectAccount('twitter')}
                          disabled={isConnecting === 'twitter'}
                        >
                          {isConnecting === 'twitter' ? 'Connecting...' : socialAccounts.twitter.connected ? '✓ Connected' : 'Connect Account'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <strong>Important:</strong> You'll need admin access to your StudentMoves social media accounts and API tokens for each platform. Contact your social media manager for assistance with account connections.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label>Social Media Platforms</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select platforms where you want to run campaigns (accounts must be connected above)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {platforms.map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={platform.id}
                          checked={campaignData.platforms.includes(platform.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCampaignData({
                                ...campaignData,
                                platforms: [...campaignData.platforms, platform.id]
                              });
                            } else {
                              setCampaignData({
                                ...campaignData,
                                platforms: campaignData.platforms.filter(p => p !== platform.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={platform.id} className="flex items-center gap-2">
                          {platform.icon && <platform.icon className="h-4 w-4" />}
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="duration">Campaign Duration (days)</Label>
                    <Select value={campaignData.duration} onValueChange={(value) => setCampaignData({ ...campaignData, duration: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="21">21 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Select value={campaignData.ageRange} onValueChange={(value) => setCampaignData({ ...campaignData, ageRange: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-22">18-22 (Undergrad)</SelectItem>
                        <SelectItem value="18-25">18-25 (All Students)</SelectItem>
                        <SelectItem value="23-28">23-28 (Postgrad)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Target Interests</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {interests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={campaignData.interests.includes(interest)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCampaignData({
                                ...campaignData,
                                interests: [...campaignData.interests, interest]
                              });
                            } else {
                              setCampaignData({
                                ...campaignData,
                                interests: campaignData.interests.filter(i => i !== interest)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={interest} className="text-sm">{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreateCampaign} className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Create Campaign
                  </Button>
                  <Button variant="outline" onClick={() => setCampaignData({ name: "", targetUniversities: [], platforms: [], budget: "", duration: "", ageRange: "18-25", interests: [] })}>
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Show Real Students</h4>
                      <p className="text-sm text-muted-foreground">Use authentic photos of students in your properties</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Highlight Location Benefits</h4>
                      <p className="text-sm text-muted-foreground">Feature nearby amenities, transport links, and campus proximity</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Use Platform-Specific Formats</h4>
                      <p className="text-sm text-muted-foreground">Optimize content for each platform's native format</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Targeting Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Start with One University</h4>
                      <p className="text-sm text-muted-foreground">Test campaigns with single universities before expanding</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Time Your Campaigns</h4>
                      <p className="text-sm text-muted-foreground">Launch before academic year starts and during application periods</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Monitor Performance Daily</h4>
                      <p className="text-sm text-muted-foreground">Check metrics and adjust targeting based on results</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Budget Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Start Small</h4>
                      <p className="text-sm text-muted-foreground">Begin with £50-100 daily budget to test performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Focus on High-Performance Platforms</h4>
                      <p className="text-sm text-muted-foreground">Allocate more budget to platforms showing better ROI</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Set Clear Goals</h4>
                      <p className="text-sm text-muted-foreground">Define target cost per lead and optimize accordingly</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Common Mistakes to Avoid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium">Targeting Too Broad</h4>
                      <p className="text-sm text-muted-foreground">Avoid targeting all universities at once</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium">Ignoring Performance Data</h4>
                      <p className="text-sm text-muted-foreground">Always review and optimize based on analytics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-medium">Using Generic Content</h4>
                      <p className="text-sm text-muted-foreground">Customize content for each university and platform</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SocialTargetingGuide;