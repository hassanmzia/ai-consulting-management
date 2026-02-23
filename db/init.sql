-- Consulting Management Platform - Database Schema

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','manager','consultant','viewer')),
    phone VARCHAR(20),
    title VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'lead' CHECK (status IN ('lead','active','on_hold','completed','churned')),
    industry VARCHAR(50),
    company_size VARCHAR(20),
    website VARCHAR(300),
    contact_name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'United States',
    annual_revenue NUMERIC(15,2),
    account_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultants
CREATE TABLE IF NOT EXISTS consultants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    expertise VARCHAR(50) NOT NULL,
    seniority VARCHAR(20) DEFAULT 'mid' CHECK (seniority IN ('junior','mid','senior','principal','partner')),
    hourly_rate NUMERIC(8,2) DEFAULT 150.00,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    date_joined DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','proposal','in_progress','on_hold','completed','cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    description TEXT,
    lead_consultant_id INTEGER REFERENCES consultants(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    deadline DATE,
    billing_type VARCHAR(20) DEFAULT 'hourly' CHECK (billing_type IN ('hourly','fixed','retainer')),
    budget NUMERIC(12,2),
    hourly_rate NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project-Consultant assignments (many-to-many)
CREATE TABLE IF NOT EXISTS project_consultants (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    consultant_id INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, consultant_id)
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    consultant_id INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    description TEXT NOT NULL,
    is_billable BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity NUMERIC(8,2) DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL
);

-- Mentorship / Consulting Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    consultant_id INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topics_covered TEXT NOT NULL,
    session_notes TEXT,
    action_items TEXT,
    client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),
    follow_up_needed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPIs
