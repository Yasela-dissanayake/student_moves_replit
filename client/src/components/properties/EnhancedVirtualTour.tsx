import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Maximize2, Minimize2, Info, ChevronLeft, ChevronRight, Youtube } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EnhancedVirtualTourProps {
  propertyId: number;
  propertyName: string;
  tourUrl?: string;
  tourImages?: string[];
  isLoading?: boolean;
}

// Helper function to extract YouTube video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Return null for non-YouTube URLs
  if (!url.includes('youtu')) return null;
  
  // Handle already embedded URLs - extract ID directly
  if (url.includes('youtube.com/embed/')) {
    const id = url.split('youtube.com/embed/')[1]?.split(/[?&/#]/)[0];
    return (id && id.length === 11) ? id : null;
  }
  
  // Handle youtu.be links
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split(/[?&/#]/)[0];
    return (id && id.length === 11) ? id : null;
  }
  
  // Handle youtube.com/watch?v= links
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2]?.length === 11) ? match[2] : null;
}

// Helper function to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string | null {
  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

// Helper to check if a URL is a YouTube URL (embed or regular)
function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export default function EnhancedVirtualTour({
  propertyId,
  propertyName,
  tourUrl,
  tourImages = [],
  isLoading = false
}: EnhancedVirtualTourProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("tour");

  // Process tourImages to separate YouTube videos from regular images
  const youtubeVideos: string[] = [];
  const regularImages: string[] = [];

  // Sort out YouTube video URLs from regular image URLs
  if (Array.isArray(tourImages)) {
    tourImages.forEach(url => {
      if (typeof url === 'string') {
        if (isYouTubeUrl(url)) {
          youtubeVideos.push(url);
        } else {
          regularImages.push(url);
        }
      }
    });
  }

  const hasVirtualTour = !!tourUrl;
  const hasYouTubeVideos = youtubeVideos.length > 0;
  const hasRegularImages = regularImages.length > 0;
  const hasTourImages = hasRegularImages || hasYouTubeVideos;
  const hasAnyTourContent = hasVirtualTour || hasTourImages;

  // Function to handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Function to navigate tour images
  const navigateImages = (direction: 'next' | 'prev') => {
    if (!hasTourImages) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % tourImages.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + tourImages.length) % tourImages.length);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!hasAnyTourContent) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Virtual Property Tour
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="h-8 w-8 p-0"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </span>
              </Button>
            </div>
          </div>
          
          {showHelp && (
            <CardDescription className="mt-2 text-sm bg-gray-50 p-2 rounded-md">
              <p>Use your mouse to navigate the 360° tour. Click and drag to look around, scroll to zoom in/out.</p>
              <p className="mt-1">For the best experience, view in fullscreen mode.</p>
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className={`p-0 overflow-hidden rounded-b-lg ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
          {hasVirtualTour ? (
            <div className={`relative ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
              <iframe
                src={tourUrl}
                title={`Virtual tour of ${propertyName}`}
                className="w-full h-full border-0"
                allowFullScreen
              />
              
              {isFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-white opacity-80 hover:opacity-100"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              )}
            </div>
          ) : hasYouTubeVideos && youtubeVideos.length > 0 ? (
            // Display first YouTube video
            <div className={`relative ${isFullscreen ? 'h-screen' : 'aspect-video'} bg-gray-50`}>
              {(() => {
                const currentVideo = youtubeVideos[videoIndex % youtubeVideos.length];
                const embedUrl = getYouTubeEmbedUrl(currentVideo);
                
                return embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={`YouTube video of ${propertyName}`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onError={(e) => console.error("YouTube iframe error in main view:", e)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <Youtube className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">Video Unavailable</p>
                      <p className="text-xs text-gray-500">Unable to load YouTube video</p>
                    </div>
                  </div>
                );
              })()}
              
              {isFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-white opacity-80 hover:opacity-100"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              )}
              
              {youtubeVideos.length > 1 && (
                <>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoIndex((prev) => (prev - 1 + youtubeVideos.length) % youtubeVideos.length)}
                      className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Badge variant="outline" className="bg-black/50 text-white border-none px-2 py-1 text-xs sm:text-sm">
                      {(videoIndex % youtubeVideos.length) + 1} / {youtubeVideos.length}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoIndex((prev) => (prev + 1) % youtubeVideos.length)}
                      className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 hidden sm:block">
                    <Badge variant="secondary" className="bg-primary text-white border-none">
                      <Youtube className="h-3 w-3 mr-1" /> {youtubeVideos.length} videos available
                    </Badge>
                  </div>
                </>
              )}
            </div>
          ) : hasRegularImages && regularImages.length > 0 ? (
            <div className={`relative ${isFullscreen ? 'h-screen' : 'aspect-video'}`}>
              <img
                src={regularImages[currentImageIndex % regularImages.length]}
                alt={`Property image ${currentImageIndex + 1} of ${propertyName}`}
                className="w-full h-full object-cover"
              />
              
              {regularImages.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateImages('prev')}
                    className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Badge variant="outline" className="bg-black/50 text-white border-none px-2 py-1 text-xs sm:text-sm">
                    {(currentImageIndex % regularImages.length) + 1} / {regularImages.length}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateImages('next')}
                    className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {isFullscreen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-white opacity-80 hover:opacity-100"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              )}
            </div>
          ) : null}
          
          {!isFullscreen && (
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {hasVirtualTour 
                      ? '360° Interactive Tour' 
                      : hasYouTubeVideos 
                        ? 'YouTube Video Tour' 
                        : 'Property Tour Images'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasYouTubeVideos && regularImages.length > 0
                      ? `${youtubeVideos.length} video${youtubeVideos.length > 1 ? 's' : ''} and ${regularImages.length} image${regularImages.length > 1 ? 's' : ''} available`
                      : hasYouTubeVideos
                        ? `${youtubeVideos.length} video${youtubeVideos.length > 1 ? 's' : ''} available` 
                        : hasRegularImages
                          ? `${regularImages.length} image${regularImages.length > 1 ? 's' : ''} available`
                          : 'Explore this property virtually'}
                  </p>
                </div>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-1"
                >
                  {hasYouTubeVideos 
                    ? <><Youtube className="h-4 w-4" /> View Videos</>
                    : 'View Tour'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Full Tour Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Virtual Tour - {propertyName}</DialogTitle>
            <DialogDescription>
              Explore the property in detail with our virtual tour
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="tour" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 p-2">
              {hasVirtualTour && <TabsTrigger value="tour">Virtual Tour</TabsTrigger>}
              {hasYouTubeVideos && <TabsTrigger value="videos" className="flex items-center gap-1"><Youtube className="h-4 w-4" /> Videos</TabsTrigger>}
              {hasRegularImages && <TabsTrigger value="images">Images</TabsTrigger>}
              {!hasVirtualTour && !hasYouTubeVideos && !hasRegularImages && <TabsTrigger value="tour">Tour</TabsTrigger>}
            </TabsList>
            
            {/* Virtual Tour Tab */}
            {hasVirtualTour && (
              <TabsContent value="tour" className="aspect-video w-full">
                <iframe
                  src={tourUrl}
                  title={`Virtual tour of ${propertyName}`}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </TabsContent>
            )}
            
            {/* YouTube Videos Tab */}
            {hasYouTubeVideos && (
              <TabsContent value="videos" className="w-full p-0">
                {/* Video Viewer */}
                <div className="p-4">
                  <div className="mb-6 aspect-video w-full bg-gray-50 rounded-md overflow-hidden border">
                    {(() => {
                      const currentVideo = youtubeVideos[videoIndex % youtubeVideos.length];
                      const embedUrl = getYouTubeEmbedUrl(currentVideo);
                      
                      return embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={`Video tour ${videoIndex + 1} of ${propertyName}`}
                          className="w-full h-full border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          onError={(e) => console.error("YouTube iframe error:", e)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center p-4">
                            <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Unable to load video</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Video Selection and Navigation */}
                  <div className="flex flex-col space-y-4">
                    {/* Video Counter and Navigation Controls */}
                    <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoIndex((prev) => (prev - 1 + youtubeVideos.length) % youtubeVideos.length)}
                        disabled={youtubeVideos.length <= 1}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      
                      <div className="text-sm font-medium">
                        Video {(videoIndex % youtubeVideos.length) + 1} of {youtubeVideos.length}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoIndex((prev) => (prev + 1) % youtubeVideos.length)}
                        disabled={youtubeVideos.length <= 1}
                        className="h-8 px-2"
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Video Thumbnails */}
                    {youtubeVideos.length > 1 && (
                      <div className="overflow-x-auto pb-2">
                        <div className="flex gap-1 sm:gap-2">
                          {youtubeVideos.map((videoUrl, index) => (
                            <button
                              key={index}
                              onClick={() => setVideoIndex(index)}
                              className={`relative aspect-video min-w-[120px] sm:min-w-[160px] max-w-[120px] sm:max-w-[160px] border-2 rounded-md overflow-hidden ${
                                index === (videoIndex % youtubeVideos.length) ? 'border-primary' : 'border-gray-200'
                              }`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                <Youtube className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] sm:text-xs p-1 text-center">
                                Video {index + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
            
            {/* Regular Images Tab */}
            {hasRegularImages && (
              <TabsContent value="images" className="aspect-video w-full">
                <div className="relative w-full h-full">
                  <img
                    src={regularImages[currentImageIndex % regularImages.length]}
                    alt={`Property image ${currentImageIndex + 1} of ${propertyName}`}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                  
                  {regularImages.length > 1 && (
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateImages('prev')}
                        className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Badge variant="outline" className="bg-black/50 text-white border-none px-2 py-1 text-xs sm:text-sm">
                        {(currentImageIndex % regularImages.length) + 1} / {regularImages.length}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateImages('next')}
                        className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90 shadow-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {regularImages.length > 1 && (
                  <div className="p-2 sm:p-4 overflow-x-auto">
                    <div className="flex gap-1 sm:gap-2">
                      {regularImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative min-w-[60px] sm:min-w-[80px] h-12 sm:h-16 border-2 rounded overflow-hidden ${
                            index === (currentImageIndex % regularImages.length) ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
            
            {/* Fallback Tab Content */}
            {!hasVirtualTour && !hasYouTubeVideos && !hasRegularImages && (
              <TabsContent value="tour" className="aspect-video w-full flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tour Content Available</h3>
                  <p className="text-gray-500">
                    This property doesn't have virtual tour or images yet.
                  </p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}