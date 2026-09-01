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
  Info
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
    consultants = [], 
    franchisees = [], 
    getStoreFranchisees,
    setSelectedStoreForProfile 
  } = useApp();

  const [selectedUF, setSelectedUF] = useState('SP');
  const [hoveredUF, setHoveredUF] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [scoreTierFilter, setScoreTierFilter] = useState('Todas');
  const [localSearch, setLocalSearch] = useState('');

  // Agrupar dados por Estado (UF)
  const stateStats = useMemo(() => {
    const stats = {};
    BRAZILIAN_STATES.forEach(st => {
      const stateStores = stores.filter(s => s.state === st.uf);
      const totalScore = stateStores.reduce((acc, s) => acc + (s.rating_score || s.ratingScore || 8.5), 0);
      const avgScore = stateStores.length > 0 ? (totalScore / stateStores.length) : 0;
      
      stats[st.uf] = {
        uf: st.uf,
        name: st.name,
        stores: stateStores,
        count: stateStores.length,
        avgScore: avgScore > 0 ? Number(avgScore.toFixed(1)) : 0,
        region: REGION_BY_UF[st.uf] || 'Outro'
      };
    });
    return stats;
  }, [stores]);

  // Lista de estados filtrados pela região
  const filteredStatesList = useMemo(() => {
    return Object.values(stateStats).filter(st => {
      if (selectedRegion !== 'Todas' && st.region !== selectedRegion) return false;
      if (scoreTierFilter === 'green' && (st.count === 0 || st.avgScore < 8.5)) return false;
      if (scoreTierFilter === 'yellow' && (st.count === 0 || st.avgScore < 7.5 || st.avgScore >= 8.5)) return false;
      if (scoreTierFilter === 'red' && (st.count === 0 || st.avgScore >= 7.5)) return false;
      return true;
    }).sort((a, b) => b.count - a.count);
  }, [stateStats, selectedRegion, scoreTierFilter]);

  // Lojas do Estado Selecionado com busca local
  const currentSelectedStateData = stateStats[selectedUF] || { stores: [], count: 0, avgScore: 0, name: '' };
  
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

  // Cores de Heatmap baseadas na média de nota e densidade
  const getStateColor = (uf, isSelected, isHovered) => {
    const data = stateStats[uf] || { count: 0, avgScore: 0 };
    const hasStores = data.count > 0;

    if (isSelected) {
      return {
        fill: '#5D3826',
        stroke: '#C49A45',
        strokeWidth: 2.5,
        textColor: '#FFFFFF',
        badgeBg: 'var(--primary-gold)',
        badgeText: '#3D2214'
      };
    }

    if (isHovered) {
      return {
        fill: hasStores ? '#8C5839' : '#CBD5E1',
        stroke: '#C49A45',
        strokeWidth: 2,
        textColor: '#FFFFFF',
        badgeBg: '#5D3826',
        badgeText: '#FFFFFF'
      };
    }

    if (!hasStores) {
      return {
        fill: '#E2E8F0',
        stroke: '#CBD5E1',
        strokeWidth: 0.8,
        textColor: '#94A3B8',
        badgeBg: '#CBD5E1',
        badgeText: '#64748B'
      };
    }

    // Heatmap por nota média
    if (data.avgScore >= 8.5) {
      return {
        fill: '#DCFCE7',
        stroke: '#16A34A',
        strokeWidth: 1.2,
        textColor: '#14532D',
        badgeBg: '#15803D',
        badgeText: '#FFFFFF'
      };
    }

    if (data.avgScore >= 7.5) {
      return {
        fill: '#FEF3C7',
        stroke: '#D97706',
        strokeWidth: 1.2,
        textColor: '#78350F',
        badgeBg: '#D97706',
        badgeText: '#FFFFFF'
      };
    }

    return {
      fill: '#FEE2E2',
      stroke: '#DC2626',
      strokeWidth: 1.2,
      textColor: '#7F1D1D',
      badgeBg: '#DC2626',
      badgeText: '#FFFFFF'
    };
  };

  const activeHoverData = hoveredUF ? stateStats[hoveredUF] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
      
      {/* 1. Barra de Filtros e KPIs Rápidos do Mapa */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={22} color="var(--primary-brown)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Mapa Cartográfico Oficial da Rede Spoleto (Brasil)
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Mapa vetorial georreferenciado com os 27 estados (UFs), densidade de restaurantes e notas médias de auditoria.
            </p>
          </div>

          {/* Filtro por Macrorregião */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <Layers size={14} /> Região:
            </div>
            {['Todas', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRegion(r)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: selectedRegion === r ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  background: selectedRegion === r ? 'var(--primary-brown)' : '#FFFFFF',
                  color: selectedRegion === r ? '#FFFFFF' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda de Nível de Maturidade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.92rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Legenda do Mapa:</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#DCFCE7', border: '2px solid #16A34A', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#14532D' }}>Excelente (&ge; 8.5)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEF3C7', border: '2px solid #D97706', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#78350F' }}>Atenção (7.5 - 8.4)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FEE2E2', border: '2px solid #DC2626', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#7F1D1D' }}>Crítico (&lt; 7.5)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#E2E8F0', border: '2px solid #CBD5E1', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#64748B' }}>Sem Lojas</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span style={{ background: '#FAF8F5', border: '1.5px solid var(--border-subtle)', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              Rede: {stores.length} restaurantes em 21 estados
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid Principal: Mapa Cartográfico Vetorial à Esquerda + Drilldown da UF à Direita */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.35fr) minmax(340px, 1fr)', gap: '1.5rem' }}>
        
        {/* Painel do Mapa Cartográfico SVG do Brasil */}
        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cartografia Territorial do Brasil (IBGE)
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Passe o mouse ou clique no estado
            </span>
          </div>

          {/* SVG Map Container */}
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '520px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, #FAF8F5 0%, #EFE9E2 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '0.75rem' }}>
            
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
                <div style={{ fontWeight: 900, color: 'var(--primary-gold)', fontSize: '0.98rem' }}>
                  {activeHoverData.name} ({activeHoverData.uf})
                </div>
                <div style={{ marginTop: '0.2rem' }}>
                  <strong>{activeHoverData.count}</strong> restaurantes &bull; Média: <strong style={{ color: 'var(--primary-gold)' }}>{activeHoverData.avgScore}</strong>
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
                const data = stateStats[uf] || { count: 0, avgScore: 0 };
                const isSelected = selectedUF === uf;
                const isHovered = hoveredUF === uf;
                const colorConfig = getStateColor(uf, isSelected, isHovered);
                const hasStores = data.count > 0;
                const isRegionMatch = selectedRegion === 'Todas' || data.region === selectedRegion;

                if (!stateInfo.center || !isRegionMatch) return null;

                const badgeWidth = data.count >= 100 ? 44 : data.count >= 10 ? 38 : 32;
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
                            stroke="var(--primary-gold)" 
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
                          fill={isSelected ? '#3D2214' : colorConfig.badgeBg}
                          stroke={isSelected ? 'var(--primary-gold)' : '#FFFFFF'} 
                          strokeWidth="2"
                          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
                        />

                        {/* Sigla UF (Linha Superior) */}
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

                        {/* Quantidade de Lojas (Linha Inferior) */}
                        <text 
                          x="0" 
                          y="8" 
                          textAnchor="middle" 
                          fontSize="9.5" 
                          fontWeight="900" 
                          fill={isSelected ? 'var(--primary-gold)' : '#FFFFFF'}
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {data.count}
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

          {/* Atalhos Rápidos para Estados com Maior Rede */}
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Principais Praças:</span>
            {filteredStatesList.slice(0, 8).map(st => (
              <button
                key={st.uf}
                type="button"
                onClick={() => setSelectedUF(st.uf)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  border: selectedUF === st.uf ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
                  background: selectedUF === st.uf ? 'var(--primary-brown)' : '#FFFFFF',
                  color: selectedUF === st.uf ? '#FFFFFF' : 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                {st.uf} ({st.count})
              </button>
            ))}
          </div>
        </div>

        {/* 3. Painel Lateral: Detalhes & Lista de Lojas do Estado Selecionado */}
        <div className="card-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '660px' }}>
          
          {/* Cabeçalho do Estado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, background: 'var(--primary-brown)', color: '#FFFFFF', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                  {selectedUF}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {currentSelectedStateData.name || selectedUF}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Região {currentSelectedStateData.region} &bull; {currentSelectedStateData.count} restaurantes
                  </span>
                </div>
              </div>
            </div>

            {/* Média de Nota da UF */}
            {currentSelectedStateData.count > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
                  <Star size={16} fill="var(--primary-gold)" color="var(--primary-gold)" />
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    {currentSelectedStateData.avgScore}
                  </span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: currentSelectedStateData.avgScore >= 8.5 ? '#15803D' : currentSelectedStateData.avgScore >= 7.5 ? '#D97706' : '#DC2626' }}>
                  {currentSelectedStateData.avgScore >= 8.5 ? 'Excelente' : currentSelectedStateData.avgScore >= 7.5 ? 'Atenção' : 'Crítico'}
                </span>
              </div>
            )}
          </div>

          {/* Campo de Busca Rápida no Estado */}
          <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder={`Buscar entre as ${currentSelectedStateData.count} lojas de ${selectedUF}...`}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', width: '100%', height: '36px', fontSize: '0.82rem', margin: 0 }}
            />
          </div>

          {/* Lista de Lojas com Rolagem */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.25rem' }}>
            {stateStoresFiltered.length === 0 ? (
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
                const consultant = consultants.find(c => 
                  c.id === store.consultantId || 
                  (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(store.id))
                );

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
                        <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {store.name}
                        </h4>
                      </div>

                      {/* Nota da Loja */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#FAF8F5', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <Star size={13} fill="var(--primary-gold)" color="var(--primary-gold)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {store.rating_score || store.ratingScore || 8.5}
                        </span>
                      </div>
                    </div>

                    {/* Endereço / CEP Real */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <MapPin size={12} color="var(--primary-brown)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {store.address || `${store.city} - ${store.state}`} &bull; CEP: {store.cep || '00000-000'}
                      </span>
                    </div>

                    {/* Rodapé do Card: Franqueado & Consultor */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-main)' }}>
                        <Handshake size={12} color="var(--primary-brown)" />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', whiteSpace: 'nowrap' }}>
                          {storeFrans.length > 0 ? storeFrans.map(f => f.name).join(', ') : (store.franchisee || 'Franqueado')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-brown)', fontWeight: 700, fontSize: '0.72rem' }}>
                        Ver Ficha 360º <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
