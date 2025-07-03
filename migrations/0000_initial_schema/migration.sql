CREATE TABLE IF NOT EXISTS "ai_providers" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "active" BOOLEAN DEFAULT false,
  "priority" INTEGER NOT NULL,
  "last_checked" TIMESTAMP,
  "status" TEXT DEFAULT 'unknown',
  "error_message" TEXT,
  "capabilities" JSON DEFAULT '["text"]',
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "user_type" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT false,
  "profile_image" TEXT,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "deposit_scheme_credentials" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "scheme_name" TEXT NOT NULL,
  "scheme_username" TEXT NOT NULL,
  "scheme_password" TEXT NOT NULL,
  "account_number" TEXT,
  "api_key" TEXT,
  "is_default" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "properties" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postcode" TEXT NOT NULL,
  "price" NUMERIC NOT NULL,
  "property_type" TEXT NOT NULL,
  "bedrooms" INTEGER NOT NULL,
  "bathrooms" INTEGER NOT NULL,
  "available" BOOLEAN DEFAULT true,
  "available_date" TEXT,
  "area" TEXT,
  "features" JSON DEFAULT '[]',
  "images" JSON DEFAULT '[]',
  "owner_id" INTEGER NOT NULL,
  "university" TEXT,
  "distance_to_university" TEXT,
  "epc_rating" TEXT,
  "epc_expiry_date" TIMESTAMP,
  "gas_checked" BOOLEAN DEFAULT false,
  "gas_check_date" TIMESTAMP,
  "gas_check_expiry_date" TIMESTAMP,
  "electrical_checked" BOOLEAN DEFAULT false,
  "electrical_check_date" TIMESTAMP,
  "electrical_check_expiry_date" TIMESTAMP,
  "hmo_licensed" BOOLEAN DEFAULT false,
  "hmo_license_number" TEXT,
  "hmo_license_expiry_date" TIMESTAMP,
  "furnished" BOOLEAN DEFAULT false,
  "pets_allowed" BOOLEAN DEFAULT false,
  "smoking_allowed" BOOLEAN DEFAULT false,
  "parking_available" BOOLEAN DEFAULT false,
  "bills_included" BOOLEAN DEFAULT false,
  "included_bills" JSON DEFAULT '[]',
  "landlord_id" INTEGER,
  "landlord_commission_percentage" NUMERIC,
  "maintenance_budget" NUMERIC,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "applications" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "tenant_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "move_in_date" TIMESTAMP,
  "message" TEXT,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tenancies" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "tenant_id" INTEGER NOT NULL,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "rent_amount" NUMERIC NOT NULL,
  "deposit_amount" NUMERIC NOT NULL,
  "deposit_protection_scheme" TEXT,
  "deposit_protection_id" TEXT,
  "signed_by_tenant" BOOLEAN DEFAULT false,
  "signed_by_owner" BOOLEAN DEFAULT false,
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" SERIAL PRIMARY KEY,
  "tenancy_id" INTEGER NOT NULL,
  "amount" NUMERIC NOT NULL,
  "payment_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "due_date" TIMESTAMP,
  "paid_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "document_type" TEXT NOT NULL,
  "document_image" TEXT NOT NULL,
  "selfie_image" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "ai_verified" BOOLEAN DEFAULT false,
  "admin_verified" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "maintenance_requests" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "tenant_id" INTEGER,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reported_date" TIMESTAMP DEFAULT now(),
  "scheduled_date" TIMESTAMP,
  "completed_date" TIMESTAMP,
  "category" TEXT,
  "estimated_cost" NUMERIC,
  "actual_cost" NUMERIC,
  "assigned_contractor_id" INTEGER,
  "assigned_agent_id" INTEGER,
  "notes" TEXT,
  "images" JSON DEFAULT '[]',
  "requires_landlord_approval" BOOLEAN DEFAULT false,
  "landlord_approved" BOOLEAN DEFAULT false,
  "tenant_reported" BOOLEAN DEFAULT false,
  "recurring" BOOLEAN DEFAULT false,
  "recurrence_interval" TEXT,
  "next_scheduled_date" TIMESTAMP,
  "budget" NUMERIC,
  "invoice_url" TEXT,
  "receipt_url" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "safety_certificates" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "issue_date" TIMESTAMP NOT NULL,
  "expiry_date" TIMESTAMP NOT NULL,
  "certificate_number" TEXT,
  "issued_by" TEXT NOT NULL,
  "document_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'valid',
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "landlords" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "company_name" TEXT,
  "address" TEXT NOT NULL,
  "contact_email" TEXT NOT NULL,
  "contact_phone" TEXT NOT NULL,
  "bank_account" TEXT,
  "bank_sort_code" TEXT,
  "commission_rate" NUMERIC,
  "payment_terms" TEXT,
  "notes" TEXT,
  "preferred_contact_method" TEXT DEFAULT 'email',
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "contractors" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "company_name" TEXT,
  "services" JSON DEFAULT '[]',
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT,
  "hourly_rate" NUMERIC,
  "insurance_info" TEXT,
  "insurance_expiry_date" TIMESTAMP,
  "vat_registered" BOOLEAN DEFAULT false,
  "vat_number" TEXT,
  "preferred_payment_terms" TEXT,
  "certifications" JSON DEFAULT '[]',
  "service_areas" JSON DEFAULT '[]',
  "response_time" TEXT,
  "available_weekends" BOOLEAN DEFAULT false,
  "available_evenings" BOOLEAN DEFAULT false,
  "emergency_callouts" BOOLEAN DEFAULT false,
  "rating" NUMERIC,
  "total_jobs_completed" INTEGER DEFAULT 0,
  "notes" TEXT,
  "profile_image" TEXT,
  "document_urls" JSON DEFAULT '[]',
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "property_inspections" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "inspected_by" INTEGER NOT NULL,
  "scheduled_date" TIMESTAMP,
  "completed_date" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "type" TEXT NOT NULL,
  "overall_condition" TEXT,
  "issues" JSON DEFAULT '[]',
  "recommendations" TEXT,
  "tenant_present" BOOLEAN DEFAULT false,
  "images" JSON DEFAULT '[]',
  "notes" TEXT,
  "follow_up_required" BOOLEAN DEFAULT false,
  "follow_up_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "all_day" BOOLEAN DEFAULT false,
  "event_type" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" INTEGER,
  "location" TEXT,
  "status" TEXT DEFAULT 'scheduled',
  "reminders" JSON DEFAULT '[]',
  "color" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "maintenance_templates" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "estimated_cost" NUMERIC,
  "estimated_duration" TEXT,
  "priority" TEXT DEFAULT 'medium',
  "recurring" BOOLEAN DEFAULT false,
  "recommended_interval" TEXT,
  "instructions" TEXT,
  "seasonal" BOOLEAN DEFAULT false,
  "season" TEXT,
  "created_by" INTEGER,
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT now(),
  "updated_at" TIMESTAMP DEFAULT now()
);

