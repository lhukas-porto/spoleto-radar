import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  PieChart as PieIcon,
  Layers
} from 'lucide-react';

export default function DashboardView() {
  const { stores, consultants, categories, visits, setActiveTab, setSelectedVisitForReport } = useApp();
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // High level KPIs
  const totalStores = stores.length;
  const totalConsultants = consultants.length;
  const totalVisits = visits.length;
  
  // Calculate bottlenecks by category
  const categoryBottlenecks = categories.map(cat => {
    let count = 0;
    visits.forEach(v => {
      v.diagnostics.forEach(d => {
        if (d.categoryId === cat.id) {
          count++;
        }
      });
    });
    return {
      id: cat.id,
      name: cat.name.split('(')[0].trim(),
      color: cat.color || '#C8102E',
      count
    };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const totalBottlenecks = categoryBottlenecks.reduce((sum, c) => sum + c.count, 0);

  // Delivery specific metric
  const deliveryVisitsWithIssues = visits.filter(v => 
    v.diagnostics.some(d => d.categoryId === 'cat-delivery' || d.categoryId === 'cat-ifood')
  ).length;

  // Donut SVG Math
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // ~408.4
  let accumulatedPercent = 0;

  // Colors palette for slices
  const chartColors = [
    '#C8102E', // Spoleto Red
    '#F59E0B', // Amber Gold
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#0284C7', // Sky Blue
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#D97706'  // Brown-Amber
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Painel Executivo Spoleto & Grupo Trigo</h1>
          <p className="section-subtitle">Acompanhamento consolidado de visitas, conformidade de rede e gargalos operacionais.</p>
        </div>

        <button className="btn-primary" onClick={() => setActiveTab('new-visit')}>
          <ClipboardCheck size={18} /> Iniciar Nova Visita
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveTab('stores')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--primary-brown-light)', color: 'var(--primary-brown)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="kpi-label">Rede de Lojas Spoleto</div>
            <div className="kpi-value">{totalStores}</div>
            <div className="kpi-subtext">Lojas ativas em todo o Brasil</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('consultants')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold-dark)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="kpi-label">Consultores de Negócios</div>
            <div className="kpi-value">{totalConsultants}</div>
            <div className="kpi-subtext">Carteiras exclusivas de campo</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('reports')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <ClipboardCheck size={24} />
          </div>
          <div>
            <div className="kpi-label">Visitas Realizadas</div>
            <div className="kpi-value">{totalVisits}</div>
            <div className="kpi-subtext">Laudos emitidos com Plano de Ação</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('reports')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="kpi-label">Gargalos no Delivery</div>
            <div className="kpi-value">{deliveryVisitsWithIssues}</div>
            <div className="kpi-subtext">Lojas com cancelamento / atraso</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Gráfico Pizza de Gargalos Operacionais & Últimas Visitas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.15fr) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* =========================================================================
            GRÁFICO PIZZA / DONUT DE GARGALOS OPERACIONAIS
            ========================================================================= */}
        <div className="card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieIcon size={20} color="var(--primary-brown)" />
                  Itens de Oportunidade (Gráfico Pizza)
                </h3>
                <p className="section-subtitle">
                  Distribuição percentual dos temas mais apontados nos Planos de Ação.
                </p>
              </div>

              <span style={{ fontSize: '0.78rem', background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700, color: 'var(--text-main)' }}>
                Total: {totalBottlenecks} apontamentos
              </span>
            </div>

            {categoryBottlenecks.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum gargalo registrado ainda. Realize novas visitas para visualizar a distribuição.
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', margin: '1rem 0' }}>
                {/* SVG Donut / Pie Chart */}
                <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="200" height="200" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="#F1ECE6"
                      strokeWidth="24"
                    />

                    {/* Slices */}
                    {categoryBottlenecks.map((item, idx) => {
                      const percent = item.count / totalBottlenecks;
                      const strokeDasharray = `${percent * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;
                      const color = chartColors[idx % chartColors.length];
                      const isHovered = hoveredSlice === item.id;

                      return (
                        <circle
                          key={item.id}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={color}
                          strokeWidth={isHovered ? 28 : 24}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{
                            transition: 'all 0.25s ease',
                            cursor: 'pointer',
                            filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none'
                          }}
                          onMouseEnter={() => setHoveredSlice(item.id)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Text in Donut */}
                  <div style={{
                    position: 'absolute',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'block', lineHeight: '1.1' }}>
                      {hoveredSlice 
                        ? categoryBottlenecks.find(c => c.id === hoveredSlice)?.count
                        : totalBottlenecks}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {hoveredSlice 
                        ? categoryBottlenecks.find(c => c.id === hoveredSlice)?.name.slice(0, 12)
                        : 'Gargalos'}
                    </span>
                  </div>
                </div>

                {/* Legendas & Percentuais */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minWidth: '180px' }}>
                  {categoryBottlenecks.map((item, idx) => {
                    const percent = Math.round((item.count / totalBottlenecks) * 100);
                    const color = chartColors[idx % chartColors.length];
                    const isHovered = hoveredSlice === item.id;

                    return (
                      <div 
                        key={item.id}
                        onMouseEnter={() => setHoveredSlice(item.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isHovered ? 'var(--primary-brown-light)' : 'transparent',
                          transition: 'background-color 0.15s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.84rem', fontWeight: isHovered ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: color }}>
                            {percent}%
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            ({item.count})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('taxonomy')}
            >
              Ver Matriz Completa de Temas <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Últimas Visitas de Consultoria de Negócios Realizadas */}
        <div className="card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>
                Últimas Visitas de Consultoria
              </h3>
              <button 
                onClick={() => setActiveTab('reports')}
                style={{ fontSize: '0.82rem', color: 'var(--primary-brown)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                Ver todas <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visits.slice(0, 4).map(visit => {
                const store = stores.find(s => s.id === visit.storeId);
                const consultant = consultants.find(c => c.id === visit.consultantId);
                const hasIssues = visit.diagnostics.length > 0;

                return (
                  <div 
                    key={visit.id}
                    onClick={() => setSelectedVisitForReport(visit)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: '#FAFAFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>
                        {store?.name}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {consultant?.name} &bull; {new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')} &bull; {visit.visitType || 'Visita agendada'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${hasIssues ? 'badge-critica' : 'badge-concluido'}`} style={{ fontSize: '0.72rem' }}>
                        {hasIssues ? `${visit.diagnostics.length} não-conformidade${visit.diagnostics.length > 1 ? 's' : ''}` : '100% Padrão'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('new-visit')}
            >
              <ClipboardCheck size={16} /> Preencher Novo Diagnóstico
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
