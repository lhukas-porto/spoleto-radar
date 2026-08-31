import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://axcabkqjojhaxfltebgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  const { data: consultants } = await supabase.from('consultants').select('*');
  const { data: stores } = await supabase.from('stores').select('*');

  console.log('Total Stores in Supabase:', stores.length);
  console.log('Total Consultants in Supabase:', consultants.length);

  const alex = consultants.find(c => c.name.includes('ALEX DE BRISTO'));
  console.log('Alex assigned_stores count:', alex?.assigned_stores?.length);
  console.log('Alex assigned_stores:', alex?.assigned_stores);

  const matchedStores = stores.filter(s => alex.assigned_stores.includes(s.id));
  console.log('Stores found matching Alex store IDs:', matchedStores.length);
  if (matchedStores.length > 0) {
    console.log('Sample matched store:', matchedStores[0].name);
  }
}

checkIds();
