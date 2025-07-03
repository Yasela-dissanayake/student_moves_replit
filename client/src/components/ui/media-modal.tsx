import React from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  mediaType: "video" | "virtualTour";
  mediaUrl: string;
}

/**
 * Modal component to display videos or virtual tours
 */
export function MediaModal({
  isOpen,
  onClose,
  title,
  description,
  mediaType,
  mediaUrl,
}: MediaModalProps) {
  const renderMedia = () => {
    if (mediaType === "video") {
      // Check if it's a YouTube URL
      if (mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be")) {
        // Convert to embed URL if needed
        let embedUrl = mediaUrl;
        if (mediaUrl.includes("watch?v=")) {
          const videoId = mediaUrl.split("watch?v=")[1].split("&")[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (mediaUrl.includes("youtu.be")) {
          const videoId = mediaUrl.split("youtu.be/")[1];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        return (
          <iframe
            className="w-full aspect-video rounded-md"
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      
      // For direct video URLs
      return (
        <video 
          className="w-full rounded-md" 
          controls 
          autoPlay
        >
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else if (mediaType === "virtualTour") {
      // Iframe for virtual tour (Matterport, etc)
      return (
        <iframe
          className="w-full aspect-video rounded-md"
          src={mediaUrl}
          title={title}
          frameBorder="0"
          allowFullScreen
        />
      );
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{title}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {renderMedia()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}