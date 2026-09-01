-- =========================================================================
-- SPOLETO RADAR | SCHEMA OFICIAL SUPABASE (POSTGRESQL v2.0)
-- Evolução e Gestão da Rede Spoleto • Grupo Trigo
-- =========================================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TABELA DE REGIÕES OFICIAIS DA REDE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. TABELA DE CONSULTORES E LIDERANÇA (EQUIPE SPOLETO)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.consultants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'CONSULTOR' NOT NULL, -- 'DIRETORIA' | 'GERENTE_NACIONAL' | 'GERENTE_REGIONAL' | 'CONSULTOR'
  reports_to TEXT REFERENCES public.consultants(id) ON DELETE SET NULL,
  photo_url TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  assigned_stores TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração segura de colunas caso a tabela já exista
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultants' AND column_name='role') THEN
    ALTER TABLE public.consultants ADD COLUMN role TEXT DEFAULT 'CONSULTOR';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultants' AND column_name='reports_to') THEN
    ALTER TABLE public.consultants ADD COLUMN reports_to TEXT REFERENCES public.consultants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultants' AND column_name='photo_url') THEN
    ALTER TABLE public.consultants ADD COLUMN photo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultants' AND column_name='active') THEN
    ALTER TABLE public.consultants ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- =========================================================================
-- 3. TABELA DE LOJAS (REDE DE UNIDADES SPOLETO)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  cep TEXT,
  address TEXT,
  franchisee TEXT,
  location_type TEXT NOT NULL DEFAULT 'Shopping',
  phone TEXT,
  email TEXT,
  consultant_id TEXT REFERENCES public.consultants(id) ON DELETE SET NULL,
  rating_score NUMERIC DEFAULT 8.5,
  status TEXT DEFAULT 'Ativa' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração segura de colunas caso a tabela já exista
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='cep') THEN
    ALTER TABLE public.stores ADD COLUMN cep TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='address') THEN
    ALTER TABLE public.stores ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='franchisee') THEN
    ALTER TABLE public.stores ADD COLUMN franchisee TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='consultant_id') THEN
    ALTER TABLE public.stores ADD COLUMN consultant_id TEXT REFERENCES public.consultants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='rating_score') THEN
    ALTER TABLE public.stores ADD COLUMN rating_score NUMERIC DEFAULT 8.5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='status') THEN
    ALTER TABLE public.stores ADD COLUMN status TEXT DEFAULT 'Ativa';
  END IF;
END $$;

-- =========================================================================
-- 4. TABELA DE TAXONOMIA (TEMAS & SUBTÓPICOS OPERACIONAIS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  subproblems JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 5. TABELA DE VISITAS & LAUDOS OFICIAIS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.visits (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  consultant_id TEXT NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT,
  end_time TEXT,
  visit_type TEXT DEFAULT 'Visita agendada',
  general_notes TEXT,
  diagnostics JSONB DEFAULT '[]'::jsonb,
  signatures JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração segura de colunas caso a tabela já exista
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='end_time') THEN
    ALTER TABLE public.visits ADD COLUMN end_time TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='signatures') THEN
    ALTER TABLE public.visits ADD COLUMN signatures JSONB DEFAULT NULL;
  END IF;
END $$;

