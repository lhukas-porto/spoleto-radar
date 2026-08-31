import { createClient } from '@supabase/supabase-js';
import { INITIAL_CONSULTANTS } from '../src/data/initialData.js';

const supabaseUrl = 'https://axcabkqjojhaxfltebgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConsultantsInSupabase() {
  console.log('Total de consultores para atualizar:', INITIAL_CONSULTANTS.length);
  
  for (const c of INITIAL_CONSULTANTS) {
    const row = {
      id: c.id,
      name: c.name,
      region: c.region,
      phone: c.phone || '',
      email: c.email || '',
      assigned_stores: c.assignedStores || []
    };
    
    console.log(`Upserting ${c.id} (${c.name}) com ${row.assigned_stores.length} lojas...`);
    const { error } = await supabase.from('consultants').upsert(row);
    if (error) {
      console.error(`Erro no consultor ${c.name}:`, error.message);
    }
  }

  // Verify
  const { data: updated } = await supabase.from('consultants').select('*');
  console.log('\n--- Resultado no Supabase ---');
  for (const c of updated) {
    console.log(`${c.id} | ${c.name} | ${c.assigned_stores?.length} lojas`);
  }
}

fixConsultantsInSupabase();
