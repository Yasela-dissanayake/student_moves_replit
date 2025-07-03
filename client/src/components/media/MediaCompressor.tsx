import { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File, 
  X,
  AlertTriangle,
  CheckCircle, 
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

export interface MediaCompressorProps {
  onCompress?: (result: {
    originalSize: string;
    compressedSize: string;
    compressionRatio: string;
    compressedUrl: string;
  }) => void;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
  showPreview?: boolean;
}

export default function MediaCompressor({
  onCompress,
  maxFileSize = 50,
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
  showPreview = true,
}: MediaCompressorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'unknown'>('unknown');
  const [fileInfo, setFileInfo] = useState<{
    size: string;
    dimensions?: string;
    duration?: string;
    type: string;
  } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    canBeCompressed: boolean;
    recommendation: string;
  } | null>(null);
  const [options, setOptions] = useState({
    imageQuality: 80,
    maxWidth: 1920,
    videoCRF: 23,
    videoPreset: 'medium',
    maintainAspectRatio: true
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    
    // Check file size
    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxFileSize}MB`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file type
    if (!allowedFileTypes.includes(selectedFile.type)) {
      toast({
        title: "Unsupported file type",
        description: `Please select ${allowedFileTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    setCompressedUrl(null);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Determine file type
    if (selectedFile.type.startsWith('image/')) {
      setFileType('image');
    } else if (selectedFile.type.startsWith('video/')) {
      setFileType('video');
    } else {
      setFileType('unknown');
    }
    
    // Get file info
    analyzeFile(selectedFile);
  };

  const analyzeFile = async (fileToAnalyze: File) => {
    // Format file size
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };
    
    const size = formatSize(fileToAnalyze.size);
    
    // Basic info first
    setFileInfo({
      size,
      type: fileToAnalyze.type,
    });
    
    // Get dimensions and additional info
    if (fileToAnalyze.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setFileInfo(prev => ({
          ...prev!,
          dimensions: `${img.width} × ${img.height}`,
        }));
        
        // Make compression recommendations
        const canBeCompressed = fileToAnalyze.size > 500 * 1024; // 500KB
        let recommendation = '';
        
        if (img.width > 2000) {
          recommendation = 'Image dimensions are large. Reducing size is recommended.';
        } else if (fileToAnalyze.type === 'image/png' && fileToAnalyze.size > 1 * 1024 * 1024) {
          recommendation = 'Consider JPEG format for better compression if transparency is not needed.';
        } else if (fileToAnalyze.size > 2 * 1024 * 1024) {
          recommendation = 'File size is large. Compression is highly recommended.';
        } else if (fileToAnalyze.size > 1 * 1024 * 1024) {
          recommendation = 'Moderate file size. Compression may help with loading times.';
        } else {
          recommendation = 'Image is already well-optimized.';
        }
        
        setAnalysisResult({
          canBeCompressed,
          recommendation
        });
      };
      img.src = URL.createObjectURL(fileToAnalyze);
    } else if (fileToAnalyze.type.startsWith('video/')) {
      // For videos, we would need to use the server to get dimensions and duration
      // For now, we'll just make recommendations based on size
      const canBeCompressed = fileToAnalyze.size > 5 * 1024 * 1024; // 5MB
      let recommendation = '';
      
      if (fileToAnalyze.size > 50 * 1024 * 1024) {
        recommendation = 'Video is very large. High compression is recommended.';
      } else if (fileToAnalyze.size > 20 * 1024 * 1024) {
        recommendation = 'Video size is large. Compression is recommended.';
      } else if (fileToAnalyze.size > 10 * 1024 * 1024) {
        recommendation = 'Moderate video size. Compression may improve loading times.';
      } else {
        recommendation = 'Video is already well-optimized for web.';
      }
      
      setAnalysisResult({
        canBeCompressed,
        recommendation
      });
    }
  };

  const handleCompression = async () => {
    if (!file) return;
    
    setIsCompressing(true);
    setProgress(10);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);
      
      // Add options
      formData.append('imageQuality', options.imageQuality.toString());
      formData.append('maxWidth', options.maxWidth.toString());
      formData.append('videoCRF', options.videoCRF.toString());
      formData.append('videoPreset', options.videoPreset);
      formData.append('maintainAspectRatio', options.maintainAspectRatio.toString());
      
      setProgress(30);
      
      // Send to server - using fetch directly to avoid auth headers
      const response = await fetch('/api/media/compress', {
        method: 'POST',
        body: formData,
      });
      
      setProgress(80);
      
      const result = await response.json();
      
      if (result.success) {
        setCompressedUrl(result.compressedPath);
        setProgress(100);
        
        // Call onCompress callback
        if (onCompress) {
          onCompress({
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio.toString(),
            compressedUrl: result.compressedPath
          });
        }
        
        toast({
          title: "Compression successful",
          description: `Reduced from ${result.originalSize} to ${result.compressedSize} (${Math.round((1 - 1/result.compressionRatio) * 100)}% reduction)`,
          variant: "default",
        });
      } else {
        toast({
          title: "Compression failed",
          description: result.error || "An error occurred during compression",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error compressing file:', error);
      toast({
        title: "Compression failed",
        description: "An error occurred during compression",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setCompressedUrl(null);
    setFileInfo(null);
    setAnalysisResult(null);
    setProgress(0);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-12 w-12 text-blue-500" />;
      case 'video':
        return <Video className="h-12 w-12 text-purple-500" />;
      default:
        return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  const formatFileType = (type: string) => {
    switch (type) {
      case 'image/jpeg':
        return 'JPEG Image';
      case 'image/png':
        return 'PNG Image';
      case 'image/webp':
        return 'WebP Image';
      case 'video/mp4':
        return 'MP4 Video';
      case 'video/quicktime':
        return 'QuickTime Video';
      default:
        return type;
    }
  };

  const renderAnalysisAlert = () => {
    if (!analysisResult) return null;
    
    if (analysisResult.canBeCompressed) {
      return (
        <Alert className="mt-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">Compression recommended</AlertTitle>
          <AlertDescription className="text-amber-700">
            {analysisResult.recommendation}
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-800">File already optimized</AlertTitle>
          <AlertDescription className="text-green-700">
            {analysisResult.recommendation}
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={allowedFileTypes.join(',')}
              onChange={handleFileChange}
            />
            <Upload className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-lg font-medium">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-1">
              Supports {allowedFileTypes.map(type => type.split('/')[1]).join(', ')} files (up to {maxFileSize}MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {file && (
        <>
          {/* File Preview & Info Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* File Preview */}
                {showPreview && previewUrl && (
                  <div className="w-full md:w-2/3 relative">
                    <div className="h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                      {fileType === 'image' ? (
                        <img 
                          src={compressedUrl || previewUrl} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : fileType === 'video' ? (
                        <video 
                          controls 
                          src={compressedUrl || previewUrl} 
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <FileText className="h-16 w-16 text-gray-400" />
                      )}
                      
                      {compressedUrl && (
                        <div className="absolute bottom-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Compressed version
                        </div>
                      )}
                    </div>
                    
                    {/* Clear button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                )}
                
                {/* File Info */}
                <div className={`w-full ${showPreview ? 'md:w-1/3' : ''}`}>
                  <div className="flex items-center mb-4">
                    {renderFileIcon()}
                    <div className="ml-3">
                      <h3 className="font-medium">{file.name}</h3>
                      <p className="text-sm text-gray-500">{fileInfo?.type && formatFileType(fileInfo.type)}</p>
                    </div>
                  </div>
                  
                  {fileInfo && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">{fileInfo.size}</span>
                      </div>
                      {fileInfo.dimensions && (
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="font-medium">{fileInfo.dimensions}</span>
                        </div>
                      )}
                      {fileInfo.duration && (
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{fileInfo.duration}</span>
                        </div>
                      )}
                      {compressedUrl && (
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Compressed</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {renderAnalysisAlert()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compression Options Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Compression Options</h3>
              
              <Tabs defaultValue={fileType === 'video' ? 'video' : 'image'}>
                <TabsList className="mb-4">
                  <TabsTrigger value="image" disabled={fileType === 'video'}>Image Settings</TabsTrigger>
                  <TabsTrigger value="video" disabled={fileType === 'image'}>Video Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="image" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="quality">Quality: {options.imageQuality}%</Label>
                    </div>
                    <Slider
                      id="quality"
                      min={30}
                      max={100}
                      step={5}
                      value={[options.imageQuality]}
                      onValueChange={(values) => setOptions({...options, imageQuality: values[0]})}
                    />
                    <p className="text-xs text-gray-500">Higher values preserve more details but result in larger files</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-width">Maximum Width</Label>
                    <Select 
                      value={options.maxWidth.toString()} 
                      onValueChange={(value) => setOptions({...options, maxWidth: parseInt(value)})}
                    >
                      <SelectTrigger id="max-width" className="w-full">
                        <SelectValue placeholder="Select max width" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Dimensions</SelectLabel>
                          <SelectItem value="640">640px (small screens)</SelectItem>
                          <SelectItem value="1280">1280px (medium screens)</SelectItem>
                          <SelectItem value="1920">1920px (HD)</SelectItem>
                          <SelectItem value="2560">2560px (2K)</SelectItem>
                          <SelectItem value="3840">3840px (4K)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Larger images will be resized, smaller ones won't be affected</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="aspect-ratio"
                      checked={options.maintainAspectRatio}
                      onCheckedChange={(checked) => setOptions({...options, maintainAspectRatio: checked})}
                    />
                    <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
                  </div>
                </TabsContent>
                
                <TabsContent value="video" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="crf">CRF (Compression Quality): {options.videoCRF}</Label>
                    </div>
                    <Slider
                      id="crf"
                      min={18}
                      max={28}
                      step={1}
                      value={[options.videoCRF]}
                      onValueChange={(values) => setOptions({...options, videoCRF: values[0]})}
                    />
                    <p className="text-xs text-gray-500">Lower values give better quality but larger files (18=high quality, 28=high compression)</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preset">Compression Preset</Label>
                    <Select 
                      value={options.videoPreset} 
                      onValueChange={(value) => setOptions({...options, videoPreset: value})}
                    >
                      <SelectTrigger id="preset" className="w-full">
                        <SelectValue placeholder="Select a preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Speed vs Quality</SelectLabel>
                          <SelectItem value="ultrafast">Ultrafast (lowest quality)</SelectItem>
                          <SelectItem value="superfast">Superfast</SelectItem>
                          <SelectItem value="veryfast">Very Fast</SelectItem>
                          <SelectItem value="faster">Faster</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="medium">Medium (balanced)</SelectItem>
                          <SelectItem value="slow">Slow (better quality)</SelectItem>
                          <SelectItem value="slower">Slower</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Slower presets provide better compression but take longer to process</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Alert className="mt-6 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-800">About compression</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                  Compression reduces file size while trying to maintain visual quality.
                  {fileType === 'image' 
                    ? " Images will be processed and optimized on the server using modern compression techniques."
                    : " Videos may take longer to process depending on their size and the chosen settings."}
                </AlertDescription>
              </Alert>
              
              <div className="mt-6">
                {isCompressing ? (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-center text-gray-500">
                      {progress < 100 ? 'Compressing...' : 'Compression complete!'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="flex-1"
                      onClick={handleCompression}
                      disabled={!file}
                    >
                      Compress {fileType === 'image' ? 'Image' : fileType === 'video' ? 'Video' : 'File'}
                    </Button>
                    
                    {compressedUrl && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // Download the compressed file
                          const a = document.createElement('a');
                          a.href = compressedUrl;
                          a.download = `compressed_${file.name}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      >
                        Download Compressed File
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}