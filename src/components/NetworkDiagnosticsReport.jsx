import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatBrDate } from '../utils/dateHelpers';
import { SPOLETO_LOGO_DARK } from './spoletoLogoAssets';
import ExecutiveNetworkPdfReport from './ExecutiveNetworkPdfReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Store, 
  Calendar, 
  User, 
  Eye, 
  Layers, 
  RefreshCw, 
  BarChart2, 
  Printer, 
  CheckCircle2, 
  Award,
  X,
  Building2,
  ExternalLink,
  Target,
  Crosshair,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CalendarRange,
  Flame,
  Zap,
  Info
} from 'lucide-react';

export default function NetworkDiagnosticsReport() {
  const { 
    visibleStores: stores = [], 
    visibleVisits: visits = [], 
    categories = [], 
    consultants = [],
    franchisees = [],
    getStoreFranchisees,
    setSelectedStoreForProfile,
    showToast
  } = useApp();

  // =========================================================================
  // ESTADOS PRINCIPAIS
  // =========================================================================
  
  // Modo de Visualização: 'ALL' (Panorama Geral da Rede) | 'FOCUS' (Raio-X Cirúrgico de um Problema)
  const [viewMode, setViewMode] = useState('ALL');
  const [focusedSubKey, setFocusedSubKey] = useState('');

  // Filtros de Pesquisa & Dimensão
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('Todos');
  const [selectedStateFilter, setSelectedStateFilter] = useState('Todos');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('Todos');

  // Filtros de Período Temporal
  // 'ALL' | 'CURRENT_MONTH' | 'PREV_MONTH' | '30' | '60' | '90' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | '2026' | 'SPECIFIC_MONTH' | 'CUSTOM'
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('ALL');
  const [selectedSpecificMonth, setSelectedSpecificMonth] = useState('2026-10');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Expansão de Tópicos e Subtópicos no modo geral
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});

  // Modal de IA (Prompt & Dados)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalTab, setAiModalTab] = useState('AUTO'); // 'AUTO' | 'ALL' | 'FOCUS'
  const [copiedAiData, setCopiedAiData] = useState(false);

  // Modal de Relatório Executivo Sintético (Impressão & PDF)
  const [isExecutivePdfModalOpen, setIsExecutivePdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const executiveDocRef = useRef(null);

  // Toggle helpers
  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const toggleSubtopic = (subId) => {
    setExpandedSubtopics(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const expandAll = () => {
    const allT = {};
    const allS = {};
    categories.forEach(c => {
      allT[c.id] = true;
      (c.subproblems || []).forEach(sp => {
        allS[`${c.id}-${sp.id}`] = true;
      });
    });
    setExpandedTopics(allT);
    setExpandedSubtopics(allS);
  };

  const collapseAll = () => {
    setExpandedTopics({});
    setExpandedSubtopics({});
  };

  // =========================================================================
  // MESES DISPONÍVEIS & FORMATAÇÃO
  // =========================================================================
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    visits.forEach(v => {
      if (v.date && v.date.length >= 7) {
        monthsSet.add(v.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    // Se poucos dados, inclui meses de referência de 2026
    ['2026-12', '2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'].forEach(m => monthsSet.add(m));
    return Array.from(monthsSet).sort().reverse();
  }, [visits]);

  const formatMonthLabel = (yearMonth) => {
    if (!yearMonth) return '';
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || month} de ${year}`;
  };

  // Rótulo amigável do período ativo
  const activePeriodLabel = useMemo(() => {
    if (selectedPeriodFilter === 'CURRENT_MONTH') {
      const now = new Date();
      return `Mês Atual (${formatMonthLabel(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)})`;
    }
    if (selectedPeriodFilter === 'PREV_MONTH') {
      const now = new Date();
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `Mês Anterior (${formatMonthLabel(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`)})`;
    }
    if (selectedPeriodFilter === 'SPECIFIC_MONTH') {
      return formatMonthLabel(selectedSpecificMonth) || 'Mês Específico';
    }
    if (selectedPeriodFilter === '30') return 'Últimos 30 dias';
    if (selectedPeriodFilter === '60') return 'Últimos 60 dias';
    if (selectedPeriodFilter === '90') return 'Últimos 90 dias (Trimestre Recente)';
    if (selectedPeriodFilter === 'Q1') return '1º Trimestre (Jan - Mar)';
    if (selectedPeriodFilter === 'Q2') return '2º Trimestre (Abr - Jun)';
    if (selectedPeriodFilter === 'Q3') return '3º Trimestre (Jul - Set)';
    if (selectedPeriodFilter === 'Q4') return '4º Trimestre (Out - Dez)';
    if (selectedPeriodFilter === '2026') return 'Ano de 2026';
    if (selectedPeriodFilter === 'CUSTOM') {
      return `De ${formatBrDate(customStartDate) || 'início'} até ${formatBrDate(customEndDate) || 'hoje'}`;
    }
    return 'Todo o Histórico';
  }, [selectedPeriodFilter, selectedSpecificMonth, customStartDate, customEndDate]);

  // =========================================================================
  // FILTRAGEM TEMPORAL DE VISITAS
  // =========================================================================
  const filteredVisits = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthStr = `${curYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    return visits.filter(v => {
      if (!v.date) return true;
      const vDate = new Date(v.date + 'T12:00:00');

      if (selectedPeriodFilter === 'CURRENT_MONTH') {
        return v.date.startsWith(curMonthStr);
      }
      if (selectedPeriodFilter === 'PREV_MONTH') {
        return v.date.startsWith(prevMonthStr);
      }
      if (selectedPeriodFilter === 'SPECIFIC_MONTH') {
        if (!selectedSpecificMonth) return true;
        return v.date.startsWith(selectedSpecificMonth);
      }
      if (selectedPeriodFilter === '30') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      if (selectedPeriodFilter === '60') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 60;
      }
      if (selectedPeriodFilter === '90') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 90;
      }
      if (selectedPeriodFilter === 'Q1') {
        const m = v.date.substring(5, 7);
        return ['01', '02', '03'].includes(m);
      }
      if (selectedPeriodFilter === 'Q2') {
        const m = v.date.substring(5, 7);
        return ['04', '05', '06'].includes(m);
      }
      if (selectedPeriodFilter === 'Q3') {
        const m = v.date.substring(5, 7);
        return ['07', '08', '09'].includes(m);
      }
      if (selectedPeriodFilter === 'Q4') {
        const m = v.date.substring(5, 7);
        return ['10', '11', '12'].includes(m);
      }
      if (selectedPeriodFilter === '2026') {
        return v.date.startsWith('2026');
      }
      if (selectedPeriodFilter === 'CUSTOM') {
        if (customStartDate && v.date < customStartDate) return false;
        if (customEndDate && v.date > customEndDate) return false;
        return true;
      }
      return true; // 'ALL'
    });
  }, [visits, selectedPeriodFilter, selectedSpecificMonth, customStartDate, customEndDate]);

  // =========================================================================
  // MOTOR DE CONSOLIDAÇÃO HIERÁRQUICA: TÓPICO -> SUBTÓPICO -> LOJAS AFETADAS
  // =========================================================================
  const { 
    consolidatedTopics, 
    topNetworkProblems, 
    totalUniqueStoresWithIssues, 
    totalIssuesCount,
    availableStates
  } = useMemo(() => {
    const storesMap = new Map(stores.map(s => [s.id, s]));
    const consultantsMap = new Map(consultants.map(c => [c.id, c]));

    const statesSet = new Set();
    stores.forEach(s => { if (s.state) statesSet.add(s.state); });

    const topicsMap = new Map();

    // Inicializa categorias cadastradas
    categories.forEach(cat => {
      topicsMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#5D3826',
        icon: cat.icon || 'Layers',
        occurrencesCount: 0,
        uniqueStoreIds: new Set(),
        subtopicsMap: new Map()
      });
    });

    // Categoria coringa para diagnósticos avulsos
    const OTHER_CAT_ID = 'cat-outros';
    topicsMap.set(OTHER_CAT_ID, {
      id: OTHER_CAT_ID,
      name: 'OUTROS APONTAMENTOS OPERACIONAIS',
      color: '#4B5563',
      icon: 'AlertCircle',
      occurrencesCount: 0,
      uniqueStoreIds: new Set(),
      subtopicsMap: new Map()
    });

    let issuesCount = 0;
    const globalStoresWithIssues = new Set();

    filteredVisits.forEach(visit => {
      const store = storesMap.get(visit.storeId);
      if (!store) return;

      if (selectedStateFilter !== 'Todos' && store.state !== selectedStateFilter) {
        return;
      }

      const consultant = consultantsMap.get(visit.consultantId) || { name: visit.consultantName || 'Consultor Spoleto' };
      const storeFrans = getStoreFranchisees ? getStoreFranchisees(store.id) : [];
      const franchiseeName = storeFrans.length > 0 ? storeFrans.map(f => f.name).join(', ') : (store.franchisee || 'Franqueado Spoleto');

      (visit.diagnostics || []).forEach(diag => {
        const sev = diag.severity || 'Alta';
        if (selectedSeverityFilter !== 'Todos' && sev !== selectedSeverityFilter) {
          return;
        }

        const catId = diag.categoryId && topicsMap.has(diag.categoryId) ? diag.categoryId : OTHER_CAT_ID;
        const topicObj = topicsMap.get(catId);
        const originalCat = categories.find(c => c.id === catId);

        let subId = diag.subproblemId || 'sub-custom';
        let subTitle = 'Apontamento Operacional';

        if (originalCat && diag.subproblemId) {
          const sp = (originalCat.subproblems || []).find(p => p.id === diag.subproblemId);
          if (sp) {
            subTitle = sp.title;
          } else if (diag.actionPlan?.action) {
            subTitle = diag.actionPlan.action;
          }
        } else if (diag.actionPlan?.action) {
          subTitle = diag.actionPlan.action;
        } else if (diag.notes) {
          subTitle = diag.notes.length > 70 ? diag.notes.substring(0, 70) + '...' : diag.notes;
        }

        const subKey = `${catId}__${subId}__${subTitle}`;

        if (!topicObj.subtopicsMap.has(subKey)) {
          topicObj.subtopicsMap.set(subKey, {
            subKey,
            subId,
            subTitle,
            topicId: catId,
            topicName: topicObj.name,
            severityCount: { Crítica: 0, Alta: 0, Média: 0, Baixa: 0 },
            uniqueStoreIds: new Set(),
            occurrencesCount: 0,
            storesList: []
          });
        }

        const subObj = topicObj.subtopicsMap.get(subKey);
        subObj.occurrencesCount += 1;
        subObj.severityCount[sev] = (subObj.severityCount[sev] || 0) + 1;
        subObj.uniqueStoreIds.add(store.id);

        subObj.storesList.push({
          diagnosticId: diag.id || `${visit.id}-${Math.random()}`,
          visitId: visit.id,
          visitDate: visit.date,
          storeId: store.id,
          storeCode: store.code,
          storeName: store.name,
          city: store.city,
          state: store.state,
          locationType: store.locationType || 'Shopping',
          workShift: store.workShift || '6x1',
          franchisee: franchiseeName,
          consultantName: consultant.name,
          severity: sev,
          notes: diag.notes || 'Sem observações detalhadas.',
          actionPlan: diag.actionPlan || null,
          storeRaw: store
        });

        topicObj.occurrencesCount += 1;
        topicObj.uniqueStoreIds.add(store.id);
        globalStoresWithIssues.add(store.id);
        issuesCount += 1;
      });
    });

    // Ordenação e cálculo de criticidade
    const topicsArr = Array.from(topicsMap.values())
      .filter(t => t.occurrencesCount > 0)
      .map(t => {
        const getPriorityScore = (sub) => {
          if ((sub.severityCount?.Crítica || 0) > 0 || (sub.severityCount?.Alta || 0) > 0) return 3;
          if ((sub.severityCount?.Média || 0) > 0) return 2;
          return 1;
        };

        const subList = Array.from(t.subtopicsMap.values())
          .map(sub => {
            const pScore = getPriorityScore(sub);
            const priorityLabel = pScore === 3 ? 'Alta' : pScore === 2 ? 'Média' : 'Baixa';
            
            const sevRank = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };
            const sortedStores = [...sub.storesList].sort((a, b) => (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0));

            return {
              ...sub,
              priorityScore: pScore,
              priorityLabel: priorityLabel,
              storesList: sortedStores
            };
          })
          .sort((a, b) => {
            if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
            if (b.uniqueStoreIds.size !== a.uniqueStoreIds.size) return b.uniqueStoreIds.size - a.uniqueStoreIds.size;
            return b.occurrencesCount - a.occurrencesCount;
          });

        return {
          ...t,
          uniqueStoresCount: t.uniqueStoreIds.size,
          subtopics: subList
        };
      })
      .sort((a, b) => b.uniqueStoresCount - a.uniqueStoresCount || b.occurrencesCount - a.occurrencesCount);

    const allSubs = [];
    topicsArr.forEach(t => {
      t.subtopics.forEach(st => {
        allSubs.push(st);
      });
    });

    const topProblems = allSubs
      .sort((a, b) => b.uniqueStoreIds.size - a.uniqueStoreIds.size || b.occurrencesCount - a.occurrencesCount)
      .slice(0, 5);

    return {
      consolidatedTopics: topicsArr,
      topNetworkProblems: topProblems,
      totalUniqueStoresWithIssues: globalStoresWithIssues.size,
      totalIssuesCount: issuesCount,
      availableStates: Array.from(statesSet).sort()
    };
  }, [categories, filteredVisits, stores, consultants, selectedStateFilter, selectedSeverityFilter, getStoreFranchisees]);

  // =========================================================================
  // CATÁLOGO UNIFICADO DE SUBTÓPICOS (PARA RAIO-X CIRÚRGICO)
  // =========================================================================
  const allSubtopicsCatalog = useMemo(() => {
    const map = new Map();

    // 1. A partir dos que têm apontamentos ativos no período
    consolidatedTopics.forEach(t => {
      t.subtopics.forEach(st => {
        map.set(st.subKey, {
          subKey: st.subKey,
          subTitle: st.subTitle,
          topicId: t.id,
          topicName: t.name,
          color: t.color,
          activeStoresCount: st.uniqueStoreIds.size,
          occurrencesCount: st.occurrencesCount,
          subObj: st
        });
      });
    });

    // 2. A partir do cadastro das categorias (para permitir selecionar mesmo antes de haver laudo)
    categories.forEach(cat => {
      (cat.subproblems || []).forEach(sp => {
        const key = `${cat.id}__${sp.id}__${sp.title}`;
        if (!map.has(key)) {
          map.set(key, {
            subKey: key,
            subTitle: sp.title,
            topicId: cat.id,
            topicName: cat.name,
            color: cat.color || '#5D3826',
            activeStoresCount: 0,
            occurrencesCount: 0,
            subObj: null
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.activeStoresCount !== a.activeStoresCount) return b.activeStoresCount - a.activeStoresCount;
      return a.subTitle.localeCompare(b.subTitle);
    });
  }, [consolidatedTopics, categories]);

  // Objeto do Subtópico Focado (no modo Raio-X Cirúrgico)
  const focusedSubtopicData = useMemo(() => {
    if (!focusedSubKey) return null;
    
    // Procura nos tópicos consolidados (com dados reais)
    for (const t of consolidatedTopics) {
      const found = t.subtopics.find(st => st.subKey === focusedSubKey || st.subTitle.toLowerCase() === focusedSubKey.toLowerCase());
      if (found) {
        return {
          ...found,
          topic: t
        };
      }
    }

    // Se não tiver ocorrências no período filtrado
    const catalogItem = allSubtopicsCatalog.find(item => item.subKey === focusedSubKey || item.subTitle.toLowerCase() === focusedSubKey.toLowerCase());
    if (catalogItem) {
      return {
        subKey: catalogItem.subKey,
        subId: 'sub-item',
        subTitle: catalogItem.subTitle,
        topicId: catalogItem.topicId,
        topicName: catalogItem.topicName,
        severityCount: { Crítica: 0, Alta: 0, Média: 0, Baixa: 0 },
        uniqueStoreIds: new Set(),
        occurrencesCount: 0,
        storesList: [],
        priorityLabel: 'Baixa',
        topic: { id: catalogItem.topicId, name: catalogItem.topicName, color: catalogItem.color }
      };
    }
    return null;
  }, [focusedSubKey, consolidatedTopics, allSubtopicsCatalog]);

  // Ativar o Raio-X Cirúrgico de um problema
  const handleActivateFocus = (subKey) => {
    setFocusedSubKey(subKey);
    setViewMode('FOCUS');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Voltar ao Panorama Geral
  const handleBackToAll = () => {
    setViewMode('ALL');
  };

  // =========================================================================
  // FILTRAGEM FINAL DO PANORAMA GERAL POR BUSCA
  // =========================================================================
  const displayedTopics = useMemo(() => {
    let result = consolidatedTopics;

    if (selectedTopicFilter !== 'Todos') {
      result = result.filter(t => t.id === selectedTopicFilter || t.name === selectedTopicFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toUpperCase();
      result = result
        .map(t => {
          const matchTopicName = t.name.toUpperCase().includes(term);
          const filteredSubs = t.subtopics.filter(st => {
            if (st.subTitle.toUpperCase().includes(term)) return true;
            if (st.topicName.toUpperCase().includes(term)) return true;
            return st.storesList.some(s => 
              s.storeName.toUpperCase().includes(term) ||
              s.storeCode.toUpperCase().includes(term) ||
              s.city.toUpperCase().includes(term) ||
              s.franchisee.toUpperCase().includes(term) ||
              s.consultantName.toUpperCase().includes(term) ||
              (s.notes && s.notes.toUpperCase().includes(term)) ||
              (s.actionPlan?.action && s.actionPlan.action.toUpperCase().includes(term))
            );
          });

          if (matchTopicName) return t;
          if (filteredSubs.length > 0) {
            return {
              ...t,
              subtopics: filteredSubs,
              uniqueStoresCount: new Set(filteredSubs.flatMap(sub => Array.from(sub.uniqueStoreIds))).size,
              occurrencesCount: filteredSubs.reduce((acc, sub) => acc + sub.occurrencesCount, 0)
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return result;
  }, [consolidatedTopics, selectedTopicFilter, searchTerm]);

  // =========================================================================
  // GERADOR DE PROMPT & DADOS PARA IA (CHATGPT / CLAUDE / GEMINI)
  // =========================================================================
  const generateAiStructuredText = (forceTarget = null) => {
    const totalStoresCount = stores.length;
    const targetMode = forceTarget || (viewMode === 'FOCUS' && focusedSubtopicData ? 'FOCUS' : 'ALL');

    // 1. PROMPT CIRÚRGICO (PROBLEMA FOCADO)
    if (targetMode === 'FOCUS' && focusedSubtopicData) {
      const sub = focusedSubtopicData;
      const subPct = totalStoresCount > 0 ? ((sub.uniqueStoreIds.size / totalStoresCount) * 100).toFixed(1) : 0;

      const stMap = {};
      sub.storesList.forEach(s => {
        stMap[s.state] = (stMap[s.state] || 0) + 1;
      });
      const topStatesText = Object.entries(stMap)
        .sort((a, b) => b[1] - a[1])
        .map(([uf, count]) => `${uf}: ${count} lojas`)
        .join(' | ') || 'Nenhum estado registrado';

      let text = `================================================================================
RELATÓRIO CIRÚRGICO DE INTELIGÊNCIA OPERACIONAL - REDE SPOLETO
PROBLEMA FOCADO: ${sub.subTitle.toUpperCase()}
================================================================================
Data de Extração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Período de Referência: ${activePeriodLabel}
Categoria / Disciplina: ${sub.topicName}
Total de Lojas Afetadas: ${sub.uniqueStoreIds.size} de ${totalStoresCount} lojas (${subPct}% da rede)
Total de Apontamentos Coletados: ${sub.occurrencesCount} laudos de campo
Distribuição por Severidade: Crítica (${sub.severityCount?.Crítica || 0}) | Alta (${sub.severityCount?.Alta || 0}) | Média (${sub.severityCount?.Média || 0}) | Baixa (${sub.severityCount?.Baixa || 0})
Distribuição Regional: ${topStatesText}

--------------------------------------------------------------------------------
PROMPT EXECUTIVO CIRÚRGICO PARA A IA (RECUPERAÇÃO OPERACIONAL):
--------------------------------------------------------------------------------
Você é um consultor executivo sênior de inteligência operacional de franquias do Grupo Trigo / Spoleto, especialista na disciplina de "${sub.topicName}".

Com base nos laudos reais coletados pelos consultores de campo durante as visitas do período (${activePeriodLabel}), desenvolva um plano estratégico e tático de recuperação contendo:

1. DIAGNÓSTICO DE CAUSA-RAIZ:
   - Por que o problema "${sub.subTitle}" afetou ${sub.uniqueStoreIds.size} lojas (${subPct}% da rede)?
   - Analise os fatores operacionais ocultos que levam a essa não-conformidade (ex: escala de equipe, treinamento, rotina do franqueado, falta de cobrança).

2. PLANO DE AÇÃO EMERGENCIAL DE 30 DIAS (SPRINT DE RESGATE):
   - Semana 1 e 2: Ações de choque imediatas que o Gerente de Loja e o Consultor de Campo devem executar.
   - Semana 3 e 4: Rotina diária de sustentação (checklist diário) para garantir que a nota ou o padrão suba e permaneça alto.

3. RECOMENDAÇÕES PARA OS CASOS MAIS GRAVES:
   - Analise detalhadamente as anotações reais dos consultores listadas abaixo e formule a prescrição exata para as 3 lojas em situação mais crítica.

--------------------------------------------------------------------------------
MATRIZ DETALHADA DAS LOJAS AFETADAS:
--------------------------------------------------------------------------------
`;
      if (sub.storesList.length === 0) {
        text += `Nenhuma ocorrência registrada para este problema no período selecionado (${activePeriodLabel}).\n`;
      } else {
        sub.storesList.forEach((st, idx) => {
          text += `\n${idx + 1}. [${st.storeCode}] ${st.storeName} (${st.city}-${st.state})\n`;
          text += `   - Franqueado: ${st.franchisee} | Consultor: ${st.consultantName}\n`;
          text += `   - Data da Visita: ${formatBrDate(st.visitDate)} | Gravidade: ${st.severity}\n`;
          if (st.notes && st.notes !== 'Sem observações detalhadas.') {
            text += `   - Anotação Real do Consultor: "${st.notes}"\n`;
          }
          if (st.actionPlan?.action) {
            text += `   - Ação Corretiva Registrada: "${st.actionPlan.action}" (Responsável: ${st.actionPlan.responsible || 'Gerente'} | Prazo: ${st.actionPlan.deadline || 'Imediato'})\n`;
          }
        });
      }

      text += `\n================================================================================\nFIM DO RELATÓRIO CIRÚRGICO SPOLETO RADAR\n================================================================================\n`;
      return text;
    }

    // 2. PROMPT MACRO / PANORAMA GERAL DA REDE
    let text = `================================================================================
RELATÓRIO ESTRUTURADO DE INTELIGÊNCIA OPERACIONAL DA REDE SPOLETO
DOCUMENTO GERADO PELO SPOLETO RADAR PARA ANÁLISE AVANÇADA POR IA (LLM)
================================================================================
Data de Extração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Período de Referência: ${activePeriodLabel}
Universo Total da Rede: ${totalStoresCount} lojas cadastradas
Lojas com Apontamentos no Período: ${totalUniqueStoresWithIssues} lojas (${totalStoresCount > 0 ? ((totalUniqueStoresWithIssues / totalStoresCount) * 100).toFixed(1) : 0}% da rede)
Total de Apontamentos / Não-Conformidades Coletadas: ${totalIssuesCount} ocorrências
Filtro de Estado (UF): ${selectedStateFilter}
Filtro de Gravidade: ${selectedSeverityFilter}

--------------------------------------------------------------------------------
PROMPT EXECUTIVO PARA A IA (INSTRUÇÕES DE CONSULTORIA ESTRATÉGICA):
--------------------------------------------------------------------------------
Você é um consultor executivo sênior de inteligência operacional de franquias do Grupo Trigo / Spoleto.
Com base na matriz de dados reais coletada pelas consultorias de campo abaixo, produza um diagnóstico estratégico contendo:

1. DIAGNÓSTICO SISTÊMICO: Quais são as 3 maiores vulnerabilidades operacionais da rede no período (${activePeriodLabel}) e por que estão acontecendo de forma recorrente?
2. ANÁLISE ESPECÍFICA DE FLUXO & ATENDIMENTO: Quantas lojas sofrem com falta de embaixador, filas no pico de almoço ou reputação no Google/NPS? Qual o impacto financeiro e na imagem da marca?
3. CORRELAÇÕES OCULTAS: Aponte correlações entre problemas de equipe (turnover/escala) e falhas no padrão de qualidade (Q.A) ou tempo de entrega.
4. PLANO DE AÇÃO EM 3 ONDAS:
   - Onda 1 (Próximos 15 dias): Ações imediatas de contenção para a Gerência Nacional e Consultores de Campo.
   - Onda 2 (30 a 60 dias): Ajustes de processos e capacitação prioritária na Universidade Spoleto.
   - Onda 3 (90 dias): Medidas estruturais para os Franqueados com maior número de reincidências.

--------------------------------------------------------------------------------
RANKING TOP 5 GARGALOS MAIS FREQUENTES DA REDE NO PERÍODO:
--------------------------------------------------------------------------------
`;

    topNetworkProblems.forEach((prob, idx) => {
      text += `${idx + 1}. [${prob.topicName}] ${prob.subTitle}\n`;
      text += `   -> Lojas Afetadas: ${prob.uniqueStoreIds.size} lojas (${totalStoresCount > 0 ? ((prob.uniqueStoreIds.size / totalStoresCount) * 100).toFixed(1) : 0}% da rede) | Ocorrências: ${prob.occurrencesCount}\n`;
    });

    text += `\n--------------------------------------------------------------------------------\nDETALHAMENTO COMPLETO POR TÓPICO, SUBTÓPICO E LOJAS AFETADAS:\n--------------------------------------------------------------------------------\n`;

    displayedTopics.forEach((topic, tIdx) => {
      text += `\n### TÓPICO ${tIdx + 1}: ${topic.name}\n`;
      text += `Impacto: ${topic.uniqueStoresCount} lojas afetadas | ${topic.occurrencesCount} ocorrências\n`;

      topic.subtopics.forEach((sub, sIdx) => {
        text += `\n  - SUBTÓPICO [PRIORIDADE ${sub.priorityLabel.toUpperCase()}] ${tIdx + 1}.${sIdx + 1}: ${sub.subTitle}\n`;
        text += `    Lojas com este problema (${sub.uniqueStoreIds.size} lojas):\n`;

        sub.storesList.forEach(st => {
          text += `      * [${st.storeCode}] ${st.storeName} (${st.city}-${st.state}) | Franqueado: ${st.franchisee} | Consultor: ${st.consultantName} | Gravidade: ${st.severity}\n`;
          if (st.notes && st.notes !== 'Sem observações detalhadas.') {
            text += `        Observação: "${st.notes}"\n`;
          }
          if (st.actionPlan?.action) {
            text += `        Ação Corretiva: "${st.actionPlan.action}" (Resp: ${st.actionPlan.responsible || 'Gerente'} | Prazo: ${st.actionPlan.deadline || 'Imediato'})\n`;
          }
        });
      });
    });

    text += `\n================================================================================\nFIM DO RELATÓRIO SPOLETO RADAR\n================================================================================\n`;
    return text;
  };

  const handleCopyAiData = () => {
    const targetMode = aiModalTab === 'AUTO' 
      ? (viewMode === 'FOCUS' && focusedSubtopicData ? 'FOCUS' : 'ALL') 
      : aiModalTab;

    const content = generateAiStructuredText(targetMode);
    navigator.clipboard.writeText(content).then(() => {
      setCopiedAiData(true);
      showToast('🤖 Dados estruturados e Prompt copiados para a área de transferência! Cole no ChatGPT, Claude ou Gemini.');
      setTimeout(() => setCopiedAiData(false), 3000);
    });
  };

  const handlePrintPdf = () => {
    setIsExecutivePdfModalOpen(true);
  };

  const handleDownloadExecutivePdf = async () => {
    if (!executiveDocRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const element = executiveDocRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const cleanPeriod = (activePeriodLabel || 'Periodo').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Relatorio_Executivo_Spoleto_RaioX_${cleanPeriod}.pdf`;
      pdf.save(fileName);
      showToast(`📄 PDF Executivo "${fileName}" baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar PDF com html2canvas:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Estilos Específicos para Impressão / Salvar em PDF */}
      <style>{`
        /* Barra de rolagem estilizada para pré-visualização executiva */
        .executive-scroll-container::-webkit-scrollbar {
          width: 12px;
        }
        .executive-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 8px;
        }
        .executive-scroll-container::-webkit-scrollbar-thumb {
          background: #D97706;
          border-radius: 8px;
          border: 2px solid #3E2415;
        }
        .executive-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #F59E0B;
        }

        @media screen {
          .only-print-document {
            display: none !important;
          }
        }
        @media print {
          /* Esconder toda a interface da aplicação */
          header, nav, footer, .app-header, .sidebar, .role-simulator-bar, .no-print, button, select, input, .modal-header, .modal-footer, .kpi-grid, .filters-bar, .executive-pdf-modal-overlay, .executive-scroll-container {
            display: none !important;
          }
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .only-print-document,
          #executive-report-document {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 10mm 10mm;
          }
        }
      `}</style>

      {/* =========================================================================
          BANNER HERO EXECUTIVO DO RAIO-X COM SELETORES RÁPIDOS
          ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #3E2415 0%, #5D3826 60%, #854D0E 100%)',
        color: '#FFFFFF',
        padding: '1.75rem 2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 24px rgba(93, 56, 38, 0.2)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <BarChart2 size={13} /> MATRIZ DE INTELIGÊNCIA DA REDE
              </span>
              
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <Calendar size={12} /> {activePeriodLabel}
              </span>
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Diagnóstico & Raio-X da Rede
            </h1>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', maxWidth: '680px', lineHeight: 1.45 }}>
              Cruze dados por <strong>mês, trimestre ou histórico completo</strong>. Descubra os maiores gargalos sistêmicos de toda a rede ou faça um <strong>raio-x cirúrgico</strong> de problemas específicos (como Google Meu Negócio, NPS, CMV ou Embaixador).
            </p>
          </div>

          {/* Botões Superiores de Ação (IA & PDF) */}
          <div className="no-print" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setAiModalTab('AUTO');
                setIsAiModalOpen(true);
              }}
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: 'none',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease'
              }}
              title="Abrir prompt estruturado para alimentar ChatGPT, Gemini ou Claude"
            >
              <Sparkles size={16} color="#B45309" />
              Alimentar IA ({viewMode === 'FOCUS' ? 'Cirúrgico' : 'Geral'})
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
              title="Gerar Relatório Executivo Sintético (PDF / Impressão)"
            >
              <FileText size={16} />
              Gerar Relatório
            </button>
          </div>
        </div>

        {/* =========================================================================
            SELETOR DE MODO DE VISÃO: PANORAMA GERAL vs. RAIO-X CIRÚRGICO
            ========================================================================= */}
        <div className="no-print" style={{
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, textTransform: 'uppercase' }}>
              Modo de Visualização:
            </span>

            <div style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(0,0,0,0.25)',
              padding: '0.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <button
                type="button"
                onClick={handleBackToAll}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: viewMode === 'ALL' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'ALL' ? '#5D3826' : '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={14} /> Panorama Geral da Rede
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!focusedSubKey && allSubtopicsCatalog.length > 0) {
                    setFocusedSubKey(allSubtopicsCatalog[0].subKey);
                  }
                  setViewMode('FOCUS');
                }}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: viewMode === 'FOCUS' ? '#FEF3C7' : 'transparent',
                  color: viewMode === 'FOCUS' ? '#92400E' : '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Crosshair size={14} /> Raio-X Cirúrgico de um Gargalo
              </button>
            </div>
          </div>

          {/* Seletor Rápido de Gargalo Focado */}
          {viewMode === 'FOCUS' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
              <select
                value={focusedSubKey}
                onChange={(e) => setFocusedSubKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid #FDE68A',
                  backgroundColor: '#FFFDF9',
                  color: '#1E293B',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Selecione o problema para investigar...</option>
                {allSubtopicsCatalog.map(item => (
                  <option key={item.subKey} value={item.subKey}>
                    {item.activeStoresCount > 0 ? `🚨 (${item.activeStoresCount} lojas) ` : '⚪ '}
                    [{item.topicName}] {item.subTitle}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* =========================================================================
            4 MINI KPIS GLOBAIS DO PERÍODO
            ========================================================================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 700 }}>
              Lojas com Apontamentos ({activePeriodLabel})
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.15rem' }}>
              {totalUniqueStoresWithIssues} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>/ {stores.length} lojas</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.1rem' }}>
              {stores.length > 0 ? `${((totalUniqueStoresWithIssues / stores.length) * 100).toFixed(1)}% da rede franqueada` : '0%'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total de Ocorrências no Período
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FEF3C7', marginTop: '0.15rem' }}>
              {totalIssuesCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.1rem' }}>
              Laudos registrados em visitas
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 700 }}>
              Categorias com Alerta
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.15rem' }}>
              {consolidatedTopics.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>categorias</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.1rem' }}>
              de {categories.length} cadastradas no Radar
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', fontWeight: 700 }}>
              #1 Maior Gargalo da Rede
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FDE68A', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topNetworkProblems[0] ? `${topNetworkProblems[0].uniqueStoreIds.size} lojas: ${topNetworkProblems[0].subTitle}` : 'Nenhum apontamento'}
            </div>
            {topNetworkProblems[0] && (
              <button
                type="button"
                onClick={() => handleActivateFocus(topNetworkProblems[0].subKey)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FEF3C7',
                  padding: 0,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginTop: '0.15rem'
                }}
              >
                Investigar no Raio-X Cirúrgico &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          BARRA DE FILTROS TEMPORAIS & PESQUISA
          ========================================================================= */}
      <div className="no-print" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Linha 1: Input de Busca Textual + Ações de Expansão */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar gargalos: 'google', 'nps', 'embaixador', 'delivery', 'molho', código de loja..."
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1.5px solid var(--border-subtle)',
                fontSize: '0.88rem',
                backgroundColor: '#FAF8F5'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {viewMode === 'ALL' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={expandAll}
                style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Expandir Tudo
              </button>
              <button
                type="button"
                onClick={collapseAll}
                style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                Recolher
              </button>
            </div>
          )}
        </div>

        {/* Linha 2: Filtros de Período, Mês Específico, Categoria, UF e Severidade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
          {/* Seletor Principal de Período */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📅 Período de Visita
            </label>
            <select
              value={selectedPeriodFilter}
              onChange={(e) => setSelectedPeriodFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '6px', border: '1.5px solid var(--border-subtle)', fontWeight: 700 }}
            >
              <optgroup label="Visão Rápida">
                <option value="ALL">Todo o Histórico</option>
                <option value="CURRENT_MONTH">Mês Atual</option>
                <option value="PREV_MONTH">Mês Anterior</option>
                <option value="30">Últimos 30 dias</option>
                <option value="60">Últimos 60 dias</option>
                <option value="90">Últimos 90 dias (Trimestre)</option>
              </optgroup>
              <optgroup label="Trimestres Fechados">
                <option value="Q1">1º Trimestre (Jan - Mar)</option>
                <option value="Q2">2º Trimestre (Abr - Jun)</option>
                <option value="Q3">3º Trimestre (Jul - Set)</option>
                <option value="Q4">4º Trimestre (Out - Dez)</option>
              </optgroup>
              <optgroup label="Anual ou Mês Específico">
                <option value="2026">Ano de 2026</option>
                <option value="SPECIFIC_MONTH">🎯 Escolher Mês Específico...</option>
                <option value="CUSTOM">🗓️ Intervalo Personalizado...</option>
              </optgroup>
            </select>
          </div>

          {/* Sub-seletor quando escolhe "Mês Específico" */}
          {selectedPeriodFilter === 'SPECIFIC_MONTH' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#B45309', marginBottom: '0.25rem' }}>
                📆 Mês Selecionado
              </label>
              <select
                value={selectedSpecificMonth}
                onChange={(e) => setSelectedSpecificMonth(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '6px', border: '1.5px solid #F59E0B', fontWeight: 800, backgroundColor: '#FFFDF9' }}
              >
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sub-seletor quando escolhe "Intervalo Personalizado" */}
          {selectedPeriodFilter === 'CUSTOM' && (
            <div style={{ display: 'flex', gap: '0.4rem', gridColumn: 'span 2' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#B45309', marginBottom: '0.25rem' }}>
                  De
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#B45309', marginBottom: '0.25rem' }}>
                  Até
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                />
              </div>
            </div>
          )}

          {/* Tópico / Categoria */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📁 Tópico / Categoria
            </label>
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todos os Tópicos ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Estado / Regional */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📍 Regional / Estado (UF)
            </label>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todos os Estados</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Gravidade */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              ⚠️ Gravidade do Apontamento
            </label>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todas as Gravidades</option>
              <option value="Crítica">Apenas Crítica</option>
              <option value="Alta">Apenas Alta</option>
              <option value="Média">Apenas Média</option>
              <option value="Baixa">Apenas Baixa</option>
            </select>
          </div>
        </div>

        {/* Atalhos Rápidos de Palavras-Chave Frequentes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Atalhos Rápidos:</span>
          {[
            { label: '⭐ Google (< 4.0)', query: 'google' },
            { label: '📊 NPS Baixo', query: 'nps' },
            { label: '🧑‍🍳 Embaixador', query: 'embaixador' },
            { label: '🛵 iFood / Delivery', query: 'ifood' },
            { label: '💰 CMV / Desperdício', query: 'cmv' },
            { label: '🧼 Limpeza / Q.A', query: 'limpeza' }
          ].map(tag => (
            <button
              key={tag.label}
              type="button"
              onClick={() => {
                setSearchTerm(tag.query);
                setViewMode('ALL');
              }}
              style={{
                padding: '0.25rem 0.6rem',
                backgroundColor: searchTerm.toLowerCase() === tag.query ? 'var(--primary-brown)' : '#F3F4F6',
                color: searchTerm.toLowerCase() === tag.query ? '#FFFFFF' : '#374151',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tag.label}
            </button>
          ))}

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ padding: '0.2rem 0.55rem', background: 'none', border: 'none', color: '#DC2626', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Limpar busca
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODO 1: RAIO-X CIRÚRGICO DE UM PROBLEMA ESPECÍFICO (DOSSIÊ EXECUTIVO)
          ========================================================================= */}
      {viewMode === 'FOCUS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {focusedSubtopicData ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid #5D3826',
              boxShadow: '0 4px 16px rgba(93, 56, 38, 0.08)',
              overflow: 'hidden'
            }}>
              {/* Header do Dossiê Cirúrgico */}
              <div style={{
                background: 'linear-gradient(135deg, #FFFDF9 0%, #FEF3C7 100%)',
                borderBottom: '1.5px solid #FDE68A',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: '#5D3826',
                      color: '#FFFFFF',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      letterSpacing: '0.05em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <Crosshair size={12} /> RAIO-X CIRÚRGICO
                    </span>

                    <span style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FDE68A',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      📁 {focusedSubtopicData.topicName}
                    </span>

                    <span style={{
                      backgroundColor: focusedSubtopicData.priorityLabel === 'Alta' ? '#FEE2E2' : '#EFF6FF',
                      color: focusedSubtopicData.priorityLabel === 'Alta' ? '#991B1B' : '#1D4ED8',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      PRIORIDADE {focusedSubtopicData.priorityLabel.toUpperCase()}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E293B', margin: 0, lineHeight: 1.25 }}>
                    {focusedSubtopicData.subTitle}
                  </h2>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Análise aprofundada das lojas que registraram este apontamento em <strong>{activePeriodLabel}</strong>.
                  </p>
                </div>

                {/* Ações Rápidas no Dossiê */}
                <div className="no-print" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAiModalTab('FOCUS');
                      setIsAiModalOpen(true);
                    }}
                    style={{
                      backgroundColor: '#4338CA',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.55rem 0.95rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)'
                    }}
                  >
                    <Sparkles size={14} /> Análise de IA para este Problema
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToAll}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <ArrowLeft size={14} /> Voltar ao Panorama Geral
                  </button>
                </div>
              </div>

              {/* 4 Cards de Resumo Executivo do Problema */}
              <div style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#FAF8F5',
                borderBottom: '1px solid #E5E7EB',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Lojas Afetadas
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-brown)', marginTop: '0.2rem' }}>
                    {focusedSubtopicData.uniqueStoreIds.size} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>/ {stores.length}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B45309', marginTop: '0.15rem' }}>
                    {stores.length > 0 ? `${((focusedSubtopicData.uniqueStoreIds.size / stores.length) * 100).toFixed(1)}% da rede neste período` : '0%'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Total de Apontamentos
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginTop: '0.2rem' }}>
                    {focusedSubtopicData.occurrencesCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Ocorrências em consultorias
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Gravidade Dominante
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                      Crítica: {focusedSubtopicData.severityCount?.Crítica || 0}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      Alta: {focusedSubtopicData.severityCount?.Alta || 0}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                      Média: {focusedSubtopicData.severityCount?.Média || 0}
                    </span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Planos de Ação Criados
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16A34A', marginTop: '0.2rem' }}>
                    {focusedSubtopicData.storesList.filter(s => s.actionPlan?.action).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    com medidas corretivas definidas
                  </div>
                </div>
              </div>

              {/* Lista Detalhada das Lojas com este Problema */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Unidades Afetadas ({focusedSubtopicData.storesList.length} ocorrências registradas em {activePeriodLabel})
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Ordenado pela gravidade do apontamento
                  </span>
                </div>

                {focusedSubtopicData.storesList.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: '#FAF8F5', borderRadius: '8px' }}>
                    <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Excelente! Nenhuma loja com este problema no período selecionado ({activePeriodLabel}).
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                      Selecione outro mês ou altere o período para verificar o histórico anterior.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {focusedSubtopicData.storesList.map((stItem, idx) => (
                      <div
                        key={`${stItem.diagnosticId}-${idx}`}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.2rem 0.5rem',
                              backgroundColor: '#F3F4F6',
                              color: '#374151',
                              borderRadius: '4px',
                              fontWeight: 900,
                              fontSize: '0.76rem'
                            }}>
                              {stItem.storeCode}
                            </span>

                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {stItem.storeName}
                            </span>

                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              📍 {stItem.city}/{stItem.state} &bull; {stItem.locationType}
                            </span>

                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: stItem.severity === 'Crítica' ? '#FEE2E2' : stItem.severity === 'Alta' ? '#FEF3C7' : '#EFF6FF',
                              color: stItem.severity === 'Crítica' ? '#991B1B' : stItem.severity === 'Alta' ? '#92400E' : '#1D4ED8'
                            }}>
                              {stItem.severity.toUpperCase()}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            🤝 Franqueado: <strong>{stItem.franchisee}</strong> &bull; 👨‍💼 Consultor: <strong>{stItem.consultantName}</strong> &bull; 📅 Visita: <strong>{formatBrDate(stItem.visitDate)}</strong>
                          </div>

                          {stItem.notes && stItem.notes !== 'Sem observações detalhadas.' && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#374151',
                              backgroundColor: '#FAF8F5',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '6px',
                              marginTop: '0.5rem',
                              borderLeft: '3px solid var(--primary-brown)',
                              lineHeight: 1.45
                            }}>
                              <strong>📝 Anotação de Campo:</strong> {stItem.notes}
                            </div>
                          )}

                          {stItem.actionPlan?.action && (
                            <div style={{
                              fontSize: '0.78rem',
                              color: '#1E40AF',
                              backgroundColor: '#EFF6FF',
                              padding: '0.45rem 0.75rem',
                              borderRadius: '6px',
                              marginTop: '0.4rem',
                              borderLeft: '3px solid #3B82F6',
                              display: 'flex',
                              gap: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              <span>🎯 <strong>Plano Corretivo:</strong> {stItem.actionPlan.action}</span>
                              <span>⏰ <strong>Prazo:</strong> {stItem.actionPlan.deadline || 'Imediato'}</span>
                              <span>👤 <strong>Responsável:</strong> {stItem.actionPlan.responsible || 'Gerente da Loja'}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className="no-print"
                          onClick={() => setSelectedStoreForProfile(stItem.storeRaw)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#FAF5EE',
                            border: '1px solid var(--primary-brown-light)',
                            borderRadius: '6px',
                            color: 'var(--primary-brown)',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0
                          }}
                          title="Abrir Perfil 360° desta unidade"
                        >
                          <Eye size={14} /> Ficha 360°
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Selecione um gargalo no menu acima para iniciar a investigação cirúrgica.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODO 2: PANORAMA GERAL DA REDE (TOP 5 + TODAS AS CATEGORIAS HIERÁRQUICAS)
          ========================================================================= */}
      {viewMode === 'ALL' && (
        <>
          {/* Top 5 Dores Mais Crônicas da Rede */}
          {topNetworkProblems.length > 0 && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚨</span>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Top 5 Gargalos Mais Crônicos da Rede ({activePeriodLabel})
                  </h3>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Clique em qualquer item para abrir o <strong>Raio-X Cirúrgico</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                {topNetworkProblems.map((prob, idx) => {
                  const pct = stores.length > 0 ? ((prob.uniqueStoreIds.size / stores.length) * 100).toFixed(0) : 0;
                  return (
                    <div 
                      key={prob.subKey}
                      onClick={() => handleActivateFocus(prob.subKey)}
                      style={{
                        backgroundColor: '#FAF8F5',
                        border: '1px solid #E5E7EB',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-brown)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title="Clique para abrir o Raio-X Cirúrgico deste gargalo"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{
                          backgroundColor: idx === 0 ? '#FEF2F2' : '#EFF6FF',
                          color: idx === 0 ? '#DC2626' : '#1D4ED8',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          #{idx + 1} MAIOR GARGALO
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                          {prob.uniqueStoreIds.size} lojas ({pct}%)
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                        {prob.subTitle}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          📁 {prob.topicName}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                          Ver Raio-X &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Tópicos e Subtópicos em Acordeão */}
          {displayedTopics.length === 0 ? (
            <div style={{
              padding: '3.5rem 1rem',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Layers size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0.25rem 0' }}>
                Nenhum apontamento encontrado para {activePeriodLabel}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', margin: '0.5rem auto 1rem' }}>
                Tente selecionar outro mês, limpar o termo de busca ou resetar os filtros.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTopicFilter('Todos');
                  setSelectedStateFilter('Todos');
                  setSelectedSeverityFilter('Todos');
                  setSelectedPeriodFilter('ALL');
                }}
              >
                Resetar Todos os Filtros
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {displayedTopics.map((topic, tIdx) => {
                const isTopicExpanded = expandedTopics[topic.id] !== false;
                const pct = stores.length > 0 ? ((topic.uniqueStoresCount / stores.length) * 100).toFixed(0) : 0;

                return (
                  <div 
                    key={topic.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Header do Tópico */}
                    <div 
                      onClick={() => toggleTopic(topic.id)}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#FAF8F5',
                        borderBottom: isTopicExpanded ? '1px solid #E5E7EB' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-brown)',
                          fontWeight: 800,
                          fontSize: '1rem',
                          flexShrink: 0
                        }}>
                          {tIdx + 1}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                              {topic.name}
                            </h2>
                            <span style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.7rem',
                              fontWeight: 800
                            }}>
                              {topic.uniqueStoresCount} {topic.uniqueStoresCount === 1 ? 'loja afetada' : 'lojas afetadas'} ({pct}% da rede)
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              &bull; {topic.occurrencesCount} {topic.occurrencesCount === 1 ? 'ocorrência' : 'ocorrências'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {topic.subtopics.length} {topic.subtopics.length === 1 ? 'subtópico com apontamentos' : 'subtópicos com apontamentos'} em {activePeriodLabel}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {isTopicExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                      </div>
                    </div>

                    {/* Subtópicos deste Tópico */}
                    {isTopicExpanded && (
                      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {topic.subtopics.map(sub => {
                          const isSubExpanded = expandedSubtopics[sub.subKey] || (searchTerm && sub.subTitle.toUpperCase().includes(searchTerm.toUpperCase()));
                          const subPct = stores.length > 0 ? ((sub.uniqueStoreIds.size / stores.length) * 100).toFixed(0) : 0;

                          return (
                            <div 
                              key={sub.subKey}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Header do Subtópico */}
                              <div 
                                style={{
                                  padding: '0.75rem 1rem',
                                  backgroundColor: isSubExpanded ? '#FAF5EE' : '#FFFFFF',
                                  borderBottom: isSubExpanded ? '1px solid #E5E7EB' : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  userSelect: 'none'
                                }}
                                onClick={() => toggleSubtopic(sub.subKey)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: sub.severityCount.Crítica > 0 ? '#EF4444' : sub.severityCount.Alta > 0 ? '#F59E0B' : '#3B82F6'
                                  }} />
                                  
                                  <div>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                      {sub.subTitle}
                                    </span>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                      Identificado em <strong>{sub.uniqueStoreIds.size} lojas distintas</strong> ({subPct}% da rede) &bull; {sub.occurrencesCount} laudos
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  {/* Botão de abrir diretamente no Raio-X Cirúrgico */}
                                  <button
                                    type="button"
                                    className="no-print"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivateFocus(sub.subKey);
                                    }}
                                    style={{
                                      padding: '0.25rem 0.6rem',
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      border: '1px solid #FDE68A',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem'
                                    }}
                                    title="Abrir este gargalo na visão de Raio-X Cirúrgico"
                                  >
                                    <Crosshair size={12} /> Raio-X Cirúrgico
                                  </button>

                                  {isSubExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                                </div>
                              </div>

                              {/* Lojas Afetadas */}
                              {isSubExpanded && (
                                <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FAF8F5' }}>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                                    Lojas Afetadas ({sub.storesList.length} ocorrências):
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {sub.storesList.map((stItem, sIdx) => (
                                      <div 
                                        key={`${stItem.diagnosticId}-${sIdx}`}
                                        style={{
                                          backgroundColor: '#FFFFFF',
                                          border: '1px solid #E5E7EB',
                                          borderRadius: '6px',
                                          padding: '0.65rem 0.85rem',
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          justifyContent: 'space-between',
                                          gap: '0.75rem'
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{
                                              padding: '0.15rem 0.45rem',
                                              backgroundColor: '#F3F4F6',
                                              color: '#374151',
                                              borderRadius: '4px',
                                              fontWeight: 800,
                                              fontSize: '0.74rem'
                                            }}>
                                              {stItem.storeCode}
                                            </span>
                                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                              {stItem.storeName}
                                            </span>
                                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                              📍 {stItem.city}/{stItem.state} &bull; {stItem.locationType}
                                            </span>
                                            <span style={{
                                              fontSize: '0.66rem',
                                              fontWeight: 800,
                                              padding: '0.1rem 0.4rem',
                                              borderRadius: 'var(--radius-full)',
                                              backgroundColor: stItem.severity === 'Crítica' ? '#FEE2E2' : stItem.severity === 'Alta' ? '#FEF3C7' : '#EFF6FF',
                                              color: stItem.severity === 'Crítica' ? '#991B1B' : stItem.severity === 'Alta' ? '#92400E' : '#1D4ED8'
                                            }}>
                                              {stItem.severity}
                                            </span>
                                          </div>

                                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            🤝 Franqueado: <strong>{stItem.franchisee}</strong> &bull; 👨‍💼 Consultor: <strong>{stItem.consultantName}</strong> &bull; 📅 Visita: {formatBrDate(stItem.visitDate)}
                                          </div>

                                          {stItem.notes && stItem.notes !== 'Sem observações detalhadas.' && (
                                            <div style={{
                                              fontSize: '0.76rem',
                                              color: '#4B5563',
                                              backgroundColor: '#F9FAFB',
                                              padding: '0.35rem 0.55rem',
                                              borderRadius: '4px',
                                              marginTop: '0.35rem',
                                              borderLeft: '2.5px solid var(--primary-brown-light)'
                                            }}>
                                              📝 {stItem.notes}
                                            </div>
                                          )}

                                          {stItem.actionPlan?.action && (
                                            <div style={{ fontSize: '0.74rem', color: '#1E40AF', marginTop: '0.3rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                              <span>🎯 Plano: <strong>{stItem.actionPlan.action}</strong></span>
                                              <span>⏰ Prazo: {stItem.actionPlan.deadline || 'Imediato'}</span>
                                            </div>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          className="no-print"
                                          onClick={() => setSelectedStoreForProfile(stItem.storeRaw)}
                                          style={{
                                            padding: '0.3rem 0.65rem',
                                            backgroundColor: '#FAF5EE',
                                            border: '1px solid var(--primary-brown-light)',
                                            borderRadius: '6px',
                                            color: 'var(--primary-brown)',
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            flexShrink: 0
                                          }}
                                          title="Abrir Ficha 360° desta unidade"
                                        >
                                          <Eye size={12} /> Ficha da Loja
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODAL DE EXPORTAÇÃO E PROMPT PARA IA (CHATGPT / CLAUDE / GEMINI)
          ========================================================================= */}
      {isAiModalOpen && (
        <div 
          className="modal-overlay"
          style={{ zIndex: 11000, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}
          onClick={() => setIsAiModalOpen(false)}
        >
          <div 
            className="modal-card" 
            style={{ 
              maxWidth: '860px', 
              width: '95%', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              borderRadius: '18px', 
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal IA */}
            <div style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
              color: '#FFFFFF',
              padding: '1.4rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  🤖
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                    Alimentar Inteligência Artificial (ChatGPT / Claude / Gemini)
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#C7D2FE' }}>
                    Prompt de consultoria sênior alimentado com os dados reais de visitas do Spoleto Radar.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsAiModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Alternador de Modo no Modal de IA */}
            <div style={{
              padding: '0.75rem 1.75rem',
              backgroundColor: '#EEF2FF',
              borderBottom: '1px solid #E0E7FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAiModalTab('ALL')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: (aiModalTab === 'ALL' || (aiModalTab === 'AUTO' && viewMode === 'ALL')) ? '#4338CA' : '#FFFFFF',
                    color: (aiModalTab === 'ALL' || (aiModalTab === 'AUTO' && viewMode === 'ALL')) ? '#FFFFFF' : '#4338CA',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🌐 Diagnóstico Macro da Rede
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!focusedSubtopicData && allSubtopicsCatalog.length > 0) {
                      setFocusedSubKey(allSubtopicsCatalog[0].subKey);
                    }
                    setAiModalTab('FOCUS');
                  }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: (aiModalTab === 'FOCUS' || (aiModalTab === 'AUTO' && viewMode === 'FOCUS')) ? '#4338CA' : '#FFFFFF',
                    color: (aiModalTab === 'FOCUS' || (aiModalTab === 'AUTO' && viewMode === 'FOCUS')) ? '#FFFFFF' : '#4338CA',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🎯 Raio-X Cirúrgico ({focusedSubtopicData ? focusedSubtopicData.subTitle.substring(0, 30) + '...' : 'Problema Específico'})
                </button>
              </div>

              <span style={{ fontSize: '0.74rem', color: '#6366F1', fontWeight: 700 }}>
                📅 Período: {activePeriodLabel}
              </span>
            </div>

            {/* Conteúdo Prévia do Texto */}
            <div style={{ padding: '1.25rem 1.75rem', flex: 1, overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#1E293B',
                whiteSpace: 'pre-wrap',
                maxHeight: '380px',
                overflowY: 'auto',
                lineHeight: 1.5
              }}>
                {generateAiStructuredText(aiModalTab === 'AUTO' ? (viewMode === 'FOCUS' && focusedSubtopicData ? 'FOCUS' : 'ALL') : aiModalTab)}
              </div>

              <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: '#64748B' }}>
                <Sparkles size={14} color="#6366F1" />
                <span>
                  <strong>Como usar:</strong> Clique no botão abaixo para copiar o prompt executivo completo e cole diretamente no ChatGPT, Claude ou Gemini.
                </span>
              </div>
            </div>

            {/* Footer Modal IA */}
            <div style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsAiModalOpen(false)}
                style={{ fontSize: '0.84rem' }}
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleCopyAiData}
                style={{
                  backgroundColor: copiedAiData ? '#16A34A' : '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedAiData ? <Check size={16} /> : <Copy size={16} />}
                {copiedAiData ? 'Copiado para Área de Transferência!' : 'Copiar Tudo para a IA'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL EXECUTIVO: PRÉ-VISUALIZAÇÃO DO LAUDO SINTÉTICO (IMPRESSÃO & PDF)
          ========================================================================= */}
      {isExecutivePdfModalOpen && (
        <div 
          className="executive-pdf-modal-overlay"
          onClick={() => setIsExecutivePdfModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 12000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '1rem 0.75rem 1.25rem 0.75rem',
            overflow: 'hidden'
          }}
        >
          {/* Barra de Ações Superior Fixa do Modal (Oculta na impressão) */}
          <div 
            className="no-print"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '940px',
              width: '100%',
              margin: '0 auto 0.75rem auto',
              backgroundColor: '#3E2415',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              flexWrap: 'wrap',
              gap: '0.75rem',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={18} color="#F59E0B" />
              </div>
              <div>
                <strong style={{ fontSize: '0.92rem', display: 'block', color: '#FFFFFF' }}>
                  Relatório Executivo Sintético da Rede
                </strong>
                <span style={{ fontSize: '0.72rem', color: '#FEF3C7' }}>
                  ↕️ Role a página abaixo para revisar o laudo completo &bull; Padrão A4
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadExecutivePdf}
                disabled={isGeneratingPdf}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#451A03',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: isGeneratingPdf ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.15s ease'
                }}
                title="Fazer download imediato do arquivo PDF oficial"
              >
                <Download size={15} />
                {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#3E2415',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease'
                }}
                title="Imprimir ou Salvar como PDF na caixa de impressão"
              >
                <Printer size={15} />
                Imprimir
              </button>

              <button
                type="button"
                onClick={() => setIsExecutivePdfModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.45rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Fechar pré-visualização"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Container com Barra de Rolagem Dedicada para Revisar Todo o Relatório */}
          <div 
            className="executive-scroll-container no-print"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '940px',
              width: '100%',
              flex: 1,
              overflowY: 'auto',
              borderRadius: '10px',
              paddingRight: '6px',
              boxSizing: 'border-box'
            }}
          >
            <div 
              className="executive-modal-content"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                overflow: 'visible'
              }}
            >
              <ExecutiveNetworkPdfReport
                reportRef={executiveDocRef}
                activePeriodLabel={activePeriodLabel}
                selectedTopicFilter={selectedTopicFilter}
                selectedStateFilter={selectedStateFilter}
                selectedSeverityFilter={selectedSeverityFilter}
                viewMode={viewMode}
                focusedSubtopicData={focusedSubtopicData}
                stores={stores}
                totalUniqueStoresWithIssues={totalUniqueStoresWithIssues}
                totalIssuesCount={totalIssuesCount}
                topNetworkProblems={topNetworkProblems}
                displayedTopics={displayedTopics}
              />
            </div>

            {/* Barra de Ações ao Fim do Relatório (após a rolagem) */}
            <div style={{
              marginTop: '1.25rem',
              marginBottom: '1rem',
              padding: '0.9rem 1.25rem',
              backgroundColor: '#3E2415',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              color: '#FFFFFF'
            }}>
              <span style={{ fontSize: '0.8rem', color: '#FEF3C7', fontWeight: 700 }}>
                ✅ Fim do relatório executivo &bull; Revise os apontamentos antes de exportar
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleDownloadExecutivePdf}
                  disabled={isGeneratingPdf}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#451A03',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: isGeneratingPdf ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={14} /> {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#3E2415',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Printer size={14} /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renderização em segundo plano exclusivamente para Ctrl+P ou chamada de impressão direta */}
      <div className="only-print-document">
        <ExecutiveNetworkPdfReport
          activePeriodLabel={activePeriodLabel}
          selectedTopicFilter={selectedTopicFilter}
          selectedStateFilter={selectedStateFilter}
          selectedSeverityFilter={selectedSeverityFilter}
          viewMode={viewMode}
          focusedSubtopicData={focusedSubtopicData}
          stores={stores}
          totalUniqueStoresWithIssues={totalUniqueStoresWithIssues}
          totalIssuesCount={totalIssuesCount}
          topNetworkProblems={topNetworkProblems}
          displayedTopics={displayedTopics}
        />
      </div>

    </div>
  );
}
