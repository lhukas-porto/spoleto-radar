import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://axcabkqjojhaxfltebgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2Fia3Fqb2poYXhmbHRlYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4ODI3OTksImV4cCI6MjEwMzQ1ODc5OX0.FchgXNKoWmzkTnJUR-kzsiR6-DPfNVWrwvOpX_KS5LI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMapping() {
  const { data: cloudConsultants } = await supabase.from('consultants').select('*');
  const { data: cloudStores } = await supabase.from('stores').select('*');

  console.log('Consultants count:', cloudConsultants.length);
  console.log('Stores count:', cloudStores.length);

  const mappedConsultants = cloudConsultants.map(c => ({
    id: c.id,
    name: c.name,
    region: c.region,
    phone: c.phone,
    email: c.email,
    assignedStores: c.assigned_stores || c.assignedStores || [],
    storesCount: (c.assigned_stores || c.assignedStores || []).length,
    active: true
  }));

  const mappedStores = cloudStores.map(s => {
    let matchedConsId = null;
    if (mappedConsultants) {
      const cons = mappedConsultants.find(c => c.assignedStores && c.assignedStores.includes(s.id));
      if (cons) matchedConsId = cons.id;
    }
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      state: s.state,
      city: s.city,
      consultantId: matchedConsId || null
    };
  });

  for (const c of mappedConsultants) {
    const assignedStores = mappedStores.filter(s => 
      s.consultantId === c.id || 
      (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(s.id))
    );
    console.log(`${c.id} | ${c.name} | assigned in array: ${c.assignedStores.length} | filtered stores: ${assignedStores.length}`);
  }
}

debugMapping();
