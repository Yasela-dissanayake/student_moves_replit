import '@/lib/global-polyfill'; // Import global polyfill first to ensure it's available
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

// Define SimplePeer types if needed (if the d.ts file isn't being properly recognized)
interface SimplePeerInstance {
  signal(data: unknown): void;
  on(event: string, callback: (...args: any[]) => void): void;
  destroy(err?: Error): void;
  send(data: unknown): void;
}
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Video, Mic, MicOff, VideoOff, MessageSquare, Info as InfoIcon, CheckCircle, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types
interface Participant {
  socketId: string;
  userId: number | null;
  name: string;
  joined: Date;
}

interface ChatMessage {
  message: string;
  sender: {
    id: number | null;
    name: string;
    isHost: boolean;
  };
  timestamp: Date;
}

const JoinVirtualViewing: React.FC = () => {
  // Use params to get session ID
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  
  // Session and Media State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peer, setPeer] = useState<SimplePeerInstance | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [hostSocketId, setHostSocketId] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(true);
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [activeTab, setActiveTab] = useState('video');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<{ id: number, name: string } | null>(null);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [cameraAccessError, setCameraAccessError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Define session data type
  interface SessionDataResponse {
    id: number;
    propertyId: number;
    hostId: number;
    scheduledTime: string;
    status: string;
    [key: string]: any;
  }

  // Fetch session data
  const { data: sessionDataResponse, isLoading: isLoadingSession } = useQuery<SessionDataResponse>({
    queryKey: ['/api/viewing-sessions', id],
    enabled: !!id
  });
  
  // Fetch property data
  const { data: propertyDataResponse, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties', sessionDataResponse?.propertyId],
    enabled: !!sessionDataResponse && !!sessionDataResponse.propertyId
  });
  
  // Fetch user profile
  const { data: profileData, isLoading: isLoadingProfileData } = useQuery({
    queryKey: ['/api/me'],
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        const response = await fetch('/api/me', { signal });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
        return null;
      } catch (error) {
        return null;
      }
    }
  });
  
  // Update state when data is loaded
  useEffect(() => {
    if (propertyDataResponse) {
      setPropertyData(propertyDataResponse);
    }
    
    if (sessionDataResponse) {
      setSessionData(sessionDataResponse);
    }
    
    if (profileData) {
      setUserProfile(profileData);
      setIsAnonymous(false);
      setUserName(profileData.name);
    }
    
    if (!isLoadingProfileData) {
      setIsLoadingProfile(false);
    }
  }, [propertyDataResponse, sessionDataResponse, profileData, isLoadingProfileData]);
  
  // Connect to socket server
  useEffect(() => {
    if (!id) return;
    
    // Create socket connection
    const newSocket = io('', {
      path: '/socket.io',
      query: { sessionId: id }
    });
    
    setSocket(newSocket);
    
    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      
      // If we were reconnecting, notify the user
      if (isReconnecting) {
        toast({
          title: 'Reconnected',
          description: 'You have been reconnected to the viewing session.',
        });
        setIsReconnecting(false);
        
        // Re-join the session if we were already in it
        if (!showJoinDialog && userName) {
          newSocket.emit('join-session', {
            sessionId: id,
            name: userName,
            userId: userProfile?.id || null
          });
        }
      }
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
      
      // Attempt to reconnect automatically
      setIsReconnecting(true);
      toast({
        title: 'Connection lost',
        description: 'Attempting to reconnect to the viewing session...',
        variant: 'destructive',
      });
    });
    
    newSocket.on('host-joined', (hostId: string) => {
      console.log('Host joined:', hostId);
      setHostSocketId(hostId);
    });
    
    newSocket.on('host-left', () => {
      console.log('Host left');
      setHostSocketId(null);
      
      // Close peer connection if it exists
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
      
      // Clear remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
      
      toast({
        title: 'Host left the session',
        description: 'The host has left the viewing. You can wait for them to rejoin or leave the session.',
        variant: 'destructive'
      });
    });
    
    newSocket.on('session-ended', () => {
      console.log('Session ended');
      setSessionEnded(true);
      
      // Close peer connection if it exists
      if (peer) {
        peer.destroy();
        setPeer(null);
      }
      
      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      
      // Clear remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
      
      toast({
        title: 'Session ended',
        description: 'This viewing session has ended. Thank you for joining.',
      });
    });
    
    newSocket.on('signal', (data: any) => {
      console.log('Received signal');
      if (peer) {
        peer.signal(data);
      }
    });
    
    newSocket.on('participant-joined', (participant: Participant) => {
      console.log('Participant joined:', participant);
      setParticipants(prev => {
        // Check if participant already exists
        const exists = prev.some(p => p.socketId === participant.socketId);
        if (exists) {
          return prev;
        }
        return [...prev, participant];
      });
      
      // Show toast for new participant (only for non-host)
      if (participant.socketId !== hostSocketId) {
        toast({
          title: 'New participant',
          description: `${participant.name} has joined the viewing`,
        });
      }
    });
    
    newSocket.on('participant-left', (socketId: string) => {
      console.log('Participant left:', socketId);
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    });
    
    newSocket.on('participants-list', (list: Participant[]) => {
      console.log('Participants list:', list);
      setParticipants(list);
      
      // Identify host
      const host = list.find(p => p.socketId === hostSocketId);
      if (host) {
        console.log('Host identified:', host);
      }
    });
    
    newSocket.on('viewing-chat-message', (data: ChatMessage) => {
      console.log('Received chat message:', data);
      setChatMessages(prev => [...prev, data]);
      
      // Scroll to bottom
      if (chatContainerRef.current) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [id, hostSocketId, peer, localStream, remoteStream]);
  
  // When remote stream updates, set it to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // When local stream updates, set it to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Manually attempt to reconnect
  const manualReconnect = () => {
    if (socket) {
      // First try to disconnect if already connected
      socket.disconnect();
      
      // Then try to reconnect
      socket.connect();
      
      toast({
        title: 'Reconnecting',
        description: 'Attempting to reconnect to the viewing session...',
      });
      
      setConnectionStatus('connecting');
    } else {
      toast({
        title: 'Connection error',
        description: 'Could not reconnect to the server. Please refresh the page and try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Join the viewing session
  const joinSession = async () => {
    if (!socket) {
      toast({
        title: 'Connection error',
        description: 'Could not connect to the server. Please try again.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsJoining(true);
    setConnectionStatus('connecting');
    
    try {
      // First try to get both audio and video
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch (initialError) {
        console.warn("Initial media access failed, trying fallback options:", initialError);
        
        // Try video-only as fallback
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          toast({
            title: 'Microphone unavailable',
            description: 'Could not access your microphone. You can view the property but won\'t be able to speak.'
          });
        } catch (videoError) {
          console.warn("Video-only access failed:", videoError);
          
          // Try audio-only as fallback
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true
            });
            toast({
              title: 'Camera unavailable',
              description: 'Could not access your camera. You can hear and speak but won\'t be visible.'
            });
          } catch (audioError) {
            // No media access at all, throw the original error
            throw initialError;
          }
        }
      }
      
      setLocalStream(stream);
      setCameraAccessError(null);
      
      // Create a new peer connection
      const newPeer = new SimplePeer({
        initiator: false,
        stream,
        trickle: false
      }) as SimplePeerInstance;
      
      // Set up peer event handlers
      newPeer.on('signal', (data) => {
        console.log('Sending signal to host');
        socket.emit('signal', { to: hostSocketId, data });
      });
      
      newPeer.on('stream', (stream) => {
        console.log('Received stream from host');
        setRemoteStream(stream);
      });
      
      newPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        toast({
          title: 'Connection error',
          description: 'There was an error connecting to the host. Please try rejoining.',
          variant: 'destructive'
        });
      });
      
      // Set the peer
      setPeer(newPeer);
      
      // Join the session
      socket.emit('join-session', {
        sessionId: id,
        name: userName,
        userId: userProfile?.id || null
      });
      
      // Hide the join dialog
      setShowJoinDialog(false);
      
      // Success notification
      toast({
        title: 'Joined successfully',
        description: 'You have joined the virtual property viewing.',
      });
      
      // Update connection status to connected
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Set error message based on error type
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setCameraAccessError('You need to grant camera and microphone permission to join the viewing.');
          toast({
            title: 'Permission denied',
            description: 'Camera or microphone access was denied. Please allow access to join the viewing.',
            variant: 'destructive'
          });
        } else if (error.name === 'NotFoundError') {
          setCameraAccessError('No camera or microphone found. Please connect a device and try again.');
          toast({
            title: 'Device not found',
            description: 'No camera or microphone detected. Please connect a device and try again.',
            variant: 'destructive'
          });
        } else {
          setCameraAccessError('There was an error accessing your camera and microphone.');
          toast({
            title: 'Media access error',
            description: 'There was an error accessing your camera and microphone.',
            variant: 'destructive'
          });
        }
      } else {
        setCameraAccessError('There was an error setting up the video call. Please try again.');
        toast({
          title: 'Connection error',
          description: 'There was an error connecting to the session. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsJoining(false);
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (!localStream) return;
    
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    setIsAudioEnabled(audioTracks[0]?.enabled || false);
    
    // Notify state to other participants
    if (socket) {
      socket.emit('media-state-change', {
        audioEnabled: !isAudioEnabled,
        videoEnabled: isVideoEnabled
      });
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (!localStream) return;
    
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    
    setIsVideoEnabled(videoTracks[0]?.enabled || false);
    
    // Notify state to other participants
    if (socket) {
      socket.emit('media-state-change', {
        audioEnabled: isAudioEnabled,
        videoEnabled: !isVideoEnabled
      });
    }
  };
  
  // Send a chat message
  const sendChatMessage = () => {
    if (!socket || !chatInput.trim()) return;
    
    const message = {
      message: chatInput.trim(),
      sender: {
        id: userProfile?.id || null,
        name: userProfile?.name || userName,
        isHost: false
      },
      timestamp: new Date()
    };
    
    socket.emit('viewing-chat-message', message);
    setChatInput('');
  };
  
  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Handle enter key in chat input
  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Virtual Property Viewing</h1>
      
      {/* Loading state */}
      {(isLoadingSession || isLoadingProperty) && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Loading session...</p>
        </div>
      )}
      
      {/* Session ended state */}
      {sessionEnded && (
        <div className="bg-muted p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">This viewing session has ended</h2>
          <p className="mb-4">Thank you for participating in this virtual property viewing.</p>
          <Button onClick={() => setLocation('/')}>Return Home</Button>
        </div>
      )}
      
      {/* Main content */}
      <div className="space-y-4">
        {/* Session info */}
        {sessionData && propertyData && !isLoadingSession && !isLoadingProperty && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{propertyData.title}</h2>
              
              {/* Connection status indicator */}
              <div className="flex items-center">
                {connectionStatus === 'connected' && (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Connected</span>
                  </div>
                )}
                {connectionStatus === 'connecting' && (
                  <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    <span>Connecting...</span>
                  </div>
                )}
                {connectionStatus === 'disconnected' && (
                  <div className="flex items-center">
                    <div className="flex items-center text-sm text-red-600 dark:text-red-400 mr-2">
                      <WifiOff className="w-4 h-4 mr-1" />
                      <span>Disconnected</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={manualReconnect}
                      disabled={isReconnecting}
                      className="text-xs py-1 h-7"
                    >
                      {isReconnecting ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Reconnecting...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reconnect
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm">{propertyData.address}, {propertyData.city}</p>
            
            <div className="flex items-center mt-2 text-sm">
              <p className="mr-4">
                Host: {participants.find(p => p.socketId === hostSocketId)?.name || 'Waiting for host...'}
              </p>
              <p>
                Participants: {participants.length}
              </p>
            </div>
          </div>
        )}
        
        {/* Mobile View with Tabs */}
        {isMobileView && !showJoinDialog && (
          <div>
            {/* Mobile instructions - only show initially */}
            {!sessionEnded && remoteStream && (
              <div className="bg-muted p-3 rounded-md mb-3 flex items-start">
                <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm">
                    Use the <span className="font-medium">Video</span> and <span className="font-medium">Chat</span> tabs below to switch between viewing and messaging.
                  </p>
                </div>
              </div>
            )}
          
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
            
              <TabsContent value="video" className="space-y-4">
                {/* Host's video (remote stream) */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {!remoteStream ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                      <Video className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-center text-sm opacity-80">
                        Waiting for host's video...
                      </p>
                      <p className="text-center text-xs mt-2 opacity-60">
                        The host will appear here once connected
                      </p>
                    </div>
                  ) : (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                    {participants.find(p => p.socketId === hostSocketId)?.name || 'Host'}
                  </div>
                </div>
                
                {/* Your video (local stream) */}
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {!isVideoEnabled ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                      <VideoOff className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-center text-sm opacity-80">
                        Camera is disabled or unavailable
                      </p>
                      <p className="text-center text-xs mt-2 opacity-60">
                        If this is unintended, try camera permissions in your device settings
                      </p>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                    You
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <Button 
                      size="sm" 
                      variant={isAudioEnabled ? "default" : "destructive"} 
                      onClick={toggleAudio}
                      title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={isVideoEnabled ? "default" : "destructive"} 
                      onClick={toggleVideo}
                      title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                      disabled={!localStream?.getVideoTracks().length}
                    >
                      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="chat">
                <Card className="p-4 h-[60vh] flex flex-col">
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto mb-4 space-y-2"
                  >
                    {chatMessages.map((msg, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded-lg max-w-[80%] ${
                          msg.sender.id === userProfile?.id 
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'mr-auto bg-muted'
                        }`}
                      >
                        <div className="text-xs font-semibold">
                          {msg.sender.name} {msg.sender.isHost ? '(Host)' : ''}
                        </div>
                        <div>{msg.message}</div>
                        <div className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button onClick={sendChatMessage}>Send</Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Desktop View with Grid Layout */}
        {!isMobileView && !showJoinDialog && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              {/* Host's video (remote stream) */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {!remoteStream ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                    <Video className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center text-sm opacity-80">
                      Waiting for host's video...
                    </p>
                    <p className="text-center text-xs mt-2 opacity-60">
                      The host will appear here once connected
                    </p>
                  </div>
                ) : (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                  {participants.find(p => p.socketId === hostSocketId)?.name || 'Host'}
                </div>
              </div>
              
              {/* Your video (local stream) */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {!isVideoEnabled ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                    <VideoOff className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center text-sm opacity-80">
                      Camera is disabled or unavailable
                    </p>
                    <p className="text-center text-xs mt-2 opacity-60">
                      If this is unintended, try camera permissions in your device settings
                    </p>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                  You
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant={isAudioEnabled ? "default" : "destructive"} 
                    onClick={toggleAudio}
                    title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isVideoEnabled ? "default" : "destructive"} 
                    onClick={toggleVideo}
                    title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                    disabled={!localStream?.getVideoTracks().length}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="col-span-1">
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid grid-cols-1 w-full">
                  <TabsTrigger value="chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="mt-4">
                  <Card className="p-4 h-[60vh] flex flex-col">
                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto mb-4 space-y-2"
                    >
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index}
                          className={`p-2 rounded-lg max-w-[80%] ${
                            msg.sender.id === userProfile?.id 
                              ? 'ml-auto bg-primary text-primary-foreground'
                              : 'mr-auto bg-muted'
                          }`}
                        >
                          <div className="text-xs font-semibold">
                            {msg.sender.name} {msg.sender.isHost ? '(Host)' : ''}
                          </div>
                          <div>{msg.message}</div>
                          <div className="text-xs opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendChatMessage()}
                      />
                      <Button onClick={sendChatMessage}>Send</Button>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {propertyData && (
                <Card className="p-4 mt-4">
                  <h3 className="text-lg font-semibold mb-2">Property Information</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Title</Label>
                      <p className="text-sm">{propertyData.title}</p>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <p className="text-sm">{propertyData.address}, {propertyData.city}</p>
                    </div>
                    <div>
                      <Label>Price</Label>
                      <p className="text-sm">£{propertyData.price} {propertyData.pricePerPerson && `(£${propertyData.pricePerPerson} per person)`}</p>
                    </div>
                    <div>
                      <Label>Details</Label>
                      <p className="text-sm">{propertyData.bedrooms} bed, {propertyData.bathrooms} bath, {propertyData.propertyType}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Join Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={(open) => {
        // Only allow closing if not joining
        if (!isJoining) {
          setShowJoinDialog(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Virtual Property Viewing</DialogTitle>
            <DialogDescription>
              Enter your name to join the virtual property viewing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {isAnonymous ? (
              <div>
                <Label htmlFor="user-name">Your Name</Label>
                <Input 
                  id="user-name" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isJoining}
                />
              </div>
            ) : (
              <div>
                <Label>Joining as</Label>
                <p>{isLoadingProfile ? 'Loading profile...' : userProfile?.name}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">About This Viewing</h4>
                <p className="text-sm mb-2">
                  You are about to join a live virtual property viewing. Your camera and microphone will be enabled.
                </p>
                <p className="text-sm">
                  The host may record this session. By joining, you consent to being recorded during the viewing.
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Permission Notice</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your browser will ask for camera and microphone permissions. Please allow access when prompted to fully participate in the viewing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              onClick={joinSession}
              disabled={isJoining || (isAnonymous && !userName.trim())}
              className="gap-2"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Start Virtual Viewing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JoinVirtualViewing;