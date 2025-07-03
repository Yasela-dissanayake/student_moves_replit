import { apiRequest } from './queryClient';

// Authentication
export async function login(email: string, password: string, userType: string = 'tenant') {
  return apiRequest('POST', '/api/auth/login', { email, password, userType });
}

export async function logout() {
  return apiRequest('POST', '/api/auth/logout');
}

export async function register(userData: any) {
  return apiRequest('POST', '/api/auth/register', userData);
}

export async function getCurrentUser() {
  return apiRequest('GET', '/api/auth/me');
}

// Properties
export async function createProperty(propertyData: any) {
  return apiRequest('POST', '/api/properties', propertyData);
}

export async function updateProperty(id: number, propertyData: any) {
  return apiRequest('PATCH', `/api/properties/${id}`, propertyData);
}

export async function deleteProperty(id: number) {
  return apiRequest('DELETE', `/api/properties/${id}`);
}

export async function getProperty(id: number) {
  return apiRequest('GET', `/api/properties/${id}`);
}

export async function getProperties(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/properties${params}`);
}

export async function generatePropertyDescription(propertyDetails: any) {
  return apiRequest('POST', '/api/properties/generate-description', propertyDetails);
}

// Tenants
export async function createTenant(tenantData: any) {
  return apiRequest('POST', '/api/tenants', tenantData);
}

export async function updateTenant(id: number, tenantData: any) {
  return apiRequest('PATCH', `/api/tenants/${id}`, tenantData);
}

export async function deleteTenant(id: number) {
  return apiRequest('DELETE', `/api/tenants/${id}`);
}

export async function getTenant(id: number) {
  return apiRequest('GET', `/api/tenants/${id}`);
}

export async function getTenants(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/tenants${params}`);
}

// Applications
export async function createApplication(applicationData: any) {
  return apiRequest('POST', '/api/applications', applicationData);
}

export async function createGuestApplication(applicationData: any) {
  return apiRequest('POST', '/api/applications/guest', applicationData);
}

export async function updateApplication(id: number, applicationData: any) {
  return apiRequest('PATCH', `/api/applications/${id}`, applicationData);
}

export async function deleteApplication(id: number) {
  return apiRequest('DELETE', `/api/applications/${id}`);
}

export async function getApplication(id: number) {
  return apiRequest('GET', `/api/applications/${id}`);
}

export async function getApplications(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/applications${params}`);
}

// Tenancies
export async function createTenancy(tenancyData: any) {
  // Ensure dates are properly formatted as Date objects for PostgreSQL
  const formattedData = {
    ...tenancyData,
    startDate: tenancyData.startDate instanceof Date 
      ? tenancyData.startDate 
      : new Date(tenancyData.startDate),
    endDate: tenancyData.endDate instanceof Date 
      ? tenancyData.endDate 
      : new Date(tenancyData.endDate)
  };
  
  return apiRequest('POST', '/api/tenancies', formattedData);
}

export async function updateTenancy(id: number, tenancyData: any) {
  // Ensure dates are properly formatted as Date objects for PostgreSQL
  const formattedData = {
    ...tenancyData
  };
  
  // Format startDate if it exists in the update data
  if (tenancyData.startDate) {
    formattedData.startDate = tenancyData.startDate instanceof Date 
      ? tenancyData.startDate 
      : new Date(tenancyData.startDate);
  }
  
  // Format endDate if it exists in the update data
  if (tenancyData.endDate) {
    formattedData.endDate = tenancyData.endDate instanceof Date 
      ? tenancyData.endDate 
      : new Date(tenancyData.endDate);
  }
  
  return apiRequest('PATCH', `/api/tenancies/${id}`, formattedData);
}

export async function deleteTenancy(id: number) {
  return apiRequest('DELETE', `/api/tenancies/${id}`);
}

export async function getTenancy(id: number) {
  return apiRequest('GET', `/api/tenancies/${id}`);
}

export async function getTenancies(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/tenancies${params}`);
}

// Payments
export async function createPayment(paymentData: any) {
  return apiRequest('POST', '/api/payments', paymentData);
}

