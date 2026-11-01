import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- FREELANCER CLIENT PORTAL - SUPABASE POSTGRESQL SCHEMA
-- Execute this entire script in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- ==============================================================================

-- 1. Create enum types if not exists
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('admin', 'freelancer', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status_enum AS ENUM ('pending', 'in_progress', 'review', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'freelancer',
    phone VARCHAR(50),
    company VARCHAR(150),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Clients Directory Table
CREATE TABLE IF NOT EXISTS public.portal_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.portal_users(id) ON DELETE SET NULL,
    freelancer_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.portal_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    freelancer_id UUID NOT NULL,
    freelancer_name VARCHAR(255),
    client_id UUID NOT NULL,
    client_name VARCHAR(255),
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'PKR',
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status project_status_enum DEFAULT 'pending',
    category VARCHAR(100) DEFAULT 'Design & Dev',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Project Tasks / Milestones
CREATE TABLE IF NOT EXISTS public.portal_project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.portal_projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS public.portal_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    freelancer_id UUID NOT NULL,
    freelancer_name VARCHAR(255),
    client_id UUID NOT NULL,
    client_name VARCHAR(255),
    project_id UUID REFERENCES public.portal_projects(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status invoice_status_enum DEFAULT 'sent',
    currency VARCHAR(10) DEFAULT 'PKR',
    notes TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.portal_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.portal_invoices(id) ON DELETE CASCADE NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- 8. Project Deliverables / Files
CREATE TABLE IF NOT EXISTS public.portal_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.portal_projects(id) ON DELETE CASCADE NOT NULL,
    uploader_id UUID NOT NULL,
    uploader_name VARCHAR(255),
    uploader_role user_role_enum DEFAULT 'freelancer',
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    file_type VARCHAR(50),
    file_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'deliverable',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Messages Table (Real-time chat)
CREATE TABLE IF NOT EXISTS public.portal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.portal_projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role user_role_enum NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_name VARCHAR(255),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Activity Audit Logs (Super Admin viewable)
CREATE TABLE IF NOT EXISTS public.portal_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name VARCHAR(255) NOT NULL,
    user_role user_role_enum NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    category VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Initial Seed Data (Admin user 'abdary' and demo data)
INSERT INTO public.portal_users (username, email, full_name, role, status)
VALUES ('abdary', 'admin@freelancerportal.pk', 'Abdary (Super Admin)', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;

-- 12. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON public.portal_projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.portal_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_freelancer ON public.portal_invoices(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_messages_project ON public.portal_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.portal_activity_logs(created_at DESC);
`;

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
  const finalUrl = url || (typeof window !== 'undefined' ? localStorage.getItem('portal_supabase_url') : '') || envUrl;
  const finalKey = anonKey || (typeof window !== 'undefined' ? localStorage.getItem('portal_supabase_key') : '') || envKey;

  if (!finalUrl || !finalKey || !finalUrl.startsWith('https://')) {
    return null;
  }

  try {
    return createClient(finalUrl, finalKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('https://')) {
    return { success: false, message: 'Invalid URL. Supabase URL must start with https://' };
  }
  if (!anonKey || anonKey.length < 20) {
    return { success: false, message: 'Invalid Anon Key. Please paste the public anon key from Project Settings > API.' };
  }

  try {
    const client = createClient(url, anonKey);
    // Simple ping check
    const { error } = await client.from('portal_users').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return {
          success: true,
          message: 'Connected to your Supabase project (cpxrbcxkextzidwwkyhe)! Tables are ready to be created via the SQL Schema script in your Supabase SQL Editor.'
        };
      }
      return { success: false, message: `Supabase error: ${error.message} (${error.code || 'API error'})` };
    }

    return { success: true, message: 'Connection successful! Supabase tables are ready and accessible.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to connect to Supabase. Check network and credentials.' };
  }
}
