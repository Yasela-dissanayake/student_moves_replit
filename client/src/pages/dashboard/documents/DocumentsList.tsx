import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  FileClock,
  FileCheck,
  Filter,
  Plus,
  Search,
  MoreHorizontal,
  Download,
  Eye,
  FileEdit,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  documentType: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  propertyAddress?: string;
  tenantName?: string;
  landlordName?: string;
  agentName?: string;
  signedByTenant: boolean;
  signedByLandlord: boolean;
  signedByAgent: boolean;
  dateSigned: Date | null;
  isAllInclusive: boolean;
  isHmo: boolean;
  isJointTenancy: boolean;
}

export default function DocumentsList() {
  const [, setLocation] = useLocation();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: !!user
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending_signature':
        return <Badge variant="secondary" className="text-amber-600">Pending Signatures</Badge>;
      case 'signed':
        return <Badge className="bg-green-500">Signed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'pending_signature':
        return <FileClock className="h-4 w-4 text-amber-500" />;
      case 'signed':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  const filterDocuments = (docs: Document[] = [], tab: string, query: string) => {
    if (!docs || !Array.isArray(docs)) return [];
    
    // First apply the tab filter
    let filtered = docs;
    
    if (tab !== 'all') {
      filtered = docs.filter(doc => {
        if (tab === 'pending_signature') return doc.status === 'pending_signature';
        if (tab === 'signed') return doc.status === 'signed';
        if (tab === 'draft') return doc.status === 'draft';
        if (tab === 'tenancy_agreements') return doc.documentType === 'tenancy_agreement';
        if (tab === 'deposit_certificates') return doc.documentType === 'deposit_certificate';
        if (tab === 'right_to_rent') return doc.documentType === 'right_to_rent';
        return true;
      });
    }
    
    // Then apply the search filter if there is a query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(lowerQuery) ||
        (doc.propertyAddress && doc.propertyAddress.toLowerCase().includes(lowerQuery)) ||
        (doc.tenantName && doc.tenantName.toLowerCase().includes(lowerQuery)) ||
        (doc.landlordName && doc.landlordName.toLowerCase().includes(lowerQuery)) ||
        (doc.agentName && doc.agentName.toLowerCase().includes(lowerQuery))
      );
    }
    
    return filtered;
  };
  
  const viewDocument = (id: string) => {
    setLocation(`/dashboard/documents/${id}`);
  };
  
  const filteredDocuments = filterDocuments(documents as Document[], activeTab, searchQuery);
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documents</h1>
          <p className="text-muted-foreground">
            Manage your property documents, contracts, and legal paperwork
          </p>
        </div>
        
        <Button className="gap-2" onClick={() => setLocation('/dashboard/documents/generate')}>
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setActiveTab('all')}>
              <FileText className="h-4 w-4" /> All Documents
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setActiveTab('pending_signature')}>
              <FileClock className="h-4 w-4 text-amber-500" /> Pending Signature
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setActiveTab('signed')}>
              <FileCheck className="h-4 w-4 text-green-500" /> Signed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setActiveTab('tenancy_agreements')}>
              <Calendar className="h-4 w-4" /> Tenancy Agreements
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2" onClick={() => setActiveTab('deposit_certificates')}>
              <SlidersHorizontal className="h-4 w-4" /> Deposit Certificates
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending_signature">Pending Signature</TabsTrigger>
          <TabsTrigger value="signed">Signed</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>Document List</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading documents...' : 
                filteredDocuments.length === 0 ? 'No documents found' : 
                `Showing ${filteredDocuments.length} document${filteredDocuments.length === 1 ? '' : 's'}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No documents found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Get started by creating your first document'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setLocation('/dashboard/documents/generate')}>
                    Create Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewDocument(doc.id)}>
                        <TableCell>
                          <div className="font-medium">{doc.title}</div>
                          {doc.propertyAddress && (
                            <div className="text-sm text-muted-foreground">{doc.propertyAddress}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1).replace('_', ' ')}
                          <div className="flex gap-1 mt-1">
                            {doc.isAllInclusive && <Badge variant="outline" className="text-xs">All-Inclusive</Badge>}
                            {doc.isHmo && <Badge variant="outline" className="text-xs">HMO</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            {getStatusBadge(doc.status)}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="flex items-center gap-2" onClick={(e) => {
                                e.stopPropagation();
                                viewDocument(doc.id);
                              }}>
                                <Eye className="h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2" onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/api/documents/${doc.id}/download`, '_blank');
                              }}>
                                <Download className="h-4 w-4" /> Download
                              </DropdownMenuItem>
                              {doc.status === 'draft' && (
                                <DropdownMenuItem className="flex items-center gap-2" onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality here
                                }}>
                                  <FileEdit className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Documents are stored securely and comply with data protection regulations.
            </p>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  );
}