export async function updatePayment(id: number, paymentData: any) {
  return apiRequest('PATCH', `/api/payments/${id}`, paymentData);
}

export async function deletePayment(id: number) {
  return apiRequest('DELETE', `/api/payments/${id}`);
}

export async function getPayment(id: number) {
  return apiRequest('GET', `/api/payments/${id}`);
}

export async function getPayments(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/payments${params}`);
}

// Verifications - Using submitVerification instead
export async function uploadVerificationDocuments(formData: FormData) {
  return submitVerification(formData); // Use the renamed function for backward compatibility
}

export async function getVerification(id: number) {
  return apiRequest('GET', `/api/verifications/${id}`);
}

export async function getVerifications(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/verifications${params}`);
}

export async function verifyIdentity(verificationId: number) {
  return apiRequest('POST', `/api/verifications/${verificationId}/verify`);
}

// Right to Rent specific endpoints
export async function submitVerification(formData: FormData) {
  return apiRequest('POST', '/api/verifications', formData, true);
}

export async function checkRightToRentStatus(userId: number) {
  return apiRequest('GET', `/api/verifications/right-to-rent/${userId}`);
}

export async function updateRightToRentStatus(userId: number, rightToRentData: any) {
  return apiRequest('PATCH', `/api/verifications/right-to-rent/${userId}`, rightToRentData);
}

export async function generateRightToRentForm(userId: number, verificationData: any) {
  return apiRequest('POST', `/api/documents/right-to-rent-form/${userId}`, verificationData);
}

// Deposit Protection API
export async function registerDepositWithScheme(tenancyId: number, schemeData: any) {
  return apiRequest('POST', `/api/deposit-protection/register/${tenancyId}`, schemeData);
}

export async function getDepositSchemeCredentialsByUser(userId: number) {
  return apiRequest('GET', `/api/deposit-protection/credentials/${userId}`);
}

export async function addDepositSchemeAccount(credentials: any) {
  return apiRequest('POST', '/api/deposit-protection/credentials', credentials);
}

export async function updateDepositSchemeCredentials(id: number, credentials: any) {
  return apiRequest('PATCH', `/api/deposit-protection/credentials/${id}`, credentials);
}

// Group Applications
export async function createGroupApplication(applicationData: any) {
  return apiRequest('POST', '/api/applications/group', applicationData);
}

export async function inviteMemberToGroup(groupId: string, memberData: any) {
  return apiRequest('POST', `/api/applications/group/${groupId}/invite`, memberData);
}

export async function acceptGroupInvitation(groupId: string, applicationId: number) {
  return apiRequest('PATCH', `/api/applications/group/${groupId}/accept/${applicationId}`);
}

export async function rejectGroupInvitation(groupId: string, applicationId: number) {
  return apiRequest('PATCH', `/api/applications/group/${groupId}/reject/${applicationId}`);
}

export async function approveVerification(verificationId: number) {
  return apiRequest('PATCH', `/api/verifications/${verificationId}/approve`);
}

export async function rejectVerification(verificationId: number) {
  return apiRequest('PATCH', `/api/verifications/${verificationId}/reject`);
}

// Maintenance Requests
export async function createMaintenanceRequest(maintenanceData: any) {
  return apiRequest('POST', '/api/maintenance', maintenanceData);
}

export async function updateMaintenanceRequest(id: number, maintenanceData: any) {
  return apiRequest('PATCH', `/api/maintenance/${id}`, maintenanceData);
}

export async function deleteMaintenanceRequest(id: number) {
  return apiRequest('DELETE', `/api/maintenance/${id}`);
}

export async function getMaintenanceRequest(id: number) {
  return apiRequest('GET', `/api/maintenance/${id}`);
}

export async function getMaintenanceRequests(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/maintenance${params}`);
}

// Safety Certificates
export async function createSafetyCertificate(certificateData: any) {
  return apiRequest('POST', '/api/certificates', certificateData);
}

export async function updateSafetyCertificate(id: number, certificateData: any) {
  return apiRequest('PATCH', `/api/certificates/${id}`, certificateData);
}

export async function deleteSafetyCertificate(id: number) {
  return apiRequest('DELETE', `/api/certificates/${id}`);
}

export async function getSafetyCertificate(id: number) {
  return apiRequest('GET', `/api/certificates/${id}`);
}

export async function getSafetyCertificates(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/certificates${params}`);
}

