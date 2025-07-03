import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, HelpCircle, Info } from "lucide-react";
import VoiceSearch from "./VoiceSearch";
import VoiceSearchGuide from "./VoiceSearchGuide";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceSearchDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export default function VoiceSearchDialog({ 
  trigger, 
  className 
}: VoiceSearchDialogProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              {trigger || (
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full w-10 h-10 p-0 ${className}`}
                  aria-label="Search by voice"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search properties using your voice</p>
          </TooltipContent>
        </Tooltip>
        
        <DialogContent className="sm:max-w-md p-0">
          <div className="px-6 pt-5 pb-2 border-b">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Voice Search
            </DialogTitle>
            <DialogDescription className="mt-1.5">
              Speak naturally to find your perfect property. Try phrases like:
              <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                <span className="px-2 py-0.5 bg-primary/10 rounded-full">"3 bedroom houses in Leeds"</span>
                <span className="px-2 py-0.5 bg-primary/10 rounded-full">"properties with bills included"</span>
                <span className="px-2 py-0.5 bg-primary/10 rounded-full">"flats under £500 per week"</span>
              </div>
            </DialogDescription>
          </div>
          
          <VoiceSearch onClose={handleClose} />
          
          <DialogFooter className="px-4 py-2 border-t flex justify-center sm:justify-end">
            <VoiceSearchGuide />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}