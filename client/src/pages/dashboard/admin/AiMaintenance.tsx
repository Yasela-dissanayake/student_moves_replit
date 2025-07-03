import { useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, InfoIcon, CheckCircle2, AlertTriangle, ShieldAlert, Shield } from "lucide-react";

const AiMaintenance = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Sample statistics - in a real app, these would come from API calls
  const stats = {
    issuesFound: 0,
    issuesFixed: 0,
    pendingIssues: 0,
    successRate: "N/A"
  };

  const startScan = () => {
    setIsScanning(true);
    // In a real app, this would trigger an API call to start the scan
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Maintenance</h1>
          <div className="flex space-x-3">
            <Link href="/dashboard/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-0 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">AI Maintenance System</CardTitle>
            <p className="text-muted-foreground">Automatically scan, diagnose, and fix website issues</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-end mb-4">
              <Button
                disabled={isScanning}
                onClick={startScan}
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {isScanning ? "Scanning..." : "Start Scan"}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                title="Issues Found" 
                value={stats.issuesFound.toString()} 
                description="Total issues detected by the system"
                icon={<InfoIcon className="h-5 w-5 text-blue-500" />}
              />
              <StatsCard 
                title="Issues Fixed" 
                value={stats.issuesFixed.toString()} 
                description="Successfully repaired issues"
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              />
              <StatsCard 
                title="Pending Issues" 
                value={stats.pendingIssues.toString()} 
                description="Issues waiting to be fixed"
                icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              />
              <StatsCard 
                title="Success Rate" 
                value={stats.successRate} 
                description="Percentage of successful fixes"
                icon={<ShieldAlert className="h-5 w-5 text-purple-500" />}
              />
            </div>

            {/* Tabs for filtering issues */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-5">
                <TabsTrigger value="all" className="text-xs">
                  All Issues <Badge variant="outline" className="ml-1">0</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">
                  Pending <Badge variant="outline" className="ml-1">0</Badge>
                </TabsTrigger>
                <TabsTrigger value="progress" className="text-xs">
                  In Progress <Badge variant="outline" className="ml-1">0</Badge>
                </TabsTrigger>
                <TabsTrigger value="fixed" className="text-xs">
                  Fixed <Badge variant="outline" className="ml-1">0</Badge>
                </TabsTrigger>
                <TabsTrigger value="failed" className="text-xs">
                  Failed <Badge variant="outline" className="ml-1">0</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <NoIssuesDisplay 
                  scanComplete={scanComplete}
                  startScan={startScan}
                  isScanning={isScanning}
                />
              </TabsContent>
              
              <TabsContent value="pending" className="mt-6">
                <NoIssuesDisplay 
                  scanComplete={scanComplete}
                  startScan={startScan}
                  isScanning={isScanning}
                  message="No pending issues found."
                />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-6">
                <NoIssuesDisplay 
                  scanComplete={scanComplete}
                  startScan={startScan}
                  isScanning={isScanning}
                  message="No issues currently in progress."
                />
              </TabsContent>
              
              <TabsContent value="fixed" className="mt-6">
                <NoIssuesDisplay 
                  scanComplete={scanComplete}
                  startScan={startScan}
                  isScanning={isScanning}
                  message="No fixed issues to display."
                />
              </TabsContent>
              
              <TabsContent value="failed" className="mt-6">
                <NoIssuesDisplay 
                  scanComplete={scanComplete}
                  startScan={startScan}
                  isScanning={isScanning}
                  message="No failed attempts to display."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const StatsCard = ({ 
  title, 
  value, 
  description,
  icon
}: { 
  title: string, 
  value: string, 
  description: string,
  icon: React.ReactNode 
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-bold">{value}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const NoIssuesDisplay = ({ 
  scanComplete, 
  startScan, 
  isScanning,
  message = "No Issues Found" 
}: { 
  scanComplete: boolean, 
  startScan: () => void, 
  isScanning: boolean,
  message?: string 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Shield className="h-16 w-16 text-gray-300 mb-4" />
    <h3 className="text-xl font-semibold mb-2">{message}</h3>
    <p className="text-muted-foreground max-w-md mb-6">
      {scanComplete 
        ? "The AI maintenance system hasn't detected any issues yet. Run a scan to check for problems."
        : "Run your first scan to identify potential issues with your website."}
    </p>
    <Button
      onClick={startScan}
      disabled={isScanning}
      className="flex items-center gap-2"
    >
      <PlayCircle className="h-4 w-4" />
      {isScanning ? "Scanning..." : "Start Scan"}
    </Button>
  </div>
);

export default AiMaintenance;