-- =========================================================================
-- 6. TABELA INDIVIDUALIZADA DE PLANOS DE AÇÃO (ACTION PLANS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.action_plans (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  consultant_id TEXT NOT NULL REFERENCES public.consultants(id) ON DELETE CASCADE,
  topic_id TEXT,
  topic_name TEXT,
  subtopic_id TEXT,
  subtopic_title TEXT NOT NULL,
  severity TEXT DEFAULT 'Médio',
  action_what TEXT NOT NULL,
  action_who TEXT NOT NULL,
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'Não Iniciado' NOT NULL, -- 'Não Iniciado' | 'Em Andamento' | 'Concluído' | 'Atrasado'
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 7. TABELA DE NOTIFICAÇÕES & ALERTAS AUTOMÁTICOS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'OVERDUE_ACTION' | 'VISIT_SIGNED' | 'WEEKLY_SUMMARY' | 'SYSTEM'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  channel TEXT DEFAULT 'whatsapp' NOT NULL, -- 'whatsapp' | 'email' | 'system'
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'sent' | 'failed'
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  visit_id TEXT REFERENCES public.visits(id) ON DELETE SET NULL,
  action_id TEXT REFERENCES public.action_plans(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 8. VIEW ANALÍTICA EM TEMPO REAL: v_action_plans
-- Desmembra o JSONB de diagnósticos das visitas em linhas SQL individuais
-- =========================================================================
CREATE OR REPLACE VIEW public.v_action_plans AS
SELECT 
  v.id AS visit_id,
  v.date AS visit_date,
  v.visit_type,
  s.id AS store_id,
  s.code AS store_code,
  s.name AS store_name,
  s.state AS store_state,
  s.city AS store_city,
  s.franchisee AS store_franchisee,
  c.id AS consultant_id,
  c.name AS consultant_name,
  c.region AS consultant_region,
  c.role AS consultant_role,
  (d.value->>'id') AS diagnostic_id,
  (d.value->>'categoryId') AS category_id,
  (d.value->>'subproblemId') AS subproblem_id,
  (d.value->>'severity') AS severity,
  (d.value->>'notes') AS diagnostic_notes,
  (d.value->'actionPlan'->>'what') AS action_what,
  (d.value->'actionPlan'->>'who') AS action_who,
  (d.value->'actionPlan'->>'deadline')::date AS deadline,
  (d.value->'actionPlan'->>'status') AS status,
  CASE 
    WHEN (d.value->'actionPlan'->>'status') = 'Concluído' THEN 'CONCLUÍDO'
    WHEN (d.value->'actionPlan'->>'deadline')::date < CURRENT_DATE AND (d.value->'actionPlan'->>'status') != 'Concluído' THEN 'ATRASADO'
    WHEN (d.value->'actionPlan'->>'status') = 'Em Andamento' THEN 'EM_ANDAMENTO'
    ELSE 'NO_PRAZO'
  END AS sla_status,
  v.created_at
FROM public.visits v
JOIN public.stores s ON v.store_id = s.id
JOIN public.consultants c ON v.consultant_id = c.id,
LATERAL jsonb_array_elements(COALESCE(v.diagnostics, '[]'::jsonb)) d;

-- =========================================================================
-- 9. ÍNDICES DE ALTA PERFORMANCE (B-TREE)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_stores_state ON public.stores(state);
CREATE INDEX IF NOT EXISTS idx_stores_consultant_id ON public.stores(consultant_id);
CREATE INDEX IF NOT EXISTS idx_stores_code ON public.stores(code);

CREATE INDEX IF NOT EXISTS idx_consultants_role ON public.consultants(role);
CREATE INDEX IF NOT EXISTS idx_consultants_reports_to ON public.consultants(reports_to);
CREATE INDEX IF NOT EXISTS idx_consultants_region ON public.consultants(region);

CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_store_id ON public.visits(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_consultant_id ON public.visits(consultant_id);

CREATE INDEX IF NOT EXISTS idx_action_plans_deadline ON public.action_plans(deadline);
CREATE INDEX IF NOT EXISTS idx_action_plans_status ON public.action_plans(status);
CREATE INDEX IF NOT EXISTS idx_action_plans_store_id ON public.action_plans(store_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);

-- =========================================================================
-- 10. SEGURANÇA: ROW LEVEL SECURITY (RLS) & POLÍTICAS DE ACESSO
-- =========================================================================
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.regions;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.regions;
CREATE POLICY "Permitir leitura para todos" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.regions FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.stores;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.stores;
CREATE POLICY "Permitir leitura para todos" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.stores FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.consultants;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.consultants;
CREATE POLICY "Permitir leitura para todos" ON public.consultants FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.consultants FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.categories;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.categories;
CREATE POLICY "Permitir leitura para todos" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.visits;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.visits;
CREATE POLICY "Permitir leitura para todos" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.visits FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.action_plans;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.action_plans;
CREATE POLICY "Permitir leitura para todos" ON public.action_plans FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.action_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.notifications;
DROP POLICY IF EXISTS "Permitir escrita para todos" ON public.notifications;
CREATE POLICY "Permitir leitura para todos" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Permitir escrita para todos" ON public.notifications FOR ALL USING (true);

