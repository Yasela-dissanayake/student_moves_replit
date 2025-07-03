import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Settings,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  Eye,
  Gift,
  Star,
  Camera,
  RotateCcw
} from 'lucide-react';

interface LiveStream {
  id: number;
  title: string;
  description: string;
  streamer: {
    id: number;
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  viewers: number;
  duration: number;
  category: string;
  tags: string[];
  isLive: boolean;
  thumbnail: string;
  startedAt: string;
}

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'gift' | 'follow';
  giftValue?: number;
}

export default function LiveStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSettings, setStreamSettings] = useState({
    title: '',
    description: '',
    category: 'student-life',
    isPrivate: false,
    allowComments: true,
    recordStream: true
  });
  const [chatMessage, setChatMessage] = useState('');
  const [deviceSettings, setDeviceSettings] = useState({
    camera: true,
    microphone: true,
    quality: 'hd',
    orientation: 'portrait'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queryClient = useQueryClient();

  // Fetch live streams
  const { data: liveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ['/api/live-streams'],
    queryFn: async () => {
      const response = await fetch('/api/live-streams');
      if (!response.ok) throw new Error('Failed to fetch live streams');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch chat messages for current stream
  const { data: chatMessages } = useQuery<ChatMessage[]>({
    queryKey: ['/api/live-chat', 'current'],
    queryFn: async () => {
      const response = await fetch('/api/live-chat/current');
      if (!response.ok) throw new Error('Failed to fetch chat');
      return response.json();
    },
    enabled: isStreaming,
    refetchInterval: 1000
  });

  // Start streaming mutation
  const startStreamMutation = useMutation({
    mutationFn: async (settings: typeof streamSettings) => {
      const response = await fetch('/api/live-streams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to start stream');
      return response.json();
    },
    onSuccess: () => {
      setIsStreaming(true);
      queryClient.invalidateQueries({ queryKey: ['/api/live-streams'] });
    }
  });

  // Send chat message mutation
  const sendChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/live-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, streamId: 'current' })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/live-chat'] });
    }
  });

  // Initialize camera and microphone
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceSettings.camera ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: deviceSettings.microphone
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  // Stop streaming
  const stopStreaming = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    
    try {
      await fetch('/api/live-streams/stop', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/live-streams'] });
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  };

  // Toggle camera/microphone
  const toggleDevice = (device: 'camera' | 'microphone') => {
    setDeviceSettings(prev => ({
      ...prev,
      [device]: !prev[device]
    }));
    
    if (streamRef.current) {
      if (device === 'camera') {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !deviceSettings.camera;
        });
      } else {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !deviceSettings.microphone;
        });
      }
    }
  };

  // Send chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      sendChatMutation.mutate(chatMessage);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                     : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  useEffect(() => {
    if (isStreaming) {
      initializeMedia();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isStreaming, deviceSettings.camera, deviceSettings.microphone]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Monitor className="h-8 w-8 text-red-500" />
              Live Streaming
            </h1>
            <p className="text-gray-600 mt-1">Share your student life in real-time</p>
          </div>
          
          {!isStreaming ? (
            <Button 
              onClick={() => startStreamMutation.mutate(streamSettings)}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
              disabled={startStreamMutation.isPending}
            >
              <Play className="h-4 w-4" />
              Start Streaming
            </Button>
          ) : (
            <Button 
              onClick={stopStreaming}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Stream
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Streaming Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Preview/Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{isStreaming ? 'Live Stream' : 'Stream Preview'}</span>
                  {isStreaming && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <Badge variant="destructive">LIVE</Badge>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Stream Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant={deviceSettings.camera ? "default" : "destructive"}
                        onClick={() => toggleDevice('camera')}
                        className="h-10 w-10 p-0"
                      >
                        {deviceSettings.camera ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={deviceSettings.microphone ? "default" : "destructive"}
                        onClick={() => toggleDevice('microphone')}
                        className="h-10 w-10 p-0"
                      >
                        {deviceSettings.microphone ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                      
                      <Button size="sm" variant="outline" className="h-10 w-10 p-0">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {isStreaming && (
                      <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{formatViewers(1247)} viewers</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stream Settings */}
                {!isStreaming && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stream Title
                      </label>
                      <Input
                        value={streamSettings.title}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="What's happening in your student life?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        value={streamSettings.description}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell viewers what they can expect..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={streamSettings.category}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="student-life">Student Life</option>
                          <option value="study-session">Study Session</option>
                          <option value="campus-tour">Campus Tour</option>
                          <option value="room-tour">Room Tour</option>
                          <option value="cooking">Cooking</option>
                          <option value="chat">Just Chatting</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quality
                        </label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md"
                          value={deviceSettings.quality}
                          onChange={(e) => setDeviceSettings(prev => ({ ...prev, quality: e.target.value }))}
                        >
                          <option value="hd">HD (720p)</option>
                          <option value="fhd">Full HD (1080p)</option>
                          <option value="sd">SD (480p)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Streams Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-red-500" />
                  Live Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 rounded-lg aspect-video"></div>
                    ))}
                  </div>
                ) : liveStreams && liveStreams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveStreams.map((stream) => (
                      <div key={stream.id} className="relative group cursor-pointer">
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                          <img 
                            src={stream.thumbnail} 
                            alt={stream.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          
                          {/* Live Badge */}
                          <div className="absolute top-2 left-2">
                            <Badge variant="destructive" className="text-xs">
                              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                              LIVE
                            </Badge>
                          </div>
                          
                          {/* Viewer Count */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formatViewers(stream.viewers)}
                          </div>
                          
                          {/* Duration */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formatDuration(stream.duration)}
                          </div>
                        </div>
                        
                        {/* Stream Info */}
                        <div className="mt-3 space-y-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                            {stream.title}
                          </h3>
                          
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={stream.streamer.avatar} />
                              <AvatarFallback>
                                {stream.streamer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">{stream.streamer.name}</span>
                            {stream.streamer.verified && (
                              <Star className="h-3 w-3 text-blue-500 fill-current" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {stream.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <WifiOff className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No live streams at the moment</p>
                    <p className="text-sm">Be the first to go live!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Sidebar */}
          <div className="space-y-6">
            {/* Live Chat */}
            <Card className="h-96">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages?.map((message) => (
                    <div key={message.id} className="flex items-start gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback>
                          {message.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.username}
                          </span>
                          {message.type === 'gift' && (
                            <Gift className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!chatMessage.trim()}>
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Stream Stats */}
            {isStreaming && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stream Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Viewers</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Peak Viewers</span>
                    <span className="font-medium">1,891</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Stream Duration</span>
                    <span className="font-medium">{formatDuration(3847)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Followers</span>
                    <span className="font-medium text-green-600">+23</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Switch Camera
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Stream
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Stream Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}