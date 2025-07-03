import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Link,
  Settings,
  Zap
} from "lucide-react";
import AgentPageTemplate from "./AgentPageTemplate";

interface SocialAccount {
  platform: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  pageId?: string;
  businessManagerId?: string;
  isConnected: boolean;
  lastSync: string;
}

interface EmailProvider {
  provider: string;
  email: string;
  apiKey: string;
  smtpServer?: string;
  smtpPort?: number;
  isConnected: boolean;
  lastSync: string;
}

export default function SocialMediaCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  // Social media account states
  const [socialAccounts, setSocialAccounts] = useState<{[key: string]: SocialAccount}>({
    instagram: {
      platform: "Instagram",
      username: "",
      accessToken: "",
      refreshToken: "",
      isConnected: false,
      lastSync: ""
    },
    facebook: {
      platform: "Facebook", 
      username: "",
      accessToken: "",
      refreshToken: "",
      pageId: "",
      businessManagerId: "",
      isConnected: false,
      lastSync: ""
    },
    twitter: {
      platform: "Twitter/X",
      username: "",
      accessToken: "",
      refreshToken: "",
      isConnected: false,
      lastSync: ""
    },
    tiktok: {
      platform: "TikTok",
      username: "",
      accessToken: "",
      refreshToken: "",
      isConnected: false,
      lastSync: ""
    }
  });

  // Email provider states
  const [emailProviders, setEmailProviders] = useState<{[key: string]: EmailProvider}>({
    gmail: {
      provider: "Gmail",
      email: "",
      apiKey: "",
      isConnected: false,
      lastSync: ""
    },
    outlook: {
      provider: "Outlook",
      email: "",
      apiKey: "",
      smtpServer: "smtp-mail.outlook.com",
      smtpPort: 587,
      isConnected: false,
      lastSync: ""
    },
    sendgrid: {
      provider: "SendGrid",
      email: "",
      apiKey: "",
      isConnected: false,
      lastSync: ""
    },
    mailchimp: {
      provider: "Mailchimp",
      email: "",
      apiKey: "",
      isConnected: false,
      lastSync: ""
    }
  });

  // Fetch existing credentials
  const { data: credentials, isLoading } = useQuery({
    queryKey: ['/api/agent/social-credentials'],
    queryFn: () => apiRequest('GET', '/api/agent/social-credentials'),
  });

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('POST', '/api/agent/social-credentials', data),
    onSuccess: () => {
      toast({
        title: "Credentials Saved",
        description: "Your social media and email credentials have been saved securely",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agent/social-credentials'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (data: { type: string; platform: string; credentials: any }) => 
      apiRequest('POST', '/api/agent/test-connection', data),
    onSuccess: (result, variables) => {
      if (variables.type === 'social') {
        setSocialAccounts(prev => ({
          ...prev,
          [variables.platform]: {
            ...prev[variables.platform],
            isConnected: result.success,
            lastSync: new Date().toISOString()
          }
        }));
      } else {
        setEmailProviders(prev => ({
          ...prev,
          [variables.platform]: {
            ...prev[variables.platform],
            isConnected: result.success,
            lastSync: new Date().toISOString()
          }
        }));
      }
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const toggleTokenVisibility = (platform: string) => {
    setShowTokens(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const updateSocialAccount = (platform: string, field: string, value: string) => {
    setSocialAccounts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const updateEmailProvider = (platform: string, field: string, value: string | number) => {
    setEmailProviders(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleSaveCredentials = () => {
    const data = {
      socialAccounts,
      emailProviders
    };
    saveCredentialsMutation.mutate(data);
  };

  const testConnection = (type: 'social' | 'email', platform: string) => {
    const credentials = type === 'social' 
      ? socialAccounts[platform] 
      : emailProviders[platform];
    
    testConnectionMutation.mutate({
      type,
      platform,
      credentials
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
      case 'gmail': 
      case 'outlook':
      case 'sendgrid':
      case 'mailchimp': return <Mail className="h-5 w-5 text-green-600" />;
      default: return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <AgentPageTemplate title="Social Media & Email Credentials">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">Secure Credential Management</h3>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Connect your social media accounts and email providers to enable automated campaign publishing and management.
          </p>
        </div>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="social">📱 Social Media</TabsTrigger>
            <TabsTrigger value="email">📧 Email Providers</TabsTrigger>
          </TabsList>

          {/* Social Media Accounts */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(socialAccounts).map(([key, account]) => (
                <Card key={key} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getPlatformIcon(account.platform)}
                        <span className="ml-2">{account.platform}</span>
                      </div>
                      <Badge variant={account.isConnected ? "default" : "secondary"}>
                        {account.isConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Configure your {account.platform} account for automated posting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`${key}-username`}>Username/Handle</Label>
                        <Input
                          id={`${key}-username`}
                          value={account.username}
                          onChange={(e) => updateSocialAccount(key, 'username', e.target.value)}
                          placeholder="@yourusername"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`${key}-token`}>Access Token</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`${key}-token`}
                            type={showTokens[key] ? "text" : "password"}
                            value={account.accessToken}
                            onChange={(e) => updateSocialAccount(key, 'accessToken', e.target.value)}
                            placeholder="Enter access token"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTokenVisibility(key)}
                          >
                            {showTokens[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {(key === 'facebook') && (
                        <>
                          <div>
                            <Label htmlFor={`${key}-pageid`}>Page ID</Label>
                            <Input
                              id={`${key}-pageid`}
                              value={account.pageId || ''}
                              onChange={(e) => updateSocialAccount(key, 'pageId', e.target.value)}
                              placeholder="Facebook Page ID"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${key}-bmid`}>Business Manager ID</Label>
                            <Input
                              id={`${key}-bmid`}
                              value={account.businessManagerId || ''}
                              onChange={(e) => updateSocialAccount(key, 'businessManagerId', e.target.value)}
                              placeholder="Business Manager ID"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => testConnection('social', key)}
                          disabled={!account.accessToken || testConnectionMutation.isPending}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                        {account.isConnected && (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {account.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(account.lastSync).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Email Providers */}
          <TabsContent value="email" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(emailProviders).map(([key, provider]) => (
                <Card key={key} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getPlatformIcon(provider.provider)}
                        <span className="ml-2">{provider.provider}</span>
                      </div>
                      <Badge variant={provider.isConnected ? "default" : "secondary"}>
                        {provider.isConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Configure {provider.provider} for email campaigns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`${key}-email`}>Email Address</Label>
                        <Input
                          id={`${key}-email`}
                          type="email"
                          value={provider.email}
                          onChange={(e) => updateEmailProvider(key, 'email', e.target.value)}
                          placeholder="your.email@domain.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`${key}-apikey`}>API Key / App Password</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`${key}-apikey`}
                            type={showTokens[key] ? "text" : "password"}
                            value={provider.apiKey}
                            onChange={(e) => updateEmailProvider(key, 'apiKey', e.target.value)}
                            placeholder="Enter API key or app password"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTokenVisibility(key)}
                          >
                            {showTokens[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {(key === 'outlook') && (
                        <>
                          <div>
                            <Label htmlFor={`${key}-smtp`}>SMTP Server</Label>
                            <Input
                              id={`${key}-smtp`}
                              value={provider.smtpServer || ''}
                              onChange={(e) => updateEmailProvider(key, 'smtpServer', e.target.value)}
                              placeholder="smtp-mail.outlook.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`${key}-port`}>SMTP Port</Label>
                            <Input
                              id={`${key}-port`}
                              type="number"
                              value={provider.smtpPort || ''}
                              onChange={(e) => updateEmailProvider(key, 'smtpPort', parseInt(e.target.value))}
                              placeholder="587"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => testConnection('email', key)}
                          disabled={!provider.apiKey || testConnectionMutation.isPending}
                          className="flex-1"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                        {provider.isConnected && (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {provider.lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(provider.lastSync).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save All Button */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSaveCredentials}
            disabled={saveCredentialsMutation.isPending}
            className="px-8 py-2"
          >
            <Zap className="h-4 w-4 mr-2" />
            Save All Credentials
          </Button>
        </div>

        {/* Integration Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Get API Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Social Media Platforms:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Instagram: Meta Developer Account → Instagram Basic Display API</li>
                  <li>• Facebook: Meta Business → App Development → Access Tokens</li>
                  <li>• Twitter/X: Twitter Developer Portal → API Keys & Tokens</li>
                  <li>• TikTok: TikTok for Business → API Access</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email Providers:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Gmail: Google Cloud Console → Gmail API → Credentials</li>
                  <li>• Outlook: Microsoft 365 → App Registrations → App Passwords</li>
                  <li>• SendGrid: SendGrid Dashboard → API Keys</li>
                  <li>• Mailchimp: Mailchimp Account → API Keys</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AgentPageTemplate>
  );
}