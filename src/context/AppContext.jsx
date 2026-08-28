import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CONSULTANTS, INITIAL_STORES, INITIAL_CATEGORIES, INITIAL_VISITS } from '../data/initialData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [consultants, setConsultants] = useState(() => {
    const saved = localStorage.getItem('trigo_consultants');
    return saved ? JSON.parse(saved) : INITIAL_CONSULTANTS;
  });

  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('trigo_stores');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length < 50) return INITIAL_STORES;
      return parsed;
    }
    return INITIAL_STORES;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('trigo_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length < 18) {
        return INITIAL_CATEGORIES;
      }
      return parsed;
    }
    return INITIAL_CATEGORIES;
  });

  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem('trigo_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedVisitForReport, setSelectedVisitForReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('trigo_consultants', JSON.stringify(consultants));
  }, [consultants]);

  useEffect(() => {
    localStorage.setItem('trigo_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('trigo_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('trigo_visits', JSON.stringify(visits));
  }, [visits]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addVisit = (newVisit) => {
    const visitWithId = {
      ...newVisit,
      id: 'vis-' + Date.now(),
      status: 'Finalizada'
    };
    setVisits(prev => [visitWithId, ...prev]);
    showToast('Visita e Plano de Ação registrados com sucesso!');
    return visitWithId;
  };

  const updateActionPlanStatus = (visitId, diagId, newStatus) => {
    setVisits(prevVisits => {
      return prevVisits.map(visit => {
        if (visit.id !== visitId) return visit;
        const updatedDiagnostics = visit.diagnostics.map(diag => {
          if (diag.id !== diagId) return diag;
          return {
            ...diag,
            actionPlan: {
              ...diag.actionPlan,
              status: newStatus
            }
          };
        });
        return {
          ...visit,
          diagnostics: updatedDiagnostics
        };
      });
    });
    showToast('Status do Plano de Ação atualizado para ' + newStatus);
  };

  const addStore = (storeData) => {
    const newStore = {
      ...storeData,
      id: 'store-' + Date.now(),
      ratingScore: 9.0,
      status: 'Ativa'
    };
    setStores(prev => [newStore, ...prev]);
    showToast('Nova loja ' + newStore.name + ' cadastrada com sucesso!');
  };

  const addConsultant = (consData) => {
    const newCons = {
      ...consData,
      id: 'cons-' + Date.now(),
      active: true,
      storesCount: 0
    };
    setConsultants(prev => [...prev, newCons]);
    showToast('Consultor(a) ' + newCons.name + ' cadastrado(a) com sucesso!');
  };

      const updateCategory = (categoryId, updatedData) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          name: updatedData.name ? updatedData.name.toUpperCase().trim() : cat.name,
          description: updatedData.description !== undefined ? updatedData.description : cat.description
        };
      });
    });
    showToast('Tema Principal atualizado com sucesso!');
  };

  const deleteCategory = (categoryId) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    showToast('Tema Principal removido da matriz.');
  };

  const updateSubproblem = (categoryId, subproblemId, updatedData) => {
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
        return {
          ...cat,
          subproblems: updatedSubs
        };
      });
    });
    showToast('Subproblema atualizado com sucesso!');
  };

  const deleteSubproblem = (categoryId, subproblemId) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subproblems: cat.subproblems.filter(s => s.id !== subproblemId)
        };
      });
    });
    showToast('Subproblema removido da matriz.');
  };

  const addCategory = (categoryData) => {
    const newCategory = {
      id: 'cat-' + Date.now(),
      name: categoryData.name.toUpperCase().trim(),
      description: categoryData.description || 'Tema e causa operacional da rede Spoleto',
      icon: 'Tag',
      color: '#C8102E',
      subproblems: categoryData.subproblems || [
        {
          id: 'sub-' + Date.now(),
          title: categoryData.firstSubTitle || 'Não-conformidade padrão em loja',
          defaultSeverity: categoryData.firstSubSeverity || 'Alta',
          suggestedActions: [
            categoryData.firstAction1 || 'Definir plano de ação corretivo e alinhar com o Franqueado.',
            categoryData.firstAction2 || 'Treinar a equipe no padrão operacional do Grupo Trigo.',
            categoryData.firstAction3 || 'Acompanhar a evolução na próxima visita de rotina.'
          ]
        }
      ]
    };

    setCategories(prev => [...prev, newCategory]);
    showToast('Novo Tema Principal "' + newCategory.name + '" cadastrado com sucesso!');
    return newCategory;
  };

  const addSubproblem = (categoryId, title, defaultSeverity, suggestedAction) => {
    setCategories(prev => {
      return prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        const newSub = {
          id: 'sub-' + Date.now(),
          title,
          defaultSeverity,
          suggestedActions: [suggestedAction]
        };
        return {
          ...cat,
          subproblems: [...cat.subproblems, newSub]
        };
      });
    });
    showToast('Novo subproblema adicionado à taxonomia!');
  };

    // Assign multiple stores to a consultant (Tick/Untick)
  const assignStoresToConsultant = (consultantId, selectedStoreIds) => {
    setStores(prevStores => {
      return prevStores.map(store => {
        const isSelectedForThisCons = selectedStoreIds.includes(store.id);
        if (isSelectedForThisCons) {
          return { ...store, consultantId };
        } else if (store.consultantId === consultantId) {
          // unassign
          return { ...store, consultantId: '' };
        }
        return store;
      });
    });
    const cons = consultants.find(c => c.id === consultantId);
    showToast('Carteira de ' + (cons?.name || 'consultor') + ' atualizada com sucesso (' + selectedStoreIds.length + ' lojas)!');
  };

  const resetToDemoData = () => {
    setConsultants(INITIAL_CONSULTANTS);
    setStores(INITIAL_STORES);
    setCategories(INITIAL_CATEGORIES);
    setVisits(INITIAL_VISITS);
    showToast('Dados restaurados para o padrão de demonstração Spoleto!');
  };

  return (
    <AppContext.Provider value={{
      consultants,
      stores,
      categories,
      visits,
      activeTab,
      setActiveTab,
      selectedVisitForReport,
      setSelectedVisitForReport,
      toastMessage,
      showToast,
      addVisit,
      updateActionPlanStatus,
      addStore,
      addConsultant,
      addSubproblem,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSubproblem,
      deleteSubproblem,
      resetToDemoData,
      assignStoresToConsultant
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
