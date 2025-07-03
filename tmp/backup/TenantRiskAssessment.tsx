import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getTenantRiskAssessment, 
  createTenantRiskAssessment, 
  getAllTenantRiskAssessments,
  getRecentRiskAssessments,
  verifyRiskAssessment
} from '@/lib/api';
import { getTenants } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
  Shield,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface RiskAssessmentFactor {
  factor: string;
  score: number;
  description: string;
}

interface Review {
  source: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  date?: string;
}

interface RiskAssessmentResult {
  tenantId: number;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: RiskAssessmentFactor[];
  reviews?: Review[];
  recommendations: string[];
  generatedAt: string;
}

// The database TenantRiskAssessment interface
interface TenantRiskAssessment {
  id: number;
  tenantId: number;
  applicationId: number | null;
  assessmentData: string; // JSON string
  overallRiskScore: string;
  riskLevel: string;
  reviewFindings: string | null; // JSON string
  assessedBy: string;
  assessedById: number | null;
  verifiedBy: number | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  userType: string;
}

const TenantRiskAssessment: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [checkReviews, setCheckReviews] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch list of tenants
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    queryFn: async () => {
      const response = await getTenants();
      const data = await response.json();
      return data.filter((user: any) => user.userType === 'tenant');
    }
  });

  // Fetch recent assessments
  const { data: recentAssessments, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['/api/tenant-risk/recent'],
    queryFn: async () => {
      const response = await getRecentRiskAssessments();
      return await response.json();
    },
    enabled: !isCreatingAssessment
  });

  // Fetch specific tenant's assessments
  const { data: tenantAssessments, isLoading: isLoadingTenantAssessments } = useQuery({
    queryKey: ['/api/tenant-risk/assessments', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return null;
      const response = await getAllTenantRiskAssessments(selectedTenantId);
      return await response.json();
    },
    enabled: !!selectedTenantId && !isCreatingAssessment
  });

  // Create risk assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: async (data: { tenantId: number, checkReviews: boolean, includeRecommendations: boolean }) => {
      const response = await createTenantRiskAssessment(data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assessment Created',
        description: 'Tenant risk assessment has been successfully created.',
        variant: 'default',
      });
      setIsCreatingAssessment(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-risk/recent'] });
      if (selectedTenantId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-risk/assessments', selectedTenantId] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create assessment: ${error.message}`,
        variant: 'destructive',
      });
      setIsCreatingAssessment(false);
    }
  });

  // Verify risk assessment mutation
  const verifyAssessmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { verified: boolean, verificationNotes?: string } }) => {
      const response = await verifyRiskAssessment(id, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assessment Verified',
        description: 'Tenant risk assessment has been verified.',
        variant: 'default',
      });
      setIsVerifyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-risk/recent'] });
      if (selectedTenantId) {
        queryClient.invalidateQueries({ queryKey: ['/api/tenant-risk/assessments', selectedTenantId] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to verify assessment: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle create assessment
  const handleCreateAssessment = () => {
    if (!selectedTenantId) {
      toast({
        title: 'Select a Tenant',
        description: 'Please select a tenant to assess.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingAssessment(true);
    createAssessmentMutation.mutate({
      tenantId: selectedTenantId,
      checkReviews,
      includeRecommendations
    });
  };

  // Handle verify assessment
  const handleVerifyAssessment = () => {
    if (!selectedAssessmentId) return;

    verifyAssessmentMutation.mutate({
      id: selectedAssessmentId,
      data: {
        verified: true,
        verificationNotes: verificationNotes
      }
    });
  };

  const parseAssessmentData = (assessment: TenantRiskAssessment): RiskAssessmentResult => {
    try {
      return JSON.parse(assessment.assessmentData);
    } catch (e) {
      console.error('Error parsing assessment data:', e);
      return {
        tenantId: assessment.tenantId,
        overallRiskScore: parseInt(assessment.overallRiskScore),
        riskLevel: assessment.riskLevel as 'low' | 'medium' | 'high',
        factors: [],
        recommendations: [],
        generatedAt: assessment.createdAt
      };
    }
  };

  // Render risk score color
  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Low Risk</span>;
      case 'medium':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Medium Risk</span>;
      case 'high':
        return <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">High Risk</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-6 w-6 text-primary" />
            Tenant Risk Assessment
          </CardTitle>
          <CardDescription>
            Assess and manage tenant risk with AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList className="mb-4">
              <TabsTrigger value="new">New Assessment</TabsTrigger>
              <TabsTrigger value="recent">Recent Assessments</TabsTrigger>
              {selectedTenantId && <TabsTrigger value="tenant">Tenant History</TabsTrigger>}
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="tenant-select">Select Tenant</Label>
                  <Select
                    onValueChange={(value) => setSelectedTenantId(parseInt(value))}
                    disabled={isCreatingAssessment}
                  >
                    <SelectTrigger id="tenant-select">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tenants</SelectLabel>
                        {isLoadingTenants ? (
                          <SelectItem value="loading" disabled>Loading tenants...</SelectItem>
                        ) : (
                          tenants?.map((tenant: Tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id.toString()}>
                              {tenant.name} ({tenant.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="check-reviews"
                      checked={checkReviews}
                      onCheckedChange={(checked) => setCheckReviews(!!checked)}
                      disabled={isCreatingAssessment}
                    />
                    <Label htmlFor="check-reviews">Include online review search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-recommendations"
                      checked={includeRecommendations}
                      onCheckedChange={(checked) => setIncludeRecommendations(!!checked)}
                      disabled={isCreatingAssessment}
                    />
                    <Label htmlFor="include-recommendations">Include recommendations</Label>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateAssessment} 
                disabled={!selectedTenantId || isCreatingAssessment}
                className="mt-4 w-full"
              >
                {isCreatingAssessment ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    Generating Assessment...
                  </>
                ) : (
                  <>Generate Risk Assessment</>
                )}
              </Button>

              {isCreatingAssessment && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Please wait</AlertTitle>
                  <AlertDescription>
                    The AI is analyzing tenant data and generating the risk assessment. This may take a minute or two.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="recent">
              {isLoadingRecent ? (
                <div className="space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-lg" />
                  <Skeleton className="h-[125px] w-full rounded-lg" />
                  <Skeleton className="h-[125px] w-full rounded-lg" />
                </div>
              ) : recentAssessments?.length > 0 ? (
                <div className="space-y-4">
                  {recentAssessments.map((assessment: TenantRiskAssessment) => {
                    const assessmentData = parseAssessmentData(assessment);
                    const tenantName = tenants?.find((t: Tenant) => t.id === assessment.tenantId)?.name || `Tenant #${assessment.tenantId}`;
                    
                    return (
                      <Card key={assessment.id} className="overflow-hidden">
                        <div className={`h-2 w-full ${getRiskScoreColor(parseInt(assessment.overallRiskScore))}`} />
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              {tenantName}
                            </CardTitle>
                            {getRiskLevelBadge(assessment.riskLevel)}
                          </div>
                          <CardDescription>
                            Created: {formatDate(assessment.createdAt)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Risk Score: {assessment.overallRiskScore}%</p>
                              <Progress
                                value={parseInt(assessment.overallRiskScore)}
                                className="h-2 mt-1"
                              />
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Risk Assessment for {tenantName}</DialogTitle>
                                  <DialogDescription>
                                    Generated on {formatDate(assessment.createdAt)}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="mt-4 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold">Overall Risk: {assessmentData.riskLevel.toUpperCase()}</h3>
                                      <p className="text-sm text-muted-foreground">Score: {assessmentData.overallRiskScore}%</p>
                                    </div>
                                    {getRiskLevelBadge(assessmentData.riskLevel)}
                                  </div>
                                  
                                  <Progress
                                    value={assessmentData.overallRiskScore}
                                    className={`h-2 ${getRiskScoreColor(assessmentData.overallRiskScore)}`}
                                  />
                                  
                                  <h3 className="text-lg font-semibold mt-6">Risk Factors</h3>
                                  <div className="space-y-4">
                                    {assessmentData.factors.map((factor, index) => (
                                      <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                          <h4 className="font-medium">{factor.factor}</h4>
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            factor.score < 30 ? 'bg-green-100 text-green-800' :
                                            factor.score < 70 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {factor.score}%
                                          </span>
                                        </div>
                                        <p className="text-sm mt-2">{factor.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {assessmentData.recommendations?.length > 0 && (
                                    <>
                                      <h3 className="text-lg font-semibold mt-6">Recommendations</h3>
                                      <ul className="space-y-2">
                                        {assessmentData.recommendations.map((rec, index) => (
                                          <li key={index} className="flex items-start">
                                            <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                  
                                  {assessmentData.reviews && assessmentData.reviews.length > 0 && (
                                    <>
                                      <h3 className="text-lg font-semibold mt-6">Online Reviews Found</h3>
                                      <div className="space-y-3">
                                        {assessmentData.reviews.map((review, index) => (
                                          <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-center">
                                              <h4 className="font-medium">{review.source}</h4>
                                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                                review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                              }`}>
                                                {review.sentiment}
                                              </span>
                                            </div>
                                            <p className="text-sm mt-2">"{review.content}"</p>
                                            {review.date && <p className="text-xs text-muted-foreground mt-1">Date: {review.date}</p>}
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <DialogFooter className="flex justify-between items-center">
                                  {assessment.verifiedBy ? (
                                    <div className="flex items-center text-green-600">
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      <span>Verified on {formatDate(assessment.verifiedAt!)}</span>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedAssessmentId(assessment.id);
                                        setVerificationNotes('');
                                        setIsVerifyDialogOpen(true);
                                      }}
                                    >
                                      Verify Assessment
                                    </Button>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                        <CardFooter className="text-sm text-muted-foreground">
                          {assessment.verifiedBy ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span>Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span>Pending verification</span>
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No assessments found</h3>
                  <p className="text-muted-foreground mt-2">
                    Create a new risk assessment to get started.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tenant">
              {selectedTenantId ? (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    Assessment History for Tenant #{selectedTenantId}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tenants?.find((t: Tenant) => t.id === selectedTenantId)?.name || 'Selected Tenant'}
                  </p>
                </div>

                {isLoadingTenantAssessments ? (
                  <div className="space-y-3">
                    <Skeleton className="h-[125px] w-full rounded-lg" />
                    <Skeleton className="h-[125px] w-full rounded-lg" />
                  </div>
                ) : tenantAssessments?.length > 0 ? (
                  <div className="space-y-4">
                    {tenantAssessments.map((assessment: TenantRiskAssessment) => {
                      const assessmentData = parseAssessmentData(assessment);
                      
                      return (
                        <Card key={assessment.id} className="overflow-hidden">
                          <div className={`h-2 w-full ${getRiskScoreColor(parseInt(assessment.overallRiskScore))}`} />
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">
                                Assessment #{assessment.id}
                              </CardTitle>
                              {getRiskLevelBadge(assessment.riskLevel)}
                            </div>
                            <CardDescription>
                              Created: {formatDate(assessment.createdAt)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">Risk Score: {assessment.overallRiskScore}%</p>
                                <Progress
                                  value={parseInt(assessment.overallRiskScore)}
                                  className="h-2 mt-1"
                                />
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Risk Assessment #{assessment.id}
                                      {assessment.applicationId && (
                                        <span className="ml-2 text-sm font-normal">
                                          (Application #{assessment.applicationId})
                                        </span>
                                      )}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Generated on {formatDate(assessment.createdAt)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="mt-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="text-lg font-semibold">Overall Risk: {assessmentData.riskLevel.toUpperCase()}</h3>
                                        <p className="text-sm text-muted-foreground">Score: {assessmentData.overallRiskScore}%</p>
                                      </div>
                                      {getRiskLevelBadge(assessmentData.riskLevel)}
                                    </div>
                                    
                                    <Progress
                                      value={assessmentData.overallRiskScore}
                                      className={`h-2 ${getRiskScoreColor(assessmentData.overallRiskScore)}`}
                                    />
                                    
                                    <h3 className="text-lg font-semibold mt-6">Risk Factors</h3>
                                    <div className="space-y-4">
                                      {assessmentData.factors.map((factor, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                          <div className="flex justify-between items-center">
                                            <h4 className="font-medium">{factor.factor}</h4>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                              factor.score < 30 ? 'bg-green-100 text-green-800' :
                                              factor.score < 70 ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'
                                            }`}>
                                              {factor.score}%
                                            </span>
                                          </div>
                                          <p className="text-sm mt-2">{factor.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {assessmentData.recommendations?.length > 0 && (
                                      <>
                                        <h3 className="text-lg font-semibold mt-6">Recommendations</h3>
                                        <ul className="space-y-2">
                                          {assessmentData.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start">
                                              <ChevronRight className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                                              <span>{rec}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </>
                                    )}
                                    
                                    {assessmentData.reviews && assessmentData.reviews.length > 0 && (
                                      <>
                                        <h3 className="text-lg font-semibold mt-6">Online Reviews Found</h3>
                                        <div className="space-y-3">
                                          {assessmentData.reviews.map((review, index) => (
                                            <div key={index} className="border rounded-lg p-4">
                                              <div className="flex justify-between items-center">
                                                <h4 className="font-medium">{review.source}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                  review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                                  review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {review.sentiment}
                                                </span>
                                              </div>
                                              <p className="text-sm mt-2">"{review.content}"</p>
                                              {review.date && <p className="text-xs text-muted-foreground mt-1">Date: {review.date}</p>}
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  
                                  <DialogFooter className="flex justify-between items-center">
                                    {assessment.verifiedBy ? (
                                      <div className="flex items-center text-green-600">
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        <span>Verified on {formatDate(assessment.verifiedAt!)}</span>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedAssessmentId(assessment.id);
                                          setVerificationNotes('');
                                          setIsVerifyDialogOpen(true);
                                        }}
                                      >
                                        Verify Assessment
                                      </Button>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                          <CardFooter className="text-sm text-muted-foreground">
                            {assessment.verifiedBy ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                <span>Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-amber-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>Pending verification</span>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No assessments found</h3>
                    <p className="text-muted-foreground mt-2">
                      This tenant doesn't have any risk assessments yet.
                    </p>
                    <Button
                      onClick={() => {
                        const element = document.querySelector('[data-value="new"]');
                        if (element instanceof HTMLElement) {
                          element.click();
                        }
                      }}
                      className="mt-4"
                    >
                      Create Assessment
                    </Button>
                  </div>
                )}
              </TabsContent>
            <TabsContent value="tenant"></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Risk Assessment</DialogTitle>
            <DialogDescription>
              Review and verify the tenant risk assessment. Once verified, it will be marked as approved and used for decision-making.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
              <Textarea
                id="verification-notes"
                placeholder="Add any notes about this verification..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleVerifyAssessment}
              disabled={verifyAssessmentMutation.isPending}
            >
              {verifyAssessmentMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                  Verifying...
                </>
              ) : (
                <>Verify Assessment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantRiskAssessment;