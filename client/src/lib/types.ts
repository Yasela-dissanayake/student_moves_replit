// User Types
export interface UserType {
  id: number;
  email: string;
  name: string;
  phone?: string;
  userType: 'tenant' | 'landlord' | 'agent' | 'admin' | 'student';
  verified: boolean;
  profileImage?: string;
  createdAt: string;
  verificationStatus?: 'unverified' | 'selfie_uploaded' | 'id_uploaded' | 'processing' | 'manual_review' | 'verified' | 'rejected' | 'expired';
}

// Property Types
export interface PropertyType {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
  availableDate?: string;
  features: string[];
  images: string[];
  videos?: string[];
  virtualTourUrl?: string;
  ownerId: number;
  university?: string;
  distanceToUniversity?: string;
  area?: string;
  billsIncluded?: boolean;
  includedBills?: string[];
  furnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  parkingAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Application Types
export interface ApplicationType {
  id: number;
  propertyId: number;
  tenantId: number;
  status: 'pending' | 'approved' | 'rejected';
  moveInDate?: string;
  message?: string;
  createdAt: string;
}

// Tenancy Types
export interface TenancyType {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  depositProtectionScheme?: string;
  depositProtectionId?: string;
  signedByTenant: boolean;
  signedByOwner: boolean;
  active: boolean;
  createdAt: string;
}

// Payment Types
export interface PaymentType {
  id: number;
  tenancyId: number;
  amount: number;
  paymentType: string;
  status: 'pending' | 'completed' | 'failed';
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
}

// Verification Types
export interface VerificationType {
  id: number;
  userId: number;
  documentType: string;
  documentImage: string;
  selfieImage: string;
  status: 'pending' | 'approved' | 'rejected';
  aiVerified: boolean;
  adminVerified: boolean;
  createdAt: string;
}

// Document Types
export interface DocumentType {
  id: number;
  title: string;
  documentType: string;
  content: string;
  createdById: number;
  propertyId?: number;
  tenantId?: number;
  status: 'draft' | 'signed' | 'expired';
  format: 'pdf' | 'docx' | 'html';
  documentUrl?: string;
  createdAt: string;
  dateSigned?: string;
}

// Maintenance Request Types
export interface MaintenanceRequestType {
  id: number;
  propertyId: number;
  tenantId?: number;
  landlordId?: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  images?: string[];
  assignedTo?: number;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
}

// Safety Certificate Types
export interface SafetyCertificateType {
  id: number;
  propertyId: number;
  certificateType: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  issuedBy: string;
  documentUrl?: string;
  status: 'valid' | 'expired' | 'expiring_soon';
  createdAt: string;
}

// Deposit Scheme Credentials
export interface DepositSchemeCredentialsType {
  id: number;
  userId: number;
  schemeName: string;
  schemeId: string;
  apiKey?: string;
  username?: string;
  password?: string;
  isActive: boolean;
  createdAt: string;
}

// Landlord Types
export interface LandlordType {
  id: number;
  userId: number;
  companyName?: string;
  address?: string;
  taxReference?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    sortCode: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

// Contractor Types
export interface ContractorType {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  specialties: string[];
  hourlyRate?: number;
  available: boolean;
  rating?: number;
  addedBy: number;
  createdAt: string;
}

// Property Inspection Types
export interface PropertyInspectionType {
  id: number;
  propertyId: number;
  inspectorId: number;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  issues?: string[];
  images?: string[];
  reportUrl?: string;
  createdAt: string;
}

// Calendar Event Types
export interface CalendarEventType {
  id: number;
  userId: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  eventType: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  location?: string;
  notificationSent: boolean;
  createdAt: string;
}

// Tenant Preferences
export interface TenantPreferencesType {
  id: number;
  tenantId: number;
  maxBudget: number;
  minBedrooms: number;
  preferredAreas: string[];
  preferredUniversities: string[];
  preferredPropertyTypes: string[];
  requiresFurnished: boolean;
  requiresParking: boolean;
  requiresPetsAllowed: boolean;
  moveInDate?: string;
  maxDistanceToUniversity?: string;
  additionalRequirements?: string;
  createdAt: string;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType: 'tenant' | 'landlord' | 'agent' | 'student';
}

export interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  price: number | string;
  propertyType: string;
  bedrooms: number | string;
  bathrooms: number | string;
  available: boolean;
  features: string[];
  images: string[];
  videos?: string[];
  virtualTourUrl?: string;
  university?: string;
  distanceToUniversity?: string;
  area?: string;
  billsIncluded?: boolean;
  includedBills?: string[];
  furnished?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  parkingAvailable?: boolean;
}

export interface VerificationFormData {
  documentType: string;
  documentImage: File;
  selfieImage: File;
}

export interface ApplicationFormData {
  propertyId: number;
  tenantId: number;
  moveInDate?: string;
  message?: string;
}

export interface TenancyFormData {
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  depositProtectionScheme?: string;
}

export interface MaintenanceRequestFormData {
  propertyId: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  category: string;
  images?: File[];
  scheduledDate?: string;
}

export interface DocumentFormData {
  title: string;
  documentType: string;
  content: string;
  propertyId?: number;
  tenantId?: number;
  format: 'pdf' | 'docx' | 'html';
}

export interface SafetyCertificateFormData {
  propertyId: number;
  certificateType: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  issuedBy: string;
  document?: File;
}

export interface TenantPreferencesFormData {
  maxBudget: number;
  minBedrooms: number;
  preferredAreas: string[];
  preferredUniversities: string[];
  preferredPropertyTypes: string[];
  requiresFurnished: boolean;
  requiresParking: boolean;
  requiresPetsAllowed: boolean;
  moveInDate?: string;
  maxDistanceToUniversity?: string;
  additionalRequirements?: string;
}

// AI Types
export interface AIProvider {
  id: number;
  providerName: string;
  apiKey?: string;
  baseUrl?: string;
  isActive: boolean;
  priority: number;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIVerificationResult {
  verified: boolean;
  faceMatch: boolean;
  documentAuthenticity: boolean;
  liveDetection: boolean;
  confidenceScore: number;
  errorDetails?: string;
}

export interface PropertyRecommendation {
  propertyId: number;
  score: number;
  matchingReasons: string[];
}

// Dashboard Stats
export interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  occupiedProperties: number;
  totalApplications: number;
  pendingApplications: number;
  totalTenancies: number;
  activeTenancies: number;
  pendingPayments: number;
  pendingMaintenanceRequests: number;
  recentActivities: {
    type: string;
    entityId: number;
    description: string;
    timestamp: string;
  }[];
  performanceMetrics?: {
    occupancyRate: number;
    averageRent: number;
    averageTenancyDuration: number;
    applicationConversionRate: number;
  };
}