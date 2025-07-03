import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PropertyManagement from '@/components/dashboard/PropertyManagement';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function AddProperty() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if user is not logged in or not a landlord/agent/admin
  useEffect(() => {
    if (user && !['landlord', 'agent', 'admin'].includes(user.userType)) {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);
  
  if (!user) {
    return null; // This will prevent render flashing before redirect
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <PropertyManagement isEdit={false} />
      </div>
    </DashboardLayout>
  );
}