import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber } from '../utils/dateHelpers';
import { 
  Store, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  X, 
  ChevronRight, 
  Award, 
  RotateCcw,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';

export default function StoreProfileModal({ store, onClose }) {
  const { 
    visits, 
    consultants, 
    categories, 
    franchisees,
    getStoreFranchisees,
    setSelectedVisitForReport, 
    setSelectedStaffForProfile,
    updateActionPlanStatus
  } = useApp();

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'actions' | 'reoccurrences'

  if (!store) return null;

  const storeFranchisees = getStoreFranchisees ? getStoreFranchisees(store.id) : [];

  // Lojas e Visitas
  const storeVisits = visits
    .filter(v => v.storeId === store.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const consultant = consultants.find(c => 
    c.id === store.consultantId || 
    (c.assignedStores && Array.isArray(c.assignedStores) && c.assignedStores.includes(store.id))
  );

  // Extrair todos os diagnósticos e planos de ação da loja
  const allDiagnostics = [];
  storeVisits.forEach(v => {
    (v.diagnostics || []).forEach(d => {
      allDiagnostics.push({
        ...d,
        visitId: v.id,
        visitDate: v.date,
        visitType: v.visitType,
        consultantId: v.consultantId
      });
    });
  });

  // Estatísticas e Métricas
  const totalActions = allDiagnostics.filter(d => d.actionPlan && d.actionPlan.what).length;
  const completedActions = allDiagnostics.filter(d => (d.actionPlan?.status || '').toUpperCase() === 'CONCLUÍDO').length;
  const inProgressActions = allDiagnostics.filter(d => (d.actionPlan?.status || '').toUpperCase() === 'EM ANDAMENTO').length;
  const overdueActions = allDiagnostics.filter(d => {
    const st = (d.actionPlan?.status || '').toUpperCase();
    if (st === 'CONCLUÍDO') return false;
    const deadlineStr = d.actionPlan?.deadline;
    if (!deadlineStr || deadlineStr === 'IMEDIATO') return false;
    const dlDate = new Date(deadlineStr + 'T23:59:59');
    return !isNaN(dlDate.getTime()) && dlDate < new Date();
  }).length;

  const resolutionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 100;

  // Análise de Evolução Histórica (Trend de problemas)
  // Visitas em ordem cronológica (mais antiga -> mais nova)
  const chronologicalVisits = [...storeVisits].sort((a, b) => new Date(a.date) - new Date(b.date));
  const visitEvolutionData = chronologicalVisits.map((v, idx) => ({
    visitIndex: idx + 1,
    date: v.date,
    problemCount: (v.diagnostics || []).length,
    visitType: v.visitType
  }));

  const firstVisitProblems = visitEvolutionData[0]?.problemCount ?? 0;
  const lastVisitProblems = visitEvolutionData[visitEvolutionData.length - 1]?.problemCount ?? 0;
  const isImproving = storeVisits.length >= 2 ? lastVisitProblems < firstVisitProblems : true;
  const isWorsening = storeVisits.length >= 2 ? lastVisitProblems > firstVisitProblems : false;

  // Detector de Reincidência nesta loja
  const subproblemFrequency = {};
  allDiagnostics.forEach(d => {
    const key = d.subproblemId || d.problem || 'outro';
    if (!subproblemFrequency[key]) {
      const cat = categories.find(c => c.id === d.categoryId);
      const sub = cat?.subproblems?.find(s => s.id === d.subproblemId);
      subproblemFrequency[key] = {
        subproblemId: d.subproblemId,
        title: sub?.title || d.subproblemTitle || d.problem || 'Não conformidade',
        categoryName: cat?.name || 'Geral',
        categoryColor: cat?.color || '#5D3826',
        count: 0,
        dates: []
      };
    }
    subproblemFrequency[key].count += 1;
    if (!subproblemFrequency[key].dates.includes(d.visitDate)) {
      subproblemFrequency[key].dates.push(d.visitDate);
    }
  });

  const reoccurringProblems = Object.values(subproblemFrequency)
    .filter(item => item.count >= 2)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9990 }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '880px', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          padding: 0, 
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          background: '#FFFFFF',
          position: 'relative'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar Padrão Windows */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EF4444';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.borderColor = '#DC2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          title="Fechar Janela"
        >
          <X size={18} />
        </button>

        {/* Top Banner & Identificação da Loja */}
        <div style={{ 
          background: 'linear-gradient(135deg, #5D3826 0%, #3D2214 100%)', 
          padding: '2rem 2rem 1.75rem 2rem', 
          color: '#FFFFFF',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              background: 'var(--accent-gold)', 
              color: '#3D2214', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '4px',
              letterSpacing: '0.5px'
            }}>
              CÓDIGO RP: {store.code}
            </span>

            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              background: 'rgba(255, 255, 255, 0.2)', 
              color: '#FFFFFF', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '4px' 
            }}>
              {store.locationType}
            </span>

            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              background: store.status === 'Ativa' ? '#22C55E' : '#94A3B8', 
              color: '#FFFFFF', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '4px' 
            }}>
              {store.status || 'Ativa'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
            {store.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: '#E8DFD8', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} color="var(--accent-gold)" />
              {store.city} - {store.state} {store.cep ? `• CEP ${store.cep}` : ''}
            </span>
            <span>
              {storeFranchisees.length > 1 ? 'Sócios / Franqueados: ' : 'Franqueado(a): '}
              <strong style={{ color: '#FFFFFF' }}>
                {storeFranchisees.length > 0 
                  ? storeFranchisees.map(f => f.name).join(' • ') 
                  : (store.franchisee || 'Franquia Oficial Spoleto')}
              </strong>
            </span>
          </div>
        </div>

        {/* Barra de Consultor Responsável & Contato */}
        <div style={{ 
          background: '#FAF8F5', 
          padding: '0.85rem 2rem', 
          borderBottom: '1px solid #E8DFD8', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.84rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Consultor(a) de Negócios:</span>{' '}
            {consultant ? (
              <strong 
                onClick={() => { onClose(); setSelectedStaffForProfile(consultant); }}
                style={{ color: 'var(--primary-brown)', cursor: 'pointer', textDecoration: 'underline' }}
                title="Ver Ficha do Consultor"
              >
                {consultant.name} ({consultant.region})
              </strong>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Não atribuído</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
            {storeFranchisees.length > 0 ? (
              storeFranchisees.map(f => {
                const cleanPhone = (f.phone || '').replace(/\D/g, '');
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                    <strong style={{ color: 'var(--primary-brown)' }}>{f.name.split(' ')[0]}:</strong>
                    {cleanPhone && (
                      <a href={`https://wa.me/55${cleanPhone}`} target="_blank" rel="noreferrer" style={{ color: '#166534', textDecoration: 'underline', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Phone size={11} /> {f.phone}
                      </a>
                    )}
                    {f.email && (
                      <a href={`mailto:${f.email}`} title={f.email} style={{ color: 'var(--primary-brown)', textDecoration: 'underline', display: 'flex', alignItems: 'center' }}>
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                {store.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={13} color="var(--text-muted)" /> {formatPhoneNumber(store.phone)}
                  </span>
                )}
                {store.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={13} color="var(--text-muted)" /> {store.email}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* KPIs Principais da Loja */}
        <div style={{ padding: '1.5rem 2rem 1rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
            {/* Total Visitas */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Visitas Realizadas</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                {storeVisits.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.1rem' }}>
                {storeVisits[0] ? `Última em ${new Date(storeVisits[0].date + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Nenhuma visita'}
              </div>
            </div>

            {/* Taxa de Resolução */}
            <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Taxa de Resolução</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803D', marginTop: '0.2rem' }}>
                {resolutionRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.1rem' }}>
                {completedActions} de {totalActions} ações resolvidas
              </div>
            </div>

            {/* Ações Atrasadas */}
            <div style={{ background: overdueActions > 0 ? '#FEF2F2' : '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: overdueActions > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: overdueActions > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase' }}>Ações em Atraso</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: overdueActions > 0 ? '#DC2626' : '#0F172A', marginTop: '0.2rem' }}>
                {overdueActions}
              </div>
              <div style={{ fontSize: '0.72rem', color: overdueActions > 0 ? '#991B1B' : '#64748B', marginTop: '0.1rem' }}>
                {overdueActions > 0 ? 'Requer cobrança imediata' : 'Tudo em dia'}
              </div>
            </div>

            {/* Reincidências */}
            <div style={{ background: reoccurringProblems.length > 0 ? '#FFFBEB' : '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: reoccurringProblems.length > 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: reoccurringProblems.length > 0 ? '#92400E' : '#64748B', textTransform: 'uppercase' }}>Problemas Reincidentes</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: reoccurringProblems.length > 0 ? '#D97706' : '#0F172A', marginTop: '0.2rem' }}>
                {reoccurringProblems.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: reoccurringProblems.length > 0 ? '#92400E' : '#64748B', marginTop: '0.1rem' }}>
                {reoccurringProblems.length > 0 ? 'Requer atenção do franqueado' : 'Sem vícios crônicos'}
              </div>
            </div>
          </div>
        </div>

        {/* Linha do Tempo & Gráfico Visual de Evolução */}
        {visitEvolutionData.length >= 2 && (
          <div style={{ padding: '0 2rem 1.25rem 2rem' }}>
            <div style={{ 
              background: isImproving ? '#F0FDF4' : isWorsening ? '#FEF2F2' : '#F8FAFC', 
              border: isImproving ? '1px solid #86EFAC' : isWorsening ? '1px solid #FCA5A5' : '1px solid #CBD5E1', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isImproving ? (
                    <TrendingDown size={20} color="#15803D" />
                  ) : isWorsening ? (
                    <TrendingUp size={20} color="#DC2626" />
                  ) : (
                    <Award size={20} color="var(--primary-brown)" />
                  )}
                  <strong style={{ fontSize: '0.95rem', color: isImproving ? '#15803D' : isWorsening ? '#991B1B' : '#0F172A' }}>
                    {isImproving 
                      ? '📈 Curva de Evolução Positiva (Queda nas Não-Conformidades)' 
                      : isWorsening 
                      ? '⚠️ Alerta de Piora Operacional (Aumento de Não-Conformidades)' 
                      : 'Estabilidade Operacional'}
                  </strong>
                </div>

                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isImproving ? '#166534' : isWorsening ? '#991B1B' : '#475569' }}>
                  De {firstVisitProblems} para {lastVisitProblems} apontamentos ({firstVisitProblems > 0 ? Math.round(((lastVisitProblems - firstVisitProblems) / firstVisitProblems) * 100) : 0}%)
                </span>
              </div>

              {/* Sparkline / Barras de Evolução por Visita */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '90px', padding: '0 0.5rem' }}>
                {visitEvolutionData.map((v, i) => {
                  const maxProblems = Math.max(...visitEvolutionData.map(d => d.problemCount), 5);
                  const barHeight = Math.max(Math.round((v.problemCount / maxProblems) * 60), 8);
                  const isLast = i === visitEvolutionData.length - 1;

                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: v.problemCount === 0 ? '#15803D' : v.problemCount > 3 ? '#DC2626' : 'var(--primary-brown)' }}>
                        {v.problemCount} {v.problemCount === 1 ? 'item' : 'itens'}
                      </span>
                      <div style={{ 
                        width: '100%', 
                        maxWidth: '48px', 
                        height: `${barHeight}px`, 
                        background: v.problemCount === 0 ? '#22C55E' : isLast && isImproving ? '#16A34A' : isLast && isWorsening ? '#EF4444' : 'var(--primary-brown)', 
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} />
                      <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Abas de Navegação Interna */}
        <div style={{ padding: '0 2rem', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                padding: '0.75rem 0.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.88rem',
                fontWeight: activeTab === 'timeline' ? 800 : 600,
                color: activeTab === 'timeline' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'timeline' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Calendar size={16} /> Linha do Tempo de Visitas ({storeVisits.length})
            </button>

            <button
              onClick={() => setActiveTab('reoccurrences')}
              style={{
                padding: '0.75rem 0.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.88rem',
                fontWeight: activeTab === 'reoccurrences' ? 800 : 600,
                color: activeTab === 'reoccurrences' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'reoccurrences' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <RotateCcw size={16} /> Problemas Reincidentes ({reoccurringProblems.length})
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              style={{
                padding: '0.75rem 0.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.88rem',
                fontWeight: activeTab === 'actions' ? 800 : 600,
                color: activeTab === 'actions' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'actions' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <FileText size={16} /> Planos de Ação da Loja ({totalActions})
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
          {/* ABA 1: LINHA DO TEMPO DAS VISITAS */}
          {activeTab === 'timeline' && (
            <div>
              {storeVisits.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                  <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <h4>Nenhuma visita registrada para esta unidade</h4>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Ao finalizar uma nova visita para a loja {store.name}, o histórico aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {storeVisits.map((v, idx) => {
                    const cons = consultants.find(c => c.id === v.consultantId);
                    const diagCount = (v.diagnostics || []).length;
                    const isSigned = !!v.signatures;

                    return (
                      <div 
                        key={v.id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'all 0.15s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '50%', 
                            background: diagCount === 0 ? '#DCFCE7' : 'var(--primary-brown-light)', 
                            color: diagCount === 0 ? '#15803D' : 'var(--primary-brown)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            #{storeVisits.length - idx}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                                {new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </strong>

                              <span style={{ 
                                fontSize: '0.72rem', 
                                padding: '0.15rem 0.45rem', 
                                borderRadius: '4px', 
                                background: v.visitType === 'Visita surpresa' ? '#FEE2E2' : '#F1F5F9',
                                color: v.visitType === 'Visita surpresa' ? '#991B1B' : '#334155',
                                fontWeight: 700
                              }}>
                                {v.visitType || 'Visita agendada'}
                              </span>

                              {isSigned && (
                                <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <ShieldCheck size={13} /> Assinado
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                              Consultor(a): <strong style={{ color: '#334155' }}>{cons?.name || 'Não atribuído'}</strong>
                              {v.time && ` • Horário: ${v.time}${v.endTime ? ` às ${v.endTime}` : ''}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: 'var(--radius-full)',
                            background: diagCount === 0 ? '#DCFCE7' : diagCount > 3 ? '#FEE2E2' : '#FEF3C7',
                            color: diagCount === 0 ? '#15803D' : diagCount > 3 ? '#B91C1C' : '#92400E'
                          }}>
                            {diagCount} {diagCount === 1 ? 'não conformidade' : 'não conformidades'}
                          </span>

                          <button 
                            className="btn-primary" 
                            style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                            onClick={() => {
                              onClose();
                              setSelectedVisitForReport(v);
                            }}
                            title="Abrir Laudo Oficial em PDF"
                          >
                            <FileText size={14} /> Ver Laudo
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: PROBLEMAS REINCIDENTES */}
          {activeTab === 'reoccurrences' && (
            <div>
              {reoccurringProblems.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#166534', background: '#F0FDF4', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                  <h4>Excelente! Nenhuma reincidência crônica detectada</h4>
                  <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Esta unidade não repetiu a mesma não-conformidade nas visitas anteriores.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.25rem' }}>
                    Os temas abaixo foram apontados <strong>2 ou mais vezes</strong> nesta mesma loja:
                  </div>

                  {reoccurringProblems.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 800, 
                            background: item.categoryColor || '#5D3826', 
                            color: '#FFFFFF', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '3px' 
                          }}>
                            {item.categoryName}
                          </span>
                          <strong style={{ fontSize: '0.92rem', color: '#92400E' }}>
                            {item.title}
                          </strong>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#78350F' }}>
                          Identificado nas visitas de: {item.dates.map(d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')).join(', ')}
                        </div>
                      </div>

                      <div style={{ 
                        background: '#FEF3C7', 
                        color: '#B45309', 
                        fontWeight: 800, 
                        fontSize: '0.85rem', 
                        padding: '0.35rem 0.75rem', 
                        borderRadius: 'var(--radius-full)',
                        whiteSpace: 'nowrap',
                        border: '1px solid #FCD34D'
                      }}>
                        ⚠️ {item.count}x apontado
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: PLANOS DE AÇÃO DA LOJA */}
          {activeTab === 'actions' && (
            <div>
              {allDiagnostics.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <h4>Nenhum plano de ação pendente para esta unidade</h4>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {allDiagnostics.map((diag, idx) => {
                    const cat = categories.find(c => c.id === diag.categoryId);
                    const sub = cat?.subproblems?.find(s => s.id === diag.subproblemId);
                    const status = diag.actionPlan?.status || 'NÃO INICIADO';

                    return (
                      <div 
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: cat?.color || '#5D3826', color: '#FFFFFF', padding: '0.15rem 0.45rem', borderRadius: '3px' }}>
                              {cat?.name || 'Geral'}
                            </span>
                            <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>
                              {sub?.title || diag.subproblemTitle || diag.problem || 'Ação Corretiva'}
                            </strong>
                          </div>

                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 800, 
                            padding: '0.2rem 0.55rem', 
                            borderRadius: '4px',
                            background: status === 'CONCLUÍDO' ? '#DCFCE7' : status === 'EM ANDAMENTO' ? '#FEF08A' : '#FEE2E2',
                            color: status === 'CONCLUÍDO' ? '#15803D' : status === 'EM ANDAMENTO' ? '#854D0E' : '#B91C1C'
                          }}>
                            {status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.84rem', color: '#334155' }}>
                          <strong>O que fazer:</strong> {diag.actionPlan?.what || diag.actionPlan?.action || 'Definir plano de ação.'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <span>Responsável: <strong style={{ color: '#0F172A' }}>{diag.actionPlan?.who || diag.actionPlan?.responsible || 'Gerente'}</strong></span>
                          <span>Prazo: <strong style={{ color: '#0F172A' }}>{diag.actionPlan?.deadline || 'Imediato'}</strong></span>
                          <span>Visita: {new Date(diag.visitDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{ padding: '1rem 2rem', background: '#FAF8F5', borderTop: '1px solid #E8DFD8', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose} style={{ padding: '0.5rem 1.5rem' }}>
            Fechar Ficha 360°
          </button>
        </div>
      </div>
    </div>
  );
}
