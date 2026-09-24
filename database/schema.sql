-- ========================================================================
-- Jeroma Farmers Collection Centre Ltd - Enterprise PostgreSQL/Supabase Schema
-- Architecture: Multi-branch, ACID-compliant, scalable to 500,000+ records
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ACCESS CONTROL TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    department VARCHAR(100),
    phone VARCHAR(30),
    district VARCHAR(100) DEFAULT 'Pader',
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. COOPERATIVES & SACCOs DIRECTORY
CREATE TABLE IF NOT EXISTS cooperatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    subcounty VARCHAR(100),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    registered_farmers INTEGER DEFAULT 0,
    crops_specialization JSONB DEFAULT '[]'::jsonb,
    machinery_assigned JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coops_code ON cooperatives(code);
CREATE INDEX IF NOT EXISTS idx_coops_district ON cooperatives(district);
CREATE INDEX IF NOT EXISTS idx_coops_status ON cooperatives(status);

-- 3. PROJECTS & WATERFALL PHASES (e.g., A2I Project, Seed Subsidy)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    lead_manager VARCHAR(255),
    department VARCHAR(100),
    donor_partner VARCHAR(255),
    budget NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Implementation',
    waterfall_phase VARCHAR(50) DEFAULT 'Implementation',
    progress_percentage INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    cooperatives_engaged JSONB DEFAULT '[]'::jsonb,
    districts_covered JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 4. GRAIN WEIGHING & DELIVERIES (Collection Center Receiving)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    farmer_name VARCHAR(255) NOT NULL,
    farmer_phone VARCHAR(50),
    cooperative_id UUID REFERENCES cooperatives(id) ON DELETE SET NULL,
    crop VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    gross_weight_kg NUMERIC(10, 2) NOT NULL,
    tare_weight_kg NUMERIC(10, 2) DEFAULT 0,
    net_weight_kg NUMERIC(10, 2) NOT NULL,
    moisture_content_pct NUMERIC(4, 2),
    unit_price_ugx NUMERIC(10, 2) NOT NULL,
    total_amount_ugx NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    payment_method VARCHAR(50) DEFAULT 'Mobile Money',
    collection_centre VARCHAR(100) DEFAULT 'Pader Head Centre',
    received_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_receipt ON deliveries(receipt_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_crop ON deliveries(crop);
CREATE INDEX IF NOT EXISTS idx_deliveries_payment ON deliveries(payment_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at);

-- 5. FLEET & TRANSIT DISPATCHES
CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_code VARCHAR(100) UNIQUE NOT NULL,
    truck_reg_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(50),
    source_location VARCHAR(100) NOT NULL,
    destination_hub VARCHAR(100) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    bag_count INTEGER NOT NULL,
    total_tonnage_mt NUMERIC(8, 2) NOT NULL,
    dispatch_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'In Transit',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispatches_code ON dispatches(dispatch_code);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON dispatches(status);

-- 6. AUDIT LOGS (Security Compliance & Traceability)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    performed_by_username VARCHAR(100) NOT NULL,
    performed_by_role VARCHAR(50),
    ip_address VARCHAR(50),
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity);
