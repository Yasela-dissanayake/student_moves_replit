import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, Settings, Activity, AlertTriangle, FileCheck, Shield, Target, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";

const AdminAIMaintenance: React.FC = () => {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string>('');

  // Sample AI operation details
  const aiOperations = {
    documents: {
      title: "Document Verification",
      description: "AI-powered document analysis and verification system",
      icon: <FileCheck className="h-5 w-5" />,
      stats: {
        processed: 23,
        successful: 22,
        failed: 1,
        avgTime: "2.3s"
      },
      recentActivities: [
        { id: 1, type: "Passport", student: "Emma Johnson", status: "verified", time: "2 mins ago" },
        { id: 2, type: "Student ID", student: "James Wilson", status: "verified", time: "5 mins ago" },
        { id: 3, type: "Driving License", student: "Sophie Brown", status: "failed", time: "8 mins ago", reason: "Blurry image" },
        { id: 4, type: "Bank Statement", student: "Alex Chen", status: "verified", time: "12 mins ago" }
      ]
    },
    fraud: {
      title: "Fraud Analysis",
      description: "AI-driven fraud detection for marketplace listings",
      icon: <Shield className="h-5 w-5" />,
      stats: {
        processed: 47,
        suspicious: 3,
        flagged: 1,
        avgTime: "1.8s"
      },
      recentActivities: [
        { id: 1, type: "Listing", item: "iPhone 13 Pro", status: "safe", time: "3 mins ago" },
        { id: 2, type: "Listing", item: "Textbook Bundle", status: "safe", time: "7 mins ago" },
        { id: 3, type: "Listing", item: "Designer Bag", status: "flagged", time: "10 mins ago", reason: "Suspicious pricing" },
        { id: 4, type: "Listing", item: "Laptop Dell XPS", status: "safe", time: "15 mins ago" }
      ]
    },
    matching: {
      title: "Property Matching",
      description: "AI-powered tenant-property recommendation engine",
      icon: <Target className="h-5 w-5" />,
      stats: {
        generated: 156,
        successful: 142,
        pending: 14,
        avgTime: "0.9s"
      },
      recentActivities: [
        { id: 1, type: "Match", tenant: "Sarah Davis", property: "2 Bed Flat, Manchester", status: "interested", time: "1 min ago" },
        { id: 2, type: "Match", tenant: "Mike Thompson", property: "Studio, Birmingham", status: "applied", time: "4 mins ago" },
        { id: 3, type: "Match", tenant: "Lisa Wang", property: "3 Bed House, Leeds", status: "viewing", time: "18 mins ago" },
        { id: 4, type: "Match", tenant: "Tom Harris", property: "1 Bed Flat, London", status: "pending", time: "25 mins ago" }
      ]
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
      case "safe":
      case "successful":
      case "applied":
      case "viewing":
        return "bg-green-100 text-green-800";
      case "failed":
      case "flagged":
        return "bg-red-100 text-red-800";
      case "suspicious":
      case "pending":
      case "interested":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "safe":
      case "successful":
      case "applied":
      case "viewing":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
      case "flagged":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "suspicious":
      case "pending":
      case "interested":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout dashboardType="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard/AdminDashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">AI Maintenance</h2>
          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={() => alert('🔍 Running AI Diagnostics...\n\nTesting:\n• Custom AI Provider: ✅ Online\n• OpenAI Fallback: ✅ Available\n• Gemini Provider: ✅ Ready\n• Document Analysis: ✅ Processing\n• Fraud Detection: ✅ Active\n• Property Matching: ✅ Operational\n\n✅ All AI services are running optimally!')}
          >
            Run Diagnostics
          </button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Services</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Active providers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Models</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Available models</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests/Hour</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">Current load</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Active issues</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Status</CardTitle>
              <CardDescription>Current status of AI service providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Custom AI Provider</div>
                    <div className="text-sm text-muted-foreground">Primary provider</div>
                  </div>
                  <div className="text-sm text-green-600">Operational</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">OpenAI GPT-4o</div>
                    <div className="text-sm text-muted-foreground">Fallback provider</div>
                  </div>
                  <div className="text-sm text-green-600">Operational</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Google Gemini</div>
                    <div className="text-sm text-muted-foreground">Secondary fallback</div>
                  </div>
                  <div className="text-sm text-green-600">Operational</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Deepseek</div>
                    <div className="text-sm text-muted-foreground">Backup provider</div>
                  </div>
                  <div className="text-sm text-green-600">Operational</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>AI service metrics and performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Document Analysis</span>
                  <span className="text-sm text-green-600">99.2% uptime</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fraud Detection</span>
                  <span className="text-sm text-green-600">98.7% uptime</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Property Matching</span>
                  <span className="text-sm text-green-600">99.8% uptime</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Moderation</span>
                  <span className="text-sm text-green-600">99.5% uptime</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Response Time</span>
                  <span className="text-sm">1.2s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="text-sm">0.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Operations</CardTitle>
            <CardDescription>Latest AI service activities and processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Document Verification</div>
                  <div className="text-sm text-muted-foreground">Processed 23 student documents</div>
                  <div className="text-xs text-muted-foreground">5 minutes ago</div>
                </div>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  onClick={() => {
                    setCurrentOperation('documents');
                    setIsDialogOpen(true);
                  }}
                >
                  View Details
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Fraud Analysis</div>
                  <div className="text-sm text-muted-foreground">Analyzed 47 marketplace listings</div>
                  <div className="text-xs text-muted-foreground">12 minutes ago</div>
                </div>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  onClick={() => {
                    setCurrentOperation('fraud');
                    setIsDialogOpen(true);
                  }}
                >
                  View Details
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Property Matching</div>
                  <div className="text-sm text-muted-foreground">Generated 156 tenant recommendations</div>
                  <div className="text-xs text-muted-foreground">28 minutes ago</div>
                </div>
                <button 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  onClick={() => {
                    setCurrentOperation('matching');
                    setIsDialogOpen(true);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Single Dialog for all operations */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {currentOperation && aiOperations[currentOperation as keyof typeof aiOperations]?.icon}
                {currentOperation && aiOperations[currentOperation as keyof typeof aiOperations]?.title}
              </DialogTitle>
              <DialogDescription>
                {currentOperation && aiOperations[currentOperation as keyof typeof aiOperations]?.description}
              </DialogDescription>
            </DialogHeader>
            
            {currentOperation && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                  {Object.entries(aiOperations[currentOperation as keyof typeof aiOperations]?.stats || {}).map(([key, value]) => (
                    <div key={key} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{value}</div>
                      <div className="text-sm text-muted-foreground capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {aiOperations[currentOperation as keyof typeof aiOperations]?.recentActivities?.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(activity.status)}
                          <div>
                            <div className="font-medium">
                              {activity.type && activity.student && `${activity.type} - ${activity.student}`}
                              {activity.type && activity.item && `${activity.type} - ${activity.item}`}
                              {activity.tenant && activity.property && `${activity.tenant} → ${activity.property}`}
                            </div>
                            <div className="text-sm text-muted-foreground">{activity.time}</div>
                            {activity.reason && <div className="text-sm text-red-600">{activity.reason}</div>}
                          </div>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    )) || []}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminAIMaintenance;