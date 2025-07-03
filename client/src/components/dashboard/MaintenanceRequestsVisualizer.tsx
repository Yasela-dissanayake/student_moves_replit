import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Home,
  MoreHorizontal,
  Plus,
  Search,
  Wrench,
  XCircle,
  BarChart4
} from "lucide-react";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  propertyId: number;
  tenantId: number;
  assignedContractorId?: number;
  reportedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedCost?: string;
  actualCost?: string;
  property: {
    id: number;
    address: string;
  };
  assignedContractor?: {
    id: number;
    name: string;
    contact?: string;
    specialty?: string;
  };
}

interface MaintenanceRequestsVisualizerProps {
  maintenanceRequests: MaintenanceRequest[];
  onViewDetails: (requestId: number) => void;
}

export default function MaintenanceRequestsVisualizer({
  maintenanceRequests,
  onViewDetails
}: MaintenanceRequestsVisualizerProps) {
  const [view, setView] = useState<'list' | 'stats' | 'timeline'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  // Apply filters
  const filteredRequests = maintenanceRequests.filter(request => {
    if (filterStatus !== 'all' && request.status !== filterStatus) return false;
    if (filterPriority !== 'all' && request.priority !== filterPriority) return false;
    return true;
  });
  
  // Count requests by status
  const counts = {
    pending: maintenanceRequests.filter(r => r.status === 'pending').length,
    scheduled: maintenanceRequests.filter(r => r.status === 'scheduled').length,
    inProgress: maintenanceRequests.filter(r => r.status === 'in-progress').length,
    completed: maintenanceRequests.filter(r => r.status === 'completed').length,
    cancelled: maintenanceRequests.filter(r => r.status === 'cancelled').length,
    total: maintenanceRequests.length
  };
  
  // Count requests by priority
  const priorityCounts = {
    emergency: maintenanceRequests.filter(r => r.priority === 'emergency').length,
    high: maintenanceRequests.filter(r => r.priority === 'high').length,
    medium: maintenanceRequests.filter(r => r.priority === 'medium').length,
    low: maintenanceRequests.filter(r => r.priority === 'low').length
  };
  
  // Helper functions for styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Scheduled</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'emergency':
        return <Badge className="bg-red-100 text-red-800">Emergency</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>Track and manage property maintenance issues</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={view === 'list' ? "default" : "outline"} 
              size="sm"
              onClick={() => setView('list')}
            >
              List
            </Button>
            <Button 
              variant={view === 'stats' ? "default" : "outline"} 
              size="sm"
              onClick={() => setView('stats')}
            >
              Statistics
            </Button>
            <Button 
              variant={view === 'timeline' ? "default" : "outline"} 
              size="sm"
              onClick={() => setView('timeline')}
            >
              Timeline
            </Button>
          </div>
        </div>
        
        {view === 'list' && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex-1 min-w-[200px]">
              <TabsList className="w-full">
                <TabsTrigger 
                  value="all" 
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'bg-primary text-primary-foreground' : ''}
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  onClick={() => setFilterStatus('pending')}
                  className={filterStatus === 'pending' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger 
                  value="scheduled" 
                  onClick={() => setFilterStatus('scheduled')}
                  className={filterStatus === 'scheduled' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Scheduled
                </TabsTrigger>
                <TabsTrigger 
                  value="in-progress" 
                  onClick={() => setFilterStatus('in-progress')}
                  className={filterStatus === 'in-progress' ? 'bg-primary text-primary-foreground' : ''}
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger 
                  value="completed" 
                  onClick={() => setFilterStatus('completed')}
                  className={filterStatus === 'completed' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Completed
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant={filterPriority === 'all' ? "default" : "outline"}
                onClick={() => setFilterPriority('all')}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={filterPriority === 'emergency' ? "default" : "outline"}
                onClick={() => setFilterPriority('emergency')}
                className={filterPriority === 'emergency' ? '' : 'text-red-600'}
              >
                Emergency
              </Button>
              <Button 
                size="sm" 
                variant={filterPriority === 'high' ? "default" : "outline"}
                onClick={() => setFilterPriority('high')}
                className={filterPriority === 'high' ? '' : 'text-orange-600'}
              >
                High
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {view === 'list' && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-yellow-50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{counts.pending}</p>
                  </div>
                  <div className="bg-yellow-200 p-2 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800">In Progress</p>
                    <p className="text-2xl font-bold text-blue-900">{counts.inProgress}</p>
                  </div>
                  <div className="bg-blue-200 p-2 rounded-full">
                    <Wrench className="h-6 w-6 text-blue-700" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-800">Completed</p>
                    <p className="text-2xl font-bold text-green-900">{counts.completed}</p>
                  </div>
                  <div className="bg-green-200 p-2 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-700" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
                  </div>
                  <div className="bg-gray-200 p-2 rounded-full">
                    <Home className="h-6 w-6 text-gray-700" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 p-8">
                  <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No maintenance requests found</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Try adjusting your filters or add a new maintenance request
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map(request => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium">{request.title}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Home className="h-3 w-3" />
                                <span>{request.property.address}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(request.status)}
                              {getPriorityBadge(request.priority)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {request.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Reported: {format(new Date(request.reportedDate), 'dd MMM yyyy')}</span>
                            </div>
                            
                            {request.scheduledDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Scheduled: {format(new Date(request.scheduledDate), 'dd MMM yyyy')}</span>
                              </div>
                            )}
                            
                            {request.estimatedCost && (
                              <div className="flex items-center gap-1">
                                <PoundSterling className="h-3 w-3" />
                                <span>Est. Cost: {request.estimatedCost}</span>
                              </div>
                            )}
                            
                            {request.assignedContractor && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>Contractor: {request.assignedContractor.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex p-4 md:border-l justify-between md:flex-col md:w-32">
                          <Button 
                            onClick={() => onViewDetails(request.id)}
                            className="w-full"
                            variant="default"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
        
        {view === 'stats' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Maintenance Request Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Pending ({counts.pending})</span>
                          <span>{((counts.pending / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(counts.pending / counts.total) * 100} className="h-2 bg-yellow-100" indicatorClassName="bg-yellow-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Scheduled ({counts.scheduled})</span>
                          <span>{((counts.scheduled / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(counts.scheduled / counts.total) * 100} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>In Progress ({counts.inProgress})</span>
                          <span>{((counts.inProgress / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(counts.inProgress / counts.total) * 100} className="h-2 bg-indigo-100" indicatorClassName="bg-indigo-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Completed ({counts.completed})</span>
                          <span>{((counts.completed / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(counts.completed / counts.total) * 100} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Cancelled ({counts.cancelled})</span>
                          <span>{((counts.cancelled / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(counts.cancelled / counts.total) * 100} className="h-2 bg-red-100" indicatorClassName="bg-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6 flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart4 className="h-20 w-20 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground">Status pie chart visualization will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Request Priority Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Emergency ({priorityCounts.emergency})</span>
                          <span>{((priorityCounts.emergency / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(priorityCounts.emergency / counts.total) * 100} className="h-2 bg-red-100" indicatorClassName="bg-red-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>High ({priorityCounts.high})</span>
                          <span>{((priorityCounts.high / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(priorityCounts.high / counts.total) * 100} className="h-2 bg-orange-100" indicatorClassName="bg-orange-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Medium ({priorityCounts.medium})</span>
                          <span>{((priorityCounts.medium / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(priorityCounts.medium / counts.total) * 100} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Low ({priorityCounts.low})</span>
                          <span>{((priorityCounts.low / counts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(priorityCounts.low / counts.total) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-gray-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Average Time to Resolution</p>
                        <Badge>5.2 days</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Completion Rate</p>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {counts.total > 0 ? ((counts.completed / counts.total) * 100).toFixed(1) : 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Cost per Request</p>
                        <Badge variant="outline">£75 avg.</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Most Common Issue</p>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Plumbing</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        
        {view === 'timeline' && (
          <div className="h-[450px] flex items-center justify-center">
            <div className="text-center">
              <Timeline className="h-20 w-20 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">Request timeline visualization will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Additional icons
import { 
  Calendar, 
  User, 
  PoundSterling,
  Timeline
} from "lucide-react";