import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileSignature, Check, Clock, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EnhancedSignatureProps {
  onSave: (signatureData: string) => void;
  disabled?: boolean;
  signedBy?: {
    tenant?: boolean;
    landlord?: boolean;
    agent?: boolean;
  };
  userRole?: 'tenant' | 'landlord' | 'agent' | 'admin';
}

export const EnhancedSignature: React.FC<EnhancedSignatureProps> = ({
  onSave,
  disabled = false,
  signedBy = {},
  userRole
}) => {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'signature1' | 'signature2' | 'signature3'>('signature1');
  const [isDirty, setIsDirty] = useState(false);

  // Check if current user has already signed
  const hasCurrentUserSigned = () => {
    if (!userRole) return false;
    
    if (userRole === 'tenant' && signedBy.tenant) return true;
    if (userRole === 'landlord' && signedBy.landlord) return true;
    if (userRole === 'agent' && signedBy.agent) return true;
    
    return false;
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsDirty(false);
    }
  };

  const handleSaveSignature = () => {
    if (signatureMethod === 'draw' && sigCanvasRef.current) {
      if (sigCanvasRef.current.isEmpty()) {
        return; // Don't save empty signatures
      }
      
      onSave(sigCanvasRef.current.toDataURL());
    } else if (signatureMethod === 'type' && typedName.trim()) {
      // Generate image from typed signature
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (selectedStyle === 'signature1') {
          ctx.font = 'italic 40px "Satisfy", cursive';
          ctx.fillStyle = 'black';
        } else if (selectedStyle === 'signature2') {
          ctx.font = 'bold 36px "Lobster", cursive';
          ctx.fillStyle = '#333';
        } else {
          ctx.font = '42px "Dancing Script", cursive';
          ctx.fillStyle = '#000';
        }
        
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 50, canvas.height / 2);
        
        onSave(canvas.toDataURL());
      }
    }
  };

  if (hasCurrentUserSigned()) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-500" />
        <AlertTitle>Document Signed</AlertTitle>
        <AlertDescription>
          You have successfully signed this document.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <div className={`rounded-full p-2 ${signedBy.tenant ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            <Badge className={signedBy.tenant ? 'bg-green-100 text-green-600 hover:bg-green-100' : 'bg-amber-100 text-amber-600 hover:bg-amber-100'}>
              {signedBy.tenant ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </Badge>
          </div>
          <div>
            <p className="font-medium">Tenant</p>
            <p className="text-sm text-muted-foreground">
              {signedBy.tenant ? 'Signed' : 'Pending'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <div className={`rounded-full p-2 ${signedBy.landlord ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            <Badge className={signedBy.landlord ? 'bg-green-100 text-green-600 hover:bg-green-100' : 'bg-amber-100 text-amber-600 hover:bg-amber-100'}>
              {signedBy.landlord ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </Badge>
          </div>
          <div>
            <p className="font-medium">Landlord</p>
            <p className="text-sm text-muted-foreground">
              {signedBy.landlord ? 'Signed' : 'Pending'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <div className={`rounded-full p-2 ${signedBy.agent ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            <Badge className={signedBy.agent ? 'bg-green-100 text-green-600 hover:bg-green-100' : 'bg-amber-100 text-amber-600 hover:bg-amber-100'}>
              {signedBy.agent ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            </Badge>
          </div>
          <div>
            <p className="font-medium">Agent</p>
            <p className="text-sm text-muted-foreground">
              {signedBy.agent ? 'Signed' : 'Pending'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="draw" className="w-full" onValueChange={(value) => setSignatureMethod(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="type">Type</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="draw" className="p-4 border rounded-md">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-md p-2 bg-white" 
            onMouseDown={() => setIsDirty(true)}
          >
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="black"
              canvasProps={{ 
                width: 600, 
                height: 150, 
                className: 'signature-canvas w-full' 
              }}
              backgroundColor="white"
            />
          </div>
          <div className="text-xs text-center text-muted-foreground mt-2 mb-4">
            Draw your signature above
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={clearSignature} disabled={!isDirty}>
              Clear
            </Button>
            <Button 
              onClick={handleSaveSignature} 
              disabled={disabled || !isDirty}
              className="gap-2"
            >
              <FileSignature className="h-4 w-4" />
              Sign Document
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="type" className="p-4 border rounded-md">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="typed-name" className="text-sm font-medium">
                Type your full name
              </label>
              <input
                id="typed-name"
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="p-2 border rounded-md w-full"
                placeholder="John Smith"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Select signature style
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  className={`p-3 border rounded-md cursor-pointer text-center ${selectedStyle === 'signature1' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedStyle('signature1')}
                >
                  <p className="font-signature1 text-xl">Signature 1</p>
                </div>
                <div 
                  className={`p-3 border rounded-md cursor-pointer text-center ${selectedStyle === 'signature2' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedStyle('signature2')}
                >
                  <p className="font-signature2 text-xl">Signature 2</p>
                </div>
                <div 
                  className={`p-3 border rounded-md cursor-pointer text-center ${selectedStyle === 'signature3' ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedStyle('signature3')}
                >
                  <p className="font-signature3 text-xl">Signature 3</p>
                </div>
              </div>
            </div>
            
            <div className="border p-4 rounded-md bg-white flex items-center justify-center h-[150px]">
              <p className={`
                text-3xl
                ${selectedStyle === 'signature1' ? 'font-signature1' : 
                  selectedStyle === 'signature2' ? 'font-signature2' : 'font-signature3'}
              `}>
                {typedName || 'Your Signature'}
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSignature} 
                disabled={disabled || !typedName.trim()}
                className="gap-2"
              >
                <FileSignature className="h-4 w-4" />
                Sign Document
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="p-4 border rounded-md">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Upload your signature
              </label>
              <input
                type="file"
                accept="image/*"
                className="p-2 border rounded-md w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        // Create a new image to get dimensions
                        const img = new Image();
                        img.onload = () => {
                          // Draw the image to a canvas to normalize it
                          const canvas = document.createElement('canvas');
                          canvas.width = 600;
                          canvas.height = 150;
                          const ctx = canvas.getContext('2d');
                          
                          if (ctx) {
                            // Fill with white background
                            ctx.fillStyle = 'white';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            
                            // Calculate size to maintain aspect ratio
                            const scale = Math.min(
                              canvas.width / img.width,
                              canvas.height / img.height
                            ) * 0.9; // Scale down a bit to leave margin
                            
                            const scaledWidth = img.width * scale;
                            const scaledHeight = img.height * scale;
                            const x = (canvas.width - scaledWidth) / 2;
                            const y = (canvas.height - scaledHeight) / 2;
                            
                            // Draw the image centered
                            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                            
                            onSave(canvas.toDataURL());
                          }
                        };
                        img.src = event.target.result as string;
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            
            <div className="text-sm text-center text-muted-foreground">
              Accepted formats: JPG, PNG, GIF. Maximum size: 5MB.
            </div>
            
            <div className="bg-slate-50 border p-4 rounded-md flex items-center justify-center h-[150px]">
              <div className="text-center text-muted-foreground">
                <RefreshCw className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Upload an image of your signature</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSignature;