import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Search,
  FileText,
  Calendar,
  Users,
  Shield
} from "lucide-react";

interface UkPropertyLegislation {
  id: number;
  title: string;
  summary: string;
  fullText?: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  affectedParties: string[];
  implementationDate?: string;
  lastUpdated: string;
  governmentSource: string;
  sourceUrl?: string;
  complianceRequirements?: string[];
  penalties?: string;
  actionRequired?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserLegislationTracking {
  id: number;
  userId: number;
  legislationId: number;
  acknowledgedAt: string;
  reminderSent: boolean;
  reminderSentAt?: string;
  createdAt: string;
}

export default function LegalCompliance() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLegislation, setSelectedLegislation] = useState<UkPropertyLegislation | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all legislation
  const { data: legislation = [], isLoading } = useQuery<UkPropertyLegislation[]>({
    queryKey: ['/api/uk-legislation'],
  });

  // Fetch critical legislation
  const { data: criticalLegislation = [] } = useQuery<UkPropertyLegislation[]>({
    queryKey: ['/api/uk-legislation/critical'],
  });

  // Acknowledge legislation mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (legislationId: number) => {
      const response = await fetch(`/api/uk-legislation/${legislationId}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to acknowledge legislation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Legislation Acknowledged",
        description: "You have successfully acknowledged this legislation update.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/uk-legislation'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to acknowledge legislation",
        variant: "destructive",
      });
    },
  });

  // Update database mutation
  const updateDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/uk-legislation/update-database', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update legislation database');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Database Updated",
        description: "Legislation database has been updated with the latest information.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/uk-legislation'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update legislation database",
        variant: "destructive",
      });
    },
  });

  // Filter legislation
  const filteredLegislation = legislation.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesUrgency = selectedUrgency === "all" || item.urgency === selectedUrgency;
    const matchesSearch = searchTerm === "" || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesUrgency && matchesSearch;
  });

  // Get unique categories
  const categories = Array.from(new Set(legislation.map(item => item.category)));

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Legal & Compliance</h1>
          <p className="text-muted-foreground mt-2">
            Stay up-to-date with UK property law and regulatory changes
          </p>
        </div>
        <Button 
          onClick={() => updateDatabaseMutation.mutate()}
          disabled={updateDatabaseMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${updateDatabaseMutation.isPending ? 'animate-spin' : ''}`} />
          Update Database
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalLegislation.length > 0 && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Critical Legal Updates</AlertTitle>
          <AlertDescription className="text-red-700">
            You have {criticalLegislation.length} critical or high-priority legal update{criticalLegislation.length !== 1 ? 's' : ''} requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="legislation">All Legislation</TabsTrigger>
          <TabsTrigger value="critical">Critical Updates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{legislation.length}</div>
                <p className="text-xs text-muted-foreground">Active legislation items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {legislation.filter(item => item.urgency === 'critical').length}
                </div>
                <p className="text-xs text-muted-foreground">Requiring immediate action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {legislation.filter(item => item.urgency === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground">Important updates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">Legal areas covered</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Recent Critical Updates
              </CardTitle>
              <CardDescription>
                Latest high-priority legal changes requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {criticalLegislation.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 py-3">
                    <Badge className={getUrgencyColor(item.urgency)}>
                      {item.urgency}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {item.summary}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => acknowledgeMutation.mutate(item.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legislation" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Legislation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search legislation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Legislation List */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading legislation...</span>
                </CardContent>
              </Card>
            ) : filteredLegislation.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No legislation found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              filteredLegislation.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getUrgencyColor(item.urgency)}>
                            {getUrgencyIcon(item.urgency)}
                            {item.urgency}
                          </Badge>
                          <Badge variant="outline">
                            {item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {item.summary}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLegislation(item)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Updated: {new Date(item.lastUpdated).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Affects: {item.affectedParties?.join(', ') || 'All users'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.sourceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(item.sourceUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate(item.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="critical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Critical Legal Updates
              </CardTitle>
              <CardDescription>
                Legislation requiring immediate attention and action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {criticalLegislation.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No critical legal updates at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalLegislation.map((item) => (
                    <Card key={item.id} className="border-red-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className={`${getUrgencyColor(item.urgency)} mb-2`}>
                              {getUrgencyIcon(item.urgency)}
                              {item.urgency}
                            </Badge>
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {item.summary}
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => acknowledgeMutation.mutate(item.id)}
                            disabled={acknowledgeMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Acknowledge Now
                          </Button>
                        </div>
                      </CardHeader>
                      {item.actionRequired && (
                        <CardContent>
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Action Required</AlertTitle>
                            <AlertDescription>{item.actionRequired}</AlertDescription>
                          </Alert>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Checklist</CardTitle>
                <CardDescription>
                  Essential compliance requirements for UK property management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Deposit Protection Scheme Registration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Gas Safety Certificates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Electrical Safety Standards</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span>HMO Licensing (if applicable)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span>Right to Rent Checks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Resources</CardTitle>
                <CardDescription>
                  Quick access to important legal resources and guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gov.uk Property Law Updates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Deposit Protection Schemes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Health & Safety Executive
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Local Authority Housing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Legislation Detail Modal */}
      {selectedLegislation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className={`${getUrgencyColor(selectedLegislation.urgency)} mb-2`}>
                    {getUrgencyIcon(selectedLegislation.urgency)}
                    {selectedLegislation.urgency}
                  </Badge>
                  <CardTitle className="text-xl">{selectedLegislation.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Source: {selectedLegislation.governmentSource}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedLegislation(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-gray-600">{selectedLegislation.summary}</p>
              </div>

              {selectedLegislation.fullText && (
                <div>
                  <h4 className="font-semibold mb-2">Full Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedLegislation.fullText}</p>
                  </div>
                </div>
              )}

              {selectedLegislation.complianceRequirements && selectedLegislation.complianceRequirements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Compliance Requirements</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedLegislation.complianceRequirements.map((req, index) => (
                      <li key={index} className="text-sm">{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLegislation.actionRequired && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Action Required</AlertTitle>
                  <AlertDescription>{selectedLegislation.actionRequired}</AlertDescription>
                </Alert>
              )}

              {selectedLegislation.penalties && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Penalties for Non-Compliance</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {selectedLegislation.penalties}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>Last Updated: {new Date(selectedLegislation.lastUpdated).toLocaleDateString()}</p>
                  <p>Implementation Date: {selectedLegislation.implementationDate ? new Date(selectedLegislation.implementationDate).toLocaleDateString() : 'Not specified'}</p>
                </div>
                <div className="flex gap-2">
                  {selectedLegislation.sourceUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedLegislation.sourceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Source
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      acknowledgeMutation.mutate(selectedLegislation.id);
                      setSelectedLegislation(null);
                    }}
                    disabled={acknowledgeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}