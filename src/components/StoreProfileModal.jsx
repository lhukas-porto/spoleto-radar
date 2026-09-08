import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatPhoneNumber, formatBrDate } from '../utils/dateHelpers';
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
  ExternalLink,
  Users,
  UserMinus,
  Plus,
  Trash2,
  Sparkles,
  Percent
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
    updateActionPlanStatus,
    turnoverRecords = [],
    addTurnoverRecord,
    deleteTurnoverRecord
  } = useApp();

  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'actions' | 'reoccurrences' | 'turnover'
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  // Form de lançamento mensal de turnover
  const [isAddingTurnover, setIsAddingTurnover] = useState(false);
  const [turnoverMonth, setTurnoverMonth] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  });
  const [activeHeadcount, setActiveHeadcount] = useState(12);
  const [departures, setDepartures] = useState(0);
  const [admissions, setAdmissions] = useState(0);
  const [turnoverNotes, setTurnoverNotes] = useState('');

  if (!store) return null;

  // Registros de Turnover desta Loja ordenados por mês descrescente
  const storeTurnoverRecords = turnoverRecords
    .filter(r => r.storeId === store.id)
    .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

  // Último turnover registrado
  const latestTurnover = storeTurnoverRecords[0];

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
              {/* Foto da Loja com Zoom Centralizado ao Clicar */}
              <div 
                onClick={() => setZoomedPhoto({ 
                  url: store.photoUrl || null, 
                  name: store.name, 
                  code: store.code,
                  locationType: store.locationType 
                })}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  border: '3px solid var(--accent-gold)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--primary-brown-light)',
                  color: 'var(--primary-brown)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Clique para ver a foto ampliada"
              >
                {store.photoUrl ? (
                  <img src={store.photoUrl} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Store size={36} color="var(--primary-brown)" />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
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
                    background: 'rgba(255,255,255,0.22)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#FFFFFF', 
                    fontSize: '0.76rem', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }} title="Escala de trabalho dos colaboradores">
                    📅 Escala: {store.workShift || '6x1'}
                  </span>

                  {store.shoppingMallAdmin && (
                    <span style={{ 
                      background: 'rgba(255,255,255,0.18)', 
                      color: '#FFFFFF', 
                      fontSize: '0.76rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600
                    }}>
                      Adm: {store.shoppingMallAdmin}
                    </span>
                  )}

                  {store.franchiseContractExpiration && (
                    <span style={{ 
                      background: 'rgba(217, 119, 6, 0.3)', 
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#FDE68A', 
                      fontSize: '0.76rem', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }} title="Vencimento do Contrato de Franquias">
                      <Calendar size={12} /> Venc. Franquia: {formatBrDate(store.franchiseContractExpiration)}
                    </span>
                  )}

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

        <div style={{ padding: '1.25rem 2rem 0.75rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#F8FAFC', padding: '0.85rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Visitas Realizadas</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem' }}>
                {storeVisits.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.1rem' }}>
                {storeVisits[0] ? `Última em ${new Date(storeVisits[0].date + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Nenhuma visita'}
              </div>
            </div>

            <div style={{ background: '#F0FDF4', padding: '0.85rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #BBF7D0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Taxa de Resolução</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803D', marginTop: '0.2rem' }}>
                {resolutionRate}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {completedActions} de {totalActions} resolvidas
              </div>
            </div>

            <div style={{ background: overdueActions > 0 ? '#FEF2F2' : '#F8FAFC', padding: '0.85rem 0.5rem', borderRadius: 'var(--radius-md)', border: overdueActions > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: overdueActions > 0 ? '#991B1B' : '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ações em Atraso</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: overdueActions > 0 ? '#DC2626' : '#0F172A', marginTop: '0.2rem' }}>
                {overdueActions}
              </div>
              <div style={{ fontSize: '0.72rem', color: overdueActions > 0 ? '#991B1B' : '#64748B', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {overdueActions > 0 ? 'Requer cobrança' : 'Tudo em dia'}
              </div>
            </div>

            <div style={{ background: reoccurringProblems.length > 0 ? '#FFFBEB' : '#F8FAFC', padding: '0.85rem 0.5rem', borderRadius: 'var(--radius-md)', border: reoccurringProblems.length > 0 ? '1px solid #FDE68A' : '1px solid #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: reoccurringProblems.length > 0 ? '#92400E' : '#64748B', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Reincidentes</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: reoccurringProblems.length > 0 ? '#D97706' : '#0F172A', marginTop: '0.2rem' }}>
                {reoccurringProblems.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: reoccurringProblems.length > 0 ? '#92400E' : '#64748B', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {reoccurringProblems.length > 0 ? 'Atenção necessária' : 'Sem vícios crônicos'}
              </div>
            </div>

            {/* KPI Dinâmico de Turnover */}
            <div style={{ 
              background: latestTurnover 
                ? (latestTurnover.turnoverRate > 12 ? '#FEF2F2' : latestTurnover.turnoverRate > 5 ? '#FFFBEB' : '#F0FDF4') 
                : '#F8FAFC', 
              padding: '0.85rem 0.5rem', 
              borderRadius: 'var(--radius-md)', 
              border: latestTurnover 
                ? (latestTurnover.turnoverRate > 12 ? '1px solid #FECACA' : latestTurnover.turnoverRate > 5 ? '1px solid #FDE68A' : '1px solid #BBF7D0') 
                : '1px solid #E2E8F0', 
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('turnover')}
            title="Clique para ver o quadro completo de colaboradores"
            >
              <div style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                color: latestTurnover 
                  ? (latestTurnover.turnoverRate > 12 ? '#991B1B' : latestTurnover.turnoverRate > 5 ? '#92400E' : '#166534') 
                  : '#64748B', 
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <Users size={12} /> Turnover
              </div>
              <div style={{ 
                fontSize: '1.65rem', 
                fontWeight: 800, 
                color: latestTurnover 
                  ? (latestTurnover.turnoverRate > 12 ? '#DC2626' : latestTurnover.turnoverRate > 5 ? '#D97706' : '#15803D') 
                  : '#0F172A', 
                marginTop: '0.2rem' 
              }}>
                {latestTurnover ? `${latestTurnover.turnoverRate}%` : '--'}
              </div>
              <div style={{ 
                fontSize: '0.72rem', 
                color: latestTurnover 
                  ? (latestTurnover.turnoverRate > 12 ? '#991B1B' : latestTurnover.turnoverRate > 5 ? '#92400E' : '#166534') 
                  : '#64748B', 
                marginTop: '0.1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {latestTurnover ? `${latestTurnover.departures} saídas / ${latestTurnover.activeHeadcount} ativos` : 'Sem lançamento'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 2rem', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'timeline' ? 800 : 600,
                color: activeTab === 'timeline' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'timeline' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Calendar size={15} /> Visitas <span className={`count-pill ${activeTab === 'timeline' ? 'count-pill-dark' : ''}`} style={{ background: activeTab === 'timeline' ? 'var(--primary-brown-light)' : '#F1F5F9', color: activeTab === 'timeline' ? 'var(--primary-brown)' : '#64748B', border: '1px solid var(--border-subtle)' }}>{storeVisits.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('reoccurrences')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'reoccurrences' ? 800 : 600,
                color: activeTab === 'reoccurrences' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'reoccurrences' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <RotateCcw size={15} /> Reincidências <span className={`count-pill ${activeTab === 'reoccurrences' ? 'count-pill-dark' : ''}`} style={{ background: activeTab === 'reoccurrences' ? 'var(--primary-brown-light)' : '#F1F5F9', color: activeTab === 'reoccurrences' ? 'var(--primary-brown)' : '#64748B', border: '1px solid var(--border-subtle)' }}>{reoccurringProblems.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'actions' ? 800 : 600,
                color: activeTab === 'actions' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'actions' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={15} /> Planos de Ação <span className={`count-pill ${activeTab === 'actions' ? 'count-pill-dark' : ''}`} style={{ background: activeTab === 'actions' ? 'var(--primary-brown-light)' : '#F1F5F9', color: activeTab === 'actions' ? 'var(--primary-brown)' : '#64748B', border: '1px solid var(--border-subtle)' }}>{totalActions}</span>
            </button>

            <button
              onClick={() => setActiveTab('turnover')}
              style={{
                padding: '0.75rem 0.25rem',
                border: 'none',
                background: 'none',
                fontSize: '0.85rem',
                fontWeight: activeTab === 'turnover' ? 800 : 600,
                color: activeTab === 'turnover' ? 'var(--primary-brown)' : '#64748B',
                borderBottom: activeTab === 'turnover' ? '3px solid var(--primary-brown)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Users size={15} /> Equipe & Turnover <span className={`count-pill ${activeTab === 'turnover' ? 'count-pill-dark' : ''}`} style={{ background: activeTab === 'turnover' ? 'var(--primary-brown-light)' : '#F1F5F9', color: activeTab === 'turnover' ? 'var(--primary-brown)' : '#64748B', border: '1px solid var(--border-subtle)' }}>{storeTurnoverRecords.length}</span>
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
                          <span>Responsável: <strong style={{ color: '#0F172A' }}>
                            {diag.actionPlan?.internalArea 
                              ? `${diag.actionPlan?.who || diag.actionPlan?.responsible || 'ÁREAS INTERNAS'} (${diag.actionPlan.internalArea})` 
                              : (diag.actionPlan?.who || diag.actionPlan?.responsible || 'Gerente')}
                          </strong></span>
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

          {/* ABA 4: QUADRO DE COLABORADORES & TURNOVER MENSAL */}
          {activeTab === 'turnover' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--primary-brown)" />
                    Quadro de Pessoal & Rotatividade (Turnover)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Acompanhamento mensal da estabilidade da equipe. A rotatividade é calculada automaticamente: (Saídas / Efetivo Ativo) × 100.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTurnover(!isAddingTurnover)}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', gap: '0.4rem' }}
                >
                  {isAddingTurnover ? <X size={15} /> : <Plus size={15} />}
                  {isAddingTurnover ? 'Fechar Formulário' : '+ Lançar Mês'}
                </button>
              </div>

              {/* Formulário de Lançamento Rápido */}
              {isAddingTurnover && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const active = Number(activeHeadcount) || 1;
                    const dep = Number(departures) || 0;
                    const adm = Number(admissions) || 0;
                    const rate = Number(((dep / active) * 100).toFixed(1));

                    const newRecord = {
                      id: `turn-${Date.now()}`,
                      storeId: store.id,
                      monthYear: turnoverMonth,
                      activeHeadcount: active,
                      departures: dep,
                      admissions: adm,
                      turnoverRate: rate,
                      notes: turnoverNotes.trim() || 'Lançamento de rotina do consultor.',
                      updatedAt: new Date().toISOString().split('T')[0]
                    };

                    addTurnoverRecord(newRecord);
                    setIsAddingTurnover(false);
                    setTurnoverNotes('');
                  }}
                  style={{
                    backgroundColor: '#FAF8F5',
                    border: '1.5px solid var(--accent-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Percent size={16} /> Lançar Quadro do Mês ({turnoverMonth})
                    </strong>
                    <span style={{ fontSize: '0.75rem', background: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontWeight: 700, color: 'var(--primary-brown)' }}>
                      Turnover Calculado: {Number(activeHeadcount) > 0 ? ((Number(departures) / Number(activeHeadcount)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '2.1rem', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        color: 'var(--text-main)', 
                        marginBottom: '0.35rem',
                        lineHeight: '1.2'
                      }}>
                        Mês de Referência *
                      </label>
                      <input
                        type="month"
                        className="input-field"
                        value={turnoverMonth}
                        onChange={(e) => setTurnoverMonth(e.target.value)}
                        required
                        style={{ width: '100%', height: '38px', fontSize: '0.85rem', padding: '0.45rem 0.65rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '2.1rem', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        color: 'var(--text-main)', 
                        marginBottom: '0.35rem',
                        lineHeight: '1.2'
                      }}>
                        Quadro Ativo (Colaboradores) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="80"
                        className="input-field"
                        placeholder="Ex: 12"
                        value={activeHeadcount}
                        onChange={(e) => setActiveHeadcount(e.target.value)}
                        required
                        style={{ width: '100%', height: '38px', fontSize: '0.85rem', padding: '0.45rem 0.65rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '2.1rem', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        color: '#991B1B', 
                        marginBottom: '0.35rem',
                        lineHeight: '1.2'
                      }}>
                        Saídas no Mês (Desligamentos) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        className="input-field"
                        placeholder="Ex: 1"
                        value={departures}
                        onChange={(e) => setDepartures(e.target.value)}
                        required
                        style={{ width: '100%', height: '38px', fontSize: '0.85rem', padding: '0.45rem 0.65rem', borderColor: '#FCA5A5', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        height: '2.1rem', 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        color: '#15803D', 
                        marginBottom: '0.35rem',
                        lineHeight: '1.2'
                      }}>
                        Admissões no Mês (Entradas)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        className="input-field"
                        placeholder="Ex: 1"
                        value={admissions}
                        onChange={(e) => setAdmissions(e.target.value)}
                        style={{ width: '100%', height: '38px', fontSize: '0.85rem', padding: '0.45rem 0.65rem', borderColor: '#86EFAC', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      Observações / Motivo das Saídas
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ex: Saída voluntária do chapeiro por mudança de cidade; reposição já contratada."
                      value={turnoverNotes}
                      onChange={(e) => setTurnoverNotes(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem', padding: '0.45rem 0.65rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsAddingTurnover(false)}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 1.1rem' }}
                    >
                      Salvar Indicador
                    </button>
                  </div>
                </form>
              )}

              {/* Régua Explicativa do Semáforo Spoleto - 1 Linha Única */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                  <span>Até 5%: <strong>Saudável</strong></span>
                </span>
                <span style={{ fontSize: '0.72rem', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
                  <span>5.1% a 12%: <strong>Atenção</strong></span>
                </span>
                <span style={{ fontSize: '0.72rem', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
                  <span>Acima de 12%: <strong>Crítico</strong></span>
                </span>
              </div>

              {/* Tabela de Histórico de Turnover da Loja */}
              {storeTurnoverRecords.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                  <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '0.98rem', color: 'var(--text-main)', margin: '0 0 0.25rem' }}>Nenhum mês lançado ainda</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1rem' }}>
                    Clique no botão <strong>"+ Lançar Mês"</strong> acima para registrar o primeiro quadro de pessoal e calcular o turnover oficial desta unidade.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsAddingTurnover(true)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    + Fazer Primeiro Lançamento
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {storeTurnoverRecords.map((item) => {
                    const isHealthy = item.turnoverRate <= 5;
                    const isWarning = item.turnoverRate > 5 && item.turnoverRate <= 12;
                    const isCritical = item.turnoverRate > 12;

                    // Formata "2026-08" para "Agosto de 2026"
                    const [year, month] = item.monthYear.split('-');
                    const dateObj = new Date(Number(year), Number(month) - 1, 1);
                    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: isCritical ? '1.5px solid #FCA5A5' : isWarning ? '1px solid #FDE68A' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {/* Badge Circular de Percentual de Turnover */}
                          <div style={{
                            width: '58px',
                            height: '58px',
                            borderRadius: '50%',
                            backgroundColor: isCritical ? '#FEE2E2' : isWarning ? '#FEF3C7' : '#DCFCE7',
                            border: `2px solid ${isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isCritical ? '#991B1B' : isWarning ? '#92400E' : '#15803D', lineHeight: 1 }}>
                              {item.turnoverRate}%
                            </span>
                            <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', fontWeight: 800, color: isCritical ? '#991B1B' : isWarning ? '#92400E' : '#15803D' }}>
                              Turnover
                            </span>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                              <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)', textTransform: 'capitalize' }}>
                                {monthName}
                              </strong>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: isCritical ? '#FEE2E2' : isWarning ? '#FEF3C7' : '#DCFCE7',
                                color: isCritical ? '#991B1B' : isWarning ? '#92400E' : '#15803D'
                              }}>
                                {isCritical ? '🔴 Crítico' : isWarning ? '🟡 Atenção' : '🟢 Saudável'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                              <span>👥 Efetivo Ativo: <strong>{item.activeHeadcount}</strong></span>
                              <span>🚪 Saídas: <strong style={{ color: '#DC2626' }}>{item.departures}</strong></span>
                              <span>✨ Entradas: <strong style={{ color: '#16A34A' }}>{item.admissions || 0}</strong></span>
                            </div>

                            {item.notes && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja remover o lançamento de turnover de ${monthName}?`)) {
                                deleteTurnoverRecord(item.id);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '0.35rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Excluir este lançamento"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Modal para Visualização da Foto da Loja Ampliada */}
      {zoomedPhoto && (
        <div className="modal-overlay" onClick={() => setZoomedPhoto(null)} style={{ zIndex: 99999 }}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '420px', textAlign: 'center', padding: '2rem 1.5rem', borderRadius: 'var(--radius-lg)' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', background: 'var(--primary-brown-light)', color: 'var(--primary-brown)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 800 }}>
                Código RP: {zoomedPhoto.code || 'SPO'}
              </span>
              <h3 style={{ margin: '0.5rem 0 0.15rem', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>
                {zoomedPhoto.name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {zoomedPhoto.locationType || 'Unidade Spoleto'}
              </p>
            </div>

            <div style={{ 
              width: '100%', 
              maxWidth: '380px', 
              aspectRatio: '1 / 1', 
              margin: '0 auto', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '3px solid var(--accent-gold)', 
              boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
              backgroundColor: 'var(--primary-brown-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-brown)'
            }}>
              {zoomedPhoto.url ? (
                <img 
                  src={zoomedPhoto.url} 
                  alt={zoomedPhoto.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <Store size={80} color="var(--primary-brown)" />
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setZoomedPhoto(null)}
                style={{ fontSize: '0.84rem', padding: '0.45rem 1.5rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
