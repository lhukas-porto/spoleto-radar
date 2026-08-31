import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_STORES, 
  INITIAL_CONSULTANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_VISITS,
  INITIAL_REGIONS
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AppContext = createContext();

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
        if (parsed.length >= 400 && parsed.some(s => s.consultantId === 'cons-1')) return parsed;
      } catch (e) {}
    }
    return INITIAL_STORES;
  });

  const [consultants, setConsultants] = useState(() => {
    const saved = localStorage.getItem('trigo_consultants_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length >= 16 && parsed.some(c => c.assignedStores && c.assignedStores.length > 0)) return parsed;
      } catch (e) {}
    }
    return INITIAL_CONSULTANTS;
  });

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

  const [selectedVisitForReport, setSelectedVisitForReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Load from Supabase on start if available
  useEffect(() => {
    async function loadFromSupabase() {
      if (!isSupabaseConfigured || !supabase) return;
      setIsCloudSyncing(true);
      try {
        // Fetch Consultants
        const { data: cloudConsultants } = await supabase.from('consultants').select('*');
        let mappedConsultants = null;
        if (cloudConsultants && cloudConsultants.length > 0) {
          mappedConsultants = cloudConsultants.map(c => ({
            id: c.id,
            name: c.name,
            region: c.region,
            phone: c.phone,
            email: c.email,
            assignedStores: c.assigned_stores || c.assignedStores || [],
            storesCount: (c.assigned_stores || c.assignedStores || []).length,
            active: true
          }));
          setConsultants(mappedConsultants);
        }

        // Fetch Stores
        const { data: cloudStores } = await supabase.from('stores').select('*');
        if (cloudStores && cloudStores.length > 0) {
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
              locationType: s.location_type || s.locationType || 'Shopping',
              address: `${s.name} - ${s.city}/${s.state}`,
              phone: s.phone || '',
              email: s.email || '',
              consultantId: matchedConsId || s.consultantId || null,
              ratingScore: s.ratingScore || 8.5,
              status: s.status || 'Ativa'
            };
          });
          setStores(mappedStores);
        }

        // Fetch Categories
        const { data: cloudCategories } = await supabase.from('categories').select('*');
        if (cloudCategories && cloudCategories.length > 0) {
          const cloudIds = new Set(cloudCategories.map(c => c.id));
          const missingDefaults = INITIAL_CATEGORIES.filter(c => !cloudIds.has(c.id));
          setCategories([...cloudCategories, ...missingDefaults]);
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
      } catch (e) {
        console.error('Supabase visit sync error:', e);
      }
    }

    return newVisit;
  };

  // Update Visit (para Assinaturas Digitais e Edições)
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

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase.from('visits').update({
          signatures: updatedObj.signatures || null,
          general_notes: updatedObj.generalNotes,
          diagnostics: updatedObj.diagnostics
        }).eq('id', visitId);
      } catch (e) {
        console.error('Supabase visit update error:', e);
      }
    }

    showToast('Assinaturas salvas no laudo com sucesso!');
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

  // Add Consultant
  const addConsultant = async (consultantData) => {
    const newConsultant = {
      id: 'cons-' + Date.now(),
      name: consultantData.name.toUpperCase().trim(),
      email: (consultantData.email || '').trim(),
      phone: (consultantData.phone || '').trim(),
      region: (consultantData.region || 'Brasil').trim(),
      active: true,
      assignedStores: [],
      storesCount: 0
    };

    setConsultants(prev => [newConsultant, ...prev]);
    showToast('Consultor cadastrado com sucesso!');

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').insert([{
          id: newConsultant.id,
          name: newConsultant.name,
          region: newConsultant.region,
          phone: newConsultant.phone,
          email: newConsultant.email,
          assigned_stores: []
        }]);
      } catch (e) {
        console.error('Supabase consultant insert error:', e);
      }
    }

    return newConsultant;
  };

  // Update Consultant
  const updateConsultant = async (consultantId, updatedData) => {
    let updatedObj = null;
    setConsultants(prev => {
      return prev.map(c => {
        if (c.id !== consultantId) return c;
        updatedObj = {
          ...c,
          name: updatedData.name ? updatedData.name.toUpperCase().trim() : c.name,
          region: updatedData.region !== undefined ? updatedData.region.trim() : c.region,
          email: updatedData.email !== undefined ? updatedData.email.trim() : (c.email || ''),
          phone: updatedData.phone !== undefined ? updatedData.phone.trim() : (c.phone || ''),
          active: updatedData.active !== undefined ? updatedData.active : c.active
        };
        return updatedObj;
      });
    });

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase.from('consultants').update({
          name: updatedObj.name,
          region: updatedObj.region,
          email: updatedObj.email,
          phone: updatedObj.phone
        }).eq('id', consultantId);
      } catch (e) {
        console.error('Supabase consultant update error:', e);
      }
    }

    showToast('Dados do consultor atualizados com sucesso!');
    return updatedObj;
  };

  // Delete Consultant
  const deleteConsultant = async (consultantId) => {
    setConsultants(prev => prev.filter(c => c.id !== consultantId));
    setStores(prev => prev.map(s => {
      if (s.consultantId === consultantId) {
        return { ...s, consultantId: null };
      }
      return s;
    }));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consultants').delete().eq('id', consultantId);
      } catch (e) {
        console.error('Supabase consultant delete error:', e);
      }
    }

    showToast('Consultor removido com sucesso.');
  };

  // Add Region
  const addRegion = (newRegionName) => {
    const trimmed = newRegionName.trim();
    if (!trimmed) return false;
    if (regions.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Esta região já está cadastrada.');
      return false;
    }
    setRegions(prev => [...prev, trimmed]);
    showToast(`Região "${trimmed}" adicionada com sucesso!`);
    return true;
  };

  // Update Region
  const updateRegion = (oldName, newName) => {
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
      supabase.from('consultants').update({ region: trimmedNew }).eq('region', trimmedOld)
        .then(() => {})
        .catch(e => console.error('Error updating region in Supabase:', e));
    }

    showToast(`Região atualizada para "${trimmedNew}"!`);
    return true;
  };

  // Delete Region
  const deleteRegion = (regionName) => {
    const trimmed = regionName.trim();
    setRegions(prev => prev.filter(r => r !== trimmed));
    showToast(`Região "${trimmed}" removida.`);
    return true;
  };

  // Add Store
  const addStore = async (storeData) => {
    const newStore = {
      id: 'store-' + Date.now(),
      code: storeData.code.toUpperCase().trim(),
      name: storeData.name.toUpperCase().trim(),
      city: storeData.city || '',
      state: storeData.state || 'RJ',
      locationType: storeData.locationType || 'Shopping',
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
          location_type: newStore.locationType
        }]);
      } catch (e) {
        console.error('Supabase store insert error:', e);
      }
    }

    return newStore;
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

  const addSubproblem = async (categoryId, title, defaultSeverity = 'Alta', suggestedAction = '') => {
    const newSubproblem = {
      id: 'sub-' + Date.now(),
      title,
      defaultSeverity,
      suggestedActions: [suggestedAction || 'Definir plano de ação na visita técnica.']
    };

    let updatedCat = null;
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        updatedCat = {
          ...cat,
          subproblems: [...cat.subproblems, newSubproblem]
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
      toastMessage,
      showToast,
      addVisit,
      updateVisit,
      updateActionPlanStatus,
      assignStoresToConsultant,
      addConsultant,
      updateConsultant,
      deleteConsultant,
      regions,
      addRegion,
      updateRegion,
      deleteRegion,
      addStore,
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
