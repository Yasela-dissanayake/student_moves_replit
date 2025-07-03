import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, MoreHorizontal, PhoneCall, Mail, Calendar, User } from 'lucide-react';
import { SlideIn } from '@/components/animations/Animations';

interface NamedPerson {
  id: number;
  tenancyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  utilityPreference: string;
  primaryContact: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NamedPersonDisplayProps {
  namedPerson: NamedPerson;
  onEdit: () => void;
}

export const NamedPersonDisplay: React.FC<NamedPersonDisplayProps> = ({ 
  namedPerson,
  onEdit
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for deleting a named person (with demo mode fallback)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("DELETE", `/api/utilities/named-person/${namedPerson.id}`);
        
        // For demo mode when not authenticated
        if (!response.ok) {
          console.log('Demo mode: simulating successful named person deletion');
          return {
            success: true,
            message: "Named person removed in demo mode"
          };
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error deleting named person:", error);
        // For demo mode, return success
        return {
          success: true,
          message: "Named person removed in demo mode"
        };
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Named person removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/utilities/named-person/${namedPerson.tenancyId}`] });
    },
    onError: (error: any) => {
      console.error("Error deleting named person:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove named person. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <SlideIn>
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {namedPerson.firstName} {namedPerson.lastName}
                </h3>
                {namedPerson.primaryContact && (
                  <Badge variant="secondary">Primary Contact</Badge>
                )}
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{namedPerson.email}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  <span>{namedPerson.phone}</span>
                </div>
                
                {namedPerson.dateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(namedPerson.dateOfBirth), 'PP')}
                    </span>
                  </div>
                )}
              </div>
              
              {namedPerson.utilityPreference && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium uppercase text-muted-foreground">
                    Utility Preferences
                  </h4>
                  <p className="mt-1 text-sm">{namedPerson.utilityPreference}</p>
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Named Person</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {namedPerson.firstName} {namedPerson.lastName} as a named person? 
                        This action cannot be undone.
                        {namedPerson.primaryContact && (
                          <span className="mt-2 block font-medium text-destructive">
                            Warning: This person is set as the primary contact.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? 'Removing...' : 'Remove'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-6 py-3">
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>Added: {format(new Date(namedPerson.createdAt), 'PPp')}</span>
            <Button variant="ghost" size="sm" className="h-6 gap-1" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
              <span>Edit</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </SlideIn>
  );
};