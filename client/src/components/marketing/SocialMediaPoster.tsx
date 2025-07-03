import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Facebook, Instagram, Linkedin, Send, Twitter, Youtube, RefreshCw } from "lucide-react";
import { getSocialMediaRateLimits, postToSocialMedia, getSocialMediaPostHistory } from "@/lib/api";

// Types
interface SupportedRateLimit {
  supported: true;
  totalLimit: number;
  usedToday: number;
  remainingPosts: number;
  nextBestTime: string;
}

interface UnsupportedPlatform {
  supported: false;
  error: string;
  remainingPosts: number;
  nextBestTime: string;
}

type RateLimitData = SupportedRateLimit | UnsupportedPlatform;

interface PlatformStatus {
  platform: string;
  connected: boolean;
  rateLimits?: RateLimitData;
}

interface SocialMediaPosterProps {
  campaignId?: number;
  initialContent?: string;
  onPostSuccess?: (platform: string) => void;
}

interface PostHistoryItem {
  id: number;
  platform: string;
  content: string;
  status: string;
  createdAt: string;
}

// Component
const SocialMediaPoster: React.FC<SocialMediaPosterProps> = ({
  campaignId,
  initialContent = "",
  onPostSuccess,
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([
    { platform: "instagram", connected: true },
    { platform: "facebook", connected: true },
    { platform: "twitter", connected: true },
    { platform: "linkedin", connected: true },
    { platform: "youtube", connected: false },
  ]);
  const [isPending, setIsPending] = useState(false);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [activeTab, setActiveTab] = useState("composer");
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch rate limits for connected platforms
  const fetchRateLimits = async () => {
    setIsLoadingLimits(true);
    try {
      const platforms = platformStatuses
        .filter(p => p.connected)
        .map(p => p.platform);
      
      const response = await getSocialMediaRateLimits(platforms);
      
      // Update platform statuses with rate limit data
      const updatedStatuses = platformStatuses.map(platform => {
        if (response[platform.platform]) {
          return {
            ...platform,
            rateLimits: response[platform.platform]
          };
        }
        return platform;
      });
      
      setPlatformStatuses(updatedStatuses);
    } catch (error) {
      console.error("Error fetching rate limits:", error);
      toast({
        title: "Failed to fetch rate limits",
        description: "Could not retrieve your current posting limits.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLimits(false);
    }
  };

  // Fetch post history
  const fetchPostHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getSocialMediaPostHistory();
      setPostHistory(history);
    } catch (error) {
      console.error("Error fetching post history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchRateLimits();
    fetchPostHistory();
  }, []);

  // Update content if initialContent changes (e.g., when campaign selection changes)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Handle platform selection toggle
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Format the date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Handle post submission
  const handlePost = async () => {
    if (!content.trim()) {
      toast({
        title: "Content is required",
        description: "Please enter some content to post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    
    try {
      // Post to each selected platform
      for (const platform of selectedPlatforms) {
        const response = await postToSocialMedia({
          platform,
          content,
          campaignId
        });
        
        if (response.success) {
          toast({
            title: "Posted Successfully",
            description: `Your content was posted to ${platform}!`,
          });
          
          if (onPostSuccess) {
            onPostSuccess(platform);
          }
        } else {
          toast({
            title: "Posting Failed",
            description: response.message || `Could not post to ${platform}.`,
            variant: "destructive",
          });
        }
      }
      
      // Refresh rate limits after posting
      fetchRateLimits();
      // Refresh post history
      fetchPostHistory();
      
    } catch (error) {
      console.error("Error posting to social media:", error);
      toast({
        title: "Posting Failed",
        description: "An unexpected error occurred while posting.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      default:
        return <Send className="h-5 w-5" />;
    }
  };

  // Get platform color
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'facebook':
        return 'bg-blue-600';
      case 'twitter':
        return 'bg-sky-500';
      case 'linkedin':
        return 'bg-blue-700';
      case 'youtube':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Get platform text color
  const getPlatformTextColor = (platform: string) => {
    return 'text-white';
  };

  // Render the composer tab
  const renderComposer = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compose Your Post</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post content here..."
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {content.length} characters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformStatuses.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.platform);
              const isDisabled = !platform.connected;
              const rateLimitExceeded = platform.rateLimits && platform.rateLimits.remainingPosts <= 0;
              
              return (
                <div 
                  key={platform.platform}
                  className={`border rounded-lg p-4 ${isDisabled ? 'opacity-50' : ''} ${
                    isSelected && !isDisabled ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getPlatformColor(platform.platform)}`}>
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">{platform.platform}</h3>
                        {!platform.connected && (
                          <span className="text-xs text-muted-foreground">Not connected</span>
                        )}
                        {platform.rateLimits && platform.rateLimits.supported === false && (
                          <span className="text-xs text-destructive">{platform.rateLimits.error || "Platform not supported"}</span>
                        )}
                        {rateLimitExceeded && platform.rateLimits && platform.rateLimits.supported && (
                          <div className="flex items-center text-xs text-amber-500 gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>Rate limited until {platform.rateLimits.nextBestTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => togglePlatform(platform.platform)}
                      disabled={isDisabled || rateLimitExceeded || (platform.rateLimits && !platform.rateLimits.supported)}
                    />
                  </div>
                  
                  {platform.connected && platform.rateLimits && platform.rateLimits.supported && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Daily limit usage</span>
                        <span>{platform.rateLimits.remainingPosts} posts remaining</span>
                      </div>
                      <Progress 
                        value={platform.rateLimits.totalLimit && platform.rateLimits.usedToday 
                          ? (platform.rateLimits.usedToday / platform.rateLimits.totalLimit) * 100 
                          : 0} 
                        className="h-1" 
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchRateLimits}
            disabled={isLoadingLimits}
          >
            {isLoadingLimits ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Limits
              </>
            )}
          </Button>
          <Button 
            onClick={handlePost}
            disabled={isPending || selectedPlatforms.length === 0 || !content.trim()}
          >
            {isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Post Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // Render the history tab
  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Posts</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchPostHistory}
          disabled={isLoadingHistory}
        >
          {isLoadingHistory ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {isLoadingHistory ? (
        <div className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading post history...</p>
        </div>
      ) : postHistory.length === 0 ? (
        <Card className="py-8 text-center">
          <CardContent>
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No post history found. Create your first post!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {postHistory.map((post) => (
            <Card key={post.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-full ${getPlatformColor(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span className={`text-sm font-medium capitalize ${getPlatformTextColor(post.platform)}`}>
                      {post.platform}
                    </span>
                  </div>
                  <Badge variant={post.status === 'success' ? 'default' : 'destructive'}>
                    {post.status}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{post.content}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Social Media Publisher</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="composer">Post Composer</TabsTrigger>
            <TabsTrigger value="history">Post History</TabsTrigger>
          </TabsList>
          <TabsContent value="composer">
            {renderComposer()}
          </TabsContent>
          <TabsContent value="history">
            {renderHistory()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SocialMediaPoster;