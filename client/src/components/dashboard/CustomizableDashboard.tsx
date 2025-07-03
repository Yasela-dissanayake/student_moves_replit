import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  LayoutGrid,
  Plus,
  X,
  Grip,
  Settings,
  RefreshCcw,
  Save,
  ArrowUp,
  ArrowDown,
  PanelLeft,
  PanelRight,
  ChevronsUp,
  ChevronsDown,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

// Import existing dashboard components
import UnifiedPerformanceMetrics from "./UnifiedPerformanceMetrics";
import EnhancedPropertyManager from "./EnhancedPropertyManager";
import DragDropCalendar from "./DragDropCalendar";

// Define types for widgets
export interface Widget {
  id: string;
  type: string;
  title: string;
  description: string;
  width: 'full' | 'half' | 'third';
  height: 'small' | 'medium' | 'large';
  visible: boolean;
  position: number;
  component: React.ReactNode | null;
  componentProps?: any;
}

interface CustomizableDashboardProps {
  userType: 'agent' | 'landlord';
  username: string;
  dashboardData: any;
  onSaveLayout: (widgets: Widget[]) => void;
  onViewProperty: (id: number) => void;
  onEditProperty: (id: number) => void;
  onCreateProperty?: () => void;
  onCreateEvent?: (event: any) => void;
  onUpdateEvent?: (id: string, event: any) => void;
  onDeleteEvent?: (id: string) => void;
}

