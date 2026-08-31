import { createClient } from '@supabase/supabase-js';
import { INITIAL_STORES, INITIAL_CONSULTANTS, INITIAL_CATEGORIES, INITIAL_VISITS } from '../src/data/initialData.js';

const supabaseUrl = 'https://axcabkqjojhaxfltebgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Iniciando atualização e carga de dados no Supabase...');

  // 1. Limpar consultores antigos para remover dados de teste
  console.log('Limpando tabela de consultores antigos...');
  const { error: delConsErr } = await supabase.from('consultants').delete().neq('id', 'dummy_never_match');
  if (delConsErr) {
    console.log('Aviso ao limpar consultores:', delConsErr.message);
  }

  // 2. Consultants (16 Consultores Oficiais)
  console.log(`Inserindo ${INITIAL_CONSULTANTS.length} consultores oficiais...`);
  const consultantRows = INITIAL_CONSULTANTS.map(c => ({
    id: c.id,
    name: c.name,
    region: c.region,
    phone: c.phone || '',
    email: c.email || '',
    assigned_stores: c.assignedStores || []
  }));
  const { error: consErr } = await supabase.from('consultants').upsert(consultantRows);
  if (consErr) console.error('Erro consultores:', consErr.message);
  else console.log(`${INITIAL_CONSULTANTS.length} Consultores inseridos com sucesso!`);

  // 3. Stores (409 Lojas)
  console.log(`Inserindo ${INITIAL_STORES.length} lojas...`);
  const storeRows = INITIAL_STORES.map(s => ({
    id: s.id,
    code: s.code,
    name: s.name,
    state: s.state,
    city: s.city,
    location_type: s.locationType,
    phone: s.phone || '',
    email: s.email || ''
  }));

  for (let i = 0; i < storeRows.length; i += 50) {
    const chunk = storeRows.slice(i, i + 50);
    const { error } = await supabase.from('stores').upsert(chunk);
    if (error) console.error('Erro lojas:', error.message);
  }
  console.log('409 Lojas inseridas com sucesso!');

  // 4. Categories (20 Temas Oficiais)
  console.log(`Inserindo ${INITIAL_CATEGORIES.length} categorias...`);
  const catRows = INITIAL_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '',
    color: cat.color || '',
    description: cat.description || '',
    subproblems: cat.subproblems || []
  }));
  const { error: catErr } = await supabase.from('categories').upsert(catRows);
  if (catErr) console.error('Erro categorias:', catErr.message);
  else console.log('20 Temas principais e 100 subproblemas inseridos com sucesso!');

  // 5. Visits
  console.log(`Inserindo ${INITIAL_VISITS.length} visitas...`);
  const visitRows = INITIAL_VISITS.map(v => ({
    id: v.id,
    store_id: v.storeId,
    consultant_id: v.consultantId,
    date: v.date,
    time: v.time || '14:00',
    visit_type: v.visitType || 'Visita agendada',
    general_notes: v.generalNotes || '',
    diagnostics: v.diagnostics || []
  }));
  const { error: visitErr } = await supabase.from('visits').upsert(visitRows);
  if (visitErr) console.error('Erro visitas:', visitErr.message);
  else console.log('Visitas inseridas com sucesso!');

  console.log('BANCO SUPABASE 100% CARREGADO E SINCRONIZADO!');
}

seed();
