import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowRightCircle,
  Home,
  Plus,
  Eye,
  Users,
  MapPin,
  Star,
  Phone,
  ExternalLink,
  Upload,
  Image,
  Video,
  Download,
  Trash2
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import AgentPageTemplate from "./AgentPageTemplate";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function MaintenanceRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isContractorsOpen, setIsContractorsOpen] = useState(false);
  const [contractors, setContractors] = useState<any[]>([]);
  const [loadingContractors, setLoadingContractors] = useState(false);

  // Fetch maintenance requests for properties managed by the agent
  const { data: maintenanceRequests = [], isLoading } = useQuery({
    queryKey: ['/api/maintenance/agent'],
    queryFn: () => apiRequest('GET', '/api/maintenance/agent'),
  });

  // Define type for maintenance request
  type MaintenanceRequest = {
    id: number;
    issue_type?: string;
    title?: string;
    description?: string;
    property_id?: number;
    property?: {
      title?: string;
    };
    reported_by?: {
      name?: string;
    };
    created_at?: string;
    priority?: 'high' | 'medium' | 'low';
    status?: 'pending' | 'in-progress' | 'completed';
  };

  // Mutation to update maintenance request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/maintenance/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/agent'] });
      toast({
        title: "Status Updated",
        description: "Maintenance request status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance request status.",
        variant: "destructive",
      });
    },
  });

  // Handle viewing request details
  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  // Handle starting a maintenance request
  const handleStartRequest = (request: MaintenanceRequest) => {
    updateStatusMutation.mutate({ id: request.id, status: 'in-progress' });
  };

  // Handle completing a maintenance request
  const handleCompleteRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsUploadModalOpen(true);
  };

  // Mutation to upload completion media
  const uploadCompletionMutation = useMutation({
    mutationFn: async ({ requestId, files, notes }: { requestId: number; files: File[]; notes: string }) => {
      const formData = new FormData();
      formData.append('requestId', requestId.toString());
      formData.append('notes', notes);
      
      files.forEach((file, index) => {
        formData.append(`media_${index}`, file);
      });

      return fetch('/api/maintenance/upload-completion', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/agent'] });
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      setUploadNotes("");
      updateStatusMutation.mutate({ id: selectedRequest!.id, status: 'completed' });
      toast({
        title: "Work Completed",
        description: "Maintenance work has been marked as completed with media uploaded.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload completion media. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isImage && !isVideo) {
        toast({
          title: "Invalid File Type",
          description: "Only images and videos are allowed.",
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "File Too Large",
          description: "Files must be under 50MB.",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });
    
    setUploadFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file from upload list
  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle upload submission
  const handleUploadSubmit = () => {
    if (!selectedRequest) return;
    
    if (uploadFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one photo or video of the completed work.",
        variant: "destructive",
      });
      return;
    }

    uploadCompletionMutation.mutate({
      requestId: selectedRequest.id,
      files: uploadFiles,
      notes: uploadNotes
    });
  };

  // Handle adding a new request
  const handleAddRequest = () => {
    toast({
      title: "Add New Request",
      description: "This would open a form to create a new maintenance request.",
    });
  };

  // Handle finding contractors for a maintenance request
  const handleFindContractors = async (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsContractorsOpen(true);
    setLoadingContractors(true);
    setContractors([]);

    try {
      // Use AI to find contractors based on property location and maintenance type
      const response = await apiRequest('POST', '/api/maintenance/find-contractors', {
        maintenanceType: request.issue_type || request.title,
        propertyLocation: request.property?.title || 'London, UK',
        urgency: request.priority === 'high' ? 'urgent' : 'standard',
        description: request.description
      });

      setContractors(response.contractors || []);
      
      toast({
        title: "Contractors Found",
        description: `Found ${response.contractors?.length || 0} verified contractors in your area.`,
      });
    } catch (error) {
      console.error('Error finding contractors:', error);
      toast({
        title: "Search Failed",
        description: "Unable to find contractors at the moment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingContractors(false);
    }
  };

  // Get different maintenance request statuses
  const pendingRequests = (maintenanceRequests as MaintenanceRequest[])
    .filter(req => req.status === 'pending' || !req.status);
  const inProgressRequests = (maintenanceRequests as MaintenanceRequest[])
    .filter(req => req.status === 'in-progress');
  const completedRequests = (maintenanceRequests as MaintenanceRequest[])
    .filter(req => req.status === 'completed');

  const renderRequestsTable = (requests: MaintenanceRequest[]) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-8">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No maintenance requests found</h3>
          <p className="text-muted-foreground mt-2">
            There are no maintenance requests in this category.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.issue_type || request.title || 'Maintenance Issue'}
                </TableCell>
                <TableCell>
                  {request.property?.title || `Property ID: ${request.property_id}`}
                </TableCell>
                <TableCell>
                  {request.reported_by?.name || 'Unknown User'}
                </TableCell>
                <TableCell>
                  {request.created_at
                    ? format(new Date(request.created_at), 'dd MMM yyyy')
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {request.priority === 'high' ? (
                    <Badge variant="destructive">High</Badge>
                  ) : request.priority === 'medium' ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Medium</Badge>
                  ) : (
                    <Badge variant="outline">Low</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {request.status === 'completed' ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>
                  ) : request.status === 'in-progress' ? (
                    <Badge variant="default">In Progress</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200"
                      onClick={() => handleFindContractors(request)}
                    >
                      <Users className="h-4 w-4 mr-2" /> Find Contractors
                    </Button>
                    {request.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                        onClick={() => handleStartRequest(request)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <ArrowRightCircle className="h-4 w-4 mr-2" /> Start
                      </Button>
                    )}
                    {request.status === 'in-progress' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                        onClick={() => handleCompleteRequest(request)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <AgentPageTemplate 
      title="Maintenance Requests" 
      description="Manage maintenance requests for your properties"
    >
      <div className="flex justify-end mb-6">
        <Button onClick={handleAddRequest}>
          <Plus className="mr-2 h-4 w-4" /> Add Request
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="lg" />
            </div>
          ) : (
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid grid-cols-3 w-full rounded-none border-b">
                <TabsTrigger value="pending" className="rounded-none">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Pending ({pendingRequests.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" className="rounded-none">
                  <Wrench className="h-4 w-4 mr-2" />
                  In Progress ({inProgressRequests.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-none">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed ({completedRequests.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="pt-2">
                {renderRequestsTable(pendingRequests)}
              </TabsContent>
              <TabsContent value="in-progress" className="pt-2">
                {renderRequestsTable(inProgressRequests)}
              </TabsContent>
              <TabsContent value="completed" className="pt-2">
                {renderRequestsTable(completedRequests)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Property</label>
                  <p className="text-lg">{selectedRequest.property?.title || 'Unknown Property'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Issue Type</label>
                  <p className="text-lg">{selectedRequest.issue_type || 'General Maintenance'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-lg">{selectedRequest.title || 'No title provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-700">{selectedRequest.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Priority</label>
                  <Badge
                    className={
                      selectedRequest.priority === 'high'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : selectedRequest.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-green-100 text-green-700 border-green-300'
                    }
                  >
                    {selectedRequest.priority || 'Low'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge
                    className={
                      selectedRequest.status === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : selectedRequest.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }
                  >
                    {selectedRequest.status === 'in-progress' ? 'In Progress' : 
                     selectedRequest.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reported By</label>
                  <p className="text-lg">{selectedRequest.reported_by?.name || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Date Reported</label>
                <p className="text-lg">
                  {selectedRequest.created_at 
                    ? new Date(selectedRequest.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Unknown date'
                  }
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedRequest && selectedRequest.status === 'pending' && (
              <Button 
                onClick={() => {
                  handleStartRequest(selectedRequest);
                  setIsDetailsOpen(false);
                }}
                disabled={updateStatusMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowRightCircle className="h-4 w-4 mr-2" />
                Start Work
              </Button>
            )}
            {selectedRequest && selectedRequest.status === 'in-progress' && (
              <Button 
                onClick={() => {
                  handleCompleteRequest(selectedRequest);
                  setIsDetailsOpen(false);
                }}
                disabled={updateStatusMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contractor Search Dialog */}
      <Dialog open={isContractorsOpen} onOpenChange={setIsContractorsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Find Contractors for {selectedRequest?.issue_type || selectedRequest?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {selectedRequest.property?.title || 'London, UK'}
                  {selectedRequest.priority === 'high' && (
                    <Badge variant="destructive" className="ml-2">Urgent</Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {loadingContractors ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-8 w-8 animate-spin" />
                <span className="ml-3 text-lg">Finding verified contractors in your area...</span>
              </div>
            ) : contractors.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-3">
                  Found {contractors.length} verified contractors
                </h3>
                {contractors.map((contractor, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{contractor.name}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{contractor.rating}</span>
                            <span className="text-sm text-gray-500">({contractor.reviews} reviews)</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{contractor.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Specialties:</span>
                            <p className="text-sm">{contractor.specialties}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Experience:</span>
                            <p className="text-sm">{contractor.experience}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Coverage:</span>
                            <p className="text-sm">{contractor.serviceArea}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Availability:</span>
                            <p className="text-sm text-green-600">{contractor.availability}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {contractor.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <ExternalLink className="h-4 w-4" />
                            <a href={contractor.profileUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 hover:underline">
                              View Profile
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-lg font-semibold text-green-600 mb-2">
                          From £{contractor.hourlyRate}/hour
                        </div>
                        <Button 
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            toast({
                              title: "Contractor Selected",
                              description: `${contractor.name} has been notified about this job and will contact you soon.`,
                            });
                            setIsContractorsOpen(false);
                          }}
                        >
                          Select Contractor
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No contractors found</h3>
                <p className="text-gray-600">
                  We couldn't find any contractors for this type of work in your area. 
                  Please try adjusting your search criteria or contact us for assistance.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContractorsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo/Video Upload Modal for Maintenance Completion */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Complete Maintenance Work
            </DialogTitle>
            <DialogDescription>
              Upload photos and videos of the completed maintenance work for {selectedRequest?.property?.title}.
              This helps maintain quality records and provides transparency to landlords and tenants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="media-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Image className="h-8 w-8" />
                    <Video className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Click to upload photos and videos
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports JPG, PNG, MP4, MOV files up to 50MB each
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="mt-2">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>
              </label>
            </div>

            {/* Upload Progress and File List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Selected Files ({uploadFiles.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Video className="h-5 w-5 text-green-600" />
                          )}
                          <span className="font-medium text-sm truncate max-w-40">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      
                      {/* Preview for images */}
                      {file.type.startsWith('image/') && (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Notes */}
            <div className="space-y-2">
              <label htmlFor="completion-notes" className="text-sm font-medium text-gray-700">
                Work Completion Notes
              </label>
              <textarea
                id="completion-notes"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Describe the work completed, any issues encountered, recommendations for future maintenance, or other important details..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500">
                These notes will be visible to the landlord and tenant for transparency
              </p>
            </div>

            {/* Work Summary */}
            {selectedRequest && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Work Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Property:</span>
                    <p className="text-blue-800">{selectedRequest.property?.title}</p>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Issue Type:</span>
                    <p className="text-blue-800">{selectedRequest.issue_type}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-700 font-medium">Description:</span>
                    <p className="text-blue-800">{selectedRequest.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsUploadModalOpen(false);
                setUploadFiles([]);
                setUploadNotes("");
              }}
              disabled={uploadCompletionMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadSubmit}
              disabled={uploadCompletionMutation.isPending || uploadFiles.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadCompletionMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading & Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Work & Upload Media
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AgentPageTemplate>
  );
}