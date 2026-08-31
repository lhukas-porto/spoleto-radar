import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://axcabkqjojhaxfltebgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const { data: consultants, error: consErr } = await supabase.from('consultants').select('*');
  console.log('Consultants in Supabase:', consultants?.length, consErr?.message);
  if (consultants && consultants.length > 0) {
    console.log('First consultant:', consultants[0]);
  }

  const { data: stores, error: storesErr } = await supabase.from('stores').select('*').limit(5);
  console.log('Stores in Supabase:', stores?.length, storesErr?.message);
  if (stores && stores.length > 0) {
    console.log('First store:', stores[0]);
  }
}

testQuery();
