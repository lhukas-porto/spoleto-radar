import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatBrDate } from '../utils/dateHelpers';
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
  ExternalLink
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

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('Todos');
  const [selectedStateFilter, setSelectedStateFilter] = useState('Todos');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('Todos');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState('ALL'); // 'ALL' | '30' | '60' | '90' | '2026'

  // Estado de Expansão de Tópicos e Subtópicos
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});

  // Modal de IA (Prompt & Dados)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [copiedAiData, setCopiedAiData] = useState(false);

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

  // Filtragem de visitas por período
  const filteredVisits = useMemo(() => {
    const now = new Date();
    return visits.filter(v => {
      if (!v.date) return true;
      const vDate = new Date(v.date);
      if (selectedPeriodFilter === '30') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      if (selectedPeriodFilter === '60') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 60;
      }
      if (selectedPeriodFilter === '90') {
        const diffDays = (now - vDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 90;
      }
      if (selectedPeriodFilter === '2026') {
        return v.date.startsWith('2026');
      }
      return true;
    });
  }, [visits, selectedPeriodFilter]);

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
    // Mapa auxiliar de lojas e consultores
    const storesMap = new Map(stores.map(s => [s.id, s]));
    const consultantsMap = new Map(consultants.map(c => [c.id, c]));

    // Estados disponíveis
    const statesSet = new Set();
    stores.forEach(s => { if (s.state) statesSet.add(s.state); });

    // Estrutura do Tópico:
    // topicId -> { id, name, color, icon, occurrencesCount, uniqueStoreIds: Set(), subtopics: Map() }
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

    // Itera sobre as visitas filtradas
    filteredVisits.forEach(visit => {
      const store = storesMap.get(visit.storeId);
      if (!store) return;

      // Filtro de Estado
      if (selectedStateFilter !== 'Todos' && store.state !== selectedStateFilter) {
        return;
      }

      const consultant = consultantsMap.get(visit.consultantId) || { name: visit.consultantName || 'Consultor Spoleto' };
      const storeFrans = getStoreFranchisees ? getStoreFranchisees(store.id) : [];
      const franchiseeName = storeFrans.length > 0 ? storeFrans.map(f => f.name).join(', ') : (store.franchisee || 'Franqueado Spoleto');

      (visit.diagnostics || []).forEach(diag => {
        // Filtro de Gravidade
        const sev = diag.severity || 'Alta';
        if (selectedSeverityFilter !== 'Todos' && sev !== selectedSeverityFilter) {
          return;
        }

        const catId = diag.categoryId && topicsMap.has(diag.categoryId) ? diag.categoryId : OTHER_CAT_ID;
        const topicObj = topicsMap.get(catId);
        const originalCat = categories.find(c => c.id === catId);

        // Identifica subtópico
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

        // Adiciona registro da loja afetada
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

    // Converte Map para Array e ordena por criticidade (lojas afetadas)
    const topicsArr = Array.from(topicsMap.values())
      .filter(t => t.occurrencesCount > 0)
      .map(t => {
        // Função para calcular o peso da prioridade (Alta/Crítica = 3, Média = 2, Baixa = 1)
        const getPriorityScore = (sub) => {
          if ((sub.severityCount?.Crítica || 0) > 0 || (sub.severityCount?.Alta || 0) > 0) return 3;
          if ((sub.severityCount?.Média || 0) > 0) return 2;
          return 1;
        };

        const subList = Array.from(t.subtopicsMap.values())
          .map(sub => {
            const pScore = getPriorityScore(sub);
            const priorityLabel = pScore === 3 ? 'Alta' : pScore === 2 ? 'Média' : 'Baixa';
            
            // Ordena lojas dentro do subtópico por gravidade
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
            // 1. Ordem por Prioridade (Alta > Média > Baixa)
            if (b.priorityScore !== a.priorityScore) {
              return b.priorityScore - a.priorityScore;
            }
            // 2. Desempate por número de lojas afetadas
            if (b.uniqueStoreIds.size !== a.uniqueStoreIds.size) {
              return b.uniqueStoreIds.size - a.uniqueStoreIds.size;
            }
            // 3. Desempate por ocorrências
            return b.occurrencesCount - a.occurrencesCount;
          });

        return {
          ...t,
          uniqueStoresCount: t.uniqueStoreIds.size,
          subtopics: subList
        };
      })
      .sort((a, b) => b.uniqueStoresCount - a.uniqueStoresCount || b.occurrencesCount - a.occurrencesCount);

    // Ranking Top Problemas Sistêmicos da Rede
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
  // FILTRAGEM FINAL POR BUSCA DE TEXTO OU TÓPICO SELECIONADO
  // =========================================================================
  const displayedTopics = useMemo(() => {
    let result = consolidatedTopics;

    // Filtro por Tópico específico
    if (selectedTopicFilter !== 'Todos') {
      result = result.filter(t => t.id === selectedTopicFilter || t.name === selectedTopicFilter);
    }

    // Busca por termo (ex: "embaixador", "ifood", "molho", "SPO-101")
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

          if (matchTopicName) {
            return t; // Mostra todos os subtópicos se o tópico der match
          }
          if (filteredSubs.length > 0) {
            return {
              ...t,
              subtopics: filteredSubs,
              uniqueStoresCount: new Set(filteredSubs.flatMap(s => Array.from(s.uniqueStoreIds))).size
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    return result;
  }, [consolidatedTopics, selectedTopicFilter, searchTerm]);

  // =========================================================================
  // GERADOR DO TEXTO DE DADOS ESTRUTURADOS PARA IA (PROMPT EXECUTIVO)
  // =========================================================================
  const generateAiStructuredText = () => {
    const totalStoresCount = stores.length;
    const periodLabel = {
      ALL: 'Histórico Completo',
      '30': 'Últimos 30 dias',
      '60': 'Últimos 60 dias',
      '90': 'Últimos 90 dias',
      '2026': 'Ano de 2026'
    }[selectedPeriodFilter] || 'Período Selecionado';

    let text = `================================================================================
RELATÓRIO ESTRUTURADO DE INTELIGÊNCIA OPERACIONAL DA REDE SPOLETO
DOCUMENTO GERADO PELO SPOLETO RADAR PARA ANÁLISE AVANÇADA POR IA (LLM)
================================================================================
Data de Extração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
Período de Referência: ${periodLabel}
Universo Total da Rede: ${totalStoresCount} lojas cadastradas
Lojas com Apontamentos no Período: ${totalUniqueStoresWithIssues} lojas (${totalStoresCount > 0 ? ((totalUniqueStoresWithIssues / totalStoresCount) * 100).toFixed(1) : 0}% da rede)
Total de Apontamentos / Não-Conformidades Coletadas: ${totalIssuesCount} ocorrências
Filtro de Estado (UF): ${selectedStateFilter}
Filtro de Gravidade: ${selectedSeverityFilter}

--------------------------------------------------------------------------------
PROMPT EXECUTIVO PARA A IA (INSTRUÇÕES DE ANÁLISE):
--------------------------------------------------------------------------------
Você é um consultor executivo sênior de inteligência operacional de franquias do Grupo Trigo / Spoleto.
Com base na matriz de dados reais coletada pelas consultorias de campo abaixo, produza um diagnóstico estratégico contendo:

1. DIAGNÓSTICO SISTÊMICO: Quais são as 3 maiores vulnerabilidades operacionais da rede hoje e por que estão acontecendo de forma recorrente?
2. ANÁLISE ESPECÍFICA DE EMBAIXADORES & FLUXO: Quantas lojas sofrem com falta de embaixador ou gargalo no pico de almoço? Qual o impacto financeiro e de imagem para a marca?
3. CORRELAÇÕES OCULTAS: Aponte correlações entre problemas de equipe (turnover/escala) e falhas no padrão de qualidade (Q.A) ou tempo de entrega.
4. PLANO DE AÇÃO EM 3 ONDAS:
   - Onda 1 (Próximos 15 dias): Ações imediatas de contenção para a Gerência Nacional e Consultores.
   - Onda 2 (30 a 60 dias): Ajustes de processos e capacitação prioritária na Universidade Spoleto.
   - Onda 3 (90 dias): Medidas estruturais para os Franqueados com maior número de reincidências.

--------------------------------------------------------------------------------
RANKING TOP 5 GARGALOS MAIS FREQUENTES DA REDE:
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
    const content = generateAiStructuredText();
    navigator.clipboard.writeText(content).then(() => {
      setCopiedAiData(true);
      showToast('🤖 Dados estruturados e Prompt copiados para a área de transferência! Cole no ChatGPT, Claude ou Gemini.');
      setTimeout(() => setCopiedAiData(false), 3000);
    });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* =========================================================================
          BANNER HERO EXECUTIVO DO RAIO-X
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
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
                <BarChart2 size={13} /> MATRIZ SISTÊMICA DA REDE
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700 }}>
                Diagnóstico de Tópicos & Subtópicos
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Raio-X da Rede
            </h1>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', maxWidth: '650px', lineHeight: 1.4 }}>
              Mapeamento de gargalos em toda a rede franqueada. Descubra quais e quantas lojas sofrem com falta de embaixador, desvios no CMV, tempo de pista e qualidade.
            </p>
          </div>

          {/* Ações de Exportação Executiva e IA */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              style={{
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: 'none',
                padding: '0.65rem 1.1rem',
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
              Copiar para IA
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
              title="Imprimir ou Salvar em PDF"
            >
              <Printer size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* 4 Mini KPIs Globais do Diagnóstico */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
              Lojas com Apontamentos
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.15rem' }}>
              {totalUniqueStoresWithIssues} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>/ {stores.length} lojas</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total de Ocorrências Coletadas
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FEF3C7', marginTop: '0.15rem' }}>
              {totalIssuesCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
              Tópicos com Alerta
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.15rem' }}>
              {consolidatedTopics.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>categorias</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 700 }}>
              Gargalo Mais Frequente
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FDE68A', marginTop: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topNetworkProblems[0] ? `${topNetworkProblems[0].uniqueStoreIds.size} lojas: ${topNetworkProblems[0].subTitle}` : 'Sem apontamentos'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAINEL TOP 5 MAIORES GARGALOS DA REDE SPOLETO
          ========================================================================= */}
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
                Top 5 Dores Mais Crônicas da Rede Spoleto (Prioridade de Intervenção)
              </h3>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Ordenado pelo número de lojas afetadas
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {topNetworkProblems.map((prob, idx) => {
              const pct = stores.length > 0 ? ((prob.uniqueStoreIds.size / stores.length) * 100).toFixed(0) : 0;
              return (
                <div 
                  key={prob.subKey}
                  onClick={() => {
                    setSearchTerm(prob.subTitle);
                    setExpandedTopics(prev => ({ ...prev, [prob.topicId]: true }));
                    setExpandedSubtopics(prev => ({ ...prev, [prob.subKey]: true }));
                  }}
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
                  title="Clique para filtrar diretamente este problema na lista abaixo"
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

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    📁 {prob.topicName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          BARRA DE PESQUISA & FILTROS INTELIGENTES
          ========================================================================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* Linha 1: Input de Busca com destaque para palavras-chave como Embaixador */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por palavra-chave: 'embaixador', 'delivery', 'molho', 'limpeza', código de loja..."
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
        </div>

        {/* Linha 2: Filtros Rápidos (Período, Estado, Gravidade, Tópico) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {/* Período */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📅 Período de Visita
            </label>
            <select
              value={selectedPeriodFilter}
              onChange={(e) => setSelectedPeriodFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="ALL">Todo o Histórico</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="2026">Ano Atual (2026)</option>
            </select>
          </div>

          {/* Tópico Principal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📁 Tópico / Categoria
            </label>
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todos os Tópicos ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Estado / UF */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              📍 Regional / Estado (UF)
            </label>
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todos os Estados</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Gravidade */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              ⚠️ Gravidade do Apontamento
            </label>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
            >
              <option value="Todos">Todas as Gravidades</option>
              <option value="Crítica">Apenas Crítica</option>
              <option value="Alta">Apenas Alta</option>
              <option value="Média">Apenas Média</option>
              <option value="Baixa">Apenas Baixa</option>
            </select>
          </div>
        </div>

        {/* Atalhos Rápidos de Palavras-Chave (Ex: Embaixador) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sugestões de busca rápida:</span>
          {['Embaixador', 'Fila', 'iFood', 'CMV', 'Validade', 'Uniforme', 'Treinamento'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchTerm(tag)}
              style={{
                padding: '0.2rem 0.55rem',
                backgroundColor: searchTerm === tag ? 'var(--primary-brown)' : '#F3F4F6',
                color: searchTerm === tag ? '#FFFFFF' : '#374151',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔍 {tag}
            </button>
          ))}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ padding: '0.2rem 0.55rem', background: 'none', border: 'none', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Limpar busca
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          LISTA HIERÁRQUICA: TÓPICOS -> SUBTÓPICOS -> LOJAS AFETADAS
          ========================================================================= */}
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
            Nenhum apontamento encontrado com os filtros atuais
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '480px', margin: '0.5rem auto 1rem' }}>
            Tente alterar o período, limpar o termo de busca ou selecionar outro estado/gravidade.
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
            const isTopicExpanded = expandedTopics[topic.id] !== false; // Padrão expandido
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
                        {topic.subtopics.length} {topic.subtopics.length === 1 ? 'subtópico com apontamentos' : 'subtópicos com apontamentos'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {isTopicExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Corpo do Tópico (Subtópicos) */}
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
                            onClick={() => toggleSubtopic(sub.subKey)}
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
                              {sub.priorityLabel === 'Alta' ? (
                                <span style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#991B1B',
                                  border: '1px solid #FCA5A5',
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  🔥 PRIORIDADE ALTA
                                </span>
                              ) : sub.priorityLabel === 'Média' ? (
                                <span style={{
                                  backgroundColor: '#FEF3C7',
                                  color: '#92400E',
                                  border: '1px solid #FDE68A',
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  ⚡ PRIORIDADE MÉDIA
                                </span>
                              ) : (
                                <span style={{
                                  backgroundColor: '#EFF6FF',
                                  color: '#1E40AF',
                                  border: '1px solid #BFDBFE',
                                  padding: '0.18rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  📌 PRIORIDADE BAIXA
                                </span>
                              )}

                              {isSubExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                            </div>
                          </div>

                          {/* Lista das Lojas Afetadas por este Subtópico */}
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

      {/* =========================================================================
          MODAL DE EXPORTAÇÃO E PROMPT PARA IA
          ========================================================================= */}
      {isAiModalOpen && (
        <div 
          className="modal-overlay"
          style={{ zIndex: 11000, backgroundColor: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(5px)' }}
          onClick={() => setIsAiModalOpen(false)}
        >
          <div 
            className="modal-card" 
            style={{ 
              maxWidth: '820px', 
              width: '94%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              borderRadius: '18px', 
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
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
                    O Spoleto Radar estruturou a matriz de problemas da rede com um prompt executivo de consultoria de alto nível.
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
                maxHeight: '400px',
                overflowY: 'auto',
                lineHeight: 1.5
              }}>
                {generateAiStructuredText()}
              </div>

              <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', color: '#64748B' }}>
                <Sparkles size={14} color="#6366F1" />
                <span>
                  <strong>Como usar:</strong> Clique no botão abaixo para copiar o texto inteiro e cole no seu modelo de IA favorito (ChatGPT, Claude ou Gemini).
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

    </div>
  );
}
