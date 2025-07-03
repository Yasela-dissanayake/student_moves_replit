import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Code, Palette } from "lucide-react";
import { Link } from "wouter";

const AdminWebsiteBuilder: React.FC = () => {
  return (
    <DashboardLayout dashboardType="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard/AdminDashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Website Builder</h2>
          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={() => alert('🚀 Creating new website...\n\nChoose a template:\n• Property Showcase\n• Student Portal\n• Agent Dashboard\n• Landlord Management\n\nFeatures include AI-powered design, responsive layouts, and integrated property management tools.')}
          >
            Create New Site
          </button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Currently deployed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Available templates</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custom Code</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Custom components</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Website Management</CardTitle>
            <CardDescription>Manage and deploy website configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Main StudentMoves Site</div>
                  <div className="text-sm text-muted-foreground">Status: Live</div>
                </div>
                <div className="space-x-2">
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    onClick={() => alert('🛠 Opening Main Site Editor...\n\nEdit features:\n• Homepage layout\n• Property listings\n• Student portal\n• Contact forms\n• SEO settings')}
                  >
                    Edit
                  </button>
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                    onClick={() => alert('🚀 Deploying Main Site...\n\nDeployment Status:\n• Building production assets...\n• Compressing images...\n• Updating CDN cache...\n• Running final tests...\n\n✅ Main site deployed successfully to live environment!')}
                  >
                    Deploy
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Property Showcase</div>
                  <div className="text-sm text-muted-foreground">Status: Draft</div>
                </div>
                <div className="space-x-2">
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    onClick={() => alert('🛠 Opening Property Showcase Editor...\n\nEdit features:\n• Property gallery layouts\n• Virtual tour integration\n• Booking system\n• Agent contact forms\n• Property comparison tools')}
                  >
                    Edit
                  </button>
                  <button 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                    onClick={() => alert('🚀 Deploying Property Showcase...\n\nDeployment Status:\n• Building property templates...\n• Optimizing gallery images...\n• Setting up booking system...\n• Configuring agent routing...\n\n✅ Property Showcase deployed successfully!')}
                  >
                    Deploy
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminWebsiteBuilder;