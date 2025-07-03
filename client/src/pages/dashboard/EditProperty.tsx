import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyManagement from '@/components/dashboard/PropertyManagement';
import { useLocation, useParams } from 'wouter';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function EditProperty() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const propertyId = params.propertyId ? parseInt(params.propertyId) : undefined;
  
  // Fetch property to confirm ownership
  const { data: property, isLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId,
  });
  
  // Redirect if user is not logged in or not a landlord/agent/admin
  // or if the property doesn't belong to the user
  useEffect(() => {
    if (!user) return;
    
    if (!['landlord', 'agent', 'admin'].includes(user.userType)) {
      setLocation('/dashboard');
      return;
    }
    
    // For non-admins, check property ownership
    if (property && user.userType !== 'admin' && property.ownerId !== user.id) {
      setLocation('/dashboard');
    }
  }, [user, property, setLocation]);
  
  if (!user || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        {propertyId && (
          <PropertyManagement propertyId={propertyId} isEdit={true} />
        )}
      </div>
    </DashboardLayout>
  );
}