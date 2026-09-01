import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_STORES, 
  INITIAL_CONSULTANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_VISITS,
  INITIAL_REGIONS
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { formatPhoneNumber } from '../utils/dateHelpers';

const AppContext = createContext();

const isLegacyMockStaff = (c) => {
  if (!c) return false;
  const legacyIds = ['staff-dir-1', 'staff-gn-1', 'staff-gr-1', 'staff-gr-2', 'staff-gr-3'];
  if (legacyIds.includes(c.id)) return true;
  const upper = (c.name || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (upper.includes('GERENCIA REGIONAL SAO PAULO') || upper.includes('GERENCIA REGIONAL SP')) return true;
  if (upper.includes('GERENCIA NACIONAL DE CONSULTORIA') || upper.includes('GERENCIA NACIONAL')) return true;
  if (upper.includes('DIRETORIA DE OPERACOES') || upper.includes('DIRETORIA DE OPERAÇOES') || upper.includes('DIRETORIA DE OPERACOES & FRANQUIAS')) return true;
  if (upper.includes('GERENCIA REGIONAL RIO DE JANEIRO')) return true;
  if (upper.includes('GERENCIA REGIONAL NORTE')) return true;
  return false;
};

export function AppProvider({ children }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States (Local + Cloud Sincronizado com migração automática v2)
  const [stores, setStores] = useState(() => {
    if (localStorage.getItem('trigo_stores') && !localStorage.getItem('trigo_stores_v2')) {
      localStorage.removeItem('trigo_stores');
      localStorage.removeItem('trigo_consultants');
    }
    const saved = localStorage.getItem('trigo_stores_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_STORES;
  });

  const [consultants, setConsultants] = useState(() => {
    const saved = localStorage.getItem('trigo_consultants_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed
            .filter(c => !isLegacyMockStaff(c))
            .map(c => ({
              ...c,
              name: (c.name || '').toUpperCase().trim(),
              email: (c.email || '').toLowerCase().trim(),
              phone: formatPhoneNumber(c.phone),
              role: c.role || 'CONSULTOR',
              reportsTo: c.reportsTo !== undefined ? c.reportsTo : null,
              photoUrl: c.photoUrl || null
            }));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) {}
    }
    return INITIAL_CONSULTANTS.filter(c => !isLegacyMockStaff(c)).map(c => ({
      ...c,
      name: (c.name || '').toUpperCase().trim(),
      email: (c.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(c.phone),
      role: c.role || 'CONSULTOR',
      reportsTo: null
    }));
  });

  const [editingVisit, setEditingVisit] = useState(null);
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState(null);
  const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
  const [managingSubordinatesLeader, setManagingSubordinatesLeader] = useState(null);

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('trigo_categories_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length >= 18) return parsed;
      } catch (e) {}
    }
    return INITIAL_CATEGORIES;
  });

  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem('trigo_visits_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_VISITS;
  });

  const [regions, setRegions] = useState(() => {
    const saved = localStorage.getItem('trigo_regions_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_REGIONS;
  });

  const [franchisees, setFranchisees] = useState(() => {
    const saved = localStorage.getItem('trigo_franchisees_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [selectedVisitForReport, setSelectedVisitForReport] = useState(null);
  const [selectedStoreForProfile, setSelectedStoreForProfile] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Cleanup deprecated legacy LocalStorage keys
  useEffect(() => {
    try {
      ['trigo_franchisees_v1', 'trigo_franchisees_v2', 'trigo_franchisees_v3'].forEach(k => {
        localStorage.removeItem(k);
      });
    } catch (e) {
      // Ignore
    }
  }, []);

  // Load from Supabase on start if available
  useEffect(() => {
    async function loadFromSupabase() {
      if (!isSupabaseConfigured || !supabase) return;
      setIsCloudSyncing(true);
      try {
        // Fetch Regions
        const { data: cloudRegions } = await supabase.from('regions').select('*');
        if (cloudRegions && cloudRegions.length > 0) {
          const regionNames = cloudRegions.map(r => r.name).filter(Boolean);
          setRegions(prev => {
            const set = new Set([...INITIAL_REGIONS, ...prev, ...regionNames]);
            return Array.from(set);
          });
        }

        // Fetch Consultants (Merge without stripping roles or losing local staff)
        const { data: cloudConsultants } = await supabase.from('consultants').select('*');
        if (cloudConsultants && cloudConsultants.length > 0) {
          const validCloud = cloudConsultants.filter(c => !isLegacyMockStaff(c));
          setConsultants(prev => {
            const cloudMap = new Map(validCloud.map(c => [c.id, c]));
            const merged = prev
              .filter(local => !isLegacyMockStaff(local))
              .map(local => {
                const cloud = cloudMap.get(local.id);
                if (!cloud) return local;
                return {
                  ...local,
                  name: cloud.name ? cloud.name.toUpperCase().trim() : local.name,
                  region: cloud.region || local.region,
                  phone: formatPhoneNumber(cloud.phone || local.phone),
                  email: (cloud.email || local.email || '').toLowerCase().trim(),
                  role: cloud.role || local.role || 'CONSULTOR',
                  reportsTo: cloud.reports_to || cloud.reportsTo || local.reportsTo || null,
                  photoUrl: cloud.photo_url || cloud.photoUrl || local.photoUrl || null
                };
              });
            // Add cloud members not yet in local state
            validCloud.forEach(c => {
              if (!merged.some(m => m.id === c.id)) {
                merged.push({
                  id: c.id,
                  name: c.name.toUpperCase().trim(),
                  region: c.region,
                  phone: formatPhoneNumber(c.phone),
                  email: (c.email || '').toLowerCase().trim(),
                  role: c.role || 'CONSULTOR',
                  reportsTo: c.reports_to || c.reportsTo || null,
                  photoUrl: c.photo_url || c.photoUrl || null,
                  assignedStores: c.assigned_stores || c.assignedStores || [],
                  storesCount: (c.assigned_stores || c.assignedStores || []).length,
                  active: true
                });
              }
            });
            return merged.filter(c => !isLegacyMockStaff(c));
          });
        }

        // Fetch Stores (Merge preserving franchisee and details)
        const { data: cloudStores } = await supabase.from('stores').select('*');
        if (cloudStores && cloudStores.length > 0) {
          setStores(prev => {
            const cloudMap = new Map(cloudStores.map(s => [s.id, s]));
            const merged = prev.map(local => {
              const cloud = cloudMap.get(local.id);
              if (!cloud) return local;
              return {
                ...local,
                code: cloud.code ? cloud.code.toUpperCase().trim() : local.code,
                name: cloud.name ? cloud.name.toUpperCase().trim() : local.name,
                state: cloud.state || local.state,
                city: cloud.city || local.city,
                cep: cloud.cep || local.cep || '',
                address: cloud.address || local.address || `${cloud.name} - ${cloud.city}/${cloud.state}`,
                franchisee: cloud.franchisee ? cloud.franchisee.toUpperCase().trim() : local.franchisee,
                locationType: cloud.location_type || cloud.locationType || local.locationType || 'Shopping',
                phone: cloud.phone ? formatPhoneNumber(cloud.phone) : local.phone,
                email: (cloud.email || local.email || '').toLowerCase().trim(),
                consultantId: cloud.consultant_id || cloud.consultantId || local.consultantId || null
              };
            });
            cloudStores.forEach(s => {
              if (!merged.some(m => m.id === s.id)) {
                merged.push({
                  id: s.id,
                  code: (s.code || '').toUpperCase().trim(),
                  name: (s.name || '').toUpperCase().trim(),
                  state: s.state || 'SP',
                  city: s.city || '',
                  cep: s.cep || '',
                  franchisee: (s.franchisee || '').toUpperCase().trim(),
                  locationType: s.location_type || s.locationType || 'Shopping',
                  address: s.address || `${s.name} - ${s.city}/${s.state}`,
                  phone: formatPhoneNumber(s.phone),
                  email: (s.email || '').toLowerCase().trim(),
                  consultantId: s.consultant_id || s.consultantId || null,
                  ratingScore: s.rating_score || s.ratingScore || 8.5,
                  status: s.status || 'Ativa'
                });
              }
            });
            return merged;
          });

          // Reconstruir lista de franqueados da nuvem automaticamente
          setFranchisees(prev => {
            const franMap = new Map();
            prev.forEach(f => franMap.set(f.name.toUpperCase().trim(), f));

            cloudStores.forEach(s => {
              const fRaw = (s.franchisee || '').trim();
              if (!fRaw || fRaw.toUpperCase() === 'FRANQUEADO OFICIAL') return;

              const partnerNames = fRaw.split(/[\/•,]/).map(p => p.trim()).filter(Boolean);
              partnerNames.forEach(pName => {
                const up = pName.toUpperCase();
                if (!franMap.has(up)) {
                  franMap.set(up, {
                    id: 'fran-' + Math.random().toString(36).substr(2, 7),
                    name: up,
                    email: (s.email || '').toLowerCase().trim(),
                    phone: formatPhoneNumber(s.phone),
                    assignedStoreIds: [s.id]
                  });
                } else {
                  const existing = franMap.get(up);
                  if (!existing.assignedStoreIds.includes(s.id)) {
                    existing.assignedStoreIds.push(s.id);
                  }
                }
              });
            });

            return Array.from(franMap.values());
          });
        }

        // Fetch Categories
        const { data: cloudCategories } = await supabase.from('categories').select('*');
        if (cloudCategories && cloudCategories.length > 0) {
          setCategories(cloudCategories);
        }

        // Fetch Visits
        const { data: cloudVisits } = await supabase.from('visits').select('*').order('date', { ascending: false });
        if (cloudVisits && cloudVisits.length > 0) {
          const mappedVisits = cloudVisits.map(v => ({
            id: v.id,
            storeId: v.store_id || v.storeId,
            consultantId: v.consultant_id || v.consultantId,
            date: v.date,
            time: v.time,
            endTime: v.end_time || v.endTime || '',
            visitType: v.visit_type || v.visitType,
            generalNotes: v.general_notes || v.generalNotes,
            diagnostics: v.diagnostics || [],
            signatures: v.signatures || null
          }));
          setVisits(mappedVisits);
        }
      } catch (err) {
        console.log('Using local store fallback:', err.message);
      } finally {
        setIsCloudSyncing(false);
      }
    }

    loadFromSupabase();
  }, []);

  // Save to LocalStorage (v2 keys)
  useEffect(() => {
    localStorage.setItem('trigo_stores_v2', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('trigo_consultants_v2', JSON.stringify(consultants));
  }, [consultants]);

  useEffect(() => {
    localStorage.setItem('trigo_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('trigo_visits_v2', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('trigo_regions_v2', JSON.stringify(regions));
  }, [regions]);

  useEffect(() => {
    localStorage.setItem('trigo_franchisees_v4', JSON.stringify(franchisees));
  }, [franchisees]);

  // Toast Helper
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add Visit
  const addVisit = async (visitData) => {
    const newVisit = {
      id: 'visit-' + Date.now(),
      ...visitData
    };
    
    // Update local state immediately
    setVisits(prev => [newVisit, ...prev]);
    showToast('Visita e Plano de Ação registrados com sucesso!');

    // Sync with Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('visits').insert([{
          id: newVisit.id,
          store_id: newVisit.storeId,
          consultant_id: newVisit.consultantId,
          date: newVisit.date,
          time: newVisit.time,
          end_time: newVisit.endTime || null,
          visit_type: newVisit.visitType,
          general_notes: newVisit.generalNotes,
          diagnostics: newVisit.diagnostics,
          signatures: newVisit.signatures || null
        }]);

        // Sync individual action_plans for SQL dashboards & analytics
        if (Array.isArray(newVisit.diagnostics) && newVisit.diagnostics.length > 0) {
          const actionsRows = newVisit.diagnostics
            .filter(d => d.actionPlan && d.actionPlan.what)
            .map(d => ({
              id: 'act-' + (d.id || Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
              visit_id: newVisit.id,
              store_id: newVisit.storeId,
              consultant_id: newVisit.consultantId,
              topic_id: d.categoryId || null,
              subtopic_id: d.subproblemId || null,
              subtopic_title: d.subproblemTitle || d.problem || 'Ação Corretiva',
              severity: d.severity || 'Médio',
              action_what: d.actionPlan.what,
              action_who: d.actionPlan.who,
              deadline: d.actionPlan.deadline,
              status: d.actionPlan.status || 'Não Iniciado',
              notes: d.notes || null,
              photos: d.photos || []
            }));
          if (actionsRows.length > 0) {
            await supabase.from('action_plans').insert(actionsRows);
          }
        }
      } catch (e) {
        console.error('Supabase visit sync error:', e);
      }
    }

    return newVisit;
  };

  // Start editing a visit
  const startEditVisit = (visit) => {
    setEditingVisit(visit);
    setSelectedVisitForReport(null);
    setActiveTab('new-visit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing a visit
  const cancelEditVisit = () => {
    const prevVisit = editingVisit;
    setEditingVisit(null);
    if (prevVisit) {
      setSelectedVisitForReport(prevVisit);
    }
  };

  // Delete Visit
  const deleteVisit = async (visitId) => {
    setVisits(prev => prev.filter(v => v.id !== visitId));
    
    if (selectedVisitForReport && selectedVisitForReport.id === visitId) {
      setSelectedVisitForReport(null);
    }
    if (editingVisit && editingVisit.id === visitId) {
      setEditingVisit(null);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('visits').delete().eq('id', visitId);
        await supabase.from('action_plans').delete().eq('visit_id', visitId);
      } catch (e) {
        console.error('Supabase visit delete error:', e);
      }
    }

    showToast('Relatório de visita excluído com sucesso.');
  };

  // Update Visit (para Edições Completas e Assinaturas Digitais)
  const updateVisit = async (visitId, updatedData) => {
    let updatedObj = null;
    setVisits(prev => {
      return prev.map(v => {
        if (v.id !== visitId) return v;
        updatedObj = {
          ...v,
          ...updatedData
        };
        return updatedObj;
      });
    });

    if (selectedVisitForReport && selectedVisitForReport.id === visitId) {
      setSelectedVisitForReport(prev => ({
        ...prev,
        ...updatedData
      }));
    }

    if (editingVisit && editingVisit.id === visitId) {
      setEditingVisit(null);
      setSelectedVisitForReport(updatedObj);
    }

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase.from('visits').update({
          store_id: updatedObj.storeId,
          consultant_id: updatedObj.consultantId,
          date: updatedObj.date,
          time: updatedObj.time,
          end_time: updatedObj.endTime || null,
          visit_type: updatedObj.visitType,
          signatures: updatedObj.signatures || null,
          general_notes: updatedObj.generalNotes,
          diagnostics: updatedObj.diagnostics
        }).eq('id', visitId);

        // Sync individual action plans
        if (Array.isArray(updatedObj.diagnostics)) {
          await supabase.from('action_plans').delete().eq('visit_id', visitId);
          const actionsRows = updatedObj.diagnostics
            .filter(d => d.actionPlan && d.actionPlan.what)
            .map(d => ({
              id: 'act-' + (d.id || Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
              visit_id: visitId,
              store_id: updatedObj.storeId,
              consultant_id: updatedObj.consultantId,
              topic_id: d.categoryId || null,
              subtopic_id: d.subproblemId || null,
              subtopic_title: d.subproblemTitle || d.problem || 'Ação Corretiva',
              severity: d.severity || 'Médio',
              action_what: d.actionPlan.what,
              action_who: d.actionPlan.who,
              deadline: d.actionPlan.deadline,
              status: d.actionPlan.status || 'Não Iniciado',
              notes: d.notes || null,
              photos: d.photos || []
            }));
          if (actionsRows.length > 0) {
            await supabase.from('action_plans').insert(actionsRows);
          }
        }
      } catch (e) {
        console.error('Supabase visit update error:', e);
      }
    }

    showToast('Relatório de visita atualizado com sucesso!');
    return updatedObj;
  };

  // Update Action Plan Status
  const updateActionPlanStatus = async (visitId, diagnosticId, newStatus) => {
    let updatedVisitObj = null;
    setVisits(prev => {
      return prev.map(visit => {
        if (visit.id !== visitId) return visit;
        const updatedDiagnostics = visit.diagnostics.map(diag => {
          if (diag.id !== diagnosticId) return diag;
          return {
            ...diag,
            actionPlan: {
              ...diag.actionPlan,
              status: newStatus
            }
          };
        });
        updatedVisitObj = {
          ...visit,
          diagnostics: updatedDiagnostics
        };
        return updatedVisitObj;
      });
    });

    if (isSupabaseConfigured && supabase && updatedVisitObj) {
      try {
        await supabase.from('visits').update({
          diagnostics: updatedVisitObj.diagnostics
        }).eq('id', visitId);
      } catch (e) {
        console.error('Supabase update error:', e);
      }
    }

    showToast('Status do Plano de Ação atualizado para: ' + newStatus);
  };

  // Add Staff / Consultant (Equipe Spoleto)
  const addConsultant = async (consultantData) => {
    const isLeadership = consultantData.role && consultantData.role !== 'CONSULTOR';
    const prefix = isLeadership ? 'staff-' : 'cons-';
    const newConsultant = {
      id: prefix + Date.now(),
      name: consultantData.name.toUpperCase().trim(),
      email: (consultantData.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(consultantData.phone),
      region: (consultantData.region || 'Brasil').trim(),
      role: consultantData.role || 'CONSULTOR',
      reportsTo: consultantData.reportsTo || null,
      photoUrl: consultantData.photoUrl || null,
      active: true,
      assignedStores: consultantData.assignedStores || [],
      storesCount: (consultantData.assignedStores || []).length
    };

    setConsultants(prev => [newConsultant, ...prev]);
    showToast(`Membro "${newConsultant.name}" cadastrado com sucesso!`);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').insert([{
          id: newConsultant.id,
          name: newConsultant.name,
          region: newConsultant.region,
          phone: newConsultant.phone,
          email: newConsultant.email,
          role: newConsultant.role,
          reports_to: newConsultant.reportsTo,
          photo_url: newConsultant.photoUrl,
          active: newConsultant.active,
          assigned_stores: newConsultant.assignedStores
        }]);
      } catch (e) {
        console.error('Supabase consultant insert error:', e);
      }
    }

    return newConsultant;
  };

  // Update Staff / Consultant
  const updateConsultant = async (consultantId, updatedData) => {
    let updatedObj = null;
    setConsultants(prev => {
      return prev.map(c => {
        if (c.id !== consultantId) return c;
        updatedObj = {
          ...c,
          name: updatedData.name ? updatedData.name.toUpperCase().trim() : c.name,
          region: updatedData.region !== undefined ? updatedData.region.trim() : c.region,
          email: updatedData.email !== undefined ? updatedData.email.toLowerCase().trim() : (c.email || '').toLowerCase().trim(),
          phone: updatedData.phone !== undefined ? formatPhoneNumber(updatedData.phone) : formatPhoneNumber(c.phone || ''),
          role: updatedData.role !== undefined ? updatedData.role : (c.role || 'CONSULTOR'),
          reportsTo: updatedData.reportsTo !== undefined ? updatedData.reportsTo : c.reportsTo,
          photoUrl: updatedData.photoUrl !== undefined ? updatedData.photoUrl : c.photoUrl,
          active: updatedData.active !== undefined ? updatedData.active : c.active
        };
        return updatedObj;
      });
    });

    if (selectedStaffForProfile && selectedStaffForProfile.id === consultantId) {
      setSelectedStaffForProfile(updatedObj);
    }

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase.from('consultants').update({
          name: updatedObj.name,
          region: updatedObj.region,
          email: updatedObj.email,
          phone: updatedObj.phone,
          role: updatedObj.role,
          reports_to: updatedObj.reportsTo,
          photo_url: updatedObj.photoUrl,
          active: updatedObj.active
        }).eq('id', consultantId);
      } catch (e) {
        console.error('Supabase consultant update error:', e);
      }
    }

    showToast(`Dados de "${updatedObj?.name || 'colaborador'}" atualizados com sucesso!`);
    return updatedObj;
  };

  // Delete Consultant / Staff
  const deleteConsultant = async (consultantId) => {
    setConsultants(prev => prev.filter(c => c.id !== consultantId));
    setStores(prev => prev.map(s => {
      if (s.consultantId === consultantId) {
        return { ...s, consultantId: null };
      }
      return s;
    }));

    if (selectedStaffForProfile && selectedStaffForProfile.id === consultantId) {
      setSelectedStaffForProfile(null);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').delete().eq('id', consultantId);
      } catch (e) {
        console.error('Supabase consultant delete error:', e);
      }
    }

    showToast('Membro removido da equipe com sucesso.');
  };

  // Assign Subordinates to a Leader
  const assignSubordinates = async (leaderId, subordinateIds) => {
    setConsultants(prev => {
      return prev.map(c => {
        if (subordinateIds.includes(c.id)) {
          return { ...c, reportsTo: leaderId };
        } else if (c.reportsTo === leaderId) {
          return { ...c, reportsTo: null };
        }
        return c;
      });
    });

    if (selectedStaffForProfile && selectedStaffForProfile.id === leaderId) {
      setSelectedStaffForProfile(prev => ({ ...prev }));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').update({ reports_to: leaderId }).in('id', subordinateIds);
      } catch (e) {
        console.error('Supabase assign subordinates error:', e);
      }
    }

    showToast('Liderados atualizados com sucesso na hierarquia!');
  };

  // Add Region
  const addRegion = async (newRegionName) => {
    const trimmed = newRegionName.trim();
    if (!trimmed) return false;
    if (regions.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Esta região já está cadastrada.');
      return false;
    }
    setRegions(prev => [...prev, trimmed]);
    showToast(`Região "${trimmed}" adicionada com sucesso!`);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('regions').insert([{ id: 'reg-' + Date.now(), name: trimmed }]);
      } catch (e) {
        console.error('Supabase region insert error:', e);
      }
    }
    return true;
  };

  // Update Region
  const updateRegion = async (oldName, newName) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedOld === trimmedNew) return false;
    
    // Update in regions list
    setRegions(prev => prev.map(r => r === trimmedOld ? trimmedNew : r));
    
    // Also update all consultants who had this region
    setConsultants(prev => prev.map(c => {
      if (c.region === trimmedOld) {
        return { ...c, region: trimmedNew };
      }
      return c;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('regions').update({ name: trimmedNew }).eq('name', trimmedOld);
        await supabase.from('consultants').update({ region: trimmedNew }).eq('region', trimmedOld);
      } catch (e) {
        console.error('Error updating region in Supabase:', e);
      }
    }

    showToast(`Região atualizada para "${trimmedNew}"!`);
    return true;
  };

  // Delete Region
  const deleteRegion = async (regionName) => {
    const trimmed = regionName.trim();
    setRegions(prev => prev.filter(r => r !== trimmed));
    showToast(`Região "${trimmed}" removida.`);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('regions').delete().eq('name', trimmed);
      } catch (e) {
        console.error('Supabase region delete error:', e);
      }
    }
    return true;
  };

  // Add Store
  const addStore = async (storeData) => {
    const newStore = {
      id: 'store-' + Date.now(),
      code: storeData.code.toUpperCase().trim(),
      name: storeData.name.toUpperCase().trim(),
      city: storeData.city || '',
      state: storeData.state || 'SP',
      cep: storeData.cep || '',
      locationType: storeData.locationType || 'Shopping',
      franchisee: (storeData.franchisee || '').toUpperCase().trim(),
      phone: storeData.phone || '',
      email: (storeData.email || '').toLowerCase().trim(),
      address: storeData.address || `${storeData.name} - ${storeData.city}/${storeData.state}`,
      consultantId: storeData.consultantId || null,
      ratingScore: 8.5,
      status: 'Ativa'
    };

    setStores(prev => [newStore, ...prev]);
    if (newStore.consultantId) {
      setConsultants(prev => prev.map(c => {
        if (c.id === newStore.consultantId) {
          const updated = [...(c.assignedStores || []), newStore.id];
          return { ...c, assignedStores: updated, storesCount: updated.length };
        }
        return c;
      }));
    }
    showToast('Nova loja cadastrada com sucesso!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('stores').insert([{
          id: newStore.id,
          code: newStore.code,
          name: newStore.name,
          state: newStore.state,
          city: newStore.city,
          cep: newStore.cep,
          address: newStore.address,
          franchisee: newStore.franchisee,
          location_type: newStore.locationType,
          phone: newStore.phone,
          email: newStore.email,
          consultant_id: newStore.consultantId,
          rating_score: newStore.ratingScore,
          status: newStore.status
        }]);
      } catch (e) {
        console.error('Supabase store insert error:', e);
      }
    }

    return newStore;
  };

  // Update Store
  const updateStore = async (storeId, updatedData) => {
    let updatedObj = null;
    const oldStore = stores.find(s => s.id === storeId);
    const oldConsultantId = oldStore?.consultantId;
    const newConsultantId = updatedData.consultantId || null;

    setStores(prev => {
      return prev.map(s => {
        if (s.id !== storeId) return s;
        updatedObj = {
          ...s,
          code: updatedData.code ? updatedData.code.toUpperCase().trim() : s.code,
          name: updatedData.name ? updatedData.name.toUpperCase().trim() : s.name,
          city: updatedData.city !== undefined ? updatedData.city.trim() : s.city,
          state: updatedData.state || s.state,
          cep: updatedData.cep !== undefined ? updatedData.cep : s.cep,
          locationType: updatedData.locationType || s.locationType,
          franchisee: updatedData.franchisee !== undefined ? updatedData.franchisee.toUpperCase().trim() : s.franchisee,
          phone: updatedData.phone !== undefined ? formatPhoneNumber(updatedData.phone) : s.phone,
          email: updatedData.email !== undefined ? updatedData.email.trim() : s.email,
          address: updatedData.address !== undefined ? updatedData.address.trim() : s.address,
          consultantId: newConsultantId
        };
        return updatedObj;
      });
    });

    // Sync consultant assignment if changed
    if (oldConsultantId !== newConsultantId) {
      setConsultants(prev => prev.map(c => {
        if (c.id === oldConsultantId) {
          const filtered = (c.assignedStores || []).filter(id => id !== storeId);
          return { ...c, assignedStores: filtered, storesCount: filtered.length };
        }
        if (c.id === newConsultantId) {
          const added = Array.from(new Set([...(c.assignedStores || []), storeId]));
          return { ...c, assignedStores: added, storesCount: added.length };
        }
        return c;
      }));
    }

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase.from('stores').update({
          code: updatedObj.code,
          name: updatedObj.name,
          state: updatedObj.state,
          city: updatedObj.city,
          cep: updatedObj.cep,
          address: updatedObj.address,
          franchisee: updatedObj.franchisee,
          location_type: updatedObj.locationType,
          phone: updatedObj.phone,
          email: updatedObj.email,
          consultant_id: updatedObj.consultantId
        }).eq('id', storeId);
      } catch (e) {
        console.error('Supabase store update error:', e);
      }
    }

    showToast('Dados da unidade atualizados com sucesso!');
    return updatedObj;
  };

  // Delete Store
  const deleteStore = async (storeId) => {
    setStores(prev => prev.filter(s => s.id !== storeId));
    setConsultants(prev => prev.map(c => {
      if (c.assignedStores && c.assignedStores.includes(storeId)) {
        const filtered = c.assignedStores.filter(id => id !== storeId);
        return { ...c, assignedStores: filtered, storesCount: filtered.length };
      }
      return c;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('stores').delete().eq('id', storeId);
      } catch (e) {
        console.error('Supabase store delete error:', e);
      }
    }

    showToast('Unidade removida com sucesso.');
  };

  // Assign Stores to Consultant (2-way reactive sync)
  const assignStoresToConsultant = async (consultantId, storeIds) => {
    setConsultants(prev => {
      return prev.map(c => {
        if (c.id === consultantId) {
          return { ...c, assignedStores: storeIds, storesCount: storeIds.length };
        }
        const filtered = (c.assignedStores || []).filter(id => !storeIds.includes(id));
        return {
          ...c,
          assignedStores: filtered,
          storesCount: filtered.length
        };
      });
    });

    setStores(prev => {
      return prev.map(store => {
        if (storeIds.includes(store.id)) {
          return { ...store, consultantId };
        } else if (store.consultantId === consultantId) {
          return { ...store, consultantId: null };
        }
        return store;
      });
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').update({
          assigned_stores: storeIds
        }).eq('id', consultantId);
      } catch (e) {
        console.error('Supabase consultant sync error:', e);
      }
    }

    showToast('Lojas atribuídas com sucesso ao consultor!');
  };

  // Franchisees CRUD (Gestão de Multi-Franqueados / Sócios por Loja)
  const getStoreFranchisees = (storeId) => {
    return franchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(storeId));
  };

  const addFranchisee = async (data) => {
    const newFranchisee = {
      id: 'fran-' + Date.now(),
      name: data.name.toUpperCase().trim(),
      email: (data.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(data.phone),
      assignedStoreIds: data.assignedStoreIds || []
    };

    const nextFranchisees = [newFranchisee, ...franchisees];
    setFranchisees(nextFranchisees);

    // Sincroniza as lojas atribuídas a esse franqueado (preservando multi-franqueados)
    if (newFranchisee.assignedStoreIds.length > 0) {
      setStores(prev => prev.map(s => {
        if (newFranchisee.assignedStoreIds.includes(s.id)) {
          const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(s.id));
          return {
            ...s,
            franchisee: partners.map(p => p.name).join(' / '),
            email: partners.map(p => p.email).filter(Boolean).join(', ') || s.email,
            phone: partners[0]?.phone || s.phone
          };
        }
        return s;
      }));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Salva na tabela dedicada franchisees
        await supabase.from('franchisees').upsert({
          id: newFranchisee.id,
          name: newFranchisee.name,
          email: newFranchisee.email,
          phone: newFranchisee.phone
        });

        // 2. Salva os vínculos na tabela store_franchisees
        if (newFranchisee.assignedStoreIds.length > 0) {
          const links = newFranchisee.assignedStoreIds.map(sId => ({
            store_id: sId,
            franchisee_id: newFranchisee.id
          }));
          await supabase.from('store_franchisees').upsert(links);

          // 3. Atualiza os campos denormalizados na tabela stores
          for (const sId of newFranchisee.assignedStoreIds) {
            const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(sId));
            await supabase.from('stores').update({
              franchisee: partners.map(p => p.name).join(' / '),
              email: partners.map(p => p.email).filter(Boolean).join(', '),
              phone: partners[0]?.phone || ''
            }).eq('id', sId);
          }
        }
      } catch (e) {
        console.error('Erro ao sincronizar franqueado no Supabase:', e);
      }
    }

    showToast(`Franqueado(a) "${newFranchisee.name}" cadastrado(a) com sucesso!`);
    return newFranchisee;
  };

  const updateFranchisee = async (id, data) => {
    let updatedObj = null;
    const newStoreIds = data.assignedStoreIds || [];

    const nextFranchisees = franchisees.map(f => {
      if (f.id !== id) return f;
      updatedObj = {
        ...f,
        name: data.name ? data.name.toUpperCase().trim() : f.name,
        email: data.email !== undefined ? data.email.toLowerCase().trim() : f.email,
        phone: data.phone !== undefined ? formatPhoneNumber(data.phone) : f.phone,
        assignedStoreIds: newStoreIds
      };
      return updatedObj;
    });

    setFranchisees(nextFranchisees);

    // Atualiza as lojas que pertencem a este franqueado e outros sócios
    setStores(prev => prev.map(s => {
      const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(s.id));
      if (partners.length > 0) {
        return {
          ...s,
          franchisee: partners.map(p => p.name).join(' / '),
          email: partners.map(p => p.email).filter(Boolean).join(', ') || s.email,
          phone: partners[0]?.phone || s.phone
        };
      }
      return s;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Atualiza dados do franqueado
        await supabase.from('franchisees').upsert({
          id: id,
          name: updatedObj.name,
          email: updatedObj.email,
          phone: updatedObj.phone
        });

        // 2. Atualiza vínculos de lojas
        await supabase.from('store_franchisees').delete().eq('franchisee_id', id);
        if (newStoreIds.length > 0) {
          const links = newStoreIds.map(sId => ({
            store_id: sId,
            franchisee_id: id
          }));
          await supabase.from('store_franchisees').upsert(links);

          for (const sId of newStoreIds) {
            const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(sId));
            await supabase.from('stores').update({
              franchisee: partners.map(p => p.name).join(' / '),
              email: partners.map(p => p.email).filter(Boolean).join(', '),
              phone: partners[0]?.phone || ''
            }).eq('id', sId);
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar franqueado no Supabase:', e);
      }
    }

    showToast(`Dados do(a) franqueado(a) "${updatedObj?.name}" atualizados com sucesso!`);
    return updatedObj;
  };

  const deleteFranchisee = async (id) => {
    const target = franchisees.find(f => f.id === id);
    const affectedStoreIds = target?.assignedStoreIds || [];
    const nextFranchisees = franchisees.filter(f => f.id !== id);
    setFranchisees(nextFranchisees);

    // Atualiza as lojas recalculando os sócios restantes
    setStores(prev => prev.map(s => {
      const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(s.id));
      if (affectedStoreIds.includes(s.id)) {
        return {
          ...s,
          franchisee: partners.map(p => p.name).join(' / '),
          email: partners.map(p => p.email).filter(Boolean).join(', ') || '',
          phone: partners[0]?.phone || s.phone
        };
      }
      return s;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('store_franchisees').delete().eq('franchisee_id', id);
        await supabase.from('franchisees').delete().eq('id', id);

        if (affectedStoreIds.length > 0) {
          for (const sId of affectedStoreIds) {
            const partners = nextFranchisees.filter(f => f.assignedStoreIds && f.assignedStoreIds.includes(sId));
            await supabase.from('stores').update({
              franchisee: partners.map(p => p.name).join(' / '),
              email: partners.map(p => p.email).filter(Boolean).join(', '),
              phone: partners[0]?.phone || ''
            }).eq('id', sId);
          }
        }
      } catch (e) {
        console.error('Erro ao excluir franqueado no Supabase:', e);
      }
    }

    showToast('Franqueado removido com sucesso.');
  };

  // Category CRUD
  const addCategory = async (categoryData) => {
    const newCategory = {
      id: 'cat-' + Date.now(),
      name: categoryData.name.toUpperCase().trim(),
      icon: 'Settings2',
      color: '#5D3826',
      description: categoryData.description || 'Tema cadastrado pelo gestor.',
      subproblems: []
    };

    setCategories(prev => [...prev, newCategory]);
    showToast('Novo Tema Principal adicionado!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').insert([newCategory]);
      } catch (e) {
        console.error('Supabase cat insert error:', e);
      }
    }

    return newCategory;
  };

  const updateCategory = async (categoryId, updatedData) => {
    let updatedCat = null;
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        updatedCat = {
          ...cat,
          name: updatedData.name ? updatedData.name.toUpperCase().trim() : cat.name,
          description: updatedData.description !== undefined ? updatedData.description : cat.description
        };
        return updatedCat;
      });
    });

    if (isSupabaseConfigured && supabase && updatedCat) {
      try {
        await supabase.from('categories').update({
          name: updatedCat.name,
          description: updatedCat.description
        }).eq('id', categoryId);
      } catch (e) {
        console.error('Supabase cat update error:', e);
      }
    }

    showToast('Tema Principal atualizado com sucesso!');
  };

  const deleteCategory = async (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', categoryId);
      } catch (e) {
        console.error('Supabase cat delete error:', e);
      }
    }
    showToast('Tema Principal removido da matriz.');
  };

  const addSubproblem = async (categoryId, title, defaultSeverity = 'Alta', suggestedActions = []) => {
    const actionsArray = Array.isArray(suggestedActions) 
      ? suggestedActions.filter(a => typeof a === 'string' && a.trim().length > 0)
      : [suggestedActions].filter(Boolean);

    const newSubproblem = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      defaultSeverity,
      suggestedActions: actionsArray.length > 0 ? actionsArray : ['Definir plano de ação na visita técnica.']
    };

    let updatedCat = null;
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        updatedCat = {
          ...cat,
          subproblems: [...(cat.subproblems || []), newSubproblem]
        };
        return updatedCat;
      });
    });

    if (isSupabaseConfigured && supabase && updatedCat) {
      try {
        await supabase.from('categories').update({
          subproblems: updatedCat.subproblems
        }).eq('id', categoryId);
      } catch (e) {
        console.error('Supabase sub add error:', e);
      }
    }

    showToast('Novo Subtópico cadastrado com sucesso!');
    return newSubproblem;
  };

  const updateSubproblem = async (categoryId, subproblemId, updatedData) => {
    let updatedCat = null;
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        const updatedSubs = cat.subproblems.map(sub => {
          if (sub.id !== subproblemId) return sub;
          return {
            ...sub,
            title: updatedData.title || sub.title,
            defaultSeverity: updatedData.defaultSeverity || sub.defaultSeverity,
            suggestedActions: updatedData.suggestedActions || sub.suggestedActions
          };
        });
        updatedCat = {
          ...cat,
          subproblems: updatedSubs
        };
        return updatedCat;
      });
    });

    if (isSupabaseConfigured && supabase && updatedCat) {
      try {
        await supabase.from('categories').update({
          subproblems: updatedCat.subproblems
        }).eq('id', categoryId);
      } catch (e) {
        console.error('Supabase sub update error:', e);
      }
    }

    showToast('Subtópico atualizado com sucesso!');
  };

  const deleteSubproblem = async (categoryId, subproblemId) => {
    let updatedCat = null;
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        updatedCat = {
          ...cat,
          subproblems: cat.subproblems.filter(s => s.id !== subproblemId)
        };
        return updatedCat;
      });
    });

    if (isSupabaseConfigured && supabase && updatedCat) {
      try {
        await supabase.from('categories').update({
          subproblems: updatedCat.subproblems
        }).eq('id', categoryId);
      } catch (e) {
        console.error('Supabase sub delete error:', e);
      }
    }

    showToast('Subtópico removido da matriz.');
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    if (confirm('Deseja restaurar os dados de demonstração com as 409 unidades Spoleto?')) {
      localStorage.clear();
      setStores(INITIAL_STORES);
      setConsultants(INITIAL_CONSULTANTS);
      setCategories(INITIAL_CATEGORIES);
      setVisits(INITIAL_VISITS);
      showToast('Dados restaurados para o padrão com sucesso!');
    }
  };

  // Ordenação Alfabética Automática A-Z
  const sortedCategories = [...categories].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
  );

  const sortedConsultants = [...consultants].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
  );

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      stores,
      consultants: sortedConsultants,
      categories: sortedCategories,
      visits,
      selectedVisitForReport,
      setSelectedVisitForReport,
      editingVisit,
      setEditingVisit,
      startEditVisit,
      cancelEditVisit,
      deleteVisit,
      selectedStaffForProfile,
      setSelectedStaffForProfile,
      selectedStoreForProfile,
      setSelectedStoreForProfile,
      isOverdueModalOpen,
      setIsOverdueModalOpen,
      managingSubordinatesLeader,
      setManagingSubordinatesLeader,
      toastMessage,
      showToast,
      addVisit,
      updateVisit,
      updateActionPlanStatus,
      assignStoresToConsultant,
      addConsultant,
      updateConsultant,
      deleteConsultant,
      assignSubordinates,
      regions,
      addRegion,
      updateRegion,
      deleteRegion,
      addStore,
      updateStore,
      deleteStore,
      franchisees,
      getStoreFranchisees,
      addFranchisee,
      updateFranchisee,
      deleteFranchisee,
      addCategory,
      updateCategory,
      deleteCategory,
      addSubproblem,
      updateSubproblem,
      deleteSubproblem,
      resetToDemoData,
      isCloudSyncing
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
}
