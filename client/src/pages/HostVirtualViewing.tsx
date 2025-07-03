import '@/lib/global-polyfill'; // Import global polyfill first to ensure it's available
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation, Link } from 'wouter';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { apiRequest } from '@/lib/queryClient';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, Video, Mic, MicOff, VideoOff, Users, MessageSquare, Share2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ViewingSession {
  id: string;
  hostSocketId: string;
  hostType: 'landlord' | 'agent';
  hostId: number;
  propertyId: number;
  participants: {
    socketId: string;
    userId: number | null;
    name: string;
    joined: Date;
  }[];
  created: Date;
  active: boolean;
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

interface ViewingRequestOption {
  id: number;
  tenantName: string;
  dateRequested: string;
  message: string;
}

const HostVirtualViewing = () => {
  const params = useParams<{ propertyId: string }>();
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : 0;
  const [, setLocation] = useLocation();
  
  // State for WebRTC and socket
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ViewingSession['participants']>([]);
  const [peers, setPeers] = useState<{ [socketId: string]: Peer.Instance }>({});
  const [streams, setStreams] = useState<{ [socketId: string]: MediaStream }>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const [linkViewingRequests, setLinkViewingRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState('video');
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get property details
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties', propertyId],
    enabled: !!propertyId
  });
  
  // Get user profile
  const { data: userProfile } = useQuery({
    queryKey: ['/api/users/me'],
  });
  
  // Get viewing requests for property
  const { data: viewingRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/viewing-requests', { propertyId }],
    enabled: !!propertyId
  });
  
  // Link viewing request to session mutation
  const linkRequestMutation = useMutation({
    mutationFn: (data: { sessionId: string, requestId: number }) => 
      apiRequest('POST', `/api/virtual-viewings/${data.sessionId}/link/${data.requestId}`),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Viewing request linked to this session',
      });
      setLinkViewingRequests(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to link viewing request',
        variant: 'destructive',
      });
    }
  });
  
  // Complete viewing session mutation
  const completeSessionMutation = useMutation({
    mutationFn: (data: { sessionId: string, requestId: number }) => 
      apiRequest('POST', `/api/virtual-viewings/${data.sessionId}/complete/${data.requestId}`),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Virtual viewing completed and recorded',
      });
      endSession();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to complete viewing session',
        variant: 'destructive',
      });
    }
  });
  
  // Check window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    socketRef.current = newSocket;
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);
  
  // Start local media stream
  useEffect(() => {
    const startMedia = async () => {
      try {
        // First try with both video and audio
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          setLocalStream(stream);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          return; // Success - exit the function
        } catch (initialError) {
          console.warn('Initial media access failed, trying fallback options:', initialError);
        }

        // Try video only as fallback
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          setLocalStream(videoOnlyStream);
          setIsAudioEnabled(false);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoOnlyStream;
          }
          
          toast({
            title: 'Microphone Unavailable',
            description: 'Unable to access your microphone. Video-only mode enabled.',
            variant: 'warning',
          });
          return; // Success with video only - exit the function
        } catch (videoError) {
          console.warn('Video-only access failed:', videoError);
        }

        // Last resort - try audio only
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          
          setLocalStream(audioOnlyStream);
          setIsVideoEnabled(false);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioOnlyStream;
          }
          
          toast({
            title: 'Camera Unavailable',
            description: 'Unable to access your camera. Audio-only mode enabled.',
            variant: 'warning',
          });
          return; // Success with audio only - exit the function
        } catch (audioError) {
          console.warn('Audio-only access failed:', audioError);
          throw new Error('All media access attempts failed');
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Camera/Microphone Error',
          description: 'Unable to access your camera or microphone. Please check browser permissions and try again.',
          variant: 'destructive',
        });
      }
    };
    
    startMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Setup socket event listeners once socket and stream are ready
  useEffect(() => {
    if (!socket || !localStream || !userProfile) return;
    
    // Create viewing session once socket is connected
    socket.emit('create-viewing-session', {
      hostType: userProfile.userType,
      hostId: userProfile.id,
      propertyId,
      hostName: userProfile.name
    });
    
    // Handle session created
    socket.on('viewing-session-created', (data: { sessionId: string, session: ViewingSession }) => {
      setSessionId(data.sessionId);
      setParticipants(data.session.participants);
      
      toast({
        title: 'Virtual Viewing Started',
        description: 'Your viewing session is ready. Share the link with tenants to join.',
      });
    });
    
    // Handle participant joining
    socket.on('participant-joined', (participant: ViewingSession['participants'][0]) => {
      setParticipants(prev => [...prev, participant]);
      
      // Create a new peer for the joining participant
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream
      });
      
      peer.on('signal', signal => {
        socket.emit('signal', {
          to: participant.socketId,
          from: socket.id,
          signal
        });
      });
      
      peer.on('stream', stream => {
        setStreams(prev => ({
          ...prev,
          [participant.socketId]: stream
        }));
      });
      
      setPeers(prev => ({
        ...prev,
        [participant.socketId]: peer
      }));
      
      toast({
        title: 'Participant Joined',
        description: `${participant.name} has joined the viewing`,
      });
    });
    
    // Handle signals from participants
    socket.on('signal', (data: { from: string, signal: any }) => {
      const peer = peers[data.from];
      
      if (peer) {
        peer.signal(data.signal);
      }
    });
    
    // Handle participant leaving
    socket.on('participant-left', (data: { socketId: string, name: string }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      
      // Clean up peer connection
      const peer = peers[data.socketId];
      if (peer) {
        peer.destroy();
      }
      
      // Remove from peers and streams
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[data.socketId];
        return newPeers;
      });
      
      setStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[data.socketId];
        return newStreams;
      });
      
      toast({
        title: 'Participant Left',
        description: `${data.name} has left the viewing`,
      });
    });
    
    // Handle chat messages
    socket.on('viewing-chat-message', (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data]);
      
      // Scroll to bottom of chat
      if (chatContainerRef.current) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    });
    
    return () => {
      socket.off('viewing-session-created');
      socket.off('participant-joined');
      socket.off('signal');
      socket.off('participant-left');
      socket.off('viewing-chat-message');
    };
  }, [socket, localStream, userProfile, peers, propertyId]);
  
  // Toggle microphone
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };
  
  // Toggle camera
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (!localStream) return;
    
    if (!isRecording) {
      // Start recording
      const mediaRecorder = new MediaRecorder(localStream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedUrl = URL.createObjectURL(recordedBlob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = recordedUrl;
        downloadLink.download = `viewing-${sessionId}-${Date.now()}.webm`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        recordedChunksRef.current = [];
      };
      
      recordedChunksRef.current = [];
      mediaRecorder.start();
      setIsRecording(true);
      
      // Notify participants that recording started
      if (socket && sessionId) {
        socket.emit('toggle-recording', {
          sessionId,
          isRecording: true
        });
      }
      
      toast({
        title: 'Recording Started',
        description: 'The viewing is now being recorded',
      });
    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      
      // Notify participants that recording stopped
      if (socket && sessionId) {
        socket.emit('toggle-recording', {
          sessionId,
          isRecording: false
        });
      }
      
      toast({
        title: 'Recording Stopped',
        description: 'The recording has been stopped and will download shortly',
      });
    }
  };
  
  // Send chat message
  const sendChatMessage = () => {
    if (!socket || !sessionId || !chatInput.trim() || !userProfile) return;
    
    socket.emit('viewing-chat-message', {
      sessionId,
      message: chatInput,
      sender: {
        id: userProfile.id,
        name: userProfile.name,
        isHost: true
      }
    });
    
    setChatInput('');
  };
  
  // End viewing session
  const endSession = () => {
    if (!socket || !sessionId) return;
    
    socket.emit('end-viewing-session', { sessionId });
    
    // Clean up resources
    Object.values(peers).forEach(peer => peer.destroy());
    setPeers({});
    setStreams({});
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Redirect to landlord dashboard
    setTimeout(() => {
      setLocation('/landlord-dashboard');
    }, 2000);
  };
  
  // Confirm end session dialog
  const confirmEndSession = () => {
    setIsSessionEnding(true);
  };
  
  // Link viewing request to session
  const linkRequest = () => {
    if (!sessionId || !selectedRequestId) return;
    
    linkRequestMutation.mutate({
      sessionId,
      requestId: selectedRequestId
    });
  };
  
  // Complete viewing session and update request
  const completeViewing = () => {
    if (!sessionId || !selectedRequestId) return;
    
    completeSessionMutation.mutate({
      sessionId,
      requestId: selectedRequestId
    });
  };
  
  // Share viewing link
  const shareViewingLink = () => {
    if (!sessionId) return;
    
    const viewingUrl = `${window.location.origin}/join-virtual-viewing/${sessionId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Virtual Property Viewing',
        text: `Join me for a live virtual viewing of the property.`,
        url: viewingUrl
      });
    } else {
      navigator.clipboard.writeText(viewingUrl);
      toast({
        title: 'Link Copied',
        description: 'Viewing link copied to clipboard',
      });
    }
  };
  
  if (isLoadingProperty) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading property details...</span>
      </div>
    );
  }
  
  const pendingViewingRequests = viewingRequests?.filter(
    (req: any) => req.status === 'pending' || req.status === 'confirmed'
  ) || [];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/dashboard/landlord">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Virtual Viewing: {property?.title || 'Property'}
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSessionInfo(true)}
            >
              Session Info
            </Button>
            <Button 
              variant="outline" 
              onClick={shareViewingLink}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmEndSession}
            >
              End Viewing
            </Button>
          </div>
        </div>
        
        {/* Mobile View with Tabs */}
        {isMobileView && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant={isAudioEnabled ? "default" : "destructive"} 
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isVideoEnabled ? "default" : "destructive"} 
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={toggleRecording}
                  >
                    {isRecording ? "Stop Recording" : "Record"}
                  </Button>
                </div>
              </div>
              
              {Object.entries(streams).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(streams).map(([socketId, stream]) => {
                    const participant = participants.find(p => p.socketId === socketId);
                    return (
                      <div key={socketId} className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(element) => {
                            if (element) {
                              element.srcObject = stream;
                            }
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                          {participant?.name || 'Participant'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                        msg.sender.isHost 
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'mr-auto bg-muted'
                      }`}
                    >
                      <div className="text-xs font-semibold">
                        {msg.sender.name}
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
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button onClick={sendChatMessage}>Send</Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="participants">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Participants ({participants.length})</h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.socketId} className="p-2 border rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined {formatDistanceToNow(new Date(participant.joined), { addSuffix: true })}
                        </div>
                      </div>
                      {participant.socketId === socket?.id && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          You (Host)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Desktop View with Grid Layout */}
        {!isMobileView && (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant={isAudioEnabled ? "default" : "destructive"} 
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isVideoEnabled ? "default" : "destructive"} 
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isRecording ? "destructive" : "outline"}
                    onClick={toggleRecording}
                  >
                    {isRecording ? "Stop Recording" : "Record"}
                  </Button>
                </div>
              </div>
              
              {Object.entries(streams).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(streams).map(([socketId, stream]) => {
                    const participant = participants.find(p => p.socketId === socketId);
                    return (
                      <div key={socketId} className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <video
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          ref={(element) => {
                            if (element) {
                              element.srcObject = stream;
                            }
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
                          {participant?.name || 'Participant'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="col-span-1 space-y-4">
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="participants">
                    <Users className="w-4 h-4 mr-2" />
                    Participants
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="mt-4">
                  <Card className="p-4 h-[50vh] flex flex-col">
                    <div 
                      ref={chatContainerRef}
                      className="flex-1 overflow-y-auto mb-4 space-y-2"
                    >
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index}
                          className={`p-2 rounded-lg max-w-[80%] ${
                            msg.sender.isHost 
                              ? 'ml-auto bg-primary text-primary-foreground'
                              : 'mr-auto bg-muted'
                          }`}
                        >
                          <div className="text-xs font-semibold">
                            {msg.sender.name}
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
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      />
                      <Button onClick={sendChatMessage}>Send</Button>
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="participants" className="mt-4">
                  <Card className="p-4 h-[50vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-4">Participants ({participants.length})</h3>
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div key={participant.socketId} className="p-2 border rounded-lg flex justify-between items-center">
                          <div>
                            <div className="font-medium">{participant.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Joined {formatDistanceToNow(new Date(participant.joined), { addSuffix: true })}
                            </div>
                          </div>
                          {participant.socketId === socket?.id && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              You (Host)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {pendingViewingRequests.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Link to Viewing Request</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link this virtual viewing to a pending request
                  </p>
                  <div className="space-y-2">
                    {pendingViewingRequests.map((req: any) => (
                      <div key={req.id} className="p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`request-${req.id}`}
                            checked={selectedRequestId === req.id}
                            onCheckedChange={() => setSelectedRequestId(req.id)}
                          />
                          <Label htmlFor={`request-${req.id}`} className="font-medium">
                            {req.guestId ? req.tenantName : 'Guest'} - {new Date(req.createdAt).toLocaleDateString()}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground ml-6 mt-1">
                          {req.message?.substring(0, 80) || 'No message'}
                          {(req.message?.length || 0) > 80 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {selectedRequestId && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={linkRequest}
                          disabled={linkRequestMutation.isPending}
                        >
                          {linkRequestMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Linking...
                            </>
                          ) : (
                            'Link Request'
                          )}
                        </Button>
                        <Button 
                          onClick={completeViewing}
                          disabled={completeSessionMutation.isPending}
                        >
                          {completeSessionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            'Complete Viewing'
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Session Info Dialog */}
      <Dialog open={showSessionInfo} onOpenChange={setShowSessionInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Virtual Viewing Session</DialogTitle>
            <DialogDescription>
              Share this link with tenants to join the viewing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="session-link">Viewing Link</Label>
              <div className="flex mt-1 gap-2">
                <Input 
                  id="session-link" 
                  value={`${window.location.origin}/join-virtual-viewing/${sessionId}`} 
                  readOnly
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join-virtual-viewing/${sessionId}`);
                    toast({
                      title: 'Link Copied',
                      description: 'Viewing link copied to clipboard',
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="session-id">Session ID</Label>
              <Input id="session-id" value={sessionId || ''} readOnly />
            </div>
            
            <div>
              <Label>Property</Label>
              <p className="text-sm">{property?.title || 'Property'}</p>
              <p className="text-xs text-muted-foreground">{property?.address}, {property?.city}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSessionInfo(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* End Session Confirmation Dialog */}
      <Dialog open={isSessionEnding} onOpenChange={setIsSessionEnding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Virtual Viewing?</DialogTitle>
            <DialogDescription>
              This will end the viewing session for all participants. 
              {isRecording && " Any ongoing recording will be saved before ending."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {pendingViewingRequests.length > 0 && selectedRequestId !== null && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Link to Viewing Request Before Ending</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Do you want to mark this viewing request as completed?
                </p>
                <Button
                  variant="secondary"
                  onClick={() => completeViewing()}
                  className="w-full"
                  disabled={completeSessionMutation.isPending}
                >
                  {completeSessionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete Linked Viewing Request'
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionEnding(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={endSession}>
              End Viewing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostVirtualViewing;