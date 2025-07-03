import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";
import FloatingMenuButton from "@/components/FloatingMenuButton";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import EnhancedPropertyDetails from "@/pages/EnhancedPropertyDetails";
import RequestViewing from "@/pages/RequestViewing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterStudent from "@/pages/RegisterStudent";
import NotFound from "@/pages/not-found";
import PropertyApplication from "@/pages/PropertyApplication";
import AuthDebug from "@/pages/AuthDebug";
import { AuthProvider } from "./lib/auth.tsx";

import AISettings from "@/pages/dashboard/admin/AISettings";
import AiMaintenance from "@/pages/dashboard/admin/AiMaintenance";
import SocialTargeting from "@/pages/dashboard/admin/SocialTargeting";
import PropertyManagement from "@/pages/dashboard/admin/PropertyManagement";
import UserVerification from "@/pages/dashboard/admin/UserVerification";
import WebsiteBuilder from "@/pages/dashboard/admin/WebsiteBuilder";
import EnhancedWebsiteBuilderPage from "@/pages/dashboard/admin/EnhancedWebsiteBuilder";
import TenantDashboard from "@/pages/dashboard/TenantDashboard";
import LandlordDashboard from "@/pages/dashboard/LandlordDashboard";
import AgentDashboard from "@/pages/dashboard/AgentDashboard";
import TenantTenancy from "@/pages/dashboard/tenant/Tenancy";
import EnhancedAgentDashboard from "@/pages/dashboard/EnhancedAgentDashboard";
import ImprovedAgentDashboard from "@/pages/dashboard/ImprovedAgentDashboard";
import ImprovedLandlordDashboard from "@/pages/dashboard/ImprovedLandlordDashboard";
import RentalAgreement from "@/pages/dashboard/documents/RentalAgreement";
import DocumentTemplates from "@/pages/dashboard/admin/DocumentTemplates";
import LandlordDocumentTemplates from "@/pages/dashboard/landlord/DocumentTemplates";
import AgentDocumentTemplates from "@/pages/dashboard/agent/DocumentTemplates";
// Import agent dashboard pages
import AgentProperties from "@/pages/dashboard/agent/Properties";
import AgentApplications from "@/pages/dashboard/agent/Applications";
import AgentTenants from "@/pages/dashboard/agent/Tenants";
import AgentLandlords from "@/pages/dashboard/agent/Landlords";
import AgentMaintenance from "@/pages/dashboard/agent/Maintenance";
import AgentKeys from "@/pages/dashboard/agent/Keys";
import AgentCompliance from "@/pages/dashboard/agent/Compliance";
import AgentSettings from "@/pages/dashboard/agent/Settings";
import AgentDocumentVerification from "@/pages/dashboard/agent/DocumentVerification";
import AgentMarketing from "@/pages/dashboard/agent/Marketing";
import SocialMediaCredentials from "@/pages/dashboard/agent/SocialMediaCredentials";
import DocumentProcessingPage from "@/pages/documents/DocumentProcessingPage";
import DepositCompliancePage from "@/pages/dashboard/DepositCompliancePage";
import AddProperty from "@/pages/dashboard/AddProperty";
import EditProperty from "@/pages/dashboard/EditProperty";
import TenantRiskAssessmentPage from "@/pages/dashboard/TenantRiskAssessmentPage";
import MediaCompressionPage from "@/pages/media/MediaCompressionPage";
import StandaloneMediaCompressor from "@/pages/tools/StandaloneMediaCompressor";
import TestAIService from "@/pages/admin/TestAIService";
import GenerateAiImagesPage from "@/pages/admin/GenerateAiImagesPage";
import UtilityManagementPage from "@/pages/admin/UtilityManagementPage";
import AiToolsFixed from "@/pages/AiToolsFixed";
import OpenAITest from "@/pages/OpenAITest";
import HostVirtualViewing from "@/pages/HostVirtualViewing";
import JoinVirtualViewing from "@/pages/JoinVirtualViewing";
import { SecurityTestPage } from "@/pages/security-test-page";
import LegalCompliance from "@/pages/LegalCompliance";
// Import marketplace components
import { MarketplaceRoutes } from "./routes/marketplace-routes";
// Import job platform components
import { JobRoutes } from "./routes/job-routes";
// Import admin components
import { AdminRoutes } from "./routes/admin-routes";
// Import city image manager
import { CityImageManager } from "@/components/admin/city-images/CityImageManager";

