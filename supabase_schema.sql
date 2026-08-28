-- =========================================================================
-- SPOLETO RADAR | SCHEMA OFICIAL SUPABASE (POSTGRESQL)
-- =========================================================================

-- 1. Tabela de Lojas (409 Unidades Spoleto)
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  location_type TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Consultores de Negócios
CREATE TABLE IF NOT EXISTS public.consultants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  assigned_stores TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Temas & Subproblemas (Taxonomia)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  subproblems JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Visitas & Planos de Ação
CREATE TABLE IF NOT EXISTS public.visits (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  consultant_id TEXT NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT,
  visit_type TEXT DEFAULT 'Visita agendada',
  general_notes TEXT,
  diagnostics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público para Leitura e Escrita
CREATE POLICY "Permitir leitura para todos" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.stores FOR ALL USING (true);

CREATE POLICY "Permitir leitura para todos" ON public.consultants FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.consultants FOR ALL USING (true);

CREATE POLICY "Permitir leitura para todos" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.categories FOR ALL USING (true);

CREATE POLICY "Permitir leitura para todos" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.visits FOR ALL USING (true);
