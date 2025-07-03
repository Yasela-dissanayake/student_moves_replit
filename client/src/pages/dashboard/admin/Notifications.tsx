import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertTriangle, Info, CheckCircle, X, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  priority: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  createdAt: string;
  category: "system" | "property" | "legal" | "security" | "maintenance";
}

export default function AdminNotifications() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Mock data for notifications - in production this would come from the API
  const notifications: Notification[] = [
    {
      id: 1,
      title: "UK Property Law Update",
      message: "Renters' Rights Bill 2024 - Section 21 abolition requires immediate action on all tenancy agreements",
      type: "warning",
      priority: "critical",
      isRead: false,
      createdAt: "2025-06-13T05:00:00Z",
      category: "legal"
    },
    {
      id: 2,
      title: "Security Alert",
      message: "Suspicious login attempt detected from unusual location for admin account",
      type: "error",
      priority: "high",
      isRead: false,
      createdAt: "2025-06-13T04:30:00Z",
      category: "security"
    },
    {
      id: 3,
      title: "System Maintenance",
      message: "Scheduled maintenance completed successfully. All systems operational",
      type: "success",
      priority: "low",
      isRead: true,
      createdAt: "2025-06-13T03:00:00Z",
      category: "system"
    },
    {
      id: 4,
      title: "Property Compliance Check",
      message: "15 properties require electrical safety certificate renewal within 30 days",
      type: "warning",
      priority: "high",
      isRead: false,
      createdAt: "2025-06-13T02:15:00Z",
      category: "property"
    },
    {
      id: 5,
      title: "Maintenance Request Surge",
      message: "Unusual spike in maintenance requests (45% increase). Consider additional resources",
      type: "info",
      priority: "medium",
      isRead: true,
      createdAt: "2025-06-13T01:45:00Z",
      category: "maintenance"
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.isRead) return false;
    if (filter !== "all" && notification.category !== filter) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard/admin')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showUnreadOnly ? "Show All" : "Unread Only"}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="legal">Legal ({notifications.filter(n => n.category === "legal").length})</TabsTrigger>
          <TabsTrigger value="security">Security ({notifications.filter(n => n.category === "security").length})</TabsTrigger>
          <TabsTrigger value="property">Property ({notifications.filter(n => n.category === "property").length})</TabsTrigger>
          <TabsTrigger value="system">System ({notifications.filter(n => n.category === "system").length})</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({notifications.filter(n => n.category === "maintenance").length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">No notifications found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(notification.type)}
                          <div>
                            <CardTitle className="text-lg">{notification.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={getPriorityColor(notification.priority)}
                              >
                                {notification.priority.toUpperCase()}
                              </Badge>
                              <Badge variant="secondary">
                                {notification.category}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex justify-end mt-4">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}