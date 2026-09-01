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
  ArrowRight
} from 'lucide-react';
import { BRAZILIAN_STATES } from '../utils/brazilianLocations';

// 27 Brazilian States with Macro-regions, geographic coordinates & centers for interactive SVG layout
const BRAZIL_STATE_COORDS = {
  'RR': { x: 260, y: 55, region: 'Norte' },
  'AP': { x: 380, y: 70, region: 'Norte' },
  'AM': { x: 175, y: 130, region: 'Norte' },
  'PA': { x: 340, y: 145, region: 'Norte' },
  'MA': { x: 440, y: 145, region: 'Nordeste' },
  'PI': { x: 465, y: 185, region: 'Nordeste' },
  'CE': { x: 520, y: 145, region: 'Nordeste' },
  'RN': { x: 555, y: 165, region: 'Nordeste' },
  'PB': { x: 560, y: 195, region: 'Nordeste' },
  'PE': { x: 545, y: 220, region: 'Nordeste' },
  'AL': { x: 555, y: 245, region: 'Nordeste' },
  'SE': { x: 535, y: 265, region: 'Nordeste' },
  'BA': { x: 485, y: 285, region: 'Nordeste' },
  'AC': { x: 80, y: 210, region: 'Norte' },
  'RO': { x: 175, y: 225, region: 'Norte' },
  'TO': { x: 375, y: 240, region: 'Norte' },
  'MT': { x: 265, y: 285, region: 'Centro-Oeste' },
  'GO': { x: 360, y: 325, region: 'Centro-Oeste' },
  'DF': { x: 395, y: 320, region: 'Centro-Oeste' },
  'MS': { x: 275, y: 390, region: 'Centro-Oeste' },
  'MG': { x: 440, y: 375, region: 'Sudeste' },
  'ES': { x: 505, y: 390, region: 'Sudeste' },
  'RJ': { x: 475, y: 435, region: 'Sudeste' },
  'SP': { x: 385, y: 430, region: 'Sudeste' },
  'PR': { x: 335, y: 475, region: 'Sul' },
  'SC': { x: 350, y: 515, region: 'Sul' },
  'RS': { x: 310, y: 555, region: 'Sul' }
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
        region: BRAZIL_STATE_COORDS[st.uf]?.region || 'Outro'
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

  // Cores de Heatmap baseadas na média de nota
  const getScoreColor = (score, count) => {
    if (count === 0) return { bg: '#E2E8F0', border: '#CBD5E1', text: '#64748B', label: 'Sem Lojas' };
    if (score >= 8.5) return { bg: '#ECFDF5', border: '#10B981', text: '#065F46', pin: '#059669', label: 'Excelente' };
    if (score >= 7.5) return { bg: '#FEFCE8', border: '#F59E0B', text: '#92400E', pin: '#D97706', label: 'Atenção' };
    return { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', pin: '#DC2626', label: 'Crítico' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
      
      {/* 1. Barra de Filtros e KPIs Rápidos do Mapa */}
      <div className="card-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={22} color="var(--primary-brown)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Mapa Geoespacial da Rede Spoleto
              </h2>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Visão nacional de calor, densidade de unidades e nível de maturidade operacional por Estado (UF).
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Nível Médio de Auditoria:</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
            <span style={{ fontWeight: 600, color: '#065F46' }}>Excelente (Nota &ge; 8.5)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
            <span style={{ fontWeight: 600, color: '#92400E' }}>Atenção (Nota 7.5 - 8.4)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
            <span style={{ fontWeight: 600, color: '#991B1B' }}>Crítico (Nota &lt; 7.5)</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <span style={{ background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', fontWeight: 700, color: 'var(--text-main)' }}>
              Total: {stores.length} lojas ativas
            </span>
          </div>
        </div>
      </div>

      {/* 2. Grid Principal: Mapa Interativo à Esquerda + Drilldown da UF à Direita */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
        
        {/* Painel do Mapa SVG do Brasil */}
        <div className="card-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-brown)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Distribuição Nacional por Estados (UFs)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Clique em um estado para inspecionar
            </span>
          </div>

          {/* SVG Map Container */}
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '480px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle, #FAF8F5 0%, #F3EFEA 100%)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '1rem' }}>
            <svg 
              viewBox="0 0 620 600" 
              style={{ width: '100%', height: '100%', maxHeight: '520px' }}
            >
              {/* Conexões e Linhas de Estrutura Geográfica */}
              <g opacity="0.15" stroke="var(--primary-brown)" strokeWidth="1" strokeDasharray="3,3">
                <line x1="260" y1="55" x2="340" y2="145" />
                <line x1="340" y1="145" x2="440" y2="145" />
                <line x1="440" y1="145" x2="520" y2="145" />
                <line x1="520" y1="145" x2="560" y2="195" />
                <line x1="560" y1="195" x2="485" y2="285" />
                <line x1="485" y1="285" x2="440" y2="375" />
                <line x1="440" y1="375" x2="385" y2="430" />
                <line x1="385" y1="430" x2="335" y2="475" />
                <line x1="335" y1="475" x2="310" y2="555" />
                <line x1="360" y1="325" x2="395" y2="320" />
                <line x1="265" y1="285" x2="360" y2="325" />
              </g>

              {/* Renderizar Nós de Cada Estado (UF) */}
              {Object.entries(BRAZIL_STATE_COORDS).map(([uf, coord]) => {
                const data = stateStats[uf] || { count: 0, avgScore: 0, name: uf };
                const isSelected = selectedUF === uf;
                const colors = getScoreColor(data.avgScore, data.count);
                const hasStores = data.count > 0;
                
                // Raio do nó baseado na quantidade de lojas
                const radius = hasStores ? Math.min(32, Math.max(16, 14 + Math.sqrt(data.count) * 2.8)) : 11;

                return (
                  <g 
                    key={uf} 
                    transform={`translate(${coord.x}, ${coord.y})`}
                    onClick={() => setSelectedUF(uf)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    {/* Efeito Glow / Seleção */}
                    {isSelected && (
                      <circle 
                        r={radius + 8} 
                        fill="none" 
                        stroke="var(--primary-gold)" 
                        strokeWidth="3"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      >
                        <animateTransform 
                          attributeName="transform" 
                          type="rotate" 
                          from="0" 
                          to="360" 
                          dur="12s" 
                          repeatCount="indefinite" 
                        />
                      </circle>
                    )}

                    {/* Círculo Principal do Estado */}
                    <circle 
                      r={radius} 
                      fill={isSelected ? 'var(--primary-brown)' : (hasStores ? colors.bg : '#F8FAFC')}
                      stroke={isSelected ? 'var(--primary-gold)' : colors.border}
                      strokeWidth={isSelected ? '3' : (hasStores ? '2' : '1')}
                      style={{ filter: hasStores ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' : 'none' }}
                    />

                    {/* Sigla da UF */}
                    <text 
                      textAnchor="middle" 
                      dy={hasStores ? "-2" : "4"} 
                      fontSize={hasStores ? "11" : "9"} 
                      fontWeight="800" 
                      fill={isSelected ? '#FFFFFF' : (hasStores ? colors.text : '#94A3B8')}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {uf}
                    </text>

                    {/* Badge com Quantidade de Lojas */}
                    {hasStores && (
                      <text 
                        textAnchor="middle" 
                        dy="10" 
                        fontSize="9" 
                        fontWeight="700" 
                        fill={isSelected ? 'var(--primary-gold)' : colors.pin}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {data.count} {data.count === 1 ? 'lj' : 'ljs'}
                      </text>
                    )}

                    {/* Indicador de Média no Topo do Pino */}
                    {hasStores && (
                      <circle 
                        cx={radius - 4} 
                        cy={-radius + 4} 
                        r="4" 
                        fill={colors.pin} 
                        stroke="#FFFFFF" 
                        strokeWidth="1" 
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Atalhos Rápidos para Estados com Maior Rede */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Principais Praças:</span>
            {filteredStatesList.slice(0, 7).map(st => (
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
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: getScoreColor(currentSelectedStateData.avgScore, currentSelectedStateData.count).text }}>
                  {getScoreColor(currentSelectedStateData.avgScore, currentSelectedStateData.count).label}
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
