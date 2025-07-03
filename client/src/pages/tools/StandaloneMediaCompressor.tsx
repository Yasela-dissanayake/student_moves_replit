import { useState } from 'react';
import { Helmet } from 'react-helmet';
import MediaCompressor from '@/components/media/MediaCompressor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileImage, FileVideo, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function StandaloneMediaCompressor() {
  const [compressionResults, setCompressionResults] = useState<Array<{
    originalSize: string;
    compressedSize: string;
    compressionRatio: string;
    compressedUrl: string;
    timestamp: Date;
  }>>([]);

  const handleCompressComplete = (result: {
    originalSize: string;
    compressedSize: string;
    compressionRatio: string;
    compressedUrl: string;
  }) => {
    setCompressionResults(prev => [
      {
        ...result,
        timestamp: new Date()
      },
      ...prev
    ]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Media Compression Tool | UniRent</title>
      </Helmet>
      
      <div className="mb-4">
        <Link href="/tools">
          <Button variant="ghost" className="flex items-center gap-1 mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="text-3xl font-bold mb-2">Media Compression Tool</h1>
          <p className="text-gray-500 mb-6">
            Optimize images and videos for your properties without losing quality
          </p>

          <MediaCompressor onCompress={handleCompressComplete} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Tips for better compression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="image">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="image" className="flex-1">
                    <FileImage className="h-4 w-4 mr-2" />
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex-1">
                    <FileVideo className="h-4 w-4 mr-2" />
                    Videos
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="image" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Ideal settings for property photos:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Quality: 75-80% for most property photos</li>
                      <li>Max width: 1920px is sufficient for web and mobile</li>
                      <li>Consider WebP format for better compression</li>
                      <li>Remove EXIF data for extra size reduction</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Best practices:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>1-2MB per image is ideal for websites</li>
                      <li>Crop unnecessary parts of the image</li>
                      <li>Use natural lighting when taking photos</li>
                      <li>Group related photos in galleries</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="video" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Ideal settings for property videos:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>CRF: 23-28 for good quality/size balance</li>
                      <li>Preset: medium or slow for better compression</li>
                      <li>Resolution: 1080p is sufficient for most cases</li>
                      <li>Keep videos under 2 minutes for tours</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Best practices:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Use stabilization when recording</li>
                      <li>Ensure good lighting in all rooms</li>
                      <li>Record in horizontal orientation</li>
                      <li>Add captions or labels if needed</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {compressionResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Compressions</CardTitle>
                <CardDescription>Your latest compressed files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {compressionResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">Size reduction:</span>
                        <span className="text-green-600 font-medium">
                          {((1 - 1/parseFloat(result.compressionRatio)) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>{result.originalSize}</span>
                        <span>→</span>
                        <span>{result.compressedSize}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}