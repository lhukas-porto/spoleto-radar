import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { evaluateActionPlanStatus } from '../utils/dateHelpers';
import {
  Building2,
  Users,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  PieChart as PieIcon,
  Layers,
  BellRing,
  Flame,
  Send,
  ChevronRight
} from 'lucide-react';

export default function DashboardView() {
  const {
    stores,
    consultants,
    categories,
    visits,
    setActiveTab,
    setSelectedVisitForReport,
    setIsOverdueModalOpen,
    setSelectedStaffForProfile,
    setSelectedStoreForProfile
  } = useApp();

  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [drilldownCategory, setDrilldownCategory] = useState(null); // null = Main Topics; categoryId = Subtopics

  // High level KPIs
  const totalStores = stores.length;
  const totalStaff = consultants.length;
  const totalVisits = visits.length;

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
    '#D97706', // Brown-Amber
    '#E11D48', // Rose
    '#059669'  // Emerald
  ];

  // Calculate Overdue Action Plans metrics
  let totalOverduePlans = 0;
  let dueTodayPlans = 0;
  let dueThisWeekPlans = 0;

  visits.forEach(v => {
    (v.diagnostics || []).forEach(d => {
      const deadline = d.actionPlan?.deadline || 'IMEDIATO';
      const status = d.actionPlan?.status || 'NÃO INICIADO';
      const metrics = evaluateActionPlanStatus(v.date, deadline, status);
      if (metrics.isOverdue) totalOverduePlans++;
      if (metrics.isDueToday) dueTodayPlans++;
      if (metrics.isDueThisWeek && !metrics.isOverdue) dueThisWeekPlans++;
    });
  });

  // Calculate bottlenecks by aggregating all diagnostics from all visits
  const categoryCounts = {};

  visits.forEach(v => {
    (v.diagnostics || []).forEach(d => {
      const catId = d.categoryId || d.category_id || 'outros';
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });
  });

  const categoryBottlenecks = Object.entries(categoryCounts).map(([catId, count], index) => {
    const cat = categories.find(c => c.id === catId);
    let displayName = cat ? cat.name.split('(')[0].trim() : catId.replace('cat-', '').replace(/-/g, ' ').toUpperCase();
    return {
      id: catId,
      name: displayName,
      fullName: cat ? cat.name : displayName,
      color: (cat && cat.color && cat.color !== '#5D3826') ? cat.color : chartColors[index % chartColors.length],
      count
    };
  }).sort((a, b) => b.count - a.count);

  const totalBottlenecks = categoryBottlenecks.reduce((sum, c) => sum + c.count, 0);

  // Drilldown Subtopics Calculation
  const activeDrilldownCat = drilldownCategory ? categories.find(c => c.id === drilldownCategory) : null;
  const subproblemCounts = {};

  if (drilldownCategory) {
    visits.forEach(v => {
      (v.diagnostics || []).forEach(d => {
        if (d.categoryId === drilldownCategory) {
          const subId = d.subproblemId || 'sub-outro';
          subproblemCounts[subId] = (subproblemCounts[subId] || 0) + 1;
        }
      });
    });
  }

  const subproblemBottlenecks = drilldownCategory ? Object.entries(subproblemCounts).map(([subId, count], index) => {
    const sub = activeDrilldownCat?.subproblems?.find(s => s.id === subId);
    return {
      id: subId,
      name: sub ? sub.title : 'Diagnóstico Geral',
      color: chartColors[index % chartColors.length],
      count
    };
  }).sort((a, b) => b.count - a.count) : [];

  const totalSubBottlenecks = subproblemBottlenecks.reduce((sum, s) => sum + s.count, 0);

  // Delivery specific metric
  const deliveryVisitsWithIssues = visits.filter(v =>
    (v.diagnostics || []).some(d => d.categoryId === 'cat-delivery' || d.categoryId === 'cat-ifood')
  ).length;

  // Donut SVG Math
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // ~408.4

  const activeChartData = drilldownCategory ? subproblemBottlenecks : categoryBottlenecks;
  const activeTotalCount = drilldownCategory ? totalSubBottlenecks : totalBottlenecks;
  let accumulatedPercent = 0;

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Painel Executivo Spoleto</h1>
          <p className="section-subtitle">Acompanhamento consolidado de visitas, conformidade de rede e gargalos operacionais.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            style={{ borderColor: totalOverduePlans > 0 ? '#991B1B' : 'var(--border-strong)', color: totalOverduePlans > 0 ? '#991B1B' : 'var(--text-main)', fontWeight: 700 }}
            onClick={() => setIsOverdueModalOpen(true)}
          >
            <BellRing size={16} color={totalOverduePlans > 0 ? '#991B1B' : 'var(--primary-brown)'} />
            Central de Atrasos ({totalOverduePlans})
          </button>
        </div>
      </div>

      {/* =========================================================================
          BANNER DE ALERTA OPERACIONAL DE PLANOS EM ATRASO
          ========================================================================= */}
      {totalOverduePlans > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F5 0%, #FEF2F2 100%)',
          border: '1.5px solid #FCA5A5',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.35rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#991B1B',
              flexShrink: 0
            }}>
              <Flame size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.96rem', color: '#991B1B' }}>
                  Atenção: {totalOverduePlans} Plano(s) de Ação em Atraso na Rede Spoleto
                </strong>
                <span className="badge badge-critica" style={{ fontSize: '0.7rem' }}>
                  {dueTodayPlans > 0 ? `${dueTodayPlans} vencendo hoje` : 'Ação requerida'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#7F1D1D', margin: '0.2rem 0 0' }}>
                Existem franquias com planos de ação com prazo estourado. Notifique franqueados e gerentes regionais para regularização.
              </p>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => setIsOverdueModalOpen(true)}
            style={{
              backgroundColor: '#991B1B',
              borderColor: '#7F1D1D',
              fontSize: '0.82rem',
              padding: '0.45rem 0.95rem'
            }}
          >
            <Send size={14} /> Abrir Central & Disparar Avisos
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveTab('stores')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--primary-brown-light)', color: 'var(--primary-brown)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="kpi-label">Rede de Lojas Spoleto</div>
            <div className="kpi-value">{totalStores}</div>
            <div className="kpi-subtext">Lojas cadastradas (Código RP)</div>
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('consultants')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-gold-light)', color: 'var(--accent-gold-dark)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="kpi-label">Equipe Spoleto</div>
            <div className="kpi-value">{totalStaff}</div>
            <div className="kpi-subtext">Diretoria, Regionais & Consultores</div>
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

        <div className="kpi-card" onClick={() => setIsOverdueModalOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="kpi-label">Controle de Prazos & SLA</div>
            <div className="kpi-value" style={{ color: totalOverduePlans > 0 ? '#991B1B' : 'inherit' }}>
              {totalOverduePlans}
            </div>
            <div className="kpi-subtext">Régua D-1 (Prevenção) & D-0 (Atenção Total)</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Gráfico Pizza de Gargalos Operacionais com Drilldown & Últimas Visitas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1.2fr) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* =========================================================================
            GRÁFICO PIZZA / DONUT DE GARGALOS OPERACIONAIS COM DRILLDOWN
            ========================================================================= */}
        <div className="card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieIcon size={20} color="var(--primary-brown)" />
                  {drilldownCategory ? 'Detalhamento por Subtópicos' : 'Itens de Oportunidade'}
                </h3>
                <p className="section-subtitle">
                  {drilldownCategory
                    ? `Distribuição dos problemas específicos do tema "${activeDrilldownCat?.name.split('(')[0].trim()}".`
                    : 'Distribuição percentual dos temas principais apontados. Clique em um tema para abrir seus subtópicos.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {drilldownCategory && (
                  <button
                    className="btn-secondary"
                    onClick={() => setDrilldownCategory(null)}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', gap: '0.3rem' }}
                  >
                    <ArrowLeft size={13} /> Voltar aos Tópicos
                  </button>
                )}

                <span style={{ fontSize: '0.78rem', background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700, color: 'var(--text-main)' }}>
                  Total: {activeTotalCount} apontamentos
                </span>
              </div>
            </div>

            {activeChartData.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhum apontamento registrado para este tema. Realize novas visitas para visualizar a distribuição.
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
                    {activeChartData.map((item, idx) => {
                      const percent = activeTotalCount > 0 ? (item.count / activeTotalCount) : 0;
                      const strokeDasharray = `${percent * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;
                      const color = item.color || chartColors[idx % chartColors.length];
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
                          onClick={() => {
                            if (!drilldownCategory) {
                              setDrilldownCategory(item.id);
                              setHoveredSlice(null);
                            }
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Center Text in Donut */}
                  <div style={{
                    position: 'absolute',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    maxWidth: '110px'
                  }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'block', lineHeight: '1.1' }}>
                      {hoveredSlice
                        ? activeChartData.find(c => c.id === hoveredSlice)?.count
                        : activeTotalCount}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hoveredSlice
                        ? activeChartData.find(c => c.id === hoveredSlice)?.name
                        : (drilldownCategory ? 'Subtópicos' : 'Gargalos')}
                    </span>
                  </div>
                </div>

                {/* Legendas & Percentuais Interativas com 1-Clique */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '200px', maxHeight: '240px', overflowY: 'auto' }}>
                  {activeChartData.map((item, idx) => {
                    const percent = activeTotalCount > 0 ? Math.round((item.count / activeTotalCount) * 100) : 0;
                    const color = item.color || chartColors[idx % chartColors.length];
                    const isHovered = hoveredSlice === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredSlice(item.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => {
                          if (!drilldownCategory) {
                            setDrilldownCategory(item.id);
                            setHoveredSlice(null);
                          }
                        }}
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
                        title={!drilldownCategory ? 'Clique para abrir o gráfico dos subtópicos' : ''}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: isHovered ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: color }}>
                            {percent}%
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({item.count})
                          </span>
                          {!drilldownCategory && (
                            <ChevronRight size={13} color="var(--text-muted)" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {drilldownCategory ? 'Exibindo detalhamento específico.' : 'Dica: clique em qualquer tema para ver subtópicos.'}
            </span>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('taxonomy')}
            >
              Ver Matriz de Tópicos <ArrowRight size={14} />
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
                style={{ fontSize: '0.82rem', color: 'var(--primary-brown)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Ver todas <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visits.slice(0, 4).map(visit => {
                const store = stores.find(s => s.id === visit.storeId);
                const consultant = consultants.find(c => c.id === visit.consultantId);
                const hasIssues = visit.diagnostics?.length > 0;

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
                      <strong
                        onClick={(e) => {
                          if (store) {
                            e.stopPropagation();
                            setSelectedStoreForProfile(store);
                          }
                        }}
                        style={{
                          fontSize: '0.92rem',
                          color: 'var(--text-main)',
                          display: 'block',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                        title="Ver Ficha 360° e Linha do Tempo da Unidade"
                      >
                        {store?.name}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        <span
                          onClick={(e) => {
                            if (consultant) {
                              e.stopPropagation();
                              setSelectedStaffForProfile(consultant);
                            }
                          }}
                          style={{ textDecoration: consultant ? 'underline' : 'none', cursor: consultant ? 'pointer' : 'default', fontWeight: 600 }}
                        >
                          {consultant?.name}
                        </span> &bull; {new Date(visit.date + 'T12:00:00').toLocaleDateString('pt-BR')} &bull; Código RP: {store?.code}
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
              <ClipboardCheck size={16} /> Iniciar Nova Visita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
