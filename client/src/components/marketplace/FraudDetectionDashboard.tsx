import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Eye, Shield, Ban, Flag, RefreshCcw, ThumbsUp, ThumbsDown, PieChart, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Types
type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface FraudAlert {
  id: number;
  itemId: number;
  itemTitle: string;
  sellerId: number;
  sellerName: string;
  sellerAvatar?: string;
  buyerId?: number;
  buyerName?: string;
  activityType: string;
  activityTimestamp: string;
  detectedTimestamp: string;
  severity: FraudAlertSeverity;
  status: 'new' | 'reviewing' | 'resolved' | 'dismissed';
  aiConfidence: number;
  description: string;
  reasons: string[];
  relatedAlerts?: number[];
}

interface FraudStats {
  totalAlerts: number;
  newAlerts: number;
  resolvedAlerts: number;
  dismissedAlerts: number;
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topFraudCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  aiPerformance: {
    truePositives: number;
    falsePositives: number;
    accuracy: number;
  };
  weeklyTrend: {
    date: string;
    count: number;
  }[];
}

export function FraudDetectionDashboard() {
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'resolve' | 'dismiss'>('resolve');
  const [currentTab, setCurrentTab] = useState('new');
  
  // Fetch fraud alerts
  const { 
    data: alerts, 
    isLoading: alertsLoading, 
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['/api/marketplace/fraud/alerts', currentTab],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/fraud/alerts?status=${currentTab}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts');
      }
      return response.json();
    },
  });
  
  // Fetch fraud statistics
  const { 
    data: stats, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['/api/marketplace/fraud/stats'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/fraud/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch fraud statistics');
      }
      return response.json();
    },
  });
  
  // Handle alert selection for detailed view
  const handleAlertClick = (alert: FraudAlert) => {
    setSelectedAlert(alert);
  };
  
  // Handle alert review submission
  const handleReviewSubmit = async (action: 'resolve' | 'dismiss') => {
    if (!selectedAlert) return;
    
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };
  
  // Process the alert after confirmation
  const processAlert = async () => {
    if (!selectedAlert) return;
    
    try {
      const response = await fetch(`/api/marketplace/fraud/alerts/${selectedAlert.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: confirmAction,
          note: reviewNote,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process alert');
      }
      
      // Reset state and refresh data
      setSelectedAlert(null);
      setReviewNote('');
      setIsConfirmDialogOpen(false);
      refetchAlerts();
      refetchStats();
    } catch (error) {
      console.error('Error processing alert:', error);
    }
  };
  
  // Get severity badge variant
  const getSeverityBadge = (severity: FraudAlertSeverity) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50">Medium</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500">High</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  // Make AI confidence human-readable
  const getAiConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    if (confidence >= 0.3) return 'Low';
    return 'Very Low';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fraud Detection Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage potential fraud in the student marketplace
          </p>
        </div>
        <Button onClick={() => { refetchAlerts(); refetchStats(); }} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.weeklyTrend && stats.weeklyTrend.length > 1 && 
                   ((stats.weeklyTrend[stats.weeklyTrend.length - 1].count - 
                    stats.weeklyTrend[stats.weeklyTrend.length - 2].count) > 0 ? 
                    <span className="text-green-500">↑ {stats.weeklyTrend[stats.weeklyTrend.length - 1].count - stats.weeklyTrend[stats.weeklyTrend.length - 2].count} from last week</span> : 
                    <span className="text-red-500">↓ {stats.weeklyTrend[stats.weeklyTrend.length - 2].count - stats.weeklyTrend[stats.weeklyTrend.length - 1].count} from last week</span>)
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">New Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.newAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Requires review
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.aiPerformance?.accuracy 
                    ? `${(stats.aiPerformance.accuracy * 100).toFixed(1)}%` 
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on reviewer feedback
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.severityDistribution?.critical || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  High priority for review
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Alert Distribution */}
      {!statsLoading && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Alert Severity Distribution</CardTitle>
            <CardDescription>
              Overview of current alert levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Critical</span>
                  <span>{stats.severityDistribution.critical} alerts</span>
                </div>
                <Progress 
                  value={stats.totalAlerts ? (stats.severityDistribution.critical / stats.totalAlerts) * 100 : 0} 
                  className="h-2 bg-gray-100" 
                  indicatorClassName="bg-red-500" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">High</span>
                  <span>{stats.severityDistribution.high} alerts</span>
                </div>
                <Progress 
                  value={stats.totalAlerts ? (stats.severityDistribution.high / stats.totalAlerts) * 100 : 0} 
                  className="h-2 bg-gray-100" 
                  indicatorClassName="bg-orange-500" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Medium</span>
                  <span>{stats.severityDistribution.medium} alerts</span>
                </div>
                <Progress 
                  value={stats.totalAlerts ? (stats.severityDistribution.medium / stats.totalAlerts) * 100 : 0} 
                  className="h-2 bg-gray-100" 
                  indicatorClassName="bg-yellow-500" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Low</span>
                  <span>{stats.severityDistribution.low} alerts</span>
                </div>
                <Progress 
                  value={stats.totalAlerts ? (stats.severityDistribution.low / stats.totalAlerts) * 100 : 0} 
                  className="h-2 bg-gray-100" 
                  indicatorClassName="bg-green-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Alerts Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Alerts</CardTitle>
          <CardDescription>
            Review and manage potential fraud activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="new">
                New
                {stats?.newAlerts > 0 && (
                  <Badge className="ml-2 bg-red-500">{stats.newAlerts}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
            
            <TabsContent value={currentTab} className="m-0">
              {alertsLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-md">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : alerts?.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold">No alerts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {currentTab === 'new' 
                      ? 'There are no new fraud alerts to review.' 
                      : `No alerts with status "${currentTab}".`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alert</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>AI Confidence</TableHead>
                        <TableHead>Detected</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts?.map((alert: FraudAlert) => (
                        <TableRow key={alert.id} onClick={() => handleAlertClick(alert)} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium truncate max-w-xs">{alert.itemTitle}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{alert.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={alert.sellerAvatar} alt={alert.sellerName} />
                                <AvatarFallback>{alert.sellerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{alert.sellerName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Progress 
                                value={alert.aiConfidence * 100} 
                                className="h-2 w-16 bg-gray-100 mr-2" 
                              />
                              <span className="text-xs">{getAiConfidenceText(alert.aiConfidence)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatRelativeTime(alert.detectedTimestamp)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlertClick(alert);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Fraud Alert Details</DialogTitle>
              <DialogDescription>
                Review the details of this suspicious activity
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Alert Overview */}
              <div className="space-y-2">
                <h3 className="font-semibold">Alert Overview</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Alert ID:</span>
                    <span className="text-sm font-medium">{selectedAlert.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Severity:</span>
                    <span>{getSeverityBadge(selectedAlert.severity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant={
                      selectedAlert.status === 'new' ? 'outline' :
                      selectedAlert.status === 'reviewing' ? 'secondary' :
                      selectedAlert.status === 'resolved' ? 'default' :
                      'outline'
                    }>
                      {selectedAlert.status.charAt(0).toUpperCase() + selectedAlert.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Detected:</span>
                    <span className="text-sm">{formatDate(selectedAlert.detectedTimestamp)}</span>
                  </div>
                </div>
              </div>
              
              {/* Item Details */}
              <div className="space-y-2">
                <h3 className="font-semibold">Item Details</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="font-medium">{selectedAlert.itemTitle}</div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Item ID:</span>
                    <span className="text-sm">{selectedAlert.itemId}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Item
                  </Button>
                </div>
              </div>
              
              {/* User Details */}
              <div className="space-y-2">
                <h3 className="font-semibold">User Details</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar>
                        <AvatarImage src={selectedAlert.sellerAvatar} alt={selectedAlert.sellerName} />
                        <AvatarFallback>{selectedAlert.sellerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedAlert.sellerName}</div>
                        <div className="text-sm text-gray-500">Seller</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Seller Profile
                    </Button>
                  </div>
                  
                  {selectedAlert.buyerId && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar>
                          <AvatarFallback>{selectedAlert.buyerName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedAlert.buyerName}</div>
                          <div className="text-sm text-gray-500">Buyer</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View Buyer Profile
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Suspicious Activity */}
              <div className="space-y-2">
                <h3 className="font-semibold">Suspicious Activity</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Activity Type:</span>
                    <span className="ml-2 font-medium">{selectedAlert.activityType}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Activity Time:</span>
                    <span className="ml-2">{formatDate(selectedAlert.activityTimestamp)}</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description:</div>
                    <p className="text-sm bg-white p-2 rounded border">{selectedAlert.description}</p>
                  </div>
                </div>
              </div>
              
              {/* AI Analysis */}
              <div className="space-y-2">
                <h3 className="font-semibold">AI Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-3">
                    <span className="text-sm text-gray-500 mr-2">Confidence:</span>
                    <Progress 
                      value={selectedAlert.aiConfidence * 100} 
                      className="h-2 flex-1 bg-gray-200" 
                    />
                    <span className="ml-2 text-sm font-medium">
                      {(selectedAlert.aiConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Detected Issues:</div>
                    <ul className="space-y-1 ml-5 list-disc text-sm">
                      {selectedAlert.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Review Notes */}
              {currentTab === 'new' && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Review Notes</h3>
                  <Textarea
                    placeholder="Add your notes about this alert..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              {currentTab === 'new' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReviewSubmit('dismiss')}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Dismiss as False Positive
                  </Button>
                  <Button
                    onClick={() => handleReviewSubmit('resolve')}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Mark as Fraud
                  </Button>
                </>
              )}
              {currentTab !== 'new' && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'resolve' 
                ? 'Confirm Mark as Fraud' 
                : 'Confirm Dismiss Alert'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'resolve'
                ? 'This will mark the item as fraudulent and notify the appropriate teams.'
                : 'This will dismiss the alert as a false positive and improve AI detection.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <p className="text-sm text-gray-500">
              {confirmAction === 'resolve'
                ? 'Are you sure you want to confirm this as fraud?'
                : 'Are you sure you want to dismiss this alert?'}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'resolve' ? 'destructive' : 'default'}
              onClick={processAlert}
            >
              {confirmAction === 'resolve' ? 'Confirm Fraud' : 'Confirm Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}