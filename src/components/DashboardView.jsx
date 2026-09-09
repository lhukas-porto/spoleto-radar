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
  BellRing,
  ChevronRight,
  BarChart3,
  Sparkles,
  Handshake,
  PieChart as PieIcon,
  Flame,
  Send,
  Store,
  MapPin,
  X
} from 'lucide-react';
import RegionalBenchmarkView from './RegionalBenchmarkView';
import NetworkDiagnosticsReport from './NetworkDiagnosticsReport';

export default function DashboardView() {
  const {
    visibleStores: stores = [],
    visibleConsultants: consultants = [],
    categories,
    visibleVisits: visits = [],
    franchisees = [],
    franchiseeGroups = [],
    setActiveTab,
    setSelectedVisitForReport,
    setIsOverdueModalOpen,
    setSelectedStaffForProfile,
    setSelectedStoreForProfile,
    simulatedRole,
    activeUser,
    canAccessSettings
  } = useApp();

  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [drilldownCategory, setDrilldownCategory] = useState(null); // null = Main Topics; categoryId = Subtopics
  const [selectedSubproblem, setSelectedSubproblem] = useState(null); // null = nenhum; subproblemId = lojas com esse problema
  const [dashboardSubTab, setDashboardSubTab] = useState('overview'); // 'overview' | 'benchmark' | 'ranking'

  // High level KPIs (Agrupamento por Loja / Sociedade: múltiplos sócios da mesma loja contam como 1 franqueado)
  const totalStores = stores.length;
  const totalFranchiseeGroups = (franchiseeGroups && franchiseeGroups.length > 0)
    ? franchiseeGroups.length
    : (franchisees.length > 0 
        ? franchisees.length 
        : Array.from(new Set(stores.map(s => s.franchisee).filter(Boolean))).length);
  const totalPartners = franchisees.length;
  const totalFranchisees = totalFranchiseeGroups;
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

  // Mapeamento das lojas que apresentam o subtópico selecionado
  const affectedStoresForSubproblem = (drilldownCategory && selectedSubproblem) ? (() => {
    const storeMap = new Map();
    visits.forEach(v => {
      const matchDiag = (v.diagnostics || []).filter(d => 
        d.categoryId === drilldownCategory && (d.subproblemId || 'sub-outro') === selectedSubproblem
      );
      if (matchDiag.length > 0) {
        const store = stores.find(s => s.id === v.storeId || s.code === v.storeId);
        const storeId = store?.id || v.storeId;
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            store,
            storeId,
            storeName: store?.name || v.storeName || 'Loja não identificada',
            storeCode: store?.code || v.storeCode || '',
            state: store?.state || '',
            city: store?.city || '',
            franchisee: store?.franchisee || '',
            occurrences: []
          });
        }
        matchDiag.forEach(diag => {
          storeMap.get(storeId).occurrences.push({
            visitId: v.id,
            date: v.date,
            consultantId: v.consultantId,
            severity: diag.severity,
            notes: diag.notes,
            actionPlan: diag.actionPlan
          });
        });
      }
    });
    return Array.from(storeMap.values());
  })() : [];

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

        <div className="kpi-card" onClick={() => setActiveTab('stores')} style={{ cursor: 'pointer' }}>
          <div className="kpi-icon-wrapper" style={{ background: '#ECFDF5', color: '#059669' }}>
            <Handshake size={24} />
          </div>
          <div>
            <div className="kpi-label">Franqueados da Rede</div>
            <div className="kpi-value">{totalFranchisees}</div>
            <div className="kpi-subtext">
              {totalPartners > totalFranchisees 
                ? `${totalPartners} sócios cadastrados em ${totalFranchisees} operações` 
                : 'Grupos & Sócios Franqueados'}
            </div>
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

      {/* Navegador Executivo do Painel */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setDashboardSubTab('overview')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            border: dashboardSubTab === 'overview' ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
            background: dashboardSubTab === 'overview' ? 'var(--primary-brown)' : '#FFFFFF',
            color: dashboardSubTab === 'overview' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: dashboardSubTab === 'overview' ? '0 2px 8px rgba(93,56,38,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <PieIcon size={16} /> Visão Geral
        </button>

        <button
          type="button"
          onClick={() => setDashboardSubTab('raio-x')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: dashboardSubTab === 'raio-x' ? '2px solid #F59E0B' : '1.5px solid #F59E0B',
            background: dashboardSubTab === 'raio-x' 
              ? 'linear-gradient(135deg, #B45309 0%, #78350F 100%)' 
              : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            color: dashboardSubTab === 'raio-x' ? '#FFFFFF' : '#78350F',
            fontWeight: 900,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: dashboardSubTab === 'raio-x' 
              ? '0 4px 14px rgba(180, 83, 9, 0.4)' 
              : '0 2px 10px rgba(217, 119, 6, 0.25)',
            transform: dashboardSubTab === 'raio-x' ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = dashboardSubTab === 'raio-x' ? 'scale(1.02)' : 'scale(1)'}
          title="Ver o Raio-X completo de problemas, gargalos e embaixadores da rede"
        >
          <Sparkles size={17} color={dashboardSubTab === 'raio-x' ? '#FDE68A' : '#B45309'} />
          <span>Raio-X da Rede</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardSubTab('benchmark')}
          style={{
            padding: '0.55rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            border: dashboardSubTab === 'benchmark' ? '1.5px solid var(--primary-brown)' : '1px solid var(--border-subtle)',
            background: dashboardSubTab === 'benchmark' ? 'var(--primary-brown)' : '#FFFFFF',
            color: dashboardSubTab === 'benchmark' ? '#FFFFFF' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: dashboardSubTab === 'benchmark' ? '0 2px 8px rgba(93,56,38,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <BarChart3 size={16} /> Benchmark de Regionais (Gerente Nacional & Diretoria)
        </button>
      </div>

      {dashboardSubTab === 'benchmark' && <RegionalBenchmarkView />}
      {dashboardSubTab === 'raio-x' && <NetworkDiagnosticsReport />}

      {dashboardSubTab === 'overview' && (
        <>
          {/* Banner VIP de Destaque Executivo para o Raio-X */}
          <div style={{
            background: 'linear-gradient(135deg, #FFFDF9 0%, #FEF3C7 100%)',
            border: '1.5px solid #FDE68A',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            boxShadow: '0 2px 6px rgba(180, 83, 9, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                🔍
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                  Quer mapear quantas e quais lojas estão sem embaixador ou analisar gargalos específicos da rede?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.1rem' }}>
                  Acesse a matriz consolidada de Tópicos e Subtópicos com filtros e exportação pronta para IA e PDF.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDashboardSubTab('raio-x')}
              style={{
                backgroundColor: 'var(--primary-brown)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(93, 56, 38, 0.2)'
              }}
            >
              <Sparkles size={14} color="#FDE68A" /> Abrir Raio-X da Rede &rarr;
            </button>
          </div>

          {/* Main Grid: Gráfico Pizza de Gargalos Operacionais com Drilldown & Últimas Visitas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1.2fr) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* =========================================================================
            GRÁFICO PIZZA / DONUT DE GARGALOS OPERACIONAIS COM SEGUNDO GRÁFICO DE SUBTÓPICOS ABAIXO
            ========================================================================= */}
          <div className="card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Gráfico 1: Tópicos Principais */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PieIcon size={20} color="var(--primary-brown)" />
                    Itens de Oportunidade por Tema
                  </h3>
                  <p className="section-subtitle">
                    Distribuição dos temas apontados nas visitas. Clique em um tema para abrir o gráfico detalhado dos subtópicos abaixo.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', background: '#FAF8F5', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700, color: 'var(--text-main)' }}>
                    Total: {totalBottlenecks} apontamentos
                  </span>
                </div>
              </div>

              {categoryBottlenecks.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum apontamento registrado. Realize novas visitas para visualizar a distribuição.
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', margin: '0.5rem 0' }}>
                  {/* SVG Donut / Pie Chart - Tópicos Principais */}
                  <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="200" height="200" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#F1ECE6"
                        strokeWidth="24"
                      />

                      {(() => {
                        let acc = 0;
                        return categoryBottlenecks.map((item, idx) => {
                          const percent = totalBottlenecks > 0 ? (item.count / totalBottlenecks) : 0;
                          const strokeDasharray = `${percent * circumference} ${circumference}`;
                          const strokeDashoffset = -acc * circumference;
                          acc += percent;
                          const color = item.color || chartColors[idx % chartColors.length];
                          const isHovered = hoveredSlice === item.id;
                          const isSelected = drilldownCategory === item.id;

                          return (
                            <circle
                              key={item.id}
                              cx="80"
                              cy="80"
                              r={radius}
                              fill="transparent"
                              stroke={color}
                              strokeWidth={isSelected ? 30 : (isHovered ? 28 : 24)}
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              style={{
                                transition: 'all 0.25s ease',
                                cursor: 'pointer',
                                filter: (isHovered || isSelected) ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' : 'none',
                                opacity: drilldownCategory && !isSelected && !isHovered ? 0.6 : 1
                              }}
                              onMouseEnter={() => setHoveredSlice(item.id)}
                              onMouseLeave={() => setHoveredSlice(null)}
                              onClick={() => {
                                setDrilldownCategory(prev => prev === item.id ? null : item.id);
                              }}
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Centro do Donut */}
                    <div style={{
                      position: 'absolute',
                      textAlign: 'center',
                      pointerEvents: 'none',
                      maxWidth: '110px'
                    }}>
                      <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'block', lineHeight: '1.1' }}>
                        {hoveredSlice
                          ? categoryBottlenecks.find(c => c.id === hoveredSlice)?.count
                          : (drilldownCategory ? categoryBottlenecks.find(c => c.id === drilldownCategory)?.count : totalBottlenecks)}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {hoveredSlice
                          ? categoryBottlenecks.find(c => c.id === hoveredSlice)?.name
                          : (drilldownCategory ? categoryBottlenecks.find(c => c.id === drilldownCategory)?.name : 'Gargalos')}
                      </span>
                    </div>
                  </div>

                  {/* Legenda dos Tópicos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, minWidth: '200px', maxHeight: '220px', overflowY: 'auto' }}>
                    {categoryBottlenecks.map((item, idx) => {
                      const percent = totalBottlenecks > 0 ? Math.round((item.count / totalBottlenecks) * 100) : 0;
                      const color = item.color || chartColors[idx % chartColors.length];
                      const isHovered = hoveredSlice === item.id;
                      const isSelected = drilldownCategory === item.id;

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredSlice(item.id)}
                          onMouseLeave={() => setHoveredSlice(null)}
                          onClick={() => setDrilldownCategory(prev => prev === item.id ? null : item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isSelected ? 'var(--primary-brown-light)' : (isHovered ? '#FAF8F5' : 'transparent'),
                            border: isSelected ? '1px solid var(--primary-brown)' : '1px solid transparent',
                            transition: 'all 0.15s ease',
                            cursor: 'pointer'
                          }}
                          title="Clique para abrir o gráfico dos subtópicos abaixo"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: (isSelected || isHovered) ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                            <ChevronRight size={13} color={isSelected ? 'var(--primary-brown)' : 'var(--text-muted)'} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Gráfico 2: Subtópicos do Tema Selecionado (Criado abaixo quando um tópico é clicado) */}
            {drilldownCategory && (
              <div style={{
                borderTop: '2px dashed var(--border-subtle)',
                paddingTop: '1.25rem',
                backgroundColor: '#FAF8F5',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.5rem',
                animation: 'fadeIn 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                      <PieIcon size={17} color="var(--primary-brown)" />
                      Subtópicos de: {activeDrilldownCat?.name?.split('(')[0].trim()}
                    </h4>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      Distribuição detalhada das não-conformidades específicas deste tema
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontWeight: 700, color: 'var(--text-main)' }}>
                      Total: {totalSubBottlenecks} ocorrências
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setDrilldownCategory(null);
                        setSelectedSubproblem(null);
                      }}
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#FFFFFF' }}
                      title="Fechar gráfico de subtópicos"
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                {subproblemBottlenecks.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhum subtópico detalhado foi registrado ainda para este tema nas visitas.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.25rem', overflow: 'hidden', maxWidth: '100%' }}>
                      {/* Donut dos Subtópicos */}
                      <div style={{ position: 'relative', width: '170px', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="170" height="170" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="transparent"
                            stroke="#EBE5DF"
                            strokeWidth="22"
                          />

                          {(() => {
                            let accSub = 0;
                            return subproblemBottlenecks.map((sub, idx) => {
                              const percent = totalSubBottlenecks > 0 ? (sub.count / totalSubBottlenecks) : 0;
                              const strokeDasharray = `${percent * circumference} ${circumference}`;
                              const strokeDashoffset = -accSub * circumference;
                              accSub += percent;
                              const color = sub.color || chartColors[idx % chartColors.length];
                              const isSelectedSub = selectedSubproblem === sub.id;

                              return (
                                <circle
                                  key={sub.id}
                                  cx="80"
                                  cy="80"
                                  r={radius}
                                  fill="transparent"
                                  stroke={color}
                                  strokeWidth={isSelectedSub ? 28 : 22}
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  onClick={() => setSelectedSubproblem(prev => prev === sub.id ? null : sub.id)}
                                  style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    opacity: selectedSubproblem ? (isSelectedSub ? 1 : 0.45) : 1
                                  }}
                                />
                              );
                            });
                          })()}
                        </svg>

                        <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-brown)', display: 'block', lineHeight: '1.1' }}>
                            {selectedSubproblem 
                              ? (subproblemBottlenecks.find(s => s.id === selectedSubproblem)?.count || 0)
                              : totalSubBottlenecks}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                            {selectedSubproblem ? 'Nesta Falha' : 'Subtópicos'}
                          </span>
                        </div>
                      </div>

                      {/* Legenda Interativa dos Subtópicos */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '220px', maxHeight: '210px', overflowY: 'auto', overflowX: 'hidden' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>
                          💡 Clique em qualquer problema abaixo para ver as lojas afetadas:
                        </div>
                        {subproblemBottlenecks.map((sub, idx) => {
                          const percent = totalSubBottlenecks > 0 ? Math.round((sub.count / totalSubBottlenecks) * 100) : 0;
                          const color = sub.color || chartColors[idx % chartColors.length];
                          const isSelectedSub = selectedSubproblem === sub.id;

                          return (
                            <div
                              key={sub.id}
                              onClick={() => setSelectedSubproblem(prev => prev === sub.id ? null : sub.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.35rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: isSelectedSub ? '#FFFFFF' : '#FFFFFF',
                                border: isSelectedSub ? `2px solid ${color}` : '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                boxShadow: isSelectedSub ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                              title="Clique para listar as lojas com este problema"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.78rem', fontWeight: isSelectedSub ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.name}>
                                  {sub.name}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: color }}>
                                  {percent}%
                                </span>
                                <span className="count-pill count-pill-dark" style={{ fontSize: '0.7rem' }}>
                                  {sub.count}
                                </span>
                                <ChevronRight size={13} color={isSelectedSub ? color : 'var(--text-muted)'} style={{ transform: isSelectedSub ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* PAINEL DE LOJAS AFETADAS PELO PROBLEMA SELECIONADO       */}
                    {/* ========================================================= */}
                    {selectedSubproblem && (
                      <div style={{
                        marginTop: '1.25rem',
                        padding: '1.15rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-sm)',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Store size={18} color="var(--primary-brown)" />
                            <div>
                              <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 700 }}>
                                Lojas com: "{subproblemBottlenecks.find(s => s.id === selectedSubproblem)?.name}"
                              </h5>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {affectedStoresForSubproblem.length} {affectedStoresForSubproblem.length === 1 ? 'loja identificada' : 'lojas identificadas'} nesta não-conformidade
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedSubproblem(null)}
                            style={{
                              background: '#F1F5F9',
                              border: 'none',
                              borderRadius: 'var(--radius-full)',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <X size={12} /> Limpar seleção
                          </button>
                        </div>

                        {affectedStoresForSubproblem.length === 0 ? (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                            Nenhuma loja vinculada a este problema nos relatórios recentes.
                          </p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '0.3rem' }}>
                            {affectedStoresForSubproblem.map(item => (
                              <div
                                key={item.storeId}
                                onClick={() => {
                                  if (item.store) {
                                    setSelectedStoreForProfile(item.store);
                                  }
                                }}
                                style={{
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0.75rem',
                                  backgroundColor: '#FAF8F5',
                                  cursor: item.store ? 'pointer' : 'default',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                  if (item.store) {
                                    e.currentTarget.style.borderColor = 'var(--primary-brown)';
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (item.store) {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.backgroundColor = '#FAF8F5';
                                  }
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>
                                      {item.storeName}
                                    </strong>
                                    {item.storeCode && (
                                      <span style={{ fontSize: '0.68rem', background: '#FFFFFF', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--primary-brown)', whiteSpace: 'nowrap' }}>
                                        {item.storeCode}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                    <MapPin size={11} />
                                    <span>{item.city || 'Cidade N/D'}{item.state ? ` - ${item.state}` : ''}</span>
                                    {item.franchisee && <span>&bull; Franqueado: {item.franchisee}</span>}
                                  </div>
                                </div>

                                <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {item.occurrences.map((occ, oIdx) => (
                                    <div key={oIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <span style={{ 
                                          width: '6px', 
                                          height: '6px', 
                                          borderRadius: '50%', 
                                          backgroundColor: occ.severity === 'Crítica' ? '#EF4444' : (occ.severity === 'Alta' ? '#F59E0B' : '#3B82F6') 
                                        }} />
                                        <span>Visita de {new Date(occ.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                      </span>
                                      <span style={{ fontWeight: 600, color: occ.actionPlan?.status === 'Concluído' ? '#059669' : '#DC2626' }}>
                                        {occ.actionPlan?.status || 'Plano Registrado'}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {item.store && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.2rem', color: 'var(--primary-brown)', fontSize: '0.72rem', fontWeight: 700 }}>
                                    <span>Ver Ficha 360º da Loja</span>
                                    <ChevronRight size={12} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {drilldownCategory ? 'Clique no mesmo tema ou em "Fechar" para ocultar o gráfico inferior.' : 'Dica: clique em qualquer tema para abrir o gráfico dos subtópicos abaixo.'}
              </span>
              {canAccessSettings && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => setActiveTab('taxonomy')}
                >
                  Ver Matriz de Tópicos <ArrowRight size={14} />
                </button>
              )}
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
        </>
      )}
    </div>
  );
}