// Deposit Protection (legacy endpoints)
export async function registerDeposit(depositData: any) {
  return apiRequest('POST', '/api/deposits/register', depositData);
}

export async function getDepositSchemes() {
  return apiRequest('GET', '/api/deposits/schemes');
}

// Renamed to avoid conflicts with new API
export async function addDepositSchemeCredentialsLegacy(schemeData: any) {
  return apiRequest('POST', '/api/deposits/credentials', schemeData);
}

// Renamed to avoid conflicts with new API
export async function getDepositSchemeCredentialsLegacy() {
  return apiRequest('GET', '/api/deposits/credentials');
}

// Documents
export async function createDocument(documentData: any) {
  return apiRequest('POST', '/api/documents', documentData);
}

export async function updateDocument(id: number, documentData: any) {
  return apiRequest('PATCH', `/api/documents/${id}`, documentData);
}

export async function deleteDocument(id: number) {
  return apiRequest('DELETE', `/api/documents/${id}`);
}

export async function getDocument(id: number) {
  return apiRequest('GET', `/api/documents/${id}`);
}

export async function getDocuments(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  return apiRequest('GET', `/api/documents${params}`);
}

export async function extractDocumentInfo(formData: FormData) {
  return fetch('/api/documents/extract', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
}

export async function structureDocument(data: { extractedText: string, documentType: string }) {
  return apiRequest('POST', '/api/documents/structure', data);
}

export async function saveDocument(documentData: any) {
  return apiRequest('POST', '/api/documents/save-extracted', documentData);
}

export async function uploadAndParseDocument(formData: FormData) {
  return fetch('/api/documents/upload-and-parse', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
}

export async function generateDocument(templateId: number, data: any) {
  return apiRequest('POST', `/api/documents/generate/${templateId}`, data);
}

// This function is replaced by the newer implementation above

export async function signDocument(documentId: number, signatureData: any) {
  return apiRequest('POST', `/api/documents/${documentId}/sign`, signatureData);
}

// AI Targeting
export async function getPropertyRecommendations(userId: number) {
  return apiRequest('GET', `/api/targeting/recommendations/${userId}`);
}

export async function setTenantPreferences(preferencesData: any) {
  return apiRequest('POST', '/api/targeting/preferences', preferencesData);
}

export async function getTenantPreferences(userId: number) {
  return apiRequest('GET', `/api/targeting/preferences/${userId}`);
}

export async function generateCampaignDescriptions(campaignData: any) {
  const response = await apiRequest('POST', '/api/targeting/generate-descriptions', campaignData);
  return response;
}

// Social Campaign interfaces
export interface SocialCampaign {
  id?: number;
  name: string;
  description?: string;
  targetDemographic?: string;
  targetUniversities?: string[];
  studentInterests?: string[];
  // Support both naming conventions for compatibility
  socialMediaPlatforms?: string[];
  platforms?: string[];
  // Support both naming conventions for budget
  budget?: number;
  campaignBudget?: number;
  // Support both naming conventions for duration
  duration?: number;
  campaignLength?: number;
  status?: string;
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CampaignContent {
  platform: string;
  postText: string;
  imagePrompt?: string;
  imageUrl?: string;
  hashtags: string[];
  callToAction: string;
}

export interface CampaignInsights {
  targetAudience: Array<{
    segment: string;
    interests: string[];
    activity: string;
    engagementRate: number;
    recommendedApproach: string;
  }>;
  recommendedHashtags: string[];
  bestTimeToPost: {
    [key: string]: string[];
  };
  contentSuggestions: string[];
  performancePrediction: {
    estimatedReach: number;
    estimatedEngagement: number;
    estimatedConversion: number;
  };
}

// Social Targeting
export async function createSocialTargetingCampaign(campaignData: SocialCampaign) {
  return apiRequest('POST', '/api/targeting/social', campaignData);
}

export async function getSocialTargetingCampaigns() {
  return apiRequest('GET', '/api/targeting/social');
}

export async function getSocialTargetingCampaign(id: number) {
  return apiRequest('GET', `/api/targeting/social/${id}`);
}

// Dynamic Campaign Builder API endpoints
export async function generateCampaignInsights(campaignData: {
  campaign: {
    name: string;
    description?: string;
    targetDemographic?: string;
    targetUniversities?: string[];
    studentInterests?: string[];
    audienceRefinements?: {
      ageRange?: number[];
      interestLevel?: string;
      activityLevel?: string;
      devicePreference?: string;
    };
  };
}) {
  return apiRequest('POST', '/api/targeting/social/insights', campaignData);
}

export async function generateCampaignContent(campaignData: {
  campaign: {
    name: string;
    description?: string;
    targetDemographic?: string;
    targetUniversities?: string[];
    studentInterests?: string[];
    platforms?: string[];
    contentTone?: string;
    includeImages?: boolean;
    insights?: CampaignInsights;
  };
}) {
  return apiRequest('POST', '/api/targeting/social/content', campaignData);
}

export async function saveCampaignDraft(campaignData: {
  campaign: {
    name: string;
    description?: string;
    targetDemographic?: string;
    targetUniversities?: string[];
    studentInterests?: string[];
    content?: CampaignContent[];
  };
}) {
  return apiRequest('POST', '/api/targeting/social/draft', campaignData);
}

export async function generateMarketingContent(id: number, contentData: {
  platforms?: string[];
  contentTone?: string;
  targetDemographic?: string;
}) {
  return apiRequest('PUT', `/api/targeting/social/${id}/content`, contentData);
}

// Calendar
export async function createCalendarEvent(eventData: any) {
  const response = await apiRequest('POST', '/api/calendar', eventData);
  return await response.json();
}

export async function updateCalendarEvent(id: number, eventData: any) {
  const response = await apiRequest('PATCH', `/api/calendar/${id}`, eventData);
  return await response.json();
}

export async function deleteCalendarEvent(id: number) {
  const response = await apiRequest('DELETE', `/api/calendar/${id}`);
  return await response.json();
}

export async function getCalendarEvent(id: number) {
  const response = await apiRequest('GET', `/api/calendar/${id}`);
  return await response.json();
}

export async function getCalendarEvents(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  const response = await apiRequest('GET', `/api/calendar${params}`);
  return await response.json();
}

// Dashboard
export async function getDashboardStats(userType: string) {
  const response = await apiRequest('GET', `/api/dashboard/stats/${userType}`);
  return await response.json();
}

// AI Services
export async function checkAIProviders() {
  const response = await apiRequest('GET', '/api/ai/providers');
  return await response.json();
}

// Admin AI Status Endpoints
export async function checkAIStatus() {
  const response = await apiRequest('GET', '/api/ai/status');
  return await response.json();
}

// Admin AI Status Endpoints - Only Gemini is supported
export async function checkGeminiStatus() {
  const response = await apiRequest('GET', '/api/ai/gemini/status');
  return await response.json();
}

// Public AI Status Endpoints - accessible to all users - Only Gemini is supported
export async function checkAIStatusPublic() {
  try {
    const response = await apiRequest('GET', '/api/ai/status/public');
    return await response.json();
  } catch (error) {
    console.error('Error checking AI status:', error);
    return { status: 'unavailable', message: 'Error connecting to AI service' };
  }
}

export async function checkGeminiStatusPublic() {
  try {
    const response = await apiRequest('GET', '/api/ai/gemini/status/public');
    return await response.json();
  } catch (error) {
    console.error('Error checking Gemini status:', error);
    return { status: 'unavailable', message: 'Error connecting to Gemini service' };
  }
}

export async function checkDeepSeekStatusPublic() {
  try {
    const response = await apiRequest('GET', '/api/ai/deepseek/status/public');
    return await response.json();
  } catch (error) {
    console.error('Error checking DeepSeek status:', error);
    return { status: 'unavailable', message: 'Error connecting to DeepSeek service' };
  }
}

// Social Media Posting with Rate Limiting

/**
 * Post content to a social media platform
 * 
 * This function handles posting to a specific social media platform while respecting
 * rate limits. It will automatically check if the platform is supported and if the
 * user has remaining posts for that platform.
 * 
 * @param {Object} postData - The data for the post
 * @param {string} postData.platform - The platform to post to (e.g., 'facebook', 'twitter')
 * @param {number} [postData.campaignId] - Optional campaign ID to associate with the post
 * @param {string} postData.content - The text content to post
 * @returns {Promise<{success: boolean, message: string, postId?: number}>} - Result object with success status and message
 */
export async function postToSocialMedia(postData: {
  platform: string;
  campaignId?: number;
  content: string;
}) {
  return apiRequest('POST', '/api/targeting/social/post', postData);
}

/**
 * Get rate limit information for social platforms
 * Returns usage information and support status for each platform
 * 
 * The returned object uses a discriminated union pattern with the 'supported' flag:
 * - If supported: true, it includes totalLimit, usedToday, and related fields
 * - If supported: false, it includes error message and consistent field structure
 * 
 * This allows client code to safely handle both supported and unsupported platforms
 * with proper TypeScript type checking.
 * 
 * @param {string[]} platforms - Optional list of specific platforms to check
 * @returns {Promise<Record<string, SupportedRateLimit | UnsupportedPlatform>>}
 * Where:
 * - SupportedRateLimit has: { supported: true, totalLimit, usedToday, remainingPosts, nextBestTime }
 * - UnsupportedPlatform has: { supported: false, error, remainingPosts, nextBestTime }
 */
export async function getSocialMediaRateLimits(platforms?: string[]) {
  const params = platforms ? `?platforms=${platforms.join(',')}` : '';
  const response = await apiRequest('GET', `/api/targeting/social/limits${params}`);
  return response.limits || {};
}

/**
 * Get posting history for the current authenticated user
 * 
 * Retrieves a list of all posts made by the current user across all platforms,
 * or filtered to a specific platform if requested.
 * 
 * Each history item includes:
 * - The platform it was posted to
 * - The content that was posted
 * - The status (success/failed)
 * - The timestamp when the post was created
 * - An optional campaign ID if the post was associated with a campaign
 * 
 * @param {string} [platform] - Optional platform name to filter results
 * @returns {Promise<Array<{
 *   id: number, 
 *   platform: string, 
 *   content: string, 
 *   status: string, 
 *   createdAt: string, 
 *   campaignId?: number
 * }>>} Array of post history items, sorted by most recent first
 */
export async function getSocialMediaPostHistory(platform?: string) {
  const params = platform ? `?platform=${platform}` : '';
  const response = await apiRequest('GET', `/api/targeting/social/history${params}`);
  return response.history || [];
}

export async function checkDeepSeekStatus() {
  try {
    const response = await apiRequest('GET', '/api/ai/deepseek/status');
    return await response.json();
  } catch (error) {
    console.error('Error checking DeepSeek status:', error);
    return { status: 'unavailable', message: 'Error connecting to DeepSeek service' };
  }
}

// Custom OpenAI API (Subscription-free)
export async function customOpenaiCompletions(params: any) {
  const response = await apiRequest('POST', '/api/custom-openai/completions', params);
  return await response.json();
}

export async function customOpenaiChatCompletions(params: any) {
  const response = await apiRequest('POST', '/api/custom-openai/chat/completions', params);
  return await response.json();
}

export async function customOpenaiImageGeneration(params: any) {
  const response = await apiRequest('POST', '/api/custom-openai/images/generations', params);
  return await response.json();
}

export async function customOpenaiEmbeddings(params: any) {
  const response = await apiRequest('POST', '/api/custom-openai/embeddings', params);
  return await response.json();
}

export async function customOpenaiModeration(params: any) {
  const response = await apiRequest('POST', '/api/custom-openai/moderations', params);
  return await response.json();
}

export async function getCustomOpenaiModels() {
  const response = await apiRequest('GET', '/api/custom-openai/models');
  return await response.json();
}

export async function getCustomOpenaiStatus() {
  try {
    const response = await apiRequest('GET', '/api/custom-openai/status');
    return await response.json();
  } catch (error) {
    console.error('Error checking custom OpenAI status:', error);
    return { status: 'unavailable', message: 'Error connecting to custom OpenAI service' };
  }
}

export async function checkCustomAiStatusPublic() {
  try {
    // apiRequest already parses JSON in queryClient.ts
    const data = await apiRequest('GET', '/api/custom-openai/status');
    
    // Transform "available" status to "operational" for consistency with other AI providers
    if (data && data.status === 'available') {
      return { ...data, status: 'operational' };
    }
    
    return data;
  } catch (error) {
    console.error('Error checking custom AI status:', error);
    return { status: 'unavailable', message: 'Error connecting to custom AI service' };
  }
}

/**
 * Compares two facial images (original and new) to determine if they show the same person
 * This function uses Gemini AI for facial comparison
 * @param originalImageBase64 The original face image in base64 format (from verified profile)
 * @param newImageBase64 The new face image in base64 format (from webcam/upload)
 * @param threshold Optional confidence threshold (0.0-1.0, default is 0.7)
 * @returns Promise with comparison results
 */
export async function compareFaces(originalImageBase64: string, newImageBase64: string, threshold?: number) {
  const response = await apiRequest('POST', '/api/ai/compare-faces', {
    originalImageBase64,
    newImageBase64,
    threshold
  });
  return await response.json();
}

// Tenant Risk Assessment
export async function getTenantRiskAssessment(tenantId: number) {
  const response = await apiRequest('GET', `/api/tenant-risk/assessment/${tenantId}`);
  return await response.json();
}

export async function createTenantRiskAssessment(assessmentData: {
  tenantId: number;
  checkReviews?: boolean;
  includeRecommendations?: boolean;
}) {
  const response = await apiRequest('POST', '/api/tenant-risk/assessment', assessmentData);
  return await response.json();
}

export async function getAllTenantRiskAssessments(tenantId: number) {
  const response = await apiRequest('GET', `/api/tenant-risk/assessments/${tenantId}/all`);
  return await response.json();
}

export async function getRecentRiskAssessments() {
  const response = await apiRequest('GET', '/api/tenant-risk/recent');
  return await response.json();
}

export async function verifyRiskAssessment(assessmentId: number, verificationData: {
  verified: boolean;
  verificationNotes?: string;
}) {
  const response = await apiRequest('PUT', `/api/tenant-risk/assessment/${assessmentId}/verify`, verificationData);
  return await response.json();
}

// Viewing Requests
export async function createViewingRequest(viewingRequestData: any) {
  const response = await apiRequest('POST', '/api/viewing-requests', viewingRequestData);
  return await response.json();
}

export async function getViewingRequests(queryParams?: object) {
  const params = queryParams ? `?${new URLSearchParams(queryParams as any).toString()}` : '';
  const response = await apiRequest('GET', `/api/viewing-requests${params}`);
  return await response.json();
}

export async function getViewingRequest(id: number) {
  const response = await apiRequest('GET', `/api/viewing-requests/${id}`);
  return await response.json();
}

export async function updateViewingRequest(id: number, viewingRequestData: any) {
  const response = await apiRequest('PATCH', `/api/viewing-requests/${id}`, viewingRequestData);
  return await response.json();
}

export async function scheduleViewingRequest(id: number, scheduleData: any) {
  const response = await apiRequest('POST', `/api/viewing-requests/${id}/schedule`, scheduleData);
  return await response.json();
}

export async function deleteViewingRequest(id: number) {
  const response = await apiRequest('DELETE', `/api/viewing-requests/${id}`);
  return await response.json();
}

// Mortgage Rates
export async function getMortgageRates() {
  const response = await apiRequest('GET', '/api/mortgage-rates/buy-to-let');
  return await response.json();
}

export async function getMortgageRateAverages() {
  const response = await apiRequest('GET', '/api/mortgage-rates/averages');
  return await response.json();
}