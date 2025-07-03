import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Globe, Smartphone, Monitor, Package, FileArchive, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DownloadPackage {
  id: string;
  name: string;
  description: string;
  type: 'web' | 'android' | 'ios' | 'desktop';
  version: string;
  size: string;
  lastUpdated: string;
  status: 'ready' | 'generating' | 'error';
  downloadUrl?: string;
  icon: typeof Globe;
}

export default function DownloadCenter() {
  const [packages, setPackages] = useState<DownloadPackage[]>([
    {
      id: 'web-production',
      name: 'Website Production Build',
      description: 'Complete production-ready website package with all optimized assets',
      type: 'web',
      version: '1.0.0',
      size: '45.2 MB',
      lastUpdated: '2025-06-05',
      status: 'ready',
      icon: Globe
    },
    {
      id: 'android-apk',
      name: 'Android APK',
      description: 'Ready-to-install Android application package',
      type: 'android',
      version: '1.0.0',
      size: '28.5 MB',
      lastUpdated: '2025-06-05',
      status: 'ready',
      icon: Smartphone
    },
    {
      id: 'android-aab',
      name: 'Android App Bundle',
      description: 'Optimized Android App Bundle for Google Play Store submission',
      type: 'android',
      version: '1.0.0',
      size: '22.1 MB',
      lastUpdated: '2025-06-05',
      status: 'generating',
      icon: Package
    },
    {
      id: 'ios-ipa',
      name: 'iOS Application',
      description: 'iOS app package ready for App Store submission',
      type: 'ios',
      version: '1.0.0',
      size: '32.8 MB',
      lastUpdated: '2025-06-05',
      status: 'ready',
      icon: Smartphone
    },
    {
      id: 'desktop-electron',
      name: 'Desktop Application',
      description: 'Cross-platform desktop app for Windows, macOS, and Linux',
      type: 'desktop',
      version: '1.0.0',
      size: '156.4 MB',
      lastUpdated: '2025-06-05',
      status: 'ready',
      icon: Monitor
    }
  ]);

  const [activeDownloads, setActiveDownloads] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const generatePackage = async (packageId: string) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === packageId ? { ...pkg, status: 'generating' } : pkg
    ));

    try {
      const response = await fetch('/api/downloads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });

      if (response.ok) {
        const result = await response.json();
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId ? { 
            ...pkg, 
            status: 'ready', 
            downloadUrl: result.downloadUrl,
            lastUpdated: new Date().toISOString().split('T')[0]
          } : pkg
        ));
        toast({
          title: "Package Generated",
          description: "Your download package is ready!"
        });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      setPackages(prev => prev.map(pkg => 
        pkg.id === packageId ? { ...pkg, status: 'error' } : pkg
      ));
      toast({
        title: "Generation Failed",
        description: "There was an error generating the package. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadPackage = async (pkg: DownloadPackage) => {
    if (activeDownloads.has(pkg.id)) return;

    setActiveDownloads(prev => new Set([...prev, pkg.id]));
    setDownloadProgress(prev => ({ ...prev, [pkg.id]: 0 }));

    // Simulate download progress
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        const currentProgress = prev[pkg.id] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 15, 100);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setActiveDownloads(prev => {
            const newSet = new Set(prev);
            newSet.delete(pkg.id);
            return newSet;
          });
          
          // Trigger actual download
          const link = document.createElement('a');
          link.href = pkg.downloadUrl || `/api/downloads/${pkg.id}`;
          link.download = `${pkg.name.replace(/\s+/g, '_')}_v${pkg.version}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Complete",
            description: `${pkg.name} has been downloaded successfully!`
          });
        }
        
        return { ...prev, [pkg.id]: newProgress };
      });
    }, 200);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterPackagesByType = (type: string) => {
    if (type === 'all') return packages;
    return packages.filter(pkg => pkg.type === type);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Download Center</h1>
        <p className="text-gray-600">
          Download ready-to-deploy packages for web hosting and app store submissions
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Packages</TabsTrigger>
          <TabsTrigger value="web">Web</TabsTrigger>
          <TabsTrigger value="android">Android</TabsTrigger>
          <TabsTrigger value="ios">iOS</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
        </TabsList>

        {['all', 'web', 'android', 'ios', 'desktop'].map(type => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterPackagesByType(type).map(pkg => {
                const IconComponent = pkg.icon;
                const isDownloading = activeDownloads.has(pkg.id);
                const progress = downloadProgress[pkg.id] || 0;

                return (
                  <Card key={pkg.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-8 w-8 text-blue-500" />
                          <div>
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStatusColor(pkg.status)}`}
                            >
                              {getStatusIcon(pkg.status)}
                              <span className="ml-1 capitalize">{pkg.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription>{pkg.description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Version: {pkg.version}</span>
                          <span>Size: {pkg.size}</span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          Last updated: {pkg.lastUpdated}
                        </div>

                        {isDownloading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Downloading...</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {pkg.status === 'ready' && (
                            <Button 
                              onClick={() => downloadPackage(pkg)}
                              disabled={isDownloading}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {isDownloading ? 'Downloading...' : 'Download'}
                            </Button>
                          )}
                          
                          {pkg.status === 'generating' && (
                            <Button disabled className="flex-1">
                              <Clock className="h-4 w-4 mr-2" />
                              Generating...
                            </Button>
                          )}
                          
                          {pkg.status === 'error' && (
                            <Button 
                              onClick={() => generatePackage(pkg.id)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Regenerate
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => generatePackage(pkg.id)}
                            variant="outline"
                            disabled={pkg.status === 'generating'}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Deployment Instructions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">Web Deployment</h3>
            <p className="text-sm text-gray-600">
              Extract the web package and upload to your hosting provider. 
              Configure your domain and SSL certificate for production.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Mobile App Stores</h3>
            <p className="text-sm text-gray-600">
              Use the APK/AAB for Google Play Store and IPA for Apple App Store. 
              Follow each platform's submission guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}