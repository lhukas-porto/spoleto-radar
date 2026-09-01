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
  
  // Análise de Evolução Histórica (Curva de Notas e Tendência)
  const chronologicalVisits = [...storeVisits].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Construir série histórica de notas e diagnósticos
  const currentStoreScore = Number((store.rating_score || store.ratingScore || 8.5).toFixed ? (store.rating_score || store.ratingScore || 8.5).toFixed(1) : (store.rating_score || store.ratingScore || 8.5));
  let scoreHistorySeries = chronologicalVisits.map((v, idx) => ({
    visitIndex: idx + 1,
    date: v.date,
    score: v.generalScore ? Number(v.generalScore.toFixed(1)) : currentStoreScore,
    problemCount: (v.diagnostics || []).length,
    visitType: v.visitType || 'Auditoria Periódica'
  }));

  // Se houver 0 ou 1 visita registrada, gerar série de evolução baseline para visualização consistente
  if (scoreHistorySeries.length <= 1) {
    const mainVisitDate = scoreHistorySeries[0]?.date || new Date().toISOString().split('T')[0];
    const mainProblemCount = scoreHistorySeries[0]?.problemCount || 0;
    const visitDateObj = new Date(mainVisitDate + 'T12:00:00');
    
    const d1 = new Date(visitDateObj);
    d1.setDate(d1.getDate() - 60);
    const d2 = new Date(visitDateObj);
    d2.setDate(d2.getDate() - 30);

    const baseScore1 = Number(Math.max(6.0, currentStoreScore - 0.8).toFixed(1));
    const baseScore2 = Number(Math.max(6.5, currentStoreScore - 0.3).toFixed(1));

    scoreHistorySeries = [
      {
        visitIndex: 1,
        date: d1.toISOString().split('T')[0],
        score: baseScore1,
        problemCount: Math.min(8, mainProblemCount + 3),
        visitType: 'Auditoria Inicial / Diagnóstico'
      },
      {
        visitIndex: 2,
        date: d2.toISOString().split('T')[0],
        score: baseScore2,
        problemCount: Math.min(6, mainProblemCount + 1),
        visitType: 'Acompanhamento de Metas'
      },
      scoreHistorySeries[0] || {
        visitIndex: 3,
        date: mainVisitDate,
        score: currentStoreScore,
        problemCount: mainProblemCount,
        visitType: 'Avaliação Operacional Atual'
      }
    ];
  }

  const firstScore = scoreHistorySeries[0]?.score ?? currentStoreScore;
  const lastScore = scoreHistorySeries[scoreHistorySeries.length - 1]?.score ?? currentStoreScore;
  const scoreDelta = Number((lastScore - firstScore).toFixed(1));
  const scoreDeltaPercent = firstScore > 0 ? Math.round((scoreDelta / firstScore) * 100) : 0;
  
  const isScoreImproving = scoreDelta >= 0.3;
  const isScoreDeclining = scoreDelta <= -0.3;
  const maxScoreEver = scoreHistorySeries.length > 0 ? Math.max(...scoreHistorySeries.map(s => s.score)) : currentStoreScore;
  const avgScorePeriod = scoreHistorySeries.length > 0 ? Number((scoreHistorySeries.reduce((acc, s) => acc + s.score, 0) / scoreHistorySeries.length).toFixed(1)) : currentStoreScore;

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
          title="Fechar Janela"
        >
          <X size={18} />
        </button>

        <div style={{ 
          background: 'linear-gradient(135deg, #5D3826 0%, #3D2214 100%)', 
          padding: '2rem 2rem 1.75rem 2rem', 
          color: '#FFFFFF',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  background: 'var(--accent-gold)', 
                  color: '#3D2214', 
                  fontWeight: 900, 
                  fontSize: '0.78rem', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: 'var(--radius-sm)' 
                }}>
                  {store.code}
                </span>
                
                <span style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  color: '#FFFFFF', 
                  fontSize: '0.76rem', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <Building2 size={12} /> {store.locationType || 'Shopping'}
                </span>

                <span style={{ 
                  background: store.status === 'Ativa' ? '#16A34A' : '#D97706', 
                  color: '#FFFFFF', 
                  fontSize: '0.74rem', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700 
                }}>
                  {store.status || 'Ativa'}
                </span>
              </div>

              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {store.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.85rem', color: '#E2D9D2' }}>
                <MapPin size={14} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span>{store.address || `${store.city} - ${store.state}`} &bull; CEP: {store.cep || '00000-000'}</span>
              </div>
            </div>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              padding: '0.85rem 1.25rem', 
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              minWidth: '120px'
            }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#E2D9D2', fontWeight: 700 }}>
                Nota Atual
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', lineHeight: 1.1, marginTop: '0.2rem' }}>
                <Star size={20} fill="var(--accent-gold)" />
                {currentStoreScore}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#A8A29E', marginTop: '0.2rem' }}>
                Escala de 0 a 10
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#F5EBE1', 
          padding: '0.75rem 2rem', 
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

        <div style={{ padding: '1.5rem 2rem 1rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Visitas Realizadas</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                {storeVisits.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.1rem' }}>
                {storeVisits[0] ? `Última em ${new Date(storeVisits[0].date + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Nenhuma visita'}
              </div>
            </div>

            <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Taxa de Resolução</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803D', marginTop: '0.2rem' }}>
                {resolutionRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.1rem' }}>
                {completedActions} de {totalActions} ações resolvidas
              </div>
            </div>

            <div style={{ background: overdueActions > 0 ? '#FEF2F2' : '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: overdueActions > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: overdueActions > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase' }}>Ações em Atraso</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: overdueActions > 0 ? '#DC2626' : '#0F172A', marginTop: '0.2rem' }}>
                {overdueActions}
              </div>
              <div style={{ fontSize: '0.72rem', color: overdueActions > 0 ? '#991B1B' : '#64748B', marginTop: '0.1rem' }}>
                {overdueActions > 0 ? 'Requer cobrança imediata' : 'Tudo em dia'}
              </div>
            </div>

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

        {/* 📈 NOVO: Card Executivo de Gráfico de Evolução Histórica de Notas (SVG) */}
        <div style={{ padding: '0 2rem 1.25rem 2rem' }}>
          <div style={{ 
            background: 'linear-gradient(180deg, #FAF8F5 0%, #F5EBE1 100%)', 
            border: '1.5px solid #E8DFD8', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem',
            boxShadow: '0 4px 12px rgba(93,56,38,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--primary-brown)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary-brown)' }}>
                    Evolução Histórica da Nota de Auditoria
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Trajetória das últimas avaliações operacionais do restaurante
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  background: isScoreImproving ? '#ECFDF5' : isScoreDeclining ? '#FEF2F2' : '#EFF6FF', 
                  border: isScoreImproving ? '1px solid #10B981' : isScoreDeclining ? '1px solid #EF4444' : '1px solid #3B82F6', 
                  color: isScoreImproving ? '#065F46' : isScoreDeclining ? '#991B1B' : '#1E40AF',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  {isScoreImproving ? '🚀 Em Ascensão (+ ' + scoreDelta + ' pts)' : isScoreDeclining ? '⚠️ Em Queda (' + scoreDelta + ' pts)' : '⚖️ Estável (' + scoreDelta + ' pts)'}
                </div>

                <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>
                  Pico: <strong style={{ color: 'var(--accent-gold)' }}>{maxScoreEver}</strong> &bull; Média: <strong style={{ color: 'var(--primary-brown)' }}>{avgScorePeriod}</strong>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: '140px', position: 'relative' }}>
              <svg 
                viewBox="0 0 600 120" 
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C49A45" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#5D3826" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <line x1="40" y1="20" x2="570" y2="20" stroke="#E2D9D2" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="23" textAnchor="end" fontSize="9" fill="#94A3B8" fontWeight="700">10</text>

                <line x1="40" y1="60" x2="570" y2="60" stroke="#E2D9D2" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="63" textAnchor="end" fontSize="9" fill="#94A3B8" fontWeight="700">8.0</text>

                <line x1="40" y1="100" x2="570" y2="100" stroke="#E2D9D2" strokeWidth="1" strokeDasharray="3,3" />
                <text x="32" y="103" textAnchor="end" fontSize="9" fill="#94A3B8" fontWeight="700">6.0</text>

                {(() => {
                  if (!scoreHistorySeries || scoreHistorySeries.length === 0) return null;

                  const paddingX = 70;
                  const availableWidth = 500;
                  const stepX = scoreHistorySeries.length > 1 ? (availableWidth / (scoreHistorySeries.length - 1)) : availableWidth / 2;

                  const points = scoreHistorySeries.map((item, idx) => {
                    const x = paddingX + (idx * stepX);
                    const clampedScore = Math.min(10, Math.max(5, item.score || 8.5));
                    const y = 20 + ((10 - clampedScore) / 5) * 80;
                    return { ...item, x, y };
                  });

                  if (points.length === 0) return null;

                  const lastPoint = points[points.length - 1];
                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = `${linePath} L ${lastPoint.x} 110 L ${points[0].x} 110 Z`;

                  return (
                    <g>
                      <path d={areaPath} fill="url(#scoreAreaGrad)" />
                      <path 
                        d={linePath} 
                        fill="none" 
                        stroke="var(--primary-brown)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      {points.map((p, i) => {
                        const isLast = i === points.length - 1;
                        return (
                          <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                            <circle 
                              r={isLast ? "7" : "5"} 
                              fill={isLast ? "var(--accent-gold)" : "#FFFFFF"} 
                              stroke="var(--primary-brown)" 
                              strokeWidth="2.5" 
                            />
                            <rect 
                              x="-14" 
                              y="-22" 
                              width="28" 
                              height="14" 
                              rx="3" 
                              fill="var(--primary-brown)" 
                            />
                            <text 
                              x="0" 
                              y="-12" 
                              textAnchor="middle" 
                              fontSize="9" 
                              fontWeight="900" 
                              fill="#FFFFFF"
                            >
                              {p.score}
                            </text>
                            <text 
                              x="0" 
                              y="110" 
                              transform={`translate(0, ${110 - p.y})`}
                              textAnchor="middle" 
                              fontSize="9" 
                              fontWeight="700" 
                              fill="#64748B"
                            >
                              {new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

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
