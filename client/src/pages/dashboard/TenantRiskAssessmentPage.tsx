import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TenantRiskAssessment from '@/components/shared/TenantRiskAssessment';

const TenantRiskAssessmentPage: React.FC = () => {
  return (
    <DashboardLayout dashboardType="agent">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tenant Risk Assessment</h1>
        <TenantRiskAssessment />
      </div>
    </DashboardLayout>
  );
};

export default TenantRiskAssessmentPage;