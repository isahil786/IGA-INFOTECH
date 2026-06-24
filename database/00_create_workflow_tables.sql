-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  company_name TEXT,
  country TEXT DEFAULT 'India',
  timezone TEXT DEFAULT 'IST',
  notification_preference TEXT DEFAULT 'both', -- 'email', 'whatsapp', or 'both'
  whatsapp_number TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  service_category TEXT NOT NULL,
  description TEXT,
  pricing_plan TEXT NOT NULL, -- 'Basic', 'Standard', 'Premium'
  total_amount DECIMAL(10, 2) NOT NULL,
  advance_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  advance_paid DECIMAL(10, 2) DEFAULT 0,
  final_paid DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'Pending Approval', -- 'Pending Approval', 'Awaiting Advance', 'In Development', 'Awaiting Final Payment', 'Completed', 'Rejected'
  rejection_reason TEXT,
  preview_url TEXT,
  production_url TEXT,
  admin_notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Details (for custom fields)
CREATE TABLE IF NOT EXISTS project_details (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technology_stack TEXT[],
  timeline_days INTEGER,
  budget_range TEXT,
  reference_links TEXT[],
  additional_requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT NOT NULL, -- 'advance' or 'final'
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Status History (for tracking changes)
CREATE TABLE IF NOT EXISTS project_status_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Milestones/Progress tracking
CREATE TABLE IF NOT EXISTS project_milestones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  percentage_complete INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security
--
-- This app does NOT use Supabase Auth (auth.uid()) — clients authenticate via
-- our own Express routes (server/routes/auth.ts), which issue signed JWTs and
-- enforce "does this client own this row" checks explicitly in code.
--
-- All server-side access goes through the SERVICE ROLE key, which bypasses
-- RLS entirely. RLS here exists purely as a defense-in-depth backstop in case
-- the anon/public key is ever used directly (e.g. accidentally exposed to the
-- browser) — in that scenario, these policies ensure it can do nothing at all.
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- No policies are defined for anon/authenticated roles below, which means
-- RLS denies all access by default for those roles. Only the service role
-- (used exclusively by our server) can read/write these tables.

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
