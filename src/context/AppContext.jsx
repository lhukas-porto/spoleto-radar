import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_STORES, 
  INITIAL_CONSULTANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_VISITS 
} from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States (Local + Cloud Sincronizado)
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('trigo_stores');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate to new official stores if old mock assignments were present
      if (parsed.length >= 400 && parsed.some(s => s.consultantId === 'cons-1' && s.name.includes('MAG SHOPPING'))) return parsed;
    }
    return INITIAL_STORES;
  });

  const [consultants, setConsultants] = useState(() => {
    const saved = localStorage.getItem('trigo_consultants');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate if old 5 mock consultants
      if (parsed.length >= 16) return parsed;
    }
    return INITIAL_CONSULTANTS;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('trigo_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length >= 18) return parsed;
    }
    return INITIAL_CATEGORIES;
  });

  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem('trigo_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
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
            visitType: v.visit_type || v.visitType,
            generalNotes: v.general_notes || v.generalNotes,
            diagnostics: v.diagnostics || []
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

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('trigo_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('trigo_consultants', JSON.stringify(consultants));
  }, [consultants]);

  useEffect(() => {
    localStorage.setItem('trigo_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('trigo_visits', JSON.stringify(visits));
  }, [visits]);

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
          visit_type: newVisit.visitType,
          general_notes: newVisit.generalNotes,
          diagnostics: newVisit.diagnostics
        }]);
      } catch (e) {
        console.error('Supabase visit sync error:', e);
      }
    }

    return newVisit;
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
      email: consultantData.email.trim(),
      phone: consultantData.phone || '',
      region: consultantData.region || 'Brasil',
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

    showToast('Novo Subproblema cadastrado com sucesso!');
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

    showToast('Subproblema atualizado com sucesso!');
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

    showToast('Subproblema removido da matriz.');
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

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      stores,
      consultants,
      categories,
      visits,
      selectedVisitForReport,
      setSelectedVisitForReport,
      toastMessage,
      showToast,
      addVisit,
      updateActionPlanStatus,
      assignStoresToConsultant,
      addConsultant,
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