export default function CustomizableDashboard({
  userType,
  username,
  dashboardData,
  onSaveLayout,
  onViewProperty,
  onEditProperty,
  onCreateProperty,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent
}: CustomizableDashboardProps) {
  // Default widgets
  const defaultWidgets: Widget[] = [
    {
      id: 'performance-metrics',
      type: 'metrics',
      title: 'Performance Metrics',
      description: 'Key performance indicators and statistics',
      width: 'full',
      height: 'small',
      visible: true,
      position: 0,
      component: <UnifiedPerformanceMetrics 
        userType={userType} 
        dashboardData={dashboardData} 
      />
    },
    {
      id: 'property-manager',
      type: 'properties',
      title: 'Property Management',
      description: 'Manage your property portfolio',
      width: 'full',
      height: 'large',
      visible: true,
      position: 1,
      component: <EnhancedPropertyManager 
        properties={dashboardData.properties || []} 
        onViewProperty={onViewProperty}
        onEditProperty={onEditProperty}
        onCreateProperty={onCreateProperty}
      />
    },
    {
      id: 'calendar',
      type: 'calendar',
      title: 'Schedule & Calendar',
      description: 'View and manage upcoming events and tasks',
      width: 'full',
      height: 'medium',
      visible: true,
      position: 2,
      component: onCreateEvent && onUpdateEvent && onDeleteEvent ? 
        <DragDropCalendar 
          events={dashboardData.calendarEvents || []} 
          properties={dashboardData.properties || []}
          onCreateEvent={onCreateEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        /> : null
    },
    {
      id: 'maintenance-overview',
      type: 'maintenance',
      title: 'Maintenance Overview',
      description: 'Monitor maintenance requests and issues',
      width: 'half',
      height: 'medium',
      visible: userType === 'agent',
      position: 3,
      component: userType === 'agent' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Maintenance Requests</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          {(dashboardData.maintenanceRequests || []).length > 0 ? (
            <div className="space-y-2">
              {(dashboardData.maintenanceRequests || []).slice(0, 5).map((request: any, i: number) => (
                <Card key={i} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">{request.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {request.propertyAddress || `Property ID: ${request.propertyId}`}
                      </p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No maintenance requests found
            </div>
          )}
        </div>
      ) : null
    },
    {
      id: 'tenant-applications',
      type: 'applications',
      title: 'Recent Applications',
      description: 'Review and manage tenant applications',
      width: 'half',
      height: 'medium',
      visible: true,
      position: 4,
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Applications</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          {(dashboardData.applications || []).length > 0 ? (
            <div className="space-y-2">
              {(dashboardData.applications || []).slice(0, 5).map((application: any, i: number) => (
                <Card key={i} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">
                        {application.tenantName || `Tenant ID: ${application.tenantId}`}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {application.propertyAddress || `Property ID: ${application.propertyId}`}
                      </p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'approved' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No applications found
            </div>
          )}
        </div>
      )
    },
    {
      id: 'recent-payments',
      type: 'payments',
      title: 'Recent Payments',
      description: 'Monitor recent payment activity',
      width: 'half',
      height: 'medium',
      visible: true,
      position: 5,
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Recent Payments</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          {(dashboardData.payments || []).length > 0 ? (
            <div className="space-y-2">
              {(dashboardData.payments || []).slice(0, 5).map((payment: any, i: number) => (
                <Card key={i} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-sm">
                        £{parseFloat(payment.amount.toString()).toLocaleString()}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {payment.tenantName || `Tenancy ID: ${payment.tenancyId}`}
                      </p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No payments found
            </div>
          )}
        </div>
      )
    },
    {
      id: 'compliance-status',
      type: 'compliance',
      title: 'Compliance Status',
      description: 'Track property compliance status',
      width: 'half',
      height: 'medium',
      visible: true,
      position: 6,
      component: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Compliance Status</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          
          {(dashboardData.properties || []).length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 bg-green-50 border-green-200">
                  <h4 className="text-xs text-green-700 font-medium">Compliant</h4>
                  <p className="text-2xl font-bold text-green-700">
                    {(dashboardData.properties || []).filter((p: any) => 
                      p.epcRating && 
                      p.gasChecked && 
                      p.electricalChecked && 
                      (p.bedrooms <= 4 || p.hmoLicensed)
                    ).length}
                  </p>
                </Card>
                <Card className="p-3 bg-yellow-50 border-yellow-200">
                  <h4 className="text-xs text-yellow-700 font-medium">Issues</h4>
                  <p className="text-2xl font-bold text-yellow-700">
                    {(dashboardData.properties || []).filter((p: any) => 
                      (!p.epcRating || !p.gasChecked || !p.electricalChecked) && 
                      !(p.bedrooms > 4 && !p.hmoLicensed)
                    ).length}
                  </p>
                </Card>
                <Card className="p-3 bg-red-50 border-red-200">
                  <h4 className="text-xs text-red-700 font-medium">Critical</h4>
                  <p className="text-2xl font-bold text-red-700">
                    {(dashboardData.properties || []).filter((p: any) => 
                      p.bedrooms > 4 && !p.hmoLicensed
                    ).length}
                  </p>
                </Card>
              </div>
              
              <Alert variant="destructive" className={
                (dashboardData.properties || []).some((p: any) => p.bedrooms > 4 && !p.hmoLicensed) 
                  ? "bg-red-50 text-red-800 border-red-200" 
                  : "hidden"
              }>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have properties requiring HMO licenses. This is a legal requirement.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                {(dashboardData.properties || [])
                  .filter((p: any) => 
                    !p.epcRating || !p.gasChecked || !p.electricalChecked || 
                    (p.bedrooms > 4 && !p.hmoLicensed)
                  )
                  .slice(0, 3)
                  .map((property: any, i: number) => (
                    <Card key={i} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{property.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {!property.epcRating ? 'Missing EPC' : 
                             !property.gasChecked ? 'Missing Gas Safety' :
                             !property.electricalChecked ? 'Missing Electrical Safety' :
                             (property.bedrooms > 4 && !property.hmoLicensed) ? 'HMO License Required' : 
                             'Compliance issue'}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEditProperty(property.id)}
                        >
                          Fix
                        </Button>
                      </div>
                    </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No properties found
            </div>
          )}
        </div>
      )
    }
  ];

  // State for active widgets
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationTab, setCustomizationTab] = useState('layout');
  const [isDirty, setIsDirty] = useState(false);

  // Filter widgets based on visibility
  const visibleWidgets = widgets.filter(widget => widget.visible);

  // Load saved layout if available
  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userType}-${username}`);
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        // Merge saved properties with default widgets to ensure we have all needed components
        const mergedWidgets = defaultWidgets.map(defaultWidget => {
          const savedWidget = parsedLayout.find((w: Widget) => w.id === defaultWidget.id);
          if (savedWidget) {
            return {
              ...defaultWidget,
              visible: savedWidget.visible,
              position: savedWidget.position,
              width: savedWidget.width,
              height: savedWidget.height
            };
          }
          return defaultWidget;
        });
        
        setWidgets(mergedWidgets);
      } catch (error) {
        console.error('Failed to load saved layout:', error);
      }
    }
  }, [userType, username]);

  // Save layout to localStorage and call parent save function
  const saveLayout = () => {
    localStorage.setItem(`dashboard-layout-${userType}-${username}`, JSON.stringify(widgets));
    onSaveLayout(widgets);
    setIsDirty(false);
  };

  // Reset to default layout
  const resetLayout = () => {
    setWidgets(defaultWidgets);
    setIsDirty(true);
  };

  // Update widget position
  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const updatedWidgets = [...widgets];
    const index = updatedWidgets.findIndex(w => w.id === id);
    
    if (direction === 'up' && index > 0) {
      // Swap with the widget above
      const widget = updatedWidgets[index];
      const prevWidget = updatedWidgets[index - 1];
      updatedWidgets[index - 1] = widget;
      updatedWidgets[index] = prevWidget;
    } else if (direction === 'down' && index < updatedWidgets.length - 1) {
      // Swap with the widget below
      const widget = updatedWidgets[index];
      const nextWidget = updatedWidgets[index + 1];
      updatedWidgets[index + 1] = widget;
      updatedWidgets[index] = nextWidget;
    }
    
    // Update positions
    updatedWidgets.forEach((widget, idx) => {
      widget.position = idx;
    });
    
    setWidgets(updatedWidgets);
    setIsDirty(true);
  };

  // Update widget visibility
  const toggleWidgetVisibility = (id: string) => {
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === id) {
        return { ...widget, visible: !widget.visible };
      }
      return widget;
    });
    
    setWidgets(updatedWidgets);
    setIsDirty(true);
  };

  // Update widget width
  const changeWidgetWidth = (id: string, width: 'full' | 'half' | 'third') => {
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === id) {
        return { ...widget, width };
      }
      return widget;
    });
    
    setWidgets(updatedWidgets);
    setIsDirty(true);
  };

  // Update widget height
  const changeWidgetHeight = (id: string, height: 'small' | 'medium' | 'large') => {
    const updatedWidgets = widgets.map(widget => {
      if (widget.id === id) {
        return { ...widget, height };
      }
      return widget;
    });
    
    setWidgets(updatedWidgets);
    setIsDirty(true);
  };

  // Get CSS classes for widget dimensions
  const getWidgetClasses = (widget: Widget) => {
    let widthClass = 'col-span-12'; // full width (default)
    if (widget.width === 'half') widthClass = 'col-span-12 md:col-span-6';
    if (widget.width === 'third') widthClass = 'col-span-12 md:col-span-4';
    
    let heightClass = 'h-auto'; // default
    if (widget.height === 'small') heightClass = 'h-auto md:h-[250px]';
    if (widget.height === 'medium') heightClass = 'h-auto md:h-[400px]';
    if (widget.height === 'large') heightClass = 'h-auto md:h-[600px]';
    
    return `${widthClass} ${heightClass}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {username}</h1>
          <p className="text-muted-foreground">
            Your personalized {userType === 'agent' ? 'agent' : 'landlord'} dashboard
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsCustomizing(true)}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Customize Dashboard
        </Button>
      </div>
      
      {/* Dashboard grid layout */}
      <div className="grid grid-cols-12 gap-4">
        {visibleWidgets
          .sort((a, b) => a.position - b.position)
          .map(widget => (
            <Card 
              key={widget.id} 
              className={`${getWidgetClasses(widget)} overflow-hidden`}
            >
              <CardHeader className="p-4">
                <CardTitle>{widget.title}</CardTitle>
                <CardDescription>{widget.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 overflow-auto">
                {widget.component}
              </CardContent>
            </Card>
          ))}
      </div>
      
      {/* Customization dialog */}
      <Dialog open={isCustomizing} onOpenChange={(open) => {
        setIsCustomizing(open);
        if (!open && isDirty) {
          saveLayout();
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customize Your Dashboard</DialogTitle>
            <DialogDescription>
              Arrange, resize, and toggle widgets to personalize your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={customizationTab} onValueChange={setCustomizationTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layout">Layout & Arrangement</TabsTrigger>
              <TabsTrigger value="visibility">Visibility & Display</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layout" className="py-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {widgets
                    .filter(widget => widget.visible)
                    .sort((a, b) => a.position - b.position)
                    .map(widget => (
                      <Card key={widget.id} className="relative overflow-hidden">
                        <div className="absolute left-3 top-3 p-1 rounded-md border bg-background">
                          <Grip className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <CardHeader className="pl-12">
                          <CardTitle className="text-base">{widget.title}</CardTitle>
                          <CardDescription className="text-xs">{widget.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between pt-0">
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs font-normal">Size:</Label>
                            <Button 
                              size="sm" 
                              variant={widget.width === 'full' ? 'default' : 'outline'} 
                              className="h-7 px-2 text-xs"
                              onClick={() => changeWidgetWidth(widget.id, 'full')}
                            >
                              Full
                            </Button>
                            <Button 
                              size="sm" 
                              variant={widget.width === 'half' ? 'default' : 'outline'} 
                              className="h-7 px-2 text-xs"
                              onClick={() => changeWidgetWidth(widget.id, 'half')}
                            >
                              Half
                            </Button>
                            <Button 
                              size="sm" 
                              variant={widget.width === 'third' ? 'default' : 'outline'} 
                              className="h-7 px-2 text-xs"
                              onClick={() => changeWidgetWidth(widget.id, 'third')}
                            >
                              Third
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => moveWidget(widget.id, 'up')}
                              disabled={widgets.findIndex(w => w.id === widget.id) === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => moveWidget(widget.id, 'down')}
                              disabled={
                                widgets.findIndex(w => w.id === widget.id) === 
                                widgets.filter(w => w.visible).length - 1
                              }
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="visibility" className="py-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {widgets.map(widget => (
                    <Card key={widget.id}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{widget.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {widget.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWidgetVisibility(widget.id)}
                          >
                            {widget.visible ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0">
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs font-normal">Height:</Label>
                          <Button 
                            size="sm" 
                            variant={widget.height === 'small' ? 'default' : 'outline'} 
                            className="h-7 px-2 text-xs"
                            onClick={() => changeWidgetHeight(widget.id, 'small')}
                          >
                            <Minimize2 className="h-3 w-3 mr-1" />
                            Small
                          </Button>
                          <Button 
                            size="sm" 
                            variant={widget.height === 'medium' ? 'default' : 'outline'} 
                            className="h-7 px-2 text-xs"
                            onClick={() => changeWidgetHeight(widget.id, 'medium')}
                          >
                            <Maximize2 className="h-3 w-3 mr-1" />
                            Medium
                          </Button>
                          <Button 
                            size="sm" 
                            variant={widget.height === 'large' ? 'default' : 'outline'} 
                            className="h-7 px-2 text-xs"
                            onClick={() => changeWidgetHeight(widget.id, 'large')}
                          >
                            <ChevronsUp className="h-3 w-3 mr-1" />
                            Large
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetLayout}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCustomizing(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  saveLayout();
                  setIsCustomizing(false);
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}