import BusinessOutreachDatabase from "@/pages/admin/BusinessOutreachDatabase";
import DeploymentDownload from "@/pages/admin/DeploymentDownload";
import DownloadCenter from "@/pages/DownloadCenter";
import DigitalSigning from "@/pages/DigitalSigning";
import UtilityDashboard from "@/pages/tenant/UtilityDashboard";
import UtilityDashboardAccess from "@/pages/UtilityDashboardAccess";
import TenantUtilities from "@/pages/tenant/TenantUtilities";
// Admin Dashboard Components
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import AdminVerification from "@/pages/admin/AdminVerification";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminAIMaintenance from "@/pages/admin/AdminAIMaintenance";
import AdminWebsiteBuilder from "@/pages/admin/AdminWebsiteBuilder";
import AdminSocialTargeting from "@/pages/admin/AdminSocialTargeting";
import SocialTargetingGuide from "@/pages/admin/SocialTargetingGuide";
import AdminPropertyTargeting from "@/pages/admin/AdminPropertyTargeting";
import AdminConfigPage from "@/pages/admin/AdminConfigPage";
import Settings from "@/pages/dashboard/Settings";
import AccessibilityToolkit from "@/pages/AccessibilityToolkit";

function Router() {
  return (
    <div>
      <Navbar />
      <Switch>
      <Route path="/dashboard/admin/property-management">
        {() => {
          try {
            return <PropertyManagement />;
          } catch (error) {
            console.error("PropertyManagement component error:", error);
            return (
              <div style={{
                padding: '20px',
                background: '#f44336',
                color: 'white',
                margin: '20px'
              }}>
                <h2>Property Management Component Error</h2>
                <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <p>Check console for details</p>
              </div>
            );
          }
        }}
      </Route>
      <Route path="/">
        {() => <Home />}
      </Route>
      <Route path="/properties">
        {() => <Properties />}
      </Route>
      <Route path="/properties/:id">
        {() => <EnhancedPropertyDetails />}
      </Route>
      <Route path="/properties/:propertyId/apply">
        {() => <PropertyApplication />}
      </Route>
      <Route path="/properties/:propertyId/request-viewing">
        {() => <RequestViewing />}
      </Route>
      <Route path="/login">
        {() => <Login />}
      </Route>
      <Route path="/login/tenant">
        {() => <Login userTypeParam="tenant" />}
      </Route>
      <Route path="/login/landlord">
        {() => <Login userTypeParam="landlord" />}
      </Route>
      <Route path="/login/agent">
        {() => <Login userTypeParam="agent" />}
      </Route>
      <Route path="/login/admin">
        {() => <Login userTypeParam="admin" />}
      </Route>
      <Route path="/register">
        {() => <Register />}
      </Route>
      <Route path="/register-student">
        {() => <RegisterStudent />}
      </Route>
      
      {/* Dashboard Routes by User Type */}
      <Route path="/dashboard">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/tenancy">
        {() => <TenantTenancy />}
      </Route>
      <Route path="/dashboard/tenant/applications">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/payments">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/maintenance">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/documents">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/groups">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/tenant/settings">
        {() => <TenantDashboard />}
      </Route>
      <Route path="/dashboard/landlord">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/properties">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/tenants">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/maintenance">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/finances">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/compliance">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/documents">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/settings">
        {() => <LandlordDashboard />}
      </Route>
      <Route path="/dashboard/landlord/improved">
        {() => <ImprovedLandlordDashboard />}
      </Route>
      <Route path="/dashboard/agent">
        {() => <EnhancedAgentDashboard />}
      </Route>
      <Route path="/dashboard/agent/basic">
        {() => <AgentDashboard />}
      </Route>
      <Route path="/dashboard/agent/improved">
        {() => <ImprovedAgentDashboard />}
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route path="/dashboard/admin">
        {() => <AdminDashboard />}
      </Route>
      <Route path="/dashboard/AdminDashboard">
        {() => <AdminDashboard />}
      </Route>
      <Route path="/dashboard/admin/ai-settings">
        {() => <AISettings />}
      </Route>
      <Route path="/dashboard/admin/ai-maintenance">
        {() => <AdminAIMaintenance />}
      </Route>
      <Route path="/dashboard/admin/social-targeting">
        {() => <AdminSocialTargeting />}
      </Route>
      <Route path="/dashboard/admin/social-targeting-guide">
        {() => <SocialTargetingGuide />}
      </Route>
      <Route path="/dashboard/admin/property-targeting">
        {() => <AdminPropertyTargeting />}
      </Route>
      <Route path="/dashboard/admin/property-management">
        {() => (
          <div style={{ 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'red', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
          }}>
            DIRECT INLINE TEST - PROPERTY MANAGEMENT
          </div>
        )}
      </Route>
      <Route path="/dashboard/admin/verification">
        {() => <AdminVerification />}
      </Route>
      <Route path="/dashboard/admin/website-builder">
        {() => <AdminWebsiteBuilder />}
      </Route>
      <Route path="/dashboard/admin/enhanced-website-builder">
        {() => <EnhancedWebsiteBuilderPage />}
      </Route>
      <Route path="/dashboard/admin/deposit-compliance">
        {() => <DepositCompliancePage />}
      </Route>
      <Route path="/dashboard/admin/document-templates">
        {() => <DocumentTemplates />}
      </Route>
      <Route path="/dashboard/admin/notifications">
        {() => <AdminNotifications />}
      </Route>
      <Route path="/dashboard/admin/test-ai-service">
        {() => <TestAIService />}
      </Route>
      <Route path="/dashboard/admin/utilities">
        {() => <UtilityManagementPage />}
      </Route>
      <Route path="/admin/utilities">
        {() => <UtilityManagementPage />}
      </Route>
      <Route path="/quick-login">
        {() => <div dangerouslySetInnerHTML={{__html: `
          <div style="max-width: 400px; margin: 50px auto; padding: 20px; fontFamily: Arial">
            <h2>Quick Admin Login</h2>
            <p><a href="/login/admin" style="background: #007bff; color: white; padding: 10px 20px; textDecoration: none; borderRadius: 4px;">Login as Admin</a></p>
            <p>Then navigate to <a href="/admin/utilities">/admin/utilities</a></p>
          </div>
        `}} />}
      </Route>

      <Route path="/admin/business-outreach-database">
        {() => <BusinessOutreachDatabase />}
      </Route>
      <Route path="/dashboard/landlord/document-templates">
        {() => <LandlordDocumentTemplates />}
      </Route>
      <Route path="/dashboard/agent/document-templates">
        {() => <AgentDocumentTemplates />}
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route path="/dashboard/admin">
        {() => <AdminDashboard />}
      </Route>
      <Route path="/dashboard/admin/verification">
        {() => <AdminVerification />}
      </Route>
      <Route path="/dashboard/admin/notifications">
        {() => <AdminNotifications />}
      </Route>
      <Route path="/dashboard/admin/utilities">
        {() => <UtilityManagementPage />}
      </Route>
      <Route path="/dashboard/admin/ai-maintenance">
        {() => <AdminAIMaintenance />}
      </Route>
      <Route path="/dashboard/admin/test-ai-service">
        {() => <TestAIService />}
      </Route>
      <Route path="/dashboard/admin/website-builder">
        {() => <AdminWebsiteBuilder />}
      </Route>
      <Route path="/dashboard/admin/property-targeting">
        {() => <AdminPropertyTargeting />}
      </Route>
      <Route path="/dashboard/admin/settings">
        {() => <AdminConfigPage />}
      </Route>

      {/* General Dashboard Routes */}
      <Route path="/dashboard/settings">
        {() => <Settings />}
      </Route>
      <Route path="/dashboard/profile">
        {() => <Settings />}
      </Route>

      {/* Agent Dashboard Routes */}
      <Route path="/dashboard/agent/properties">
        {() => <AgentProperties />}
      </Route>
      <Route path="/dashboard/agent/applications">
        {() => <AgentApplications />}
      </Route>
      <Route path="/dashboard/agent/tenants">
        {() => <AgentTenants />}
      </Route>
      <Route path="/dashboard/agent/landlords">
        {() => <AgentLandlords />}
      </Route>
      <Route path="/dashboard/agent/maintenance">
        {() => <AgentMaintenance />}
      </Route>
      <Route path="/dashboard/agent/keys">
        {() => <AgentKeys />}
      </Route>
      <Route path="/dashboard/agent/compliance">
        {() => <AgentCompliance />}
      </Route>
      <Route path="/dashboard/agent/tenancies">
        {() => <AgentDashboard />}
      </Route>
      <Route path="/dashboard/agent/targeting">
        {() => <AgentDashboard />}
      </Route>
      <Route path="/dashboard/agent/settings">
        {() => <AgentSettings />}
      </Route>
      <Route path="/dashboard/agent/verification">
        {() => <AgentDocumentVerification />}
      </Route>
      <Route path="/dashboard/agent/marketing">
        {() => <AgentMarketing />}
      </Route>
      <Route path="/dashboard/agent/social-media-credentials">
        {() => <SocialMediaCredentials />}
      </Route>
      
      {/* Risk Assessment Route */}
      <Route path="/dashboard/risk-assessment">
        {() => <TenantRiskAssessmentPage />}
      </Route>
      
      {/* Document Generator Routes */}
      <Route path="/dashboard/documents/rental-agreement">
        {() => <RentalAgreement />}
      </Route>
      <Route path="/dashboard/documents/hmo-license">
        <RentalAgreement /> {/* Using RentalAgreement as placeholder */}
      </Route>
      <Route path="/dashboard/documents/deposit-protection">
        <RentalAgreement /> {/* Using RentalAgreement as placeholder */}
      </Route>
      <Route path="/dashboard/documents/right-to-rent">
        <RentalAgreement /> {/* Using RentalAgreement as placeholder */}
      </Route>
      <Route path="/dashboard/documents/process">
        {() => <DocumentProcessingPage />}
      </Route>
      
      {/* Media Compression Routes - Dashboard only */}
      <Route path="/dashboard/media/compression">
        {() => <MediaCompressionPage />}
      </Route>
      
      {/* Property Management Routes */}
      <Route path="/dashboard/add-property">
        {() => <AddProperty />}
      </Route>
      <Route path="/dashboard/edit-property/:propertyId">
        {() => <EditProperty />}
      </Route>
      
      {/* Virtual Viewing Routes */}
      <Route path="/properties/:propertyId/host-virtual-viewing">
        {() => <HostVirtualViewing />}
      </Route>
      <Route path="/host-virtual-viewing/:propertyId">
        {() => <HostVirtualViewing />}
      </Route>
      <Route path="/join-virtual-viewing/:sessionId">
        {() => <JoinVirtualViewing />}
      </Route>
      
      {/* AI Tools Route */}
      <Route path="/ai-tools">
        {() => <AiToolsFixed />}
      </Route>
      
      {/* AI Tools Route (Fixed version) */}
      <Route path="/ai-tools-fixed">
        {() => <AiToolsFixed />}
      </Route>
      
      {/* Accessibility Design Language Toolkit */}
      <Route path="/accessibility-toolkit">
        {() => <AccessibilityToolkit />}
      </Route>
      
      {/* OpenAI Test Route */}
      <Route path="/openai-test">
        {() => <OpenAITest />}
      </Route>
      
      {/* AI Image Generation Routes */}
      <Route path="/dashboard/admin/generate-ai-images">
        {() => <GenerateAiImagesPage />}
      </Route>
      <Route path="/admin/generate-ai-images">
        {() => <GenerateAiImagesPage />}
      </Route>
      <Route path="/admin/deployment-download">
        {() => <DeploymentDownload />}
      </Route>
      
      {/* Marketplace Routes - Fixed implementation that doesn't depend on OpenAI */}
      <Route path="/marketplace*">
        {() => <MarketplaceRoutes />}
      </Route>
      
      {/* Utilities Management Route */}
      <Route path="/utilities">
        {() => <UtilityManagementPage />}
      </Route>
      
      {/* City Image Management Route */}
      <Route path="/admin/city-images">
        {() => <CityImageManager />}
      </Route>
      
      {/* Job Platform Routes */}
      <Route path="/jobs">
        {() => <JobRoutes />}
      </Route>
      <Route path="/jobs/new">
        {() => <JobRoutes />}
      </Route>
      <Route path="/jobs/applications">
        {() => <JobRoutes />}
      </Route>
      <Route path="/jobs/applications/:id">
        {() => <JobRoutes />}
      </Route>
      <Route path="/jobs/recommendations">
        {() => <JobRoutes />}
      </Route>
      <Route path="/jobs/:id">
        {() => <JobRoutes />}
      </Route>
      

      

      
      {/* Debug Routes */}
      <Route path="/auth-debug">
        {() => <AuthDebug />}
      </Route>
      
      {/* Security Test Route */}
      <Route path="/security-test">
        {() => <SecurityTestPage />}
      </Route>
      
      {/* Download Center Route */}
      <Route path="/downloads">
        {() => <DownloadCenter />}
      </Route>
      
      {/* Utility Dashboard Routes */}
      <Route path="/tenant/utilities">
        {() => <TenantUtilities />}
      </Route>
      <Route path="/tenant/utility-dashboard">
        {() => <UtilityDashboard />}
      </Route>
      <Route path="/utilities/dashboard">
        {() => <UtilityDashboardAccess />}
      </Route>
      <Route path="/admin/downloads">
        {() => <DownloadCenter />}
      </Route>
      
      {/* Legal Compliance Route */}
      <Route path="/legal-compliance">
        {() => <LegalCompliance />}
      </Route>
      
      {/* Digital Signing Route */}
      <Route path="/digital-signing">
        {() => <DigitalSigning />}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin*">
        {() => <AdminRoutes />}
      </Route>

      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