-- Create foreign key constraints
ALTER TABLE "deposit_scheme_credentials" ADD CONSTRAINT "deposit_scheme_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "applications" ADD CONSTRAINT "applications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE CASCADE;
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_contractor_id_fkey" FOREIGN KEY ("assigned_contractor_id") REFERENCES "contractors"("id") ON DELETE SET NULL;
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "safety_certificates" ADD CONSTRAINT "safety_certificates_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
ALTER TABLE "landlords" ADD CONSTRAINT "landlords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_inspected_by_fkey" FOREIGN KEY ("inspected_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "maintenance_templates" ADD CONSTRAINT "maintenance_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_user_type" ON "users"("user_type");
CREATE INDEX IF NOT EXISTS "idx_properties_owner_id" ON "properties"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_properties_landlord_id" ON "properties"("landlord_id");
CREATE INDEX IF NOT EXISTS "idx_properties_available" ON "properties"("available");
CREATE INDEX IF NOT EXISTS "idx_applications_property_id" ON "applications"("property_id");
CREATE INDEX IF NOT EXISTS "idx_applications_tenant_id" ON "applications"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "idx_tenancies_property_id" ON "tenancies"("property_id");
CREATE INDEX IF NOT EXISTS "idx_tenancies_tenant_id" ON "tenancies"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenancies_active" ON "tenancies"("active");
CREATE INDEX IF NOT EXISTS "idx_payments_tenancy_id" ON "payments"("tenancy_id");
CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "idx_verifications_user_id" ON "verifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_maintenance_requests_property_id" ON "maintenance_requests"("property_id");
CREATE INDEX IF NOT EXISTS "idx_maintenance_requests_status" ON "maintenance_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_maintenance_requests_tenant_id" ON "maintenance_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_safety_certificates_property_id" ON "safety_certificates"("property_id");
CREATE INDEX IF NOT EXISTS "idx_safety_certificates_type" ON "safety_certificates"("type");
CREATE INDEX IF NOT EXISTS "idx_safety_certificates_status" ON "safety_certificates"("status");
CREATE INDEX IF NOT EXISTS "idx_landlords_user_id" ON "landlords"("user_id");
CREATE INDEX IF NOT EXISTS "idx_contractors_services" ON "contractors" USING gin ("services");
CREATE INDEX IF NOT EXISTS "idx_contractors_service_areas" ON "contractors" USING gin ("service_areas");
CREATE INDEX IF NOT EXISTS "idx_property_inspections_property_id" ON "property_inspections"("property_id");
CREATE INDEX IF NOT EXISTS "idx_property_inspections_status" ON "property_inspections"("status");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_user_id" ON "calendar_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_start_date" ON "calendar_events"("start_date");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_entity_type_entity_id" ON "calendar_events"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_maintenance_templates_category" ON "maintenance_templates"("category");
CREATE INDEX IF NOT EXISTS "idx_maintenance_templates_season" ON "maintenance_templates"("season");