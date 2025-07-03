import React, { useState } from 'react';
import { Share, Mail, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ShareJobDialogProps {
  jobTitle: string;
  jobCompany: string;
  jobId: number;
}

export function ShareJobDialog({ jobTitle, jobCompany, jobId }: ShareJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const jobUrl = `${window.location.origin}/jobs/${jobId}`;
  
  const defaultMessage = `Hi there,\n\nI thought you might be interested in this job opportunity: "${jobTitle}" at ${jobCompany}.\n\nCheck it out here: ${jobUrl}\n\nBest regards,`;

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      setRecipient('');
      setMessage(defaultMessage);
      setIsSent(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate sending email
    setIsSending(true);
    
    // In a real implementation, this would call an API to send the email
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      
      // Auto-close after showing success
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share size={18} className="text-gray-500 hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Job Opportunity</DialogTitle>
          <DialogDescription>
            Share this job listing with someone who might be interested.
          </DialogDescription>
        </DialogHeader>
        
        {isSent ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Email Sent!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your job recommendation has been sent to {recipient}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input 
                id="recipient" 
                type="email"
                placeholder="friend@example.com" 
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Add a personal message..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>Sending<span className="ml-1 animate-pulse">...</span></>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}