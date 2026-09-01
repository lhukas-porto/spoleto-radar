import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Store, 
  Star, 
  TrendingUp, 
  Filter, 
  Search, 
  Building2, 
  User, 
  Handshake, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Compass,
  Layers,
  ArrowRight,
  Info,
  Flame,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { BRAZILIAN_STATES } from '../utils/brazilianLocations';
import { BRAZIL_SVG_STATES } from '../utils/brazilSvgPaths';

const REGION_BY_UF = {
  'RR': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'AC': 'Norte', 'RO': 'Norte', 'TO': 'Norte',
  'MA': 'Nordeste', 'PI': 'Nordeste', 'CE': 'Nordeste', 'RN': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'AL': 'Nordeste', 'SE': 'Nordeste', 'BA': 'Nordeste',
  'MT': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'DF': 'Centro-Oeste', 'MS': 'Centro-Oeste',
  'MG': 'Sudeste', 'ES': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  'PR': 'Sul', 'SC': 'Sul', 'RS': 'Sul'
};

export default function NetworkMapView() {
  const { 
    stores = [], 
    visits = [],
    categories = [],
    consultants = [], 
    franchisees = [], 
    getStoreFranchisees,
    setSelectedStoreForProfile,
    setSelectedVisitForReport
  } = useApp();

  // Modo de Visualização do Mapa: 'general' (Geral de Notas) ou 'heatmap' (Calor por Tópicos)
  const [mapMode, setMapMode] = useState('general'); // 'general' | 'heatmap'

  // Filtros Globais
  const [selectedUF, setSelectedUF] = useState('SP');
  const [hoveredUF, setHoveredUF] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [localSearch, setLocalSearch] = useState('');

  // Filtros Específicos do Modo Mapa de Calor
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedSubproblemId, setSelectedSubproblemId] = useState('all');

  // Subproblemas da categoria selecionada
  const currentCategory = categories.find(c => c.id === selectedCategoryId);
  const availableSubproblems = currentCategory?.subproblems || [];

  // Mapear diagnósticos por loja e estado
  const diagnosticsByStoreId = useMemo(() => {
    const map = {};
    visits.forEach(v => {
      (v.diagnostics || []).forEach(d => {
        if (!map[v.storeId]) map[v.storeId] = [];
        map[v.storeId].push({
          ...d,
          visitId: v.id,
          visitDate: v.date,
          visitType: v.visitType,
          consultantId: v.consultantId
        });
      });
    });
    return map;
  }, [visits]);

  // Estatísticas Gerais e de Calor por Estado (UF)
  const stateStats = useMemo(() => {
    const stats = {};
    
    BRAZILIAN_STATES.forEach(st => {
      const stateStores = stores.filter(s => s.state === st.uf);
      const totalScore = stateStores.reduce((acc, s) => acc + (s.rating_score || s.ratingScore || 8.5), 0);
      const avgScore = stateStores.length > 0 ? (totalScore / stateStores.length) : 0;
      
      // Coletar todos os diagnósticos das lojas deste estado
      const stateDiagnostics = [];
      stateStores.forEach(store => {
        const storeDiags = diagnosticsByStoreId[store.id] || [];
        storeDiags.forEach(d => {
          stateDiagnostics.push({
            ...d,
            storeName: store.name,
            storeCode: store.code,
            storeCity: store.city,
            storeId: store.id
          });
        });
      });

      // Filtrar diagnósticos de acordo com o Tópico e Subtópico selecionados no Mapa de Calor
      const filteredDiags = stateDiagnostics.filter(d => {
        if (selectedCategoryId !== 'all' && d.categoryId !== selectedCategoryId) return false;
        if (selectedSubproblemId !== 'all' && d.subproblemId !== selectedSubproblemId) return false;
        return true;
      });

      stats[st.uf] = {
        uf: st.uf,
        name: st.name,
        stores: stateStores,
        count: stateStores.length,
        avgScore: avgScore > 0 ? Number(avgScore.toFixed(1)) : 0,
        region: REGION_BY_UF[st.uf] || 'Outro',
        allDiagnostics: stateDiagnostics,
        topicDiagnostics: filteredDiags,
        problemCount: filteredDiags.length
      };
    });
    return stats;
  }, [stores, diagnosticsByStoreId, selectedCategoryId, selectedSubproblemId]);

  // Lista de estados filtrados pela região
  const filteredStatesList = useMemo(() => {
    return Object.values(stateStats).filter(st => {
      if (selectedRegion !== 'Todas' && st.region !== selectedRegion) return false;
      return true;
    }).sort((a, b) => mapMode === 'heatmap' ? b.problemCount - a.problemCount : b.count - a.count);
  }, [stateStats, selectedRegion, mapMode]);

  // Lojas / Problemas do Estado Selecionado com busca local
  const currentSelectedStateData = stateStats[selectedUF] || { 
    stores: [], 
    count: 0, 
    avgScore: 0, 
    name: '', 
    topicDiagnostics: [], 
    problemCount: 0 
  };
  
  const stateStoresFiltered = useMemo(() => {
    return (currentSelectedStateData.stores || []).filter(s => {
      const term = localSearch.toLowerCase().trim();
      if (!term) return true;
      return (s.name || '').toLowerCase().includes(term) ||
             (s.city || '').toLowerCase().includes(term) ||
             (s.code || '').toLowerCase().includes(term) ||
             (s.franchisee || '').toLowerCase().includes(term) ||
             (s.address || '').toLowerCase().includes(term);
    });
  }, [currentSelectedStateData, localSearch]);

  const stateProblemsFiltered = useMemo(() => {
    return (currentSelectedStateData.topicDiagnostics || []).filter(d => {
      const term = localSearch.toLowerCase().trim();
      if (!term) return true;
      return (d.storeName || '').toLowerCase().includes(term) ||
             (d.storeCity || '').toLowerCase().includes(term) ||
             (d.subproblemTitle || d.problem || '').toLowerCase().includes(term) ||
             (d.actionPlan?.what || '').toLowerCase().includes(term);
    });
  }, [currentSelectedStateData, localSearch]);

  // Cores de Heatmap baseadas no modo ativo
  const getStateColor = (uf, isSelected, isHovered) => {
    const data = stateStats[uf] || { count: 0, avgScore: 0, problemCount: 0 };
    const hasStores = data.count > 0;

    if (isSelected) {
      return {
        fill: '#3D2214',
        stroke: 'var(--accent-gold)',
        strokeWidth: 3,
        textColor: '#FFFFFF',
        badgeBg: '#3D2214',
        badgeBorder: 'var(--accent-gold)'
      };
    }

    if (isHovered) {
      return {
        fill: hasStores ? '#8C5839' : '#CBD5E1',
        stroke: 'var(--accent-gold)',
        strokeWidth: 2.5,
        textColor: '#FFFFFF',
        badgeBg: '#5D3826',
        badgeBorder: '#FFFFFF'
      };
    }

    if (!hasStores) {
      return {
        fill: '#E2E8F0',
        stroke: '#CBD5E1',
        strokeWidth: 1,
        textColor: '#94A3B8',
        badgeBg: '#CBD5E1',
        badgeBorder: '#94A3B8'
      };
    }

    // MODO 1: GERAL DE NOTAS
    if (mapMode === 'general') {
      if (data.avgScore >= 8.5) {
        return {
          fill: '#DCFCE7',
          stroke: '#16A34A',
          strokeWidth: 1.5,
          textColor: '#14532D',
          badgeBg: '#15803D',
          badgeBorder: '#FFFFFF'
        };
      }
      if (data.avgScore >= 7.5) {
        return {
          fill: '#FEF3C7',
          stroke: '#D97706',
          strokeWidth: 1.5,
          textColor: '#78350F',
          badgeBg: '#D97706',
          badgeBorder: '#FFFFFF'
        };
      }
      return {
        fill: '#FEE2E2',
        stroke: '#DC2626',
        strokeWidth: 1.5,
        textColor: '#7F1D1D',
        badgeBg: '#DC2626',
        badgeBorder: '#FFFFFF'
      };
    }

    // MODO 2: MAPA DE CALOR POR NÃO-CONFORMIDADES (TÓPICOS/SUBTÓPICOS)
    const pCount = data.problemCount;
    if (pCount === 0) {
      return {
        fill: '#DCFCE7',
        stroke: '#16A34A',
        strokeWidth: 1.5,
        textColor: '#14532D',
        badgeBg: '#16A34A',
        badgeBorder: '#FFFFFF'
      };
    }
    if (pCount <= 3) {
      return {
        fill: '#FEF3C7',
        stroke: '#D97706',
        strokeWidth: 1.5,
        textColor: '#78350F',
        badgeBg: '#D97706',
        badgeBorder: '#FFFFFF'
      };
    }
    // Crítico (Muitos problemas no tópico)
    return {
      fill: '#FEE2E2',
      stroke: '#EF4444',
      strokeWidth: 2,
      textColor: '#991B1B',
      badgeBg: '#EF4444',
      badgeBorder: '#FFFFFF'
    };
  };

  const activeHoverData = hoveredUF ? stateStats[hoveredUF] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
      
      {/* 1. Barra de Modo do Mapa (Geral vs Mapa de Calor por Tópicos) */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Compass size={24} color="var(--primary-brown)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                Cartografia Territorial Spoleto (Brasil)
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              Selecione entre a visão de rede por notas ou o <strong>Mapa de Calor de Não-Conformidades</strong> por Tópico e Subtópico.
            </p>
          </div>

          {/* Seletor de Modo do Mapa */}
          <div style={{ display: 'flex', background: '#FAF8F5', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-subtle)', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setMapMode('general')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                background: mapMode === 'general' ? 'var(--primary-brown)' : 'transparent',
                color: mapMode === 'general' ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
                boxShadow: mapMode === 'general' ? '0 2px 6px rgba(93,56,38,0.25)' : 'none'
              }}
            >
              <Building2 size={16} /> Visão Geral da Rede
            </button>

            <button
              type="button"
              onClick={() => setMapMode('heatmap')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: 800,
                border: 'none',
                background: mapMode === 'heatmap' ? '#DC2626' : 'transparent',
                color: mapMode === 'heatmap' ? '#FFFFFF' : 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease',
                boxShadow: mapMode === 'heatmap' ? '0 2px 6px rgba(220,38,38,0.3)' : 'none'
              }}
            >
              <Flame size={16} /> 🔥 Mapa de Calor por Tópicos
            </button>
          </div>
        </div>

        {/* Linha de Filtros Dinâmica conforme o Modo */}
        {mapMode === 'heatmap' ? (
          /* FILTROS DO MAPA DE CALOR: Tópicos e Subtópicos */
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1.5px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            {/* Seletor de Tópico (Categoria) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', marginBottom: '0.35rem' }}>
                📂 Tópico Principal (Categoria):
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedSubproblemId('all');
                }}
                style={{ width: '100%', height: '40px', fontSize: '0.85rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', borderColor: '#CBD5E1', background: '#FFFFFF' }}
              >
                <option value="all">🔥 Todos os Tópicos (Visão Geral de Problemas)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Subtópico (Subproblema) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-brown)', marginBottom: '0.35rem' }}>
                🔍 Subtópico Específico (Não-Conformidade):
              </label>
              <select
                value={selectedSubproblemId}
                onChange={(e) => setSelectedSubproblemId(e.target.value)}
                disabled={selectedCategoryId === 'all' || availableSubproblems.length === 0}
                style={{ width: '100%', height: '40px', fontSize: '0.85rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', borderColor: '#CBD5E1', background: selectedCategoryId === 'all' ? '#F1F5F9' : '#FFFFFF' }}
              >
                <option value="all">⚡ Todos os Subtópicos deste Tópico</option>
                {availableSubproblems.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.title}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Região */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                🧭 Macrorregião:
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {['Todas', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRegion(r)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: selectedRegion === r ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                      background: selectedRegion === r ? 'var(--primary-brown)' : '#FFFFFF',
                      color: selectedRegion === r ? '#FFFFFF' : 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* FILTROS DO MODO GERAL */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Macrorregião:</span>
              {['Todas', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRegion(r)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: selectedRegion === r ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                    background: selectedRegion === r ? 'var(--primary-brown)' : '#FFFFFF',
                    color: selectedRegion === r ? '#FFFFFF' : 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Total: <strong>{stores.length}</strong> restaurantes em <strong>21</strong> estados
            </div>
          </div>
        )}

        {/* Legenda de Nível de Maturidade ou Severidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.92rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
            {mapMode === 'heatmap' ? '🔥 Intensidade de Não-Conformidades:' : '⭐ Média da Nota de Auditoria:'}
          </span>
          
          {mapMode === 'heatmap' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#DCFCE7', border: '2px solid #16A34A', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#14532D' }}>Sem Ocorrências / Conforme</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEF3C7', border: '2px solid #D97706', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#78350F' }}>Atenção (1 a 3 ocorrências)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEE2E2', border: '2px solid #EF4444', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#991B1B' }}>Crítico (&ge; 4 ocorrências)</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#DCFCE7', border: '2px solid #16A34A', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#14532D' }}>Excelente (&ge; 8.5)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEF3C7', border: '2px solid #D97706', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#78350F' }}>Atenção (7.5 - 8.4)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEE2E2', border: '2px solid #DC2626', display: 'inline-block' }} />
                <span style={{ fontWeight: 700, color: '#7F1D1D' }}>Crítico (&lt; 7.5)</span>
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#E2E8F0', border: '2px solid #CBD5E1', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#64748B' }}>Sem Lojas Ativas</span>
          </div>
        </div>
      </div>

      {/* 2. Grid Principal: Mapa SVG Cartográfico à Esquerda + Drilldown à Direita */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.35fr) minmax(350px, 1fr)', gap: '1.5rem' }}>
        
        {/* Painel do Mapa Cartográfico SVG do Brasil */}
        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '620px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {mapMode === 'heatmap' ? '🔥 Mapa de Calor Territorial de Não-Conformidades' : 'Cartografia Territorial do Brasil (IBGE)'}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Passe o mouse ou clique no estado
            </span>
          </div>

          {/* SVG Map Container */}
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '530px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, #FAF8F5 0%, #EFE9E2 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '0.75rem' }}>
            
            {/* Tooltip Flutuante de Hover */}
            {activeHoverData && (
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 20,
                background: 'rgba(61, 34, 20, 0.95)',
                color: '#FFFFFF',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                backdropFilter: 'blur(6px)',
                fontSize: '0.88rem',
                border: '1.5px solid rgba(196, 154, 69, 0.6)'
              }}>
                <div style={{ fontWeight: 900, color: 'var(--accent-gold)', fontSize: '0.98rem' }}>
                  {activeHoverData.name} ({activeHoverData.uf})
                </div>
                <div style={{ marginTop: '0.2rem' }}>
                  {mapMode === 'heatmap' ? (
                    <>
                      <strong>{activeHoverData.problemCount}</strong> não-conformidades &bull; {activeHoverData.count} lojas
                    </>
                  ) : (
                    <>
                      <strong>{activeHoverData.count}</strong> restaurantes &bull; Média: <strong style={{ color: 'var(--accent-gold)' }}>{activeHoverData.avgScore}</strong>
                    </>
                  )}
                </div>
              </div>
            )}

            <svg 
              viewBox="0 0 600 600" 
              style={{ width: '100%', height: '100%', maxHeight: '560px', filter: 'drop-shadow(0 4px 12px rgba(93,56,38,0.12))' }}
            >
              {/* Renderizar Polígonos de Cada Estado do Brasil */}
              {Object.entries(BRAZIL_SVG_STATES).map(([uf, stateInfo]) => {
                const isSelected = selectedUF === uf;
                const isHovered = hoveredUF === uf;
                const colorConfig = getStateColor(uf, isSelected, isHovered);
                const data = stateStats[uf] || { count: 0, avgScore: 0 };
                const isRegionMatch = selectedRegion === 'Todas' || data.region === selectedRegion;

                return (
                  <path
                    key={uf}
                    d={stateInfo.d}
                    fill={colorConfig.fill}
                    stroke={colorConfig.stroke}
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.2}
                    opacity={isRegionMatch ? 1 : 0.25}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.18s ease-in-out',
                      outline: 'none'
                    }}
                    onMouseEnter={() => setHoveredUF(uf)}
                    onMouseLeave={() => setHoveredUF(null)}
                    onClick={() => setSelectedUF(uf)}
                  />
                );
              })}

              {/* Renderizar Labels e Badges de Lojas no Centroide de cada Estado */}
              {Object.entries(BRAZIL_SVG_STATES).map(([uf, stateInfo]) => {
                const data = stateStats[uf] || { count: 0, avgScore: 0, problemCount: 0 };
                const isSelected = selectedUF === uf;
                const isHovered = hoveredUF === uf;
                const colorConfig = getStateColor(uf, isSelected, isHovered);
                const hasStores = data.count > 0;
                const isRegionMatch = selectedRegion === 'Todas' || data.region === selectedRegion;

                if (!stateInfo.center || !isRegionMatch) return null;

                const displayValue = mapMode === 'heatmap' ? `${data.problemCount}` : `${data.count}`;
                const badgeWidth = data.count >= 100 ? 44 : data.count >= 10 ? 38 : 34;
                const badgeHeight = 24;

                return (
                  <g 
                    key={`label-${uf}`}
                    transform={`translate(${stateInfo.center.x}, ${stateInfo.center.y})`}
                    onClick={() => setSelectedUF(uf)}
                    onMouseEnter={() => setHoveredUF(uf)}
                    onMouseLeave={() => setHoveredUF(null)}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                  >
                    {hasStores ? (
                      <g>
                        {/* Glow ao selecionar ou hover */}
                        {(isSelected || isHovered) && (
                          <rect 
                            x={-badgeWidth / 2 - 4} 
                            y={-badgeHeight / 2 - 4} 
                            width={badgeWidth + 8} 
                            height={badgeHeight + 8} 
                            rx="14" 
                            fill="none" 
                            stroke="var(--accent-gold)" 
                            strokeWidth="3" 
                            strokeDasharray="4,4"
                          />
                        )}

                        {/* Pílula / Badge do Estado */}
                        <rect 
                          x={-badgeWidth / 2} 
                          y={-badgeHeight / 2} 
                          width={badgeWidth} 
                          height={badgeHeight} 
                          rx="6" 
                          fill={colorConfig.badgeBg}
                          stroke={colorConfig.badgeBorder} 
                          strokeWidth="2"
                          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
                        />

                        {/* Sigla UF (Linha Superior) - SEMPRE BRANCO */}
                        <text 
                          x="0" 
                          y="-2" 
                          textAnchor="middle" 
                          fontSize="9.5" 
                          fontWeight="900" 
                          fill="#FFFFFF"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {uf}
                        </text>

                        {/* Quantidade de Lojas / Problemas (Linha Inferior) - SEMPRE BRANCO NÍTIDO */}
                        <text 
                          x="0" 
                          y="8" 
                          textAnchor="middle" 
                          fontSize="9.5" 
                          fontWeight="900" 
                          fill="#FFFFFF"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {displayValue}
                        </text>
                      </g>
                    ) : (
                      // Sigla nítida para estados sem lojas
                      <text 
                        x="0" 
                        y="4" 
                        textAnchor="middle" 
                        fontSize="11" 
                        fontWeight="800" 
                        fill="#64748B"
                        opacity="0.9"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {uf}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Atalhos Rápidos para Estados */}
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              {mapMode === 'heatmap' ? 'Estados com Mais Ocorrências:' : 'Principais Praças:'}
            </span>
            {filteredStatesList.slice(0, 8).map(st => (
              <button
                key={st.uf}
                type="button"
                onClick={() => setSelectedUF(st.uf)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  border: selectedUF === st.uf ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  background: selectedUF === st.uf ? 'var(--primary-brown)' : '#FFFFFF',
                  color: selectedUF === st.uf ? '#FFFFFF' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {st.uf} ({mapMode === 'heatmap' ? `${st.problemCount} prob` : `${st.count} ljs`})
              </button>
            ))}
          </div>
        </div>

        {/* 3. Painel Lateral: Detalhes & Lista Dinâmica (Lojas ou Problemas) */}
        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '680px' }}>
          
          {/* Cabeçalho do Estado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, background: 'var(--primary-brown)', color: '#FFFFFF', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-sm)' }}>
                  {selectedUF}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {currentSelectedStateData.name || selectedUF}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Região {currentSelectedStateData.region} &bull; {currentSelectedStateData.count} restaurantes
                  </span>
                </div>
              </div>
            </div>

            {/* KPI do Cabeçalho */}
            {mapMode === 'heatmap' ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <Flame size={18} color="#DC2626" />
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: currentSelectedStateData.problemCount > 0 ? '#DC2626' : '#15803D' }}>
                    {currentSelectedStateData.problemCount}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: currentSelectedStateData.problemCount > 0 ? '#DC2626' : '#15803D' }}>
                  {currentSelectedStateData.problemCount === 0 ? 'Conforme' : currentSelectedStateData.problemCount <= 3 ? 'Atenção' : 'Crítico'}
                </span>
              </div>
            ) : (
              currentSelectedStateData.count > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                    <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      {currentSelectedStateData.avgScore}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: currentSelectedStateData.avgScore >= 8.5 ? '#15803D' : currentSelectedStateData.avgScore >= 7.5 ? '#D97706' : '#DC2626' }}>
                    {currentSelectedStateData.avgScore >= 8.5 ? 'Excelente' : currentSelectedStateData.avgScore >= 7.5 ? 'Atenção' : 'Crítico'}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Campo de Busca Rápida */}
          <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={mapMode === 'heatmap' ? `Buscar não-conformidade em ${selectedUF}...` : `Buscar entre as ${currentSelectedStateData.count} lojas de ${selectedUF}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', width: '100%', height: '38px', fontSize: '0.84rem', margin: 0 }}
            />
          </div>

          {/* LISTA DINÂMICA: SE MAPA DE CALOR, MOSTRA NÃO-CONFORMIDADES; SE GERAL, MOSTRA LOJAS */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.25rem' }}>
            {mapMode === 'heatmap' ? (
              /* MODO MAPA DE CALOR: Lista de Ocorrências e Planos de Ação */
              stateProblemsFiltered.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 0.5rem' }} />
                  <strong style={{ display: 'block', color: '#166534', fontSize: '0.95rem' }}>
                    Nenhuma não-conformidade apontada!
                  </strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem' }}>
                    {selectedCategoryId === 'all' 
                      ? `Os restaurantes do estado de ${selectedUF} estão 100% conformes nos tópicos avaliados.` 
                      : `Nenhum problema no tópico "${currentCategory?.name}" foi registrado em ${selectedUF}.`}
                  </p>
                </div>
              ) : (
                stateProblemsFiltered.map((d, idx) => {
                  const cat = categories.find(c => c.id === d.categoryId);
                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #FECACA',
                        background: '#FFF5F5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                              {d.severity || 'Alta'}
                            </span>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {cat?.name || 'Operação'}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#991B1B' }}>
                            {d.subproblemTitle || d.problem || 'Não conformidade'}
                          </h4>
                        </div>

                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                          {d.visitDate ? new Date(d.visitDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>

                      {/* Restaurante Afetado */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 700 }}>
                        <Store size={13} color="var(--primary-brown)" />
                        <span>{d.storeName} ({d.storeCity})</span>
                      </div>

                      {/* Plano de Ação */}
                      {d.actionPlan && d.actionPlan.what && (
                        <div style={{ background: '#FFFFFF', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                          <strong style={{ color: 'var(--primary-brown)' }}>Plano de Ação:</strong> {d.actionPlan.what}
                        </div>
                      )}

                      {/* Botão para abrir a ficha da loja */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const foundStore = stores.find(s => s.id === d.storeId);
                            if (foundStore && setSelectedStoreForProfile) setSelectedStoreForProfile(foundStore);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-brown)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: 0
                          }}
                        >
                          Ver Ficha da Loja <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* MODO GERAL: Lista de Restaurantes */
              stateStoresFiltered.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {currentSelectedStateData.count === 0 ? (
                    <p>Nenhuma loja Spoleto cadastrada no estado de <strong>{selectedUF}</strong> ainda.</p>
                  ) : (
                    <p>Nenhuma loja encontrada para o termo pesquisado.</p>
                  )}
                </div>
              ) : (
                stateStoresFiltered.map(store => {
                  const storeFrans = getStoreFranchisees ? getStoreFranchisees(store.id) : [];

                  return (
                    <div 
                      key={store.id}
                      onClick={() => setSelectedStoreForProfile && setSelectedStoreForProfile(store)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-brown)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--primary-brown)' }}>
                              {store.code}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {store.locationType || 'Shopping'}
                            </span>
                          </div>
                          <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {store.name}
                          </h4>
                        </div>

                        {/* Nota da Loja */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FAF8F5', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                          <Star size={13} fill="var(--accent-gold)" color="var(--accent-gold)" />
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {store.rating_score || store.ratingScore || 8.5}
                          </span>
                        </div>
                      </div>

                      {/* Endereço / CEP Real */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <MapPin size={12} color="var(--primary-brown)" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.address || `${store.city} - ${store.state}`} &bull; CEP: {store.cep || '00000-000'}
                        </span>
                      </div>

                      {/* Rodapé do Card: Franqueado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-main)' }}>
                          <Handshake size={12} color="var(--primary-brown)" />
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', whiteSpace: 'nowrap' }}>
                            {storeFrans.length > 0 ? storeFrans.map(f => f.name).join(', ') : (store.franchisee || 'Franqueado')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-brown)', fontWeight: 800, fontSize: '0.74rem' }}>
                          Ver Ficha 360º <ArrowRight size={11} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
