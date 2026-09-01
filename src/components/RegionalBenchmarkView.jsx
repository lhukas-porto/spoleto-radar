import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  User, 
  MapPin, 
  Store, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Award, 
  PieChart, 
  BarChart3, 
  ChevronRight,
  ShieldAlert,
  Users
} from 'lucide-react';
import { evaluateActionPlanStatus } from '../utils/dateHelpers';

export default function RegionalBenchmarkView() {
  const { stores, visits, consultants, categories, setSelectedStaffForProfile, setSelectedStoreForProfile } = useApp();
  const [selectedRegionalTab, setSelectedRegionalTab] = useState('all'); // 'all' | 'sp' | 'rj' | 'nne'

  // Identificar os 3 Gerentes Regionais Oficiais
  const regionalManagers = [
    {
      key: 'sp',
      name: 'RODRIGO SOUSA MARQUES',
      role: 'GERENTE REGIONAL SP & INTERIOR',
      regionNames: ['SP Capital, Campinas & Região', 'SP Capital, ABC, Litoral & Vale', 'SP Capital, Osasco, Alto Tietê & Interior', 'SP Capital, Campinas & Piracicaba', 'SP Capital, Campinas & Interior', 'SP Interior & Sul de Minas', 'SP - Capital', 'SP - Interior'],
      email: 'rodrigo.marques@spoleto.com.br',
      phone: '(11) 99830-2382',
      color: '#B45309',
      bgColor: '#FEF3C7',
      borderColor: '#F59E0B'
    },
    {
      key: 'rj',
      name: 'ANDRÉ LUIZ LIMA BATISTA',
      role: 'GERENTE REGIONAL RJ & SUDESTE',
      regionNames: ['RJ Capital & Sul Fluminense', 'RJ Capital, Serrana, Lagos & Norte', 'RJ Capital & Espírito Santo', 'Minas Gerais (BH & Interior)', 'RJ - Capital'],
      email: 'andre.batista@spoleto.com.br',
      phone: '(21) 99916-8362',
      color: '#1E40AF',
      bgColor: '#EFF6FF',
      borderColor: '#3B82F6'
    },
    {
      key: 'nne',
      name: 'ANAKETLIM WESTARB CRUZ',
      role: 'GERENTE REGIONAL NORTE, NORDESTE & SUL',
      regionNames: ['Norte & Nordeste (AM, PA, AP, RR, RO, MA, PI)', 'Nordeste (PB, PE, AL, BA, RN)', 'Nordeste (CE, BA)', 'Centro-Oeste (DF, GO, MT, MS, TO)', 'DF, GO, MT, AC & BA', 'Região Sul (PR, SC, RS)', 'Sul - Geral'],
      email: 'anaketlim.cruz@spoleto.com.br',
      phone: '(21) 97283-4285',
      color: '#065F46',
      bgColor: '#ECFDF5',
      borderColor: '#10B981'
    }
  ];

  // Calcular métricas consolidadas por regional
  const regionalMetrics = regionalManagers.map(mgr => {
    // Consultores da regional
    const mgrConsultants = consultants.filter(c => 
      c.reportsTo === mgr.id || 
      mgr.regionNames.some(r => (c.region || '').toLowerCase().includes(r.toLowerCase())) ||
      c.name.toLowerCase().includes(mgr.name.toLowerCase())
    );

    const consultantIds = mgrConsultants.map(c => c.id);

    // Lojas da regional
    const mgrStores = stores.filter(s => 
      consultantIds.includes(s.consultantId) ||
      mgr.regionNames.some(r => (s.state || '').toLowerCase() === r.toLowerCase() || (s.city || '').toLowerCase().includes(r.toLowerCase()))
    );

    const storeIds = mgrStores.map(s => s.id);

    // Visitas da regional
    const mgrVisits = visits.filter(v => 
      storeIds.includes(v.storeId) || consultantIds.includes(v.consultantId)
    );

    // Calcular planos de ação, atrasos e gargalos da regional
    let totalPlans = 0;
    let completedPlans = 0;
    let overduePlans = 0;
    const catCounts = {};

    mgrVisits.forEach(v => {
      (v.diagnostics || []).forEach(d => {
        totalPlans++;
        const status = d.actionPlan?.status || 'NÃO INICIADO';
        const deadline = d.actionPlan?.deadline || 'IMEDIATO';
        const metrics = evaluateActionPlanStatus(v.date, deadline, status);

        if (metrics.isCompleted) completedPlans++;
        if (metrics.isOverdue) overduePlans++;

        const catId = d.categoryId || 'outros';
        catCounts[catId] = (catCounts[catId] || 0) + 1;
      });
    });

    // Top 3 Gargalos da regional
    const topCategories = Object.entries(catCounts)
      .map(([catId, count]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat ? cat.name.split('(')[0].trim() : 'Geral',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const complianceRate = totalPlans > 0 
      ? Math.round(((totalPlans - overduePlans) / totalPlans) * 100) 
      : 100;

    const resolutionRate = totalPlans > 0 
      ? Math.round((completedPlans / totalPlans) * 100) 
      : 0;

    // Achar o objeto completo do consultor/gerente
    const managerStaff = consultants.find(c => c.name.toUpperCase().includes(mgr.name.split(' ')[0])) || {
      id: `staff-${mgr.key}`,
      name: mgr.name,
      role: 'GERENTE_REGIONAL',
      email: mgr.email,
      phone: mgr.phone,
      region: mgr.regionNames[0]
    };

    return {
      ...mgr,
      managerStaff,
      totalStores: mgrStores.length,
      totalConsultants: mgrConsultants.length || 5,
      totalVisits: mgrVisits.length,
      totalPlans,
      completedPlans,
      overduePlans,
      complianceRate,
      resolutionRate,
      topCategories
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Executivo do Benchmark */}
      <div style={{
        background: 'linear-gradient(135deg, #5D3826 0%, #78350F 50%, #B45309 100%)',
        padding: '1.5rem 1.75rem',
        borderRadius: 'var(--radius-lg)',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart3 size={24} color="#FFFFFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', margin: 0, fontWeight: 800 }}>
              Benchmark & Painel Comparativo das 3 Regionais
            </h2>
            <p style={{ color: '#FEE2E2', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Visão executiva consolidada para a <strong>Gerente Nacional (Liliane Cury)</strong> e <strong>Diretoria (Rafael Pardo)</strong>.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            onClick={() => setSelectedRegionalTab('all')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: selectedRegionalTab === 'all' ? '#FFFFFF' : 'transparent',
              color: selectedRegionalTab === 'all' ? '#5D3826' : '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Todas as Regionais
          </button>
          {regionalMetrics.map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRegionalTab(r.key)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: selectedRegionalTab === r.key ? '#FFFFFF' : 'transparent',
                color: selectedRegionalTab === r.key ? '#5D3826' : '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {r.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards das 3 Regionais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {regionalMetrics
          .filter(r => selectedRegionalTab === 'all' || selectedRegionalTab === r.key)
          .map(r => (
            <div 
              key={r.key}
              style={{
                background: '#FFFFFF',
                border: `2px solid ${r.borderColor}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      padding: '0.2rem 0.55rem', 
                      borderRadius: 'var(--radius-full)', 
                      background: r.bgColor, 
                      color: r.color,
                      textTransform: 'uppercase'
                    }}>
                      {r.role}
                    </span>
                    <h3 
                      onClick={() => setSelectedStaffForProfile(r.managerStaff)}
                      style={{ 
                        fontSize: '1.15rem', 
                        color: 'var(--text-main)', 
                        margin: '0.45rem 0 0', 
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'transparent',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = r.color}
                      onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                      title="Clique para abrir a Ficha 360° do Gerente Regional"
                    >
                      {r.name}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: r.complianceRate >= 80 ? '#166534' : '#991B1B' }}>
                      {r.complianceRate}%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      ÍNDICE SLA NO PRAZO
                    </div>
                  </div>
                </div>

                {/* Métricas da Regional */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#FAF8F5', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                      {r.totalStores}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lojas</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                      {r.totalVisits}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Visitas</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: r.overduePlans > 0 ? '#991B1B' : '#166534' }}>
                      {r.overduePlans}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Atrasos</div>
                  </div>
                </div>

                {/* Top Gargalos da Regional */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Flame size={13} color="#DC2626" /> Principais Gargalos Operacionais:
                  </div>
                  {r.topCategories.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum gargalo expressivo registrado.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {r.topCategories.map((cat, idx) => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)', padding: '0.3rem 0.55rem', borderRadius: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {idx + 1}. {cat.name}
                          </span>
                          <span style={{ fontWeight: 800, color: r.color, background: r.bgColor, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem' }}>
                            {cat.count} apont.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botão para abrir a Ficha 360° do Gerente */}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedStaffForProfile(r.managerStaff)}
                style={{ width: '100%', fontSize: '0.78rem', padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.5rem' }}
              >
                <User size={13} /> Ver Ficha 360° de {r.name.split(' ')[0]}
              </button>
            </div>
          ))}
      </div>

      {/* Tabela Comparativa Consolidada */}
      <div className="card-panel" style={{ margin: 0 }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-brown)', marginBottom: '0.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <TrendingUp size={18} /> Tabela Comparativa de Performance entre Regionais
        </h3>
        <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
          Métricas calculadas em tempo real com base no histórico de visitas e auditorias técnicas Spoleto.
        </p>

        <div className="spoleto-table-container">
          <table className="spoleto-table">
            <thead>
              <tr>
                <th>Gerência Regional</th>
                <th style={{ textAlign: 'center' }}>Lojas Ativas</th>
                <th style={{ textAlign: 'center' }}>Visitas Realizadas</th>
                <th style={{ textAlign: 'center' }}>Planos Criados</th>
                <th style={{ textAlign: 'center' }}>Concluídos</th>
                <th style={{ textAlign: 'center' }}>Em Atraso</th>
                <th style={{ textAlign: 'center' }}>Índice no Prazo (SLA)</th>
                <th>Principal Gargalo</th>
              </tr>
            </thead>
            <tbody>
              {regionalMetrics.map(r => (
                <tr key={r.key}>
                  <td>
                    <strong style={{ color: 'var(--primary-brown)', fontSize: '0.88rem' }}>{r.name}</strong>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.role}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.totalStores}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.totalVisits}</td>
                  <td style={{ textAlign: 'center' }}>{r.totalPlans}</td>
                  <td style={{ textAlign: 'center', color: '#166534', fontWeight: 700 }}>{r.completedPlans}</td>
                  <td style={{ textAlign: 'center', color: r.overduePlans > 0 ? '#991B1B' : '#166534', fontWeight: 700 }}>{r.overduePlans}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${r.complianceRate >= 80 ? 'badge-concluido' : 'badge-critica'}`} style={{ fontSize: '0.78rem' }}>
                      {r.complianceRate}% no prazo
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {r.topCategories[0]?.name || 'Em conformidade'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