CREATE TABLE IF NOT EXISTS kpis (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    category VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    baseline_value NUMERIC(12,2) NOT NULL,
    target_value NUMERIC(12,2) NOT NULL,
    current_value NUMERIC(12,2) NOT NULL,
    unit VARCHAR(30),
    measured_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consulting Portfolios (from Streamlit portfolio builder)
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(300) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','review','approved','sent')),
    -- Branding
    brand_name VARCHAR(200),
    brand_color VARCHAR(10) DEFAULT '#1E3A8A',
    font_choice VARCHAR(50) DEFAULT 'Helvetica',
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light','dark')),
    logo_url TEXT,
    -- Content sections
    executive_summary TEXT,
    strategic_opportunities TEXT,
    risk_assessment TEXT,
    scenario_analysis JSONB,
    professional_insights TEXT,
    case_study TEXT,
    -- Meta
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolios_client ON portfolios(client_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON portfolios(status);

-- AI Agent conversation logs
CREATE TABLE IF NOT EXISTS agent_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    agent_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_consultant ON time_entries(consultant_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_kpis_client ON kpis(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_consultant ON sessions(consultant_id);

-- Seed default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@consulting.local', '$2b$10$YourHashHere', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed demo data
INSERT INTO clients (name, status, industry, company_size, contact_name, contact_email, city, state, annual_revenue) VALUES
('TechVision Inc', 'active', 'technology', '51-200', 'Sarah Chen', 'sarah@techvision.io', 'San Francisco', 'CA', 5200000),
('GreenLeaf Solutions', 'active', 'energy', '11-50', 'Marcus Johnson', 'marcus@greenleaf.com', 'Austin', 'TX', 1800000),
('HealthFirst Medical', 'active', 'healthcare', '201-500', 'Dr. Emily Watson', 'emily@healthfirst.com', 'Boston', 'MA', 12000000),
('RetailMax Global', 'lead', 'retail', '501-1000', 'James Park', 'james@retailmax.com', 'New York', 'NY', 45000000),
('EduBridge Academy', 'active', 'education', '11-50', 'Lisa Rodriguez', 'lisa@edubridge.org', 'Chicago', 'IL', 3200000),
('FinanceForward', 'on_hold', 'finance', '51-200', 'Robert Kim', 'robert@financeforward.com', 'Charlotte', 'NC', 8500000)
ON CONFLICT DO NOTHING;

INSERT INTO consultants (name, email, expertise, seniority, hourly_rate, bio, is_active) VALUES
('Alexandra Rivera', 'alex@consulting.local', 'strategy', 'principal', 350.00, 'Strategy and digital transformation expert with 15 years experience.', true),
('David Okonkwo', 'david@consulting.local', 'technology', 'senior', 275.00, 'Full-stack technology consultant specializing in cloud architecture.', true),
('Maria Santos', 'maria@consulting.local', 'operations', 'senior', 250.00, 'Operations and supply chain optimization specialist.', true),
('Thomas Berg', 'thomas@consulting.local', 'finance', 'principal', 325.00, 'Financial advisory and M&A specialist.', true),
('Priya Patel', 'priya@consulting.local', 'data_analytics', 'mid', 200.00, 'Data analytics and business intelligence consultant.', true)
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, client_id, status, priority, description, lead_consultant_id, start_date, deadline, billing_type, budget, hourly_rate) VALUES
('Digital Transformation Roadmap', 1, 'in_progress', 'high', 'Complete digital transformation strategy and implementation roadmap for TechVision.', 1, '2025-11-01', '2026-04-30', 'fixed', 180000, 300),
('Sustainability Audit & Strategy', 2, 'in_progress', 'medium', 'Environmental sustainability audit and strategic planning for GreenLeaf.', 3, '2025-12-15', '2026-03-31', 'hourly', 75000, NULL),
('EHR System Migration', 3, 'in_progress', 'critical', 'Electronic Health Records system migration and staff training program.', 2, '2025-10-01', '2026-06-30', 'fixed', 420000, 280),
('Market Expansion Analysis', 4, 'proposal', 'medium', 'Market research and expansion strategy for Southeast Asian markets.', 1, NULL, NULL, 'fixed', 95000, 300),
('Data Analytics Platform', 5, 'in_progress', 'high', 'Build data analytics and reporting platform for student performance tracking.', 5, '2026-01-10', '2026-05-15', 'hourly', 60000, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO time_entries (project_id, consultant_id, date, hours, description, is_billable) VALUES
(1, 1, '2026-02-20', 6.5, 'Stakeholder interviews and current state assessment', true),
(1, 1, '2026-02-19', 8.0, 'Technology landscape analysis and vendor evaluation', true),
(1, 2, '2026-02-20', 4.0, 'Cloud infrastructure assessment', true),
(2, 3, '2026-02-20', 5.0, 'Supply chain carbon footprint analysis', true),
(2, 3, '2026-02-19', 7.5, 'Sustainability metrics baseline measurement', true),
(3, 2, '2026-02-20', 8.0, 'EHR data migration planning and schema mapping', true),
(3, 2, '2026-02-19', 8.0, 'Legacy system analysis and integration points', true),
(5, 5, '2026-02-20', 6.0, 'Data pipeline architecture design', true),
(5, 5, '2026-02-19', 7.0, 'Requirements gathering with faculty', true),
(1, 1, '2026-02-18', 7.0, 'Executive strategy workshop facilitation', true),
(3, 2, '2026-02-18', 8.0, 'Security compliance review for EHR migration', true)
ON CONFLICT DO NOTHING;

INSERT INTO invoices (invoice_number, client_id, project_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount) VALUES
('INV-2026-001', 1, 1, 'paid', '2026-01-15', '2026-02-15', 45000, 8.5, 3825, 48825),
('INV-2026-002', 3, 3, 'paid', '2026-01-15', '2026-02-15', 67200, 8.5, 5712, 72912),
('INV-2026-003', 2, 2, 'sent', '2026-02-01', '2026-03-01', 18750, 8.5, 1593.75, 20343.75),
('INV-2026-004', 1, 1, 'draft', '2026-02-15', '2026-03-15', 39000, 8.5, 3315, 42315),
('INV-2026-005', 5, 5, 'sent', '2026-02-01', '2026-03-01', 26000, 8.5, 2210, 28210)
ON CONFLICT DO NOTHING;

INSERT INTO kpis (client_id, project_id, category, name, baseline_value, target_value, current_value, unit) VALUES
(1, 1, 'technology', 'Cloud Migration Progress', 0, 100, 35, '%'),
(1, 1, 'operations', 'Process Automation Rate', 15, 75, 42, '%'),
(1, 1, 'financial', 'IT Cost Reduction', 0, 30, 12, '%'),
(2, 2, 'operations', 'Carbon Footprint Reduction', 0, 40, 18, '%'),
(2, 2, 'financial', 'Sustainability ROI', 0, 200000, 65000, 'USD'),
(3, 3, 'technology', 'EHR Data Migrated', 0, 100, 28, '%'),
(3, 3, 'operations', 'Staff Training Completion', 0, 100, 45, '%'),
(5, 5, 'technology', 'Platform Modules Delivered', 0, 8, 2, 'count'),
(5, 5, 'customer', 'Faculty Adoption Rate', 0, 90, 0, '%')
ON CONFLICT DO NOTHING;

INSERT INTO sessions (project_id, consultant_id, client_id, date, start_time, end_time, topics_covered, session_notes, action_items, client_satisfaction) VALUES
(1, 1, 1, '2026-02-20', '09:00', '11:30', 'Q1 strategy review, technology roadmap alignment', 'Reviewed progress on digital transformation. Client pleased with cloud migration timeline.', 'Schedule vendor demos for March, finalize API strategy document', 5),
(2, 3, 2, '2026-02-19', '14:00', '16:00', 'Sustainability metrics review, supply chain audit results', 'Presented initial carbon audit findings. Identified 3 key reduction opportunities.', 'Draft sustainability action plan, schedule board presentation', 4),
(3, 2, 3, '2026-02-18', '10:00', '12:00', 'EHR migration status, security compliance update', 'Phase 1 data migration on track. Security audit passed with minor findings.', 'Remediate 2 security findings, begin Phase 2 planning', 4),
(5, 5, 5, '2026-02-17', '13:00', '15:30', 'Data pipeline architecture review, reporting requirements', 'Finalized data model for student analytics. Faculty feedback incorporated.', 'Build prototype dashboard, schedule user testing', 5)
ON CONFLICT DO NOTHING;
