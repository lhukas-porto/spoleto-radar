import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  INITIAL_STORES, 
  INITIAL_CONSULTANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_VISITS,
  INITIAL_REGIONS,
  INITIAL_INTERNAL_AREAS
} from '../data/initialData';
import { INITIAL_DOCUMENTS } from '../data/initialDocuments';
import { DEFAULT_MODULES, DEFAULT_ROLES } from '../data/initialPermissions';
import { INITIAL_WORK_SHIFTS } from '../data/initialWorkShifts';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { formatCEP } from '../utils/brazilianLocations';

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(st => ({
            ...st,
            code: (st.code || '').toUpperCase().trim(),
            name: (st.name || '').toUpperCase().trim(),
            franchisee: (st.franchisee || '').toUpperCase().trim(),
            shoppingMallAdmin: (st.shoppingMallAdmin || '').toUpperCase().trim(),
            email: (st.email || '').toLowerCase().trim(),
            phone: formatPhoneNumber(st.phone),
            cep: formatCEP(st.cep),
            workShift: st.workShift || '6x1'
          }));
        }
      } catch (e) {}
    }
    return INITIAL_STORES.map(st => ({
      ...st,
      code: (st.code || '').toUpperCase().trim(),
      name: (st.name || '').toUpperCase().trim(),
      franchisee: (st.franchisee || '').toUpperCase().trim(),
      shoppingMallAdmin: (st.shoppingMallAdmin || '').toUpperCase().trim(),
      email: (st.email || '').toLowerCase().trim(),
      phone: formatPhoneNumber(st.phone),
      cep: formatCEP(st.cep),
      workShift: st.workShift || '6x1'
    }));
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
        if (parsed.length >= 18) {
          // Atualiza denominação consultiva caso ainda esteja com termo antigo
          return parsed.map(c => {
            if (c.id === 'cat-qa' && c.name?.includes('AUDITORIA')) {
              return { ...c, name: 'Q.A (PADRÃO DE QUALIDADE & EXCELÊNCIA)' };
            }
            return c;
          });
        }
      } catch (e) {}
    }
    return INITIAL_CATEGORIES;
  });

  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem('trigo_visits_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(v => {
            if (v.visitType === 'Auditoria de Rotina') return { ...v, visitType: 'Visita agendada' };
            if (v.visitType === 'Auditoria Crítica') return { ...v, visitType: 'Diagnóstico Prioritário' };
            if (v.visitType === 'Auditoria de Acompanhamento') return { ...v, visitType: 'Visita de Acompanhamento' };
            return v;
          });
        }
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

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('spoleto_documents_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_DOCUMENTS;
  });

  const [turnoverRecords, setTurnoverRecords] = useState(() => {
    const saved = localStorage.getItem('spoleto_turnover_records_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    // Dados iniciais de demonstração para unidades modelo
    return [
      {
        id: 'turn-demo-1',
        storeId: 'store-1',
        monthYear: '2026-08',
        activeHeadcount: 12,
        departures: 1,
        admissions: 1,
        turnoverRate: 8.3,
        notes: 'Equipe estável. Apenas 1 reposição de atendente de balcão.',
        updatedAt: '2026-08-25'
      },
      {
        id: 'turn-demo-2',
        storeId: 'store-1',
        monthYear: '2026-07',
        activeHeadcount: 12,
        departures: 0,
        admissions: 0,
        turnoverRate: 0,
        notes: 'Mês perfeito sem nenhuma saída na operação.',
        updatedAt: '2026-07-28'
      },
      {
        id: 'turn-demo-3',
        storeId: 'store-5',
        monthYear: '2026-08',
        activeHeadcount: 10,
        departures: 2,
        admissions: 1,
        turnoverRate: 20.0,
        notes: 'Saída de 2 cozinheiros gerando gargalo no tempo de cocção.',
        updatedAt: '2026-08-20'
      }
    ];
  });

  // Persiste turnover
  useEffect(() => {
    try {
      localStorage.setItem('spoleto_turnover_records_v1', JSON.stringify(turnoverRecords));
    } catch (e) {}
  }, [turnoverRecords]);

  const addTurnoverRecord = (record) => {
    setTurnoverRecords(prev => {
      // Remove duplicidade do mesmo mês para a mesma loja caso já exista
      const filtered = prev.filter(r => !(r.storeId === record.storeId && r.monthYear === record.monthYear));
      return [record, ...filtered];
    });
    showToast('✅ Quadro de colaboradores e turnover atualizados com sucesso!');
  };

  const deleteTurnoverRecord = (recordId) => {
    setTurnoverRecords(prev => prev.filter(r => r.id !== recordId));
    showToast('Registro de turnover removido.');
  };

  // Áreas Internas da Franqueadora Spoleto
  const [internalAreas, setInternalAreas] = useState(() => {
    const saved = localStorage.getItem('spoleto_internal_areas_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_INTERNAL_AREAS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('spoleto_internal_areas_v1', JSON.stringify(internalAreas));
    } catch (e) {}
  }, [internalAreas]);

  const addInternalArea = (newArea) => {
    const areaObj = typeof newArea === 'string' 
      ? { id: 'area-' + Date.now(), name: newArea.toUpperCase().trim(), description: 'Área da Franqueadora' }
      : { id: 'area-' + Date.now(), ...newArea, name: (newArea.name || '').toUpperCase().trim() };

    setInternalAreas(prev => [...prev, areaObj]);
    showToast(`Área interna "${areaObj.name}" adicionada.`);
  };

  const updateInternalArea = (areaId, updatedData) => {
    setInternalAreas(prev => prev.map(a => {
      if (a.id !== areaId) return a;
      return {
        ...a,
        ...updatedData,
        name: (updatedData.name || a.name || '').toUpperCase().trim()
      };
    }));
    showToast('Área interna atualizada com sucesso!');
  };

  const deleteInternalArea = (areaId) => {
    setInternalAreas(prev => prev.filter(a => a.id !== areaId));
    showToast('Área interna removida.');
  };

  // Escalas de Trabalho dos Colaboradores da Rede Spoleto
  const [workShifts, setWorkShifts] = useState(() => {
    const saved = localStorage.getItem('spoleto_work_shifts_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_WORK_SHIFTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('spoleto_work_shifts_v1', JSON.stringify(workShifts));
    } catch (e) {}
  }, [workShifts]);

  const addWorkShift = (newShift) => {
    const shiftObj = {
      id: 'shift-' + Date.now(),
      name: (newShift.name || '').trim(),
      label: (newShift.label || newShift.name || '').trim(),
      description: (newShift.description || 'Escala operacional de colaboradores').trim(),
      badgeBg: newShift.badgeBg || '#F3F4F6',
      badgeColor: newShift.badgeColor || '#374151',
      badgeBorder: newShift.badgeBorder || '#E5E7EB'
    };

    setWorkShifts(prev => [...prev, shiftObj]);
    showToast(`Escala "${shiftObj.name}" adicionada com sucesso!`);
  };

  const updateWorkShift = (shiftId, updatedData) => {
    setWorkShifts(prev => prev.map(s => {
      if (s.id !== shiftId) return s;
      return {
        ...s,
        ...updatedData,
        name: (updatedData.name || s.name || '').trim(),
        label: (updatedData.label || updatedData.name || s.label || s.name || '').trim(),
        description: (updatedData.description || s.description || '').trim()
      };
    }));
    showToast('Escala de colaboradores atualizada com sucesso!');
  };

  const deleteWorkShift = (shiftId) => {
    const shift = workShifts.find(s => s.id === shiftId);
    if (!shift) return;

    // Protege exclusão se houver lojas atreladas
    const countUsing = stores.filter(st => st.workShift === shift.name).length;
    if (countUsing > 0) {
      showToast(`Não é possível excluir a escala "${shift.name}" pois ${countUsing} loja(s) estão utilizando ela.`, 'error');
      return false;
    }

    setWorkShifts(prev => prev.filter(s => s.id !== shiftId));
    showToast(`Escala "${shift.name}" removida com sucesso.`);
    return true;
  };

  // Persiste documentos
  useEffect(() => {
    try {
      localStorage.setItem('spoleto_documents_v1', JSON.stringify(documents));
    } catch (e) {}
  }, [documents]);

  const [isRepositoryOpen, setIsRepositoryOpen] = useState(false);

  const addDocument = (newDoc) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  const deleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // ==========================================
  // PERMISSÕES & CONTROLE DE ACESSO (RBAC)
  // ==========================================
  const [permissionsModules, setPermissionsModules] = useState(() => {
    const saved = localStorage.getItem('spoleto_permissions_modules_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garante que módulos novos (como settings_work_shifts) sejam incorporados automaticamente
          const existingIds = new Set(parsed.map(m => m.id));
          const missingModules = DEFAULT_MODULES.filter(m => !existingIds.has(m.id));
          if (missingModules.length > 0) {
            return [...parsed, ...missingModules];
          }
          return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_MODULES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('spoleto_permissions_modules_v1', JSON.stringify(permissionsModules));
    } catch (e) {}
  }, [permissionsModules]);

  const updateRolePermission = (moduleId, roleId, enabled) => {
    setPermissionsModules(prev => prev.map(mod => {
      if (mod.id !== moduleId) return mod;
      return {
        ...mod,
        permissions: {
          ...mod.permissions,
          [roleId]: {
            ...(mod.permissions?.[roleId] || {}),
            enabled: !!enabled
          }
        }
      };
    }));
  };

  const resetPermissionsToDefault = () => {
    setPermissionsModules(DEFAULT_MODULES);
    try {
      localStorage.removeItem('spoleto_permissions_modules_v1');
    } catch (e) {}
    showToast('Permissões restauradas para o padrão oficial Spoleto.');
  };

  // Estado que indica se o modo Administrador Master foi desbloqueado (ex: 3 cliques no copyright do rodapé)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return localStorage.getItem('spoleto_admin_unlocked_v1') === 'true';
  });

  const toggleAdminUnlock = (forceState) => {
    setIsAdminUnlocked(prev => {
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      try {
        localStorage.setItem('spoleto_admin_unlocked_v1', String(next));
      } catch (e) {}
      if (next) {
        showToast('🔓 Modo Administrador Master ATIVADO! Aba de permissões liberada em Configurações.');
      } else {
        showToast('🔒 Modo Administrador ocultado com sucesso.');
      }
      return next;
    });
  };

  // Função de verificação dinâmica de permissão por módulo para o perfil ativo ou cargo específico
  const hasPermission = (moduleId, checkRole = null) => {
    const targetRole = checkRole || simulatedRole;
    if (targetRole === 'ADMIN') return true;

    const moduleDef = (permissionsModules || []).find(m => m.id === moduleId);
    if (!moduleDef || !moduleDef.permissions) return true;

    const perm = moduleDef.permissions[targetRole];
    if (!perm) return true;
    return !!perm.enabled;
  };

  // ==========================================
  // HIERARQUIA & SIMULADOR DE PERFIS ("VER COMO...")
  // Roles: 'ADMIN' | 'DIRETORIA' | 'GERENTE_NACIONAL' | 'GERENTE_REGIONAL' | 'CONSULTOR'
  // ==========================================
  const [simulatedRole, setSimulatedRole] = useState(() => {
    const saved = localStorage.getItem('spoleto_simulated_role_v1');
    if (saved && saved !== 'ADMIN') return saved;
    return 'DIRETORIA';
  });

  const [simulatedUserId, setSimulatedUserId] = useState(() => {
    return localStorage.getItem('spoleto_simulated_user_id_v1') || '';
  });

  useEffect(() => {
    try {
      localStorage.setItem('spoleto_simulated_role_v1', simulatedRole);
      localStorage.setItem('spoleto_simulated_user_id_v1', simulatedUserId);
    } catch (e) {}
  }, [simulatedRole, simulatedUserId]);

  const changeSimulatedProfile = (newRole, newUserId = '') => {
    setSimulatedRole(newRole);
    setSimulatedUserId(newUserId);
    
    // Se o usuário atual não tiver permissão para configurações e estiver nela, redireciona para o dashboard
    if (['CONSULTOR', 'GERENTE_REGIONAL'].includes(newRole) && (activeTab === 'taxonomy' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }

    const roleNames = {
      ADMIN: 'Administrador (Acesso Total)',
      DIRETORIA: 'Diretoria (Nacional)',
      GERENTE_NACIONAL: 'Gerência Nacional',
      GERENTE_REGIONAL: 'Gerente Regional',
      CONSULTOR: 'Consultor(a) de Negócios'
    };
    showToast(`👁️ Modo simulador: ${roleNames[newRole] || newRole}`);
  };

  // Usuário atualmente ativo no simulador
  const activeUser = React.useMemo(() => {
    if (simulatedRole === 'ADMIN') {
      return { id: 'admin-1', name: 'ADMINISTRADOR DO SISTEMA', role: 'ADMIN', region: 'Nacional / Brasil' };
    }
    if (simulatedRole === 'DIRETORIA') {
      const director = consultants.find(c => c.role === 'DIRETORIA') || consultants.find(c => c.id === 'staff-1788284716654');
      return director || { id: 'staff-dir', name: 'RAFAEL PARDO', role: 'DIRETORIA', region: 'Nacional / Brasil' };
    }
    if (simulatedRole === 'GERENTE_NACIONAL') {
      const gn = consultants.find(c => c.role === 'GERENTE_NACIONAL') || consultants.find(c => c.id === 'staff-1788278683147');
      return gn || { id: 'staff-gn', name: 'LILIANE TAHAN CURY TEIXEIRA DE RESENDE', role: 'GERENTE_NACIONAL', region: 'Nacional / Brasil' };
    }
    if (simulatedRole === 'GERENTE_REGIONAL') {
      const grs = consultants.filter(c => c.role === 'GERENTE_REGIONAL');
      const found = grs.find(c => c.id === simulatedUserId) || grs[0];
      return found || { id: 'staff-gr-default', name: 'GERENTE REGIONAL', role: 'GERENTE_REGIONAL', region: 'SP Capital, Campinas & Região' };
    }
    if (simulatedRole === 'CONSULTOR') {
      const consList = consultants.filter(c => (c.role || 'CONSULTOR') === 'CONSULTOR');
      const found = consList.find(c => c.id === simulatedUserId) || consList[0];
      return found || { id: 'cons-default', name: 'CONSULTOR SPOLETO', role: 'CONSULTOR', region: 'Brasil' };
    }
    return { id: 'admin-1', name: 'ADMINISTRADOR', role: 'ADMIN' };
  }, [simulatedRole, simulatedUserId, consultants]);

  // Permissão para abrir a aba Configurações (Baseada na Matriz de Permissões RBAC ou se Administrador Master estiver desbloqueado)
  const canAccessSettings = React.useMemo(() => {
    if (isAdminUnlocked) return true;
    if (simulatedRole === 'ADMIN') return true;
    return hasPermission('settings_taxonomy') || hasPermission('settings_internal_areas');
  }, [simulatedRole, isAdminUnlocked, permissionsModules]);

  // Consultores Visíveis para o Perfil Ativo
  const visibleConsultants = React.useMemo(() => {
    if (['ADMIN', 'DIRETORIA', 'GERENTE_NACIONAL'].includes(simulatedRole)) {
      return consultants;
    }
    if (simulatedRole === 'GERENTE_REGIONAL') {
      const grId = activeUser?.id;
      return consultants.filter(c => {
        if (c.id === grId) return true;
        return c.reportsTo === grId;
      });
    }
    if (simulatedRole === 'CONSULTOR') {
      return consultants.filter(c => c.id === activeUser?.id);
    }
    return consultants;
  }, [consultants, simulatedRole, activeUser]);

  // Lojas Visíveis para o Perfil Ativo
  const visibleStores = React.useMemo(() => {
    if (['ADMIN', 'DIRETORIA', 'GERENTE_NACIONAL'].includes(simulatedRole)) {
      return stores;
    }
    if (simulatedRole === 'CONSULTOR') {
      const consId = activeUser?.id;
      const assigned = activeUser?.assignedStores || [];
      return stores.filter(s => s.consultantId === consId || assigned.includes(s.id));
    }
    if (simulatedRole === 'GERENTE_REGIONAL') {
      const myConsultantIds = visibleConsultants.map(c => c.id);
      return stores.filter(s => {
        if (myConsultantIds.includes(s.consultantId)) return true;
        return visibleConsultants.some(c => (c.assignedStores || []).includes(s.id));
      });
    }
    return stores;
  }, [stores, simulatedRole, activeUser, visibleConsultants]);

  // Visitas e Relatórios Visíveis para o Perfil Ativo
  const visibleVisits = React.useMemo(() => {
    if (['ADMIN', 'DIRETORIA', 'GERENTE_NACIONAL'].includes(simulatedRole)) {
      return visits;
    }
    const storeIds = new Set(visibleStores.map(s => s.id));
    const consultantIds = new Set(visibleConsultants.map(c => c.id));
    return visits.filter(v => storeIds.has(v.storeId) || consultantIds.has(v.consultantId));
  }, [visits, simulatedRole, visibleStores, visibleConsultants]);

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
                workShift: cloud.work_shift || cloud.workShift || local.workShift || '6x1',
                status: cloud.status || local.status || 'Ativa',
                phone: cloud.phone ? formatPhoneNumber(cloud.phone) : local.phone,
                email: (cloud.email || local.email || '').toLowerCase().trim(),
                consultantId: cloud.consultant_id || cloud.consultantId || local.consultantId || null,
                photoUrl: cloud.photo_url || cloud.photoUrl || local.photoUrl || null,
                shoppingMallAdmin: cloud.shopping_mall_admin || cloud.shoppingMallAdmin || local.shoppingMallAdmin || '',
                franchiseContractExpiration: cloud.franchise_contract_expiration || cloud.franchiseContractExpiration || local.franchiseContractExpiration || ''
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
                  photoUrl: s.photo_url || s.photoUrl || null,
                  shoppingMallAdmin: s.shopping_mall_admin || s.shoppingMallAdmin || '',
                  franchiseContractExpiration: s.franchise_contract_expiration || s.franchiseContractExpiration || '',
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
      cep: formatCEP(storeData.cep),
      locationType: storeData.locationType || 'Shopping',
      franchisee: (storeData.franchisee || '').toUpperCase().trim(),
      phone: formatPhoneNumber(storeData.phone),
      email: (storeData.email || '').toLowerCase().trim(),
      address: storeData.address || `${storeData.name} - ${storeData.city}/${storeData.state}`,
      consultantId: storeData.consultantId || null,
      photoUrl: storeData.photoUrl || null,
      shoppingMallAdmin: storeData.shoppingMallAdmin ? storeData.shoppingMallAdmin.toUpperCase().trim() : '',
      franchiseContractExpiration: storeData.franchiseContractExpiration || '',
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
          photo_url: newStore.photoUrl,
          shopping_mall_admin: newStore.shoppingMallAdmin,
          franchise_contract_expiration: newStore.franchiseContractExpiration,
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
          cep: updatedData.cep !== undefined ? formatCEP(updatedData.cep) : s.cep,
          locationType: updatedData.locationType || s.locationType,
          workShift: updatedData.workShift !== undefined ? updatedData.workShift : (s.workShift || '6x1'),
          status: updatedData.status !== undefined ? updatedData.status : (s.status || 'Ativa'),
          franchisee: updatedData.franchisee !== undefined ? updatedData.franchisee.toUpperCase().trim() : s.franchisee,
          phone: updatedData.phone !== undefined ? formatPhoneNumber(updatedData.phone) : s.phone,
          email: updatedData.email !== undefined ? updatedData.email.toLowerCase().trim() : s.email,
          address: updatedData.address !== undefined ? updatedData.address.trim() : s.address,
          consultantId: newConsultantId,
          photoUrl: updatedData.photoUrl !== undefined ? updatedData.photoUrl : s.photoUrl,
          shoppingMallAdmin: updatedData.shoppingMallAdmin !== undefined ? (updatedData.shoppingMallAdmin ? updatedData.shoppingMallAdmin.toUpperCase().trim() : '') : (s.shoppingMallAdmin || ''),
          franchiseContractExpiration: updatedData.franchiseContractExpiration !== undefined ? updatedData.franchiseContractExpiration : (s.franchiseContractExpiration || '')
        };
        return updatedObj;
      });
    });

    // Sync selectedStoreForProfile if this store is currently open in the profile modal
    if (selectedStoreForProfile && selectedStoreForProfile.id === storeId && updatedObj) {
      setSelectedStoreForProfile(updatedObj);
    }

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
          work_shift: updatedObj.workShift,
          status: updatedObj.status,
          phone: updatedObj.phone,
          email: updatedObj.email,
          consultant_id: updatedObj.consultantId,
          photo_url: updatedObj.photoUrl,
          shopping_mall_admin: updatedObj.shoppingMallAdmin,
          franchise_contract_expiration: updatedObj.franchiseContractExpiration
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
      documents,
      isRepositoryOpen,
      setIsRepositoryOpen,
      addDocument,
      deleteDocument,
      turnoverRecords,
      addTurnoverRecord,
      deleteTurnoverRecord,
      internalAreas,
      addInternalArea,
      updateInternalArea,
      deleteInternalArea,
      // Escalas de Colaboradores
      workShifts,
      addWorkShift,
      updateWorkShift,
      deleteWorkShift,
      // Permissões & RBAC (Administrador Master)
      permissionsModules,
      updateRolePermission,
      resetPermissionsToDefault,
      hasPermission,
      rolesList: DEFAULT_ROLES,
      isAdminUnlocked,
      toggleAdminUnlock,
      // Hierarquia & Simulador de Perfis
      simulatedRole,
      simulatedUserId,
      changeSimulatedProfile,
      activeUser,
      canAccessSettings,
      visibleStores,
      visibleConsultants,
      visibleVisits,
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
