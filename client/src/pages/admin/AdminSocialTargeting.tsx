import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Users, TrendingUp, Info, Lightbulb, Play, Instagram, Facebook, Twitter, LinkIcon, Settings, Edit } from "lucide-react";
import { Link } from "wouter";

const AdminSocialTargeting: React.FC = () => {
  const [socialAccounts, setSocialAccounts] = useState({
    instagram: { 
      connected: false, 
      handle: '@studentmoves_official',
      accessToken: '',
      pageId: '',
      businessId: ''
    },
    facebook: { 
      connected: false, 
      handle: 'StudentMoves UK',
      accessToken: '',
      pageId: '',
      businessId: ''
    },
    tiktok: { 
      connected: false, 
      handle: '@studentmoves',
      accessToken: '',
      pageId: '',
      businessId: ''
    },
    twitter: { 
      connected: false, 
      handle: '@StudentMovesUK',
      accessToken: '',
      pageId: '',
      businessId: ''
    }
  });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    handle: '',
    accessToken: '',
    pageId: '',
    businessId: ''
  });

  const handleConnectAccount = async (platform: string) => {
    setIsConnecting(platform);
    
    // Simulate OAuth connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: { ...prev[platform as keyof typeof prev], connected: true }
    }));
    
    setIsConnecting(null);
  };

  const handleEditAccount = (platform: string) => {
    const account = socialAccounts[platform as keyof typeof socialAccounts];
    setEditForm({
      handle: account.handle,
      accessToken: account.accessToken,
      pageId: account.pageId,
      businessId: account.businessId
    });
    setEditingPlatform(platform);
  };

  const handleSaveAccount = () => {
    if (editingPlatform) {
      setSocialAccounts(prev => ({
        ...prev,
        [editingPlatform]: {
          ...prev[editingPlatform as keyof typeof prev],
          ...editForm
        }
      }));
      setEditingPlatform(null);
      setEditForm({
        handle: '',
        accessToken: '',
        pageId: '',
        businessId: ''
      });
    }
  };

  return (
    <DashboardLayout dashboardType="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard/AdminDashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4 text-center">
          <h1 className="text-2xl font-bold">🔥 TEST: CAN YOU SEE THIS RED BOX? 🔥</h1>
          <p>If you can see this red box, the page is working and changes are being applied!</p>
        </div>
        
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Social Targeting - Easy Campaign Creation</h2>
          <div className="flex gap-2">
            <Link to="/dashboard/admin/social-targeting-guide">
              <Button variant="outline">User Guide</Button>
            </Link>
            <Link to="/dashboard/admin/social-targeting-guide">
              <Button>Create Campaign</Button>
            </Link>
          </div>
        </div>

        {/* Zero Cost Campaign Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">Zero-Cost Campaign Creation</h3>
              <p className="text-sm opacity-90">Create unlimited social media campaigns at no cost using our custom AI provider</p>
            </div>
          </div>
        </div>

        {/* Credentials Status Overview */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Setup Progress - Social Media Accounts
          </h3>
          
          {/* Overall Progress Bar */}
          <div className="mb-6">
            {(() => {
              const totalPlatforms = Object.keys(socialAccounts).length;
              const configuredPlatforms = Object.values(socialAccounts).filter(account => 
                account.accessToken && account.handle
              ).length;
              const progressPercentage = Math.round((configuredPlatforms / totalPlatforms) * 100);
              
              return (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Setup Progress</span>
                    <span className="text-sm">{configuredPlatforms}/{totalPlatforms} platforms configured ({progressPercentage}%)</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(socialAccounts).map(([platform, account]) => {
              const hasCredentials = account.accessToken && account.handle;
              return (
                <div key={platform} className="bg-white/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${hasCredentials ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <h4 className="font-semibold capitalize">{platform}</h4>
                  </div>
                  <p className="text-sm opacity-90">
                    {hasCredentials ? 'Credentials configured' : 'Needs setup'}
                  </p>
                  {account.connected && <p className="text-xs text-green-200 mt-1">✓ Connected</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* How to Use Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="h-6 w-6" />
            🚀 How to Use Social Targeting - 3 Easy Steps
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/30 p-2 rounded-full">
                  <Play className="h-5 w-5" />
                </div>
                <h4 className="font-semibold">1. Click "Create Campaign"</h4>
              </div>
              <p className="text-sm opacity-90">Start targeting students on Instagram, Facebook, TikTok & Twitter</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/30 p-2 rounded-full">
                  <Target className="h-5 w-5" />
                </div>
                <h4 className="font-semibold">2. Set Your Target</h4>
              </div>
              <p className="text-sm opacity-90">Choose universities, age groups, and student interests</p>
            </div>
            <div className="bg-white/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/30 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="font-semibold">3. Watch Results</h4>
              </div>
              <p className="text-sm opacity-90">Track views, clicks, and property applications</p>
            </div>
          </div>
          <div className="mt-4 bg-amber-400/20 border border-amber-300/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-5 w-5 text-amber-200 mt-0.5" />
              <div className="text-sm">
                <strong>💡 Quick Start Tip:</strong> Begin with £100 daily budget targeting one university. AI automatically creates posts across all platforms to find students looking for housing!
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Account Connection Section */}
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="text-xl text-orange-800 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Social Media Account Management
            </CardTitle>
            <CardDescription className="text-orange-700">
              Manage your social media account credentials and settings. Click the edit button to update account details, usernames, and API credentials. Connect accounts to enable live campaign publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <div>
                    <div className="font-medium">Instagram Business</div>
                    <div className="text-sm text-muted-foreground">{socialAccounts.instagram.handle}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEditAccount('instagram')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Instagram Account</DialogTitle>
                        <DialogDescription>
                          Update your Instagram business account details and credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="handle">Handle/Username</Label>
                          <Input
                            id="handle"
                            value={editForm.handle}
                            onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value }))}
                            placeholder="@your_instagram_handle"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accessToken">Access Token</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            value={editForm.accessToken}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Your Instagram API access token"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pageId">Page/Account ID</Label>
                          <Input
                            id="pageId"
                            value={editForm.pageId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, pageId: e.target.value }))}
                            placeholder="Your Instagram business account ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="businessId">Business Manager ID</Label>
                          <Input
                            id="businessId"
                            value={editForm.businessId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, businessId: e.target.value }))}
                            placeholder="Your Facebook Business Manager ID"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAccount}>Save Account Details</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    size="sm" 
                    variant={socialAccounts.instagram.connected ? "default" : "outline"}
                    onClick={() => handleConnectAccount('instagram')}
                    disabled={isConnecting === 'instagram'}
                  >
                    {isConnecting === 'instagram' ? 'Connecting...' : socialAccounts.instagram.connected ? '✓ Connected' : 'Connect Account'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Facebook Page</div>
                    <div className="text-sm text-muted-foreground">{socialAccounts.facebook.handle}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEditAccount('facebook')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Facebook Account</DialogTitle>
                        <DialogDescription>
                          Update your Facebook business page details and credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="handle">Page Name</Label>
                          <Input
                            id="handle"
                            value={editForm.handle}
                            onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value }))}
                            placeholder="Your Facebook Page Name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accessToken">Page Access Token</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            value={editForm.accessToken}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Your Facebook Page access token"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pageId">Page ID</Label>
                          <Input
                            id="pageId"
                            value={editForm.pageId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, pageId: e.target.value }))}
                            placeholder="Your Facebook Page ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="businessId">Business Manager ID</Label>
                          <Input
                            id="businessId"
                            value={editForm.businessId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, businessId: e.target.value }))}
                            placeholder="Your Facebook Business Manager ID"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAccount}>Save Account Details</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    size="sm" 
                    variant={socialAccounts.facebook.connected ? "default" : "outline"}
                    onClick={() => handleConnectAccount('facebook')}
                    disabled={isConnecting === 'facebook'}
                  >
                    {isConnecting === 'facebook' ? 'Connecting...' : socialAccounts.facebook.connected ? '✓ Connected' : 'Connect Account'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  <div>
                    <div className="font-medium">TikTok Business</div>
                    <div className="text-sm text-muted-foreground">{socialAccounts.tiktok.handle}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEditAccount('tiktok')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit TikTok Account</DialogTitle>
                        <DialogDescription>
                          Update your TikTok business account details and credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="handle">Username/Handle</Label>
                          <Input
                            id="handle"
                            value={editForm.handle}
                            onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value }))}
                            placeholder="@your_tiktok_handle"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accessToken">Access Token</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            value={editForm.accessToken}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Your TikTok API access token"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pageId">Business Account ID</Label>
                          <Input
                            id="pageId"
                            value={editForm.pageId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, pageId: e.target.value }))}
                            placeholder="Your TikTok business account ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="businessId">Advertiser ID</Label>
                          <Input
                            id="businessId"
                            value={editForm.businessId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, businessId: e.target.value }))}
                            placeholder="Your TikTok advertiser ID"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAccount}>Save Account Details</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    size="sm" 
                    variant={socialAccounts.tiktok.connected ? "default" : "outline"}
                    onClick={() => handleConnectAccount('tiktok')}
                    disabled={isConnecting === 'tiktok'}
                  >
                    {isConnecting === 'tiktok' ? 'Connecting...' : socialAccounts.tiktok.connected ? '✓ Connected' : 'Connect Account'}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <Twitter className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Twitter/X Business</div>
                    <div className="text-sm text-muted-foreground">{socialAccounts.twitter.handle}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleEditAccount('twitter')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Twitter/X Account</DialogTitle>
                        <DialogDescription>
                          Update your Twitter/X business account details and credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="handle">Username/Handle</Label>
                          <Input
                            id="handle"
                            value={editForm.handle}
                            onChange={(e) => setEditForm(prev => ({ ...prev, handle: e.target.value }))}
                            placeholder="@your_twitter_handle"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accessToken">Bearer Token</Label>
                          <Input
                            id="accessToken"
                            type="password"
                            value={editForm.accessToken}
                            onChange={(e) => setEditForm(prev => ({ ...prev, accessToken: e.target.value }))}
                            placeholder="Your Twitter API bearer token"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pageId">User ID</Label>
                          <Input
                            id="pageId"
                            value={editForm.pageId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, pageId: e.target.value }))}
                            placeholder="Your Twitter user ID"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="businessId">Consumer Key</Label>
                          <Input
                            id="businessId"
                            value={editForm.businessId}
                            onChange={(e) => setEditForm(prev => ({ ...prev, businessId: e.target.value }))}
                            placeholder="Your Twitter API consumer key"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAccount}>Save Account Details</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Social media accounts must be connected to send actual campaigns. Unconnected accounts will only show campaign simulations.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reach</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,482</div>
              <p className="text-xs text-muted-foreground">Total audience</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-xs text-muted-foreground">Average rate</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Campaign Management</CardTitle>
            <CardDescription>Monitor and optimize social media targeting campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Student Housing Campaign</div>
                  <div className="text-sm text-muted-foreground">Target: University students</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">Analytics</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Property Showcase</div>
                  <div className="text-sm text-muted-foreground">Target: Young professionals</div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">Analytics</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSocialTargeting;