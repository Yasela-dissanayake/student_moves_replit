import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, Phone, Mail, Building, FileText, Home, Plus, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Landlord, User } from '@shared/schema';

interface LandlordWithUser extends Landlord {
  user: User;
}

interface LandlordManagementProps {
  landlords: LandlordWithUser[];
  onAddLandlord: (landlordData: any) => void;
  onUpdateLandlord: (id: number, landlordData: any) => void;
}

export default function LandlordManagement({ landlords, onAddLandlord, onUpdateLandlord }: LandlordManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<LandlordWithUser | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    bankAccount: '',
    bankSortCode: '',
    commissionRate: '',
    paymentTerms: 'Monthly',
    notes: '',
    preferredContactMethod: 'email'
  });
  
  const filteredLandlords = landlords.filter(landlord => 
    landlord.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (landlord.companyName && landlord.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    landlord.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    landlord.contactPhone.includes(searchTerm)
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddLandlord = () => {
    onAddLandlord(formData);
    setFormData({
      name: '',
      companyName: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      bankAccount: '',
      bankSortCode: '',
      commissionRate: '',
      paymentTerms: 'Monthly',
      notes: '',
      preferredContactMethod: 'email'
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Landlord Added",
      description: "The landlord has been added successfully.",
    });
  };
  
  const handleUpdateLandlord = () => {
    if (!selectedLandlord) return;
    
    onUpdateLandlord(selectedLandlord.id, formData);
    setSelectedLandlord(null);
    setEditMode(false);
    toast({
      title: "Landlord Updated",
      description: "The landlord details have been updated successfully.",
    });
  };
  
  const openLandlordDetails = (landlord: LandlordWithUser) => {
    setSelectedLandlord(landlord);
    setFormData({
      name: landlord.user.name,
      companyName: landlord.companyName || '',
      address: landlord.address,
      contactEmail: landlord.contactEmail,
      contactPhone: landlord.contactPhone,
      bankAccount: landlord.bankAccount || '',
      bankSortCode: landlord.bankSortCode || '',
      commissionRate: landlord.commissionRate?.toString() || '',
      paymentTerms: landlord.paymentTerms || 'Monthly',
      notes: landlord.notes || '',
      preferredContactMethod: landlord.preferredContactMethod || 'email'
    });
    setEditMode(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Landlord Management</CardTitle>
            <CardDescription>Manage all landlords for your agency</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Landlord
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Landlord</DialogTitle>
                <DialogDescription>
                  Enter landlord details to add them to your agency
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Smith" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="companyName">Company Name (Optional)</Label>
                    <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="ABC Properties Ltd" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Property Street, London" />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} placeholder="john@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} placeholder="07700 900000" />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Bank Account No.</Label>
                    <Input id="bankAccount" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} placeholder="12345678" />
                  </div>
                  <div>
                    <Label htmlFor="bankSortCode">Sort Code</Label>
                    <Input id="bankSortCode" name="bankSortCode" value={formData.bankSortCode} onChange={handleInputChange} placeholder="12-34-56" />
                  </div>
                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" value={formData.commissionRate} onChange={handleInputChange} placeholder="10.0" />
                  </div>
                  <div>
                    <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                    <select 
                      id="preferredContactMethod" 
                      name="preferredContactMethod" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" 
                      value={formData.preferredContactMethod} 
                      onChange={handleInputChange}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="post">Post</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional information..." />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddLandlord}>Add Landlord</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4 relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landlords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLandlords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No landlords found. Add your first landlord to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLandlords.map((landlord) => (
                  <TableRow key={landlord.id}>
                    <TableCell>
                      <div className="font-medium">{landlord.user.name}</div>
                      {landlord.companyName && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building className="mr-1 h-3 w-3" />
                          {landlord.companyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1 mb-1">
                        <Mail className="h-3 w-3" />
                        {landlord.contactEmail}
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {landlord.contactPhone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Home className="h-3 w-3" />
                        {Math.floor(Math.random() * 10) + 1} Properties
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {landlord.commissionRate ? `${landlord.commissionRate}%` : 'Not set'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openLandlordDetails(landlord)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Properties</DropdownMenuItem>
                          <DropdownMenuItem>Statements</DropdownMenuItem>
                          <DropdownMenuItem>Payment History</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {/* Landlord Details Dialog */}
        {selectedLandlord && (
          <Dialog open={!!selectedLandlord} onOpenChange={(open) => !open && setSelectedLandlord(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{editMode ? 'Edit Landlord Details' : 'Landlord Details'}</span>
                  {!editMode && (
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      Edit
                    </Button>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {editMode ? 'Make changes to the landlord information' : 'View landlord information and related properties'}
                </DialogDescription>
              </DialogHeader>
              
              {editMode ? (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-companyName">Company Name</Label>
                      <Input id="edit-companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-address">Address</Label>
                      <Textarea id="edit-address" name="address" value={formData.address} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-contactEmail">Email</Label>
                      <Input id="edit-contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-contactPhone">Phone</Label>
                      <Input id="edit-contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-bankAccount">Bank Account No.</Label>
                      <Input id="edit-bankAccount" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-bankSortCode">Sort Code</Label>
                      <Input id="edit-bankSortCode" name="bankSortCode" value={formData.bankSortCode} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-commissionRate">Commission Rate (%)</Label>
                      <Input id="edit-commissionRate" name="commissionRate" type="number" value={formData.commissionRate} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label htmlFor="edit-preferredContactMethod">Preferred Contact</Label>
                      <select 
                        id="edit-preferredContactMethod" 
                        name="preferredContactMethod" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" 
                        value={formData.preferredContactMethod} 
                        onChange={handleInputChange}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="post">Post</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea id="edit-notes" name="notes" value={formData.notes} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <h4 className="text-sm font-semibold">Full Name</h4>
                      <p>{selectedLandlord.user.name}</p>
                    </div>
                    {selectedLandlord.companyName && (
                      <div>
                        <h4 className="text-sm font-semibold">Company</h4>
                        <p>{selectedLandlord.companyName}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <h4 className="text-sm font-semibold">Address</h4>
                      <p className="whitespace-pre-line">{selectedLandlord.address}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Email</h4>
                      <p>{selectedLandlord.contactEmail}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Phone</h4>
                      <p>{selectedLandlord.contactPhone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Bank Account</h4>
                      <p>{selectedLandlord.bankAccount || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Sort Code</h4>
                      <p>{selectedLandlord.bankSortCode || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Commission Rate</h4>
                      <p>{selectedLandlord.commissionRate ? `${selectedLandlord.commissionRate}%` : 'Not set'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Preferred Contact</h4>
                      <p className="capitalize">{selectedLandlord.preferredContactMethod || 'Email'}</p>
                    </div>
                    {selectedLandlord.notes && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-semibold">Notes</h4>
                        <p className="whitespace-pre-line">{selectedLandlord.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-md font-semibold mb-2">Properties</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {/* This would be populated dynamically from the landlord's properties */}
                      <Card className="p-3">
                        <div className="font-medium">123 Student House, Hyde Park</div>
                        <div className="text-sm text-muted-foreground">3 bed · £1,250 pcm · Let</div>
                      </Card>
                      <Card className="p-3">
                        <div className="font-medium">456 Headingley Apartment</div>
                        <div className="text-sm text-muted-foreground">2 bed · £950 pcm · Available</div>
                      </Card>
                      <Button variant="outline" className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                {editMode ? (
                  <>
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleUpdateLandlord}>Save Changes</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setSelectedLandlord(null)}>Close</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}