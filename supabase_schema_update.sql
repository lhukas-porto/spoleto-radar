-- =========================================================================
-- SPOLETO RADAR • SCRIPT OFICIAL DE ATUALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/axcabkqjojhaxfltebgu/sql
-- =========================================================================

-- 1. TABELA DE FRANQUEADOS
CREATE TABLE IF NOT EXISTS public.franchisees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA PIVÔ DE VÍNCULO N:N (Múltiplas Lojas <-> Múltiplos Sócios/Franqueados)
CREATE TABLE IF NOT EXISTS public.store_franchisees (
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  franchisee_id TEXT REFERENCES public.franchisees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (store_id, franchisee_id)
);

-- 3. GARANTIR TABELA DE NOTIFICAÇÕES & LOG DE SLA
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'sent',
  store_id TEXT,
  visit_id TEXT,
  action_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ÍNDICES DE ALTA PERFORMANCE (Otimização para Benchmark, Ranking e Consultas)
CREATE INDEX IF NOT EXISTS idx_stores_consultant_id ON public.stores(consultant_id);
CREATE INDEX IF NOT EXISTS idx_stores_state ON public.stores(state);
CREATE INDEX IF NOT EXISTS idx_visits_store_id ON public.visits(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_consultant_id ON public.visits(consultant_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON public.notifications(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_franchisees_store ON public.store_franchisees(store_id);
CREATE INDEX IF NOT EXISTS idx_store_franchisees_franchisee ON public.store_franchisees(franchisee_id);

-- 5. POLÍTICAS DE SEGURANÇA E ACESSO (RLS - Row Level Security)
ALTER TABLE public.franchisees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_franchisees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissões totais para clientes web anônimos e autenticados
DROP POLICY IF EXISTS "Permitir acesso total a franchisees" ON public.franchisees;
CREATE POLICY "Permitir acesso total a franchisees" ON public.franchisees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total a store_franchisees" ON public.store_franchisees;
CREATE POLICY "Permitir acesso total a store_franchisees" ON public.store_franchisees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total a notifications" ON public.notifications;
CREATE POLICY "Permitir acesso total a notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 6. MIGRAÇÃO AUTOMÁTICA DE DADOS EXISTENTES (Se houver franqueados cadastrados nas lojas)
DO $$
DECLARE
  r RECORD;
  new_fran_id TEXT;
  clean_name TEXT;
BEGIN
  FOR r IN 
    SELECT DISTINCT franchisee, email, phone 
    FROM public.stores 
    WHERE franchisee IS NOT NULL 
      AND TRIM(franchisee) <> '' 
      AND UPPER(TRIM(franchisee)) <> 'FRANQUEADO OFICIAL'
  LOOP
    clean_name := UPPER(TRIM(r.franchisee));
    new_fran_id := 'fran-' || substr(md5(random()::text), 1, 10);
    
    -- Insere o franqueado se não existir
    INSERT INTO public.franchisees (id, name, email, phone)
    VALUES (new_fran_id, clean_name, COALESCE(r.email, 'franqueado@spoleto.com.br'), COALESCE(r.phone, ''))
    ON CONFLICT (id) DO NOTHING;

    -- Vincula as lojas correspondentes
    INSERT INTO public.store_franchisees (store_id, franchisee_id)
    SELECT id, new_fran_id 
    FROM public.stores 
    WHERE UPPER(TRIM(franchisee)) = clean_name